import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getAnalysisUserPrompt,
  getCorrectionsUserPrompt,
  SYSTEM_PROMPT_ANALYSIS,
  SYSTEM_PROMPT_CORRECTIONS,
} from '../utils/prompts.js';
import { calculateScore } from '../utils/formatters.js';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Tente de réparer un JSON tronqué en fermant les structures ouvertes
 */
function repairTruncatedJson(jsonStr) {
  let str = jsonStr;

  // Supprimer le dernier élément incomplet après une virgule
  // Ex: "problems": [{ ... }, { "file": "test" <-- tronqué
  str = str.replace(/,\s*("[^"]*":\s*)?("[^"]*)?$/g, '');
  str = str.replace(/,\s*\{[^}]*$/g, ''); // Supprimer objet incomplet
  str = str.replace(/,\s*"[^"]*$/g, '');  // Supprimer chaîne incomplète

  // Compter les accolades et crochets ouverts
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const char of str) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  // Fermer les chaînes non terminées (si nombre impair de guillemets)
  const quoteCount = (str.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    str += '"';
  }

  // Fermer les structures ouvertes
  while (openBrackets > 0) {
    str += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    str += '}';
    openBraces--;
  }

  return str;
}

function parseJsonFromResponse(text) {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');

  if (start === -1) {
    throw new Error('Réponse Gemini invalide: pas de JSON trouvé');
  }

  // Trouver la fin du JSON (dernière accolade fermante)
  const end = trimmed.lastIndexOf('}') + 1;
  let jsonStr = end > start ? trimmed.slice(start, end) : trimmed.slice(start);

  // Première tentative: parsing direct
  try {
    return JSON.parse(jsonStr);
  } catch (firstError) {
    console.warn('JSON malformé, tentative de réparation...', firstError.message);

    // Deuxième tentative: réparer le JSON tronqué
    try {
      const repairedJson = repairTruncatedJson(jsonStr);
      const result = JSON.parse(repairedJson);
      console.log('JSON réparé avec succès');
      return result;
    } catch (repairError) {
      console.error('Échec de la réparation JSON:', repairError.message);

      // Fallback: retourner une structure minimale valide
      console.warn('Retour d\'une structure par défaut');
      return {
        problems: [],
        summary: 'Analyse incomplète: la réponse Gemini a été tronquée. Veuillez réessayer.',
      };
    }
  }
}

/**
 * Appel à l'API Gemini (comme l'exemple GeminiClient avec @google/generative-ai)
 * systemInstruction est préfixé au prompt car l'ancien SDK peut ne pas le supporter en option.
 */
/*
async function generateContent(prompt, options = {}) {
  if (!genAI) throw new Error('GEMINI_API_KEY non configurée');
  const {
    systemInstruction = null,
    temperature = 0.3,
    maxOutputTokens = 8192,
    model = modelName,
  } = options;

  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n---\n\n${prompt}`
    : prompt;

  const generationConfig = {
    temperature,
    maxOutputTokens,
    topP: 0.95,
    topK: 40,
  };

  // @google/generative-ai : getGenerativeModel(modelName, generationConfig?)
  const geminiModel = genAI.getGenerativeModel(model, generationConfig);
  const result = await geminiModel.generateContent(fullPrompt);
  const response = result.response;
  return response.text();
} */
async function generateContent(prompt, options = {}) {
  if (!genAI) throw new Error('GEMINI_API_KEY non configurée');

  const {
    systemInstruction = null,
    temperature = 0.3,
    maxOutputTokens = 2048,
    model = modelName,
  } = options;

  const fullPrompt = systemInstruction
    ? `${systemInstruction}\n\n---\n\n${prompt}`
    : prompt;

  const generationConfig = {
    temperature,
    maxOutputTokens,
    topP: 0.95,
    topK: 40,
  };

  // ✅ FIXED
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig
  });

  const result = await geminiModel.generateContent(fullPrompt);
  return result.response.text();
}

/**
 * Analyse le code (fichiers + contexte repo) et retourne problems + summary
 */
export async function analyzeCode(context, files) {
  const userPrompt = getAnalysisUserPrompt(context, files);
  const text = await generateContent(userPrompt, {
    systemInstruction: SYSTEM_PROMPT_ANALYSIS,
    temperature: 0.3,
    maxOutputTokens: 16384,
  });
  console.log(text, " Voici le texte de l'utilisateur");
  const parsed = parseJsonFromResponse(text);
  console.log(parsed, " Voici le parsed");
  const problems = parsed.problems || [];
  const summary = parsed.summary || 'Analyse effectuée.';
  const score = calculateScore(problems);

  const byFile = new Map();
  for (const p of problems) {
    const file = p.file || 'unknown';
    if (!byFile.has(file)) byFile.set(file, { filename: file, problems: [] });
    byFile.get(file).problems.push({
      line: p.line ?? p.startLine ?? 0,
      endLine: p.endLine,
      severity: p.severity || 'info',
      category: p.category || 'other',
      message: p.message || '',
      explanation: p.explanation || '',
      suggestion: p.suggestion || '',
      impact: p.impact || '',
    });
  }
  const fileAnalyses = Array.from(byFile.values());

  return {
    problems,
    summary,
    score,
    totalProblems: problems.length,
    fileAnalyses,
  };
}

/**
 * Génère les fichiers corrigés à partir de l'analyse
 */
export async function generateCorrections(analysis, files) {
  const userPrompt = getCorrectionsUserPrompt(analysis, files);
  const text = await generateContent(userPrompt, {
    systemInstruction: SYSTEM_PROMPT_CORRECTIONS,
    temperature: 0.2,
    maxOutputTokens: 16384,
  });

  const parsed = parseJsonFromResponse(text);
  const corrected = parsed.files || [];
  if (corrected.length === 0) return files;
  const correctedMap = new Map(corrected.map((f) => [f.filename, f.content]));
  return files.map((f) => ({
    filename: f.filename,
    content: correctedMap.has(f.filename) ? correctedMap.get(f.filename) : f.content,
  }));
}

export { calculateScore };
