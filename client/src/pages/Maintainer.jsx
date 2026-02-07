import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink } from 'lucide-react';
import { getRepoStats } from '../services/api';
import Dashboard from '../components/Dashboard';
import ScoreBadge from '../components/ScoreBadge';

export default function Maintainer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setData(null);
    const match = repoUrl.trim().match(/github\.com[/:]([^/]+)\/([^/]+)/i);
    if (!match) {
      setError('Invalid URL. Expected format: https://github.com/owner/repo');
      return;
    }
    setOwner(match[1]);
    setRepo(match[2].replace(/\.git$/, ''));
  };

  useEffect(() => {
    if (!owner || !repo) return;
    setLoading(true);
    setError(null);
    getRepoStats(owner, repo)
      .then((res) => {
        if (res.success && res.data) setData(res.data);
        else setError(res.error || 'Error');
      })
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [owner, repo]);

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintainer Interface</h1>
        <p className="text-gray-600 mt-1">
          Overview of open Pull Requests in a repository and statistics.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="url"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </>
          ) : (
            'Check Pull Requests'
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <>
          <Dashboard stats={data.stats} pullRequests={data.pullRequests} />
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b border-gray-200">
              Open Pull Requests
            </h2>
            <ul className="divide-y divide-gray-200">
              {data.pullRequests?.length === 0 ? (
                <li className="px-6 py-8 text-center text-gray-500">No open PRs.</li>
              ) : (
                data.pullRequests?.map((pr) => (
                  <li key={pr.number} className="px-6 py-4 hover:bg-gray-50 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-500 font-mono text-sm">#{pr.number}</span>
                      <span className="ml-2 font-medium text-gray-900">{pr.title}</span>
                      <p className="text-sm text-gray-500 mt-1">
                        {pr.author} · {new Date(pr.createdAt).toLocaleDateString('en-US')}
                      </p>
                    </div>
                    {pr.score != null && (
                      <ScoreBadge score={pr.score} />
                    )}
                    {pr.problemCount != null && (
                      <span className="text-sm text-gray-600">{pr.problemCount} problem(s)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/?pr=${encodeURIComponent(`https://github.com/${data.repo}/pull/${pr.number}`)}`)}
                      className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                    >
                      Analyze
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
