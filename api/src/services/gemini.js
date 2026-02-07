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
 * Attempts to repair truncated JSON by closing open structures
 */
function repairTruncatedJson(jsonStr) {
  let str = jsonStr;

  // Remove the last incomplete element after a comma
  // Ex: "problems": [{ ... }, { "file": "test" <-- truncated
  str = str.replace(/,\s*("[^"]*":\s*)?("[^"]*)?$/g, '');
  str = str.replace(/,\s*\{[^}]*$/g, ''); // Remove incomplete object
  str = str.replace(/,\s*"[^"]*$/g, '');  // Remove incomplete string

  // Count open braces and brackets
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

  // Close unterminated strings (if odd number of quotes)
  const quoteCount = (str.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    str += '"';
  }

  // Close open structures
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
    throw new Error('Invalid Gemini response: no JSON found');
  }

  // Find the end of JSON (last closing brace)
  const end = trimmed.lastIndexOf('}') + 1;
  let jsonStr = end > start ? trimmed.slice(start, end) : trimmed.slice(start);

  // First attempt: direct parsing
  try {
    return JSON.parse(jsonStr);
  } catch (firstError) {
    console.warn('Malformed JSON, attempting repair...', firstError.message);

    // Second attempt: repair truncated JSON
    try {
      const repairedJson = repairTruncatedJson(jsonStr);
      const result = JSON.parse(repairedJson);
      console.log('JSON repaired successfully');
      return result;
    } catch (repairError) {
      console.error('JSON repair failed:', repairError.message);

      // Fallback: return a minimal valid structure
      console.warn('Returning default structure');
      return {
        problems: [],
        summary: 'Incomplete analysis: the Gemini response was truncated. Please try again.',
      };
    }
  }
}

/**
 * Call to Gemini API (like the GeminiClient example with @google/generative-ai)
 * systemInstruction is prefixed to the prompt as the old SDK may not support it as an option.
 */
/*
async function generateContent(prompt, options = {}) {
  if (!genAI) throw new Error('GEMINI_API_KEY not configured');
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
  if (!genAI) throw new Error('GEMINI_API_KEY not configured');

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
 * Analyzes code (files + repo context) and returns problems + summary
 */
export async function analyzeCode(context, files) {
  const userPrompt = getAnalysisUserPrompt(context, files);
  const text = await generateContent(userPrompt, {
    systemInstruction: SYSTEM_PROMPT_ANALYSIS,
    temperature: 0.3,
    maxOutputTokens: 16384,
  });
  console.log(text, " Here is the user text");
  const parsed = parseJsonFromResponse(text);
  console.log(parsed, " Here is the parsed result");
  const problems = parsed.problems || [];
  const summary = parsed.summary || 'Analysis complete.';
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
 * Generates corrected files from the analysis
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
