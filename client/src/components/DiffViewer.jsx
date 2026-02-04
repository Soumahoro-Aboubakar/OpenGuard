import React from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function DiffViewer({ originalCode = '', correctedCode = '', filename = '' }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      {filename && (
        <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 font-mono text-sm text-gray-700">
          {filename}
        </div>
      )}
      <div className="diff-viewer-wrapper [&_.diff-viewer]:text-sm">
        <ReactDiffViewer
          oldValue={originalCode}
          newValue={correctedCode}
          splitView={true}
          showDiffOnly={false}
          useDarkTheme={false}
          leftTitle="Original"
          rightTitle="Corrigé"
          styles={{
            variables: {
              light: {
                diffViewerBackground: '#f9fafb',
                diffViewerColor: '#111827',
                addedBackground: '#d1fae5',
                addedColor: '#065f46',
                removedBackground: '#fee2e2',
                removedColor: '#991b1b',
              },
            },
            line: {
              padding: '4px 8px',
            },
          }}
        />
      </div>
    </div>
  );
}
