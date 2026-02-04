import ScoreBadge from './ScoreBadge';
import { BarChart3, GitPullRequest, TrendingUp } from 'lucide-react';

export default function Dashboard({ stats = {}, pullRequests = [] }) {
  const { totalPRs = 0, averageScore = 0, problemDistribution = {} } = stats;
  const distEntries = Object.entries(problemDistribution).filter(([, v]) => v > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <GitPullRequest className="w-5 h-5" />
          <span className="font-medium">PRs ouvertes</span>
        </div>
        <p className="text-3xl font-bold text-primary-dark">{totalPRs}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">Score moyen</span>
        </div>
        <div className="mt-2">
          <ScoreBadge score={Math.round(averageScore)} />
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <BarChart3 className="w-5 h-5" />
          <span className="font-medium">Répartition des problèmes</span>
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {distEntries.length ? (
            distEntries.map(([cat, count]) => (
              <li key={cat} className="flex justify-between">
                <span className="text-gray-600">{cat}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))
          ) : (
            <li className="text-gray-500">Aucune donnée</li>
          )}
        </ul>
      </div>
    </div>
  );
}
