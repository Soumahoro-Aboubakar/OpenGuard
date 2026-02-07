import { Octokit } from '@octokit/rest';

// Validation and logging of GitHub token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.warn('[GITHUB] ⚠️ GITHUB_TOKEN not configured - Limit: 60 req/h (instead of 5000)');
} else if (!GITHUB_TOKEN.startsWith('ghp_') && !GITHUB_TOKEN.startsWith('github_pat_')) {
  console.warn('[GITHUB] ⚠️ Unusual token format - Verify it is valid');
} else {
  console.log('[GITHUB] ✓ GitHub token configured');
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN || undefined,
});

/**
 * Parse une URL de Pull Request GitHub et extrait owner, repo, number
 * @param {string} url - URL complète (ex: https://github.com/owner/repo/pull/123)
 * @returns {{ owner: string, repo: string, number: number }}
 */
export function parsePRUrl(url) {
  const match = url.match(
    /github\.com[/:]([^/]+)\/([^/]+)\/pull\/(\d+)/i
  );
  if (!match) {
    throw new Error('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    number: parseInt(match[3], 10),
  };
}

/**
 * Retrieves modified files from a Pull Request
 * @param {string} owner
 * @param {string} repo
 * @param {number} number
 * @returns {Promise<Array<{ filename: string, content: string, patch?: string }>>}
 */
export async function getPRFiles(owner, repo, number) {
  try {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: number,
    });

    const result = [];
    for (const file of files) {
      if (file.status === 'removed') continue;
      let content = '';
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.filename,
          ref: `refs/pull/${number}/head`,
        });
        if (data.type === 'file' && 'content' in data) {
          content = Buffer.from(data.content, 'base64').toString('utf-8');
        }
      } catch (e) {
        console.warn(`[GITHUB] Unreadable file: ${file.filename}`, e.message);
        content = `# Unreadable file (${file.filename})\n${e.message}`;
      }
      result.push({
        filename: file.filename,
        content,
        patch: file.patch,
      });
    }
    return result;
  } catch (error) {
    console.error('[GITHUB] Error getPRFiles:', error.status, error.message);
    throw handleGitHubError(error, `PR #${number} in ${owner}/${repo}`);
  }
}

/**
 * Centralized GitHub error handling
 */
function handleGitHubError(error, context) {
  const status = error.status;
  let message;

  switch (status) {
    case 401:
      message = `❌ Authentication failed: Invalid or expired GitHub token. Check GITHUB_TOKEN.`;
      break;
    case 403:
      if (error.message?.includes('rate limit')) {
        message = `❌ Rate limit reached. ${GITHUB_TOKEN ? 'Wait a few minutes.' : 'Configure GITHUB_TOKEN for 5000 req/h.'}`;
      } else {
        message = `❌ Access denied to ${context}. Check token permissions ('repo' scope required for private repos).`;
      }
      break;
    case 404:
      message = `❌ Resource not found: ${context}. Verify the URL is correct and you have access to the repo.`;
      break;
    default:
      message = `❌ GitHub error (${status}): ${error.message}`;
  }

  const newError = new Error(message);
  newError.status = status;
  newError.originalError = error;
  return newError;
}


/**
 * Retrieves repo context (README, CONTRIBUTING)
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<{ readme: string, contributing: string }>}
 */
export async function getRepoContext(owner, repo) {
  let readme = '';
  let contributing = '';
  try {
    const { data } = await octokit.repos.getReadme({ owner, repo });
    readme = Buffer.from(data.content, 'base64').toString('utf-8');
  } catch (_) { }
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'CONTRIBUTING.md',
    });
    if (data.type === 'file' && 'content' in data) {
      contributing = Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (_) { }
  return { readme, contributing };
}

/**
 * Lists open Pull Requests from a repository
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array<{ number: number, title: string, author: string, createdAt: string }>>}
 */
export async function listOpenPRs(owner, repo) {
  try {
    const { data } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      sort: 'created',
      direction: 'desc',
    });
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login || 'unknown',
      createdAt: pr.created_at,
    }));
  } catch (error) {
    console.error('[GITHUB] Error listOpenPRs:', error.status, error.message);
    throw handleGitHubError(error, `PR list for ${owner}/${repo}`);
  }
}

/**
 * Retrieves basic PR info
 */
export async function getPRInfo(owner, repo, number) {
  try {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: number,
    });
    return {
      number: data.number,
      title: data.title,
      author: data.user?.login || 'unknown',
      repo: `${owner}/${repo}`,
    };
  } catch (error) {
    console.error('[GITHUB] Error getPRInfo:', error.status, error.message);
    throw handleGitHubError(error, `PR #${number} in ${owner}/${repo}`);
  }
}
