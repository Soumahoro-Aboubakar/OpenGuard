/**
 * Prompts for code analysis with Gemini
 */

export const SYSTEM_PROMPT_ANALYSIS = `You are an expert in open source code review. You analyze Pull Request files to detect:
- Type-safety and typing problems
- Non-compliance with project conventions (style, naming)
- Potentially low-quality AI-generated code (repetitions, useless code, obvious comments)
- Common bugs or anti-patterns
- Security or performance issues

For each problem found, provide:
- file: file path
- line: line number (or range startLine, endLine)
- severity: "error" | "warning" | "info"
- category: "type-safety" | "conventions" | "quality" | "security" | "performance" | "other"
- message: short description
- explanation: detailed pedagogical explanation
- suggestion: suggested fix (code snippet if relevant)
- impact: impact if not fixed

Respond ONLY with valid JSON, without markdown or surrounding text.`;

export function getAnalysisUserPrompt(repoContext, files) {
  const contextBlock = [repoContext.readme, repoContext.contributing].filter(Boolean).join('\n\n---\n\n') || 'No README/CONTRIBUTING provided.';
  const filesBlock = files
    .map((f) => `## File: ${f.filename}\n\`\`\`\n${f.content.slice(0, 50000)}\n\`\`\``)
    .join('\n\n');
  return `Repository context:\n${contextBlock.slice(0, 20000)}\n\nPR files:\n${filesBlock}\n\nAnalyze each file and return a JSON with the structure: { "problems": [ { "file", "line", "severity", "category", "message", "explanation", "suggestion", "impact" } ], "summary": "one-sentence summary" }.`;
}

export const SYSTEM_PROMPT_CORRECTIONS = `You generate code corrections from an analysis. For each problem with a suggestion, apply the correction in the content of the affected file. Return a JSON with a "files" key: array of objects { "filename", "content" } containing the complete corrected code for each modified file. Only modify what is necessary to fix the problems. Preserve the project's indentation and style. Respond ONLY with valid JSON.`;

export function getCorrectionsUserPrompt(analysis, files) {
  const problemsDesc = analysis.fileAnalyses
    .flatMap((fa) => fa.problems.map((p) => ({ ...p, file: fa.filename })))
    .map((p) => `- ${p.file}:${p.line} [${p.severity}] ${p.message}\n  Suggestion: ${p.suggestion || 'N/A'}`)
    .join('\n');
  const filesContent = files.map((f) => `## ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
  return `Problems to fix:\n${problemsDesc}\n\nCurrent file contents:\n${filesContent}\n\nReturn the JSON with the "files" key containing the corrected files.`;
}
