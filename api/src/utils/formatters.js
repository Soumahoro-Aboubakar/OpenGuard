/**
 * Formatage des données pour les réponses API et fichiers générés
 */

/**
 * Calcule le score de qualité (0-100) à partir des problèmes
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
 * Génère le contenu ANALYSIS.md
 */
export function formatAnalysisMd(prInfo, analysis) {
  const lines = [
    `# Rapport d'analyse - PR #${prInfo.number} - ${prInfo.title}`,
    `Repository: ${prInfo.repo} | Auteur: ${prInfo.author}`,
    '',
    '## Résumé',
    `- **Score de qualité:** ${analysis.score}/100`,
    `- **Nombre total de problèmes:** ${analysis.totalProblems}`,
    '',
    '## Détail par fichier',
  ];
  for (const fa of analysis.fileAnalyses || []) {
    lines.push(`### ${fa.filename}`);
    for (const p of fa.problems || []) {
      lines.push(`- **Ligne ${p.line}** [${p.severity}] ${p.category}: ${p.message}`);
      lines.push(`  - Explication: ${p.explanation}`);
      if (p.suggestion) lines.push(`  - Correction suggérée:\n\`\`\`\n${p.suggestion}\n\`\`\``);
      lines.push(`  - Impact: ${p.impact || 'N/A'}`);
      lines.push('');
    }
  }
  return lines.join('\n');
}

/**
 * Génère le contenu HOWTO.md
 */
export function formatHowtoMd(prInfo) {
  return `# Guide d'application des corrections - PR #${prInfo.number}

## Étapes

1. **Télécharger le zip** des fichiers corrigés depuis OpenGuard.
2. **Extraire** l'archive dans un répertoire temporaire.
3. **Comparer** avec votre branche locale (ex: \`diff -r corrected/ ./src\`).
4. **Appliquer** les corrections de manière sélective (fichier par fichier ou bloc par bloc).
5. **Lancer les tests** locaux du projet (\`npm test\`, \`pytest\`, etc.).
6. **Commit** et pousser les changements sur votre branche.
7. **Mettre à jour** la Pull Request sur GitHub.

Repository: ${prInfo.repo}
PR: #${prInfo.number} - ${prInfo.title}
`;
}
