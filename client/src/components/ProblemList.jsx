import { useState } from 'react';
import ProblemBadge from './ProblemBadge';
import CategoryIcon from './CategoryIcon';

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };
const CATEGORIES = ['type-safety', 'conventions', 'quality', 'security', 'performance', 'other'];

export default function ProblemList({ fileAnalyses = [], onSelectFile }) {
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const allProblems = fileAnalyses.flatMap((fa) =>
    (fa.problems || []).map((p) => ({ ...p, filename: fa.filename }))
  );

  const filtered = allProblems.filter((p) => {
    if (filterSeverity && p.severity !== filterSeverity) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.line || 0) - (b.line || 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-600">Filtrer :</span>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">Toutes sévérités</option>
          <option value="error">Erreur</option>
          <option value="warning">Avertissement</option>
          <option value="info">Info</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-3">
        {sorted.map((p, i) => (
          <li
            key={`${p.filename}-${p.line}-${i}`}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-2 flex-wrap">
              <CategoryIcon category={p.category} />
              <ProblemBadge severity={p.severity} />
              <span className="font-mono text-sm text-gray-500">
                {p.filename}:{p.line}
              </span>
              {/*onSelectFile && (
                <button
                  type="button"
                  onClick={() => onSelectFile(p.filename)}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Voir le fichier
                </button>
              )*/}
            </div>
            <p className="mt-2 font-medium text-gray-900">{p.message}</p>
            {p.explanation && <p className="mt-1 text-sm text-gray-600">{p.explanation}</p>}
            {p.suggestion && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{p.suggestion}</pre>
            )}
          </li>
        ))}
      </ul>
      {sorted.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucun problème à afficher.</p>
      )}
    </div>
  );
}
