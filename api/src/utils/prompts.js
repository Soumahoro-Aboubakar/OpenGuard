/**
 * Prompts pour l'analyse de code avec Gemini
 */

export const SYSTEM_PROMPT_ANALYSIS = `Tu es un expert en revue de code open source. Tu analyses les fichiers d'une Pull Request pour détecter :
- Problèmes de type-safety et typage
- Non-respect des conventions du projet (style, nommage)
- Code potentiellement généré par IA de mauvaise qualité (répétitions, code inutile, commentaires évidents)
- Bugs ou anti-patterns courants
- Problèmes de sécurité ou de performance

Pour chaque problème trouvé, fournis :
- file: chemin du fichier
- line: numéro de ligne (ou plage startLine, endLine)
- severity: "error" | "warning" | "info"
- category: "type-safety" | "conventions" | "quality" | "security" | "performance" | "other"
- message: description courte
- explanation: explication pédagogique détaillée
- suggestion: correction suggérée (snippet de code si pertinent)
- impact: impact si non corrigé

Réponds UNIQUEMENT avec un JSON valide, sans markdown ni texte autour.`;

export function getAnalysisUserPrompt(repoContext, files) {
  const contextBlock = [repoContext.readme, repoContext.contributing].filter(Boolean).join('\n\n---\n\n') || 'Aucun README/CONTRIBUTING fourni.';
  const filesBlock = files
    .map((f) => `## Fichier: ${f.filename}\n\`\`\`\n${f.content.slice(0, 50000)}\n\`\`\``)
    .join('\n\n');
  return `Contexte du repository:\n${contextBlock.slice(0, 20000)}\n\nFichiers de la PR:\n${filesBlock}\n\nAnalyse chaque fichier et retourne un JSON avec la structure: { "problems": [ { "file", "line", "severity", "category", "message", "explanation", "suggestion", "impact" } ], "summary": "résumé en une phrase" }.`;
}

export const SYSTEM_PROMPT_CORRECTIONS = `Tu génères des corrections de code à partir d'une analyse. Pour chaque problème avec une suggestion, applique la correction dans le contenu du fichier concerné. Retourne un JSON avec une clé "files" : tableau d'objets { "filename", "content" } contenant le code corrigé complet pour chaque fichier modifié. Ne modifie que ce qui est nécessaire pour corriger les problèmes. Conserve l'indentation et le style du projet. Réponds UNIQUEMENT en JSON valide.`;

export function getCorrectionsUserPrompt(analysis, files) {
  const problemsDesc = analysis.fileAnalyses
    .flatMap((fa) => fa.problems.map((p) => ({ ...p, file: fa.filename })))
    .map((p) => `- ${p.file}:${p.line} [${p.severity}] ${p.message}\n  Suggestion: ${p.suggestion || 'N/A'}`)
    .join('\n');
  const filesContent = files.map((f) => `## ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
  return `Problèmes à corriger:\n${problemsDesc}\n\nContenu actuel des fichiers:\n${filesContent}\n\nRetourne le JSON avec la clé "files" contenant les fichiers corrigés.`;
}
