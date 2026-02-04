import { useState } from 'react';
import ScoreBadge from './ScoreBadge';
import ProblemList from './ProblemList';
import DiffViewer from './DiffViewer';
import { Download, FileCode } from 'lucide-react';

export default function PRAnalysis({ data, downloads }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { prInfo, analysis } = data || {};
  const fileAnalyses = analysis?.fileAnalyses || [];
  const correctedByFile = (downloads?.correctedFilesMap) || {};


  const handleDownload = (type) => {
    if (!downloads) return;
    if (type === 'report') {
      const md = atob(downloads.reportMd || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ANALYSIS.md';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'howto') {
      const md = atob(downloads.howtoMd || '');
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'HOWTO.md';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'zip' && downloads.correctedCode) {
      const bin = Uint8Array.from(atob(downloads.correctedCode), (c) => c.charCodeAt(0));
      const blob = new Blob([bin], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'corrected-code.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            PR #{prInfo?.number} — {prInfo?.title}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {prInfo?.repo} · Auteur: {prInfo?.author}
          </p>
        </div>
        <ScoreBadge score={analysis?.score} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleDownload('report')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <FileCode className="w-4 h-4" />
          Télécharger ANALYSIS.md
        </button>
        <button
          type="button"
          onClick={() => handleDownload('howto')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger HOWTO.md
        </button>
        {downloads?.correctedCode && (
          <button
            type="button"
            onClick={() => handleDownload('zip')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger code corrigé (.zip)
          </button>
        )}
      </div>

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Problèmes détectés</h3>
        <ProblemList fileAnalyses={fileAnalyses} onSelectFile={setSelectedFile} />
      </section>

      {selectedFile && (originalContent || correctedContent) && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparaison du code</h3>
          <DiffViewer
            originalCode={originalContent}
            correctedCode={correctedContent}
            filename={selectedFile}
          />
        </section>
      )}
    </div>
  );
}
