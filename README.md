# OpenGuard

Outil d'analyse et correction automatique de Pull Requests, utilisant **Gemini** pour détecter les problèmes de qualité et proposer des corrections pédagogiques.

Projet : **Gemini 3 Hackathon (Google DeepMind)** · Deadline : 9 février 2026

## Fonctionnalités

- **Interface Contributeur** : coller l’URL d’une PR GitHub → score de qualité, liste des problèmes par fichier, comparaison code original vs corrigé (diff), téléchargement de ANALYSIS.md, HOWTO.md et du code corrigé (.zip).
- **Interface Mainteneur** : URL du repo → liste des PRs ouvertes, dashboard avec statistiques (nombre de PRs, score moyen, répartition des problèmes), clic sur une PR pour l’analyse détaillée.

## Stack

- **Backend** : Node.js 18+ avec Express, GitHub REST API (Octokit), Google Gemini API, stockage en mémoire (cache 1h).
- **Frontend** : React 18+ avec Vite, Tailwind CSS v3, react-diff-viewer-continued, Lucide React, React Router v6, Axios.

## Installation

### Prérequis

- Node.js 18+
- Un token GitHub ([Créer un token](https://github.com/settings/tokens))
- Une clé API Gemini ([AI Studio](https://aistudio.google.com/apikey))

### Configuration

1. Cloner le dépôt.
2. Copier `.env.example` en `.env` à la racine et remplir :
   - `GITHUB_TOKEN`
   - `GEMINI_API_KEY`
3. À la racine du monorepo :

```bash
# Backend
cd api && npm install && npm run dev

# Dans un autre terminal : Frontend
cd client && npm install && npm run dev
```

- API : http://localhost:3001  
- Client : http://localhost:5173 (proxy `/api` vers 3001)

### Variables d’environnement

| Variable         | Description                    |
|------------------|--------------------------------|
| `GITHUB_TOKEN`   | Token GitHub (accès API)       |
| `GEMINI_API_KEY` | Clé API Google Gemini          |
| `GEMINI_MODEL`   | Optionnel, défaut `gemini-2.0-flash` |
| `NODE_ENV`       | `development` ou `production`  |
| `PORT`           | Port du serveur API (défaut 3001) |

## Structure du projet

```
openguard/
├── api/                 # Backend Node.js
│   ├── src/
│   │   ├── index.js     # Point d'entrée Express
│   │   ├── routes/      # analyze.js, repo.js
│   │   ├── services/    # github.js, gemini.js, analyzer.js
│   │   └── utils/       # prompts.js, formatters.js
│   └── package.json
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/       # Contributor.jsx, Maintainer.jsx
│   │   ├── components/   # PRAnalysis, DiffViewer, ProblemList, Dashboard, etc.
│   │   └── services/    # api.js
│   └── package.json
├── vercel.json          # Config déploiement
├── .env.example
└── README.md
```

## API

- **POST /api/analyze-pr**  
  Body : `{ "prUrl": "https://github.com/owner/repo/pull/123" }`  
  Réponse : `prInfo`, `analysis` (score, fileAnalyses), `fileContents`, `downloads` (reportMd, howtoMd, correctedCode en base64).

- **GET /api/repo-stats/:owner/:repo**  
  Réponse : `repo`, `pullRequests`, `stats` (totalPRs, averageScore, problemDistribution).

## Déploiement (Vercel)

- Build : client (Vite) ; API exposée via le dossier `api/` (serverless).
- Configurer les variables d’environnement dans le projet Vercel.
- En production, définir `VITE_API_URL` si le frontend appelle une autre origine pour l’API.

## Sécurité et limites (MVP)

- Ne pas committer `.env` ni de secrets.
- GitHub : 5000 requêtes/heure (authentifié).
- Gemini : selon le tier gratuit AI Studio.
- Pas d’authentification utilisateur, pas de webhooks, pas de stockage persistant, analyse statique uniquement.

## Licence

MIT.
# OpenGuard
# OpenGuard
