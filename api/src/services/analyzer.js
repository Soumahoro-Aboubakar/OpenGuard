import * as github from './github.js';
import * as gemini from './gemini.js';
import { formatAnalysisMd, formatHowtoMd } from '../utils/formatters.js';
import archiver from 'archiver';
/**
 * Pipeline complet : récupérer PR → analyser → corriger → formater
 * @param {string} prUrl
 * @returns {Promise<{ prInfo, analysis, correctedFiles, reportMd, howtoMd, zipBase64 }>}
 */
export async function analyzePR(prUrl) {
  console.log('[ANALYZER] Début de l\'analyse pour:', prUrl);

  const { owner, repo, number } = github.parsePRUrl(prUrl);
  console.log('[ANALYZER] PR parsée:', { owner, repo, number });

  const [prInfo, files, repoContext] = await Promise.all([
    github.getPRInfo(owner, repo, number),
    github.getPRFiles(owner, repo, number),
    github.getRepoContext(owner, repo),
  ]);
  console.log('[ANALYZER] Données GitHub récupérées:', { filesCount: files.length });

  if (!files.length) {
    console.log('[ANALYZER] Aucun fichier à analyser');
    return {
      prInfo,
      analysis: { score: 100, totalProblems: 0, fileAnalyses: [], summary: 'Aucun fichier à analyser.' },
      correctedFiles: [],
      fileContents: {},
      reportMd: '',
      howtoMd: formatHowtoMd(prInfo),
      zipBase64: null,
    };
  }

  console.log('[ANALYZER] Appel Gemini analyzeCode...');
  const analysis = await gemini.analyzeCode(repoContext, files);
  console.log('[ANALYZER] Analyse terminée:', { problemsCount: analysis.problems?.length, score: analysis.score });

  let correctedFiles = files;
  try {
    console.log('[ANALYZER] Appel Gemini generateCorrections...');
    correctedFiles = await gemini.generateCorrections(analysis, files);
    console.log('[ANALYZER] Corrections générées:', { correctedCount: correctedFiles.length });
  } catch (e) {
    console.warn('[ANALYZER] Génération des corrections échouée:', e.message);
  }

  console.log('[ANALYZER] Formatage du rapport...');
  const reportMd = formatAnalysisMd(prInfo, analysis);
  const howtoMd = formatHowtoMd(prInfo);

  console.log('[ANALYZER] Création du ZIP...');
  const zipBase64 = await createZipBase64(correctedFiles);
  console.log('[ANALYZER] ZIP créé');

  const fileContents = {};
  for (const f of files) {
    fileContents[f.filename] = { original: f.content };
  }
  for (const f of correctedFiles) {
    if (!fileContents[f.filename]) fileContents[f.filename] = { original: '' };
    fileContents[f.filename].corrected = f.content;
  }

  console.log('[ANALYZER] Analyse complète, renvoi des résultats');
  return {
    prInfo,
    analysis,
    correctedFiles,
    fileContents,
    reportMd,
    howtoMd,
    zipBase64,
  };
}

/**
 * Crée une archive ZIP des fichiers et la retourne en base64
 */
function createZipBase64(files) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));

    for (const f of files) {
      archive.append(f.content, { name: f.filename });
    }
    archive.finalize();
  });
}
