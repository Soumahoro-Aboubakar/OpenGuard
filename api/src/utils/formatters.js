/**
 * Formatting of data for API responses and generated files
 */

/**
 * Calculates quality score (0-100) from problems
 * @param {Array} problems
 * @returns {number}
 */
export function calculateScore(problems) {
  if (!problems || problems.length === 0) return 100;
  let penalty = 0;
  for (const p of problems) {
    if (p.severity === 'error') penalty += 15;
    else if (p.severity === 'warning') penalty += 8;
    else penalty += 3;
  }
  return Math.max(0, Math.min(100, 100 - penalty));
}

/**
 * Generates ANALYSIS.md content
 */
export function formatAnalysisMd(prInfo, analysis) {
  const lines = [
    `# Analysis Report - PR #${prInfo.number} - ${prInfo.title}`,
    `Repository: ${prInfo.repo} | Author: ${prInfo.author}`,
    '',
    '## Summary',
    `- **Quality Score:** ${analysis.score}/100`,
    `- **Total Problems:** ${analysis.totalProblems}`,
    '',
    '## Details by File',
  ];
  for (const fa of analysis.fileAnalyses || []) {
    lines.push(`### ${fa.filename}`);
    for (const p of fa.problems || []) {
      lines.push(`- **Line ${p.line}** [${p.severity}] ${p.category}: ${p.message}`);
      lines.push(`  - Explanation: ${p.explanation}`);
      if (p.suggestion) lines.push(`  - Suggested fix:\n\`\`\`\n${p.suggestion}\n\`\`\``);
      lines.push(`  - Impact: ${p.impact || 'N/A'}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

/**
 * Generates HOWTO.md content
 */
export function formatHowtoMd(prInfo) {
  return `# Guide to Apply Corrections - PR #${prInfo.number}

## Steps

1. **Download the zip** of corrected files from OpenGuard.
2. **Extract** the archive to a temporary directory.
3. **Compare** with your local branch (e.g.: \`diff -r corrected/ ./src\`).
4. **Apply** corrections selectively (file by file or block by block).
5. **Run local tests** for the project (\`npm test\`, \`pytest\`, etc.).
6. **Commit** and push changes to your branch.
7. **Update** the Pull Request on GitHub.

Repository: ${prInfo.repo}
PR: #${prInfo.number} - ${prInfo.title}
`;
}
