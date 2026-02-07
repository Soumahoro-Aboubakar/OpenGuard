import axios from 'axios';

const api = axios.create({
  baseURL: "https://openguard.onrender.com",
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Analyse une Pull Request
 * @param {string} prUrl - URL GitHub de la PR
 * @returns {Promise<{ success, data }>}
 */
export async function analyzePR(prUrl) {
  const { data } = await api.post('/api/analyze-pr', { prUrl });
  return data;
}

/**
 * Récupère les stats et PRs ouvertes d'un repo
 * @param {string} owner
 * @param {string} repo
 */
export async function getRepoStats(owner, repo) {
  const { data } = await api.get(`/api/repo-stats/${owner}/${repo}`);
  return data;
}

export default api;
