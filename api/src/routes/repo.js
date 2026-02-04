import { Router } from 'express';
import * as github from '../services/github.js';

const router = Router();

const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * GET /api/repo-stats/:owner/:repo
 * Retourne les PRs ouvertes et des stats agrégées (scores simulés si pas d'analyse en cache)
 */
router.get('/repo-stats/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const cacheKey = `repo:${owner}/${repo}`;
    let data = getCached(cacheKey);

    if (!data) {
      const pullRequests = await github.listOpenPRs(owner, repo);
      const prsWithPlaceholder = pullRequests.map((pr) => ({
        ...pr,
        score: null,
        problemCount: null,
      }));

      const problemDistribution = { 'type-safety': 0, conventions: 0, quality: 0, security: 0, performance: 0, other: 0 };
      let totalScore = 0;
      let countWithScore = 0;

      data = {
        repo: `${owner}/${repo}`,
        pullRequests: prsWithPlaceholder,
        stats: {
          totalPRs: pullRequests.length,
          averageScore: 0,
          problemDistribution,
        },
      };

      if (pullRequests.length > 0) {
        data.stats.averageScore = 70;
        data.stats.problemDistribution = problemDistribution;
      }
      setCache(cacheKey, data);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('repo-stats error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur lors de la récupération des stats du repo',
    });
  }
});

export default router;
