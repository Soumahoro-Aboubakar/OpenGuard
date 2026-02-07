import { Router } from 'express';
import { analyzePR } from '../services/analyzer.js';

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
 * POST /api/analyze-pr
 * Body: { prUrl: "https://github.com/owner/repo/pull/123" }
 */
router.post('/analyze-pr', async (req, res) => {
  try {
    const { prUrl } = req.body || {};
    if (!prUrl || typeof prUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'prUrl required (GitHub Pull Request URL)',
      });
    }

    const cacheKey = `analyze:${prUrl}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const result = await analyzePR(prUrl);
    const payload = {
      prInfo: result.prInfo,
      analysis: {
        score: result.analysis.score,
        totalProblems: result.analysis.totalProblems,
        fileAnalyses: result.analysis.fileAnalyses,
        summary: result.analysis.summary,
      },
      fileContents: result.fileContents || {},
      downloads: {
        reportMd: Buffer.from(result.reportMd, 'utf-8').toString('base64'),
        howtoMd: Buffer.from(result.howtoMd, 'utf-8').toString('base64'),
        correctedCode: result.zipBase64,
      },
    };
    setCache(cacheKey, payload);
    res.json({ success: true, data: payload });
  } catch (err) {
    console.error('analyze-pr error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error during PR analysis',
    });
  }
});

export default router;
