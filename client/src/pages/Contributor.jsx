import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { analyzePR } from '../services/api';
import PRAnalysis from '../components/PRAnalysis';

export default function Contributor() {
  const [searchParams] = useSearchParams();
  const prFromQuery = searchParams.get('pr') || '';
  const [prUrl, setPrUrl] = useState(prFromQuery);
  useEffect(() => {
    if (prFromQuery) setPrUrl(prFromQuery);
  }, [prFromQuery]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!prUrl.trim()) {
      setError('Please paste a GitHub Pull Request URL.');
      return;
    }
    setLoading(true);
    try {
      const res = await analyzePR(prUrl.trim());
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error || 'Error during analysis.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributor Interface</h1>
        <p className="text-gray-600 mt-1">
          Review a Pull Request and get a quality score, a list of issues, and the corrected code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="url"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/pull/123"
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
              Processing analysis…
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze the Pull Request
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p>Pull Request analysis in progress…</p>
          <p className="text-sm mt-1">This may take a few seconds.</p>

        </div>
      )}

      {result && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <PRAnalysis
            data={result}
            downloads={result.downloads}
            fileContents={result.fileContents || {}}
          />
        </div>
      )}
    </div>
  );
}
