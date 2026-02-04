import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
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
    throw new Error('URL de PR GitHub invalide. Format attendu: https://github.com/owner/repo/pull/123');
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ''),
    number: parseInt(match[3], 10),
  };
}

/**
 * Récupère les fichiers modifiés d'une Pull Request
 * @param {string} owner
 * @param {string} repo
 * @param {number} number
 * @returns {Promise<Array<{ filename: string, content: string, patch?: string }>>}
 */
export async function getPRFiles(owner, repo, number) {
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
      content = `# Fichier non lisible (${file.filename})\n${e.message}`;
    }
    result.push({
      filename: file.filename,
      content,
      patch: file.patch,
    });
  }
  return result;
}

/**
 * Récupère le contexte du repo (README, CONTRIBUTING)
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
  } catch (_) {}
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: 'CONTRIBUTING.md',
    });
    if (data.type === 'file' && 'content' in data) {
      contributing = Buffer.from(data.content, 'base64').toString('utf-8');
    }
  } catch (_) {}
  return { readme, contributing };
}

/**
 * Liste les Pull Requests ouvertes d'un repository
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<Array<{ number: number, title: string, author: string, createdAt: string }>>}
 */
export async function listOpenPRs(owner, repo) {
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
}

/**
 * Récupère les infos de base d'une PR
 */
export async function getPRInfo(owner, repo, number) {
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
}
