# OpenGuard

Automatic Pull Request analysis and correction tool, using **Gemini** to detect quality issues and propose educational corrections.

Project: **Gemini 3 Hackathon (Google DeepMind)** · Deadline: February 9, 2026

## Features

- **Contributor Interface**: paste a GitHub PR URL → quality score, list of issues by file, original vs corrected code comparison (diff), download ANALYSIS.md, HOWTO.md and corrected code (.zip).
- **Maintainer Interface**: repo URL → list of open PRs, dashboard with statistics (number of PRs, average score, issue distribution), click on a PR for detailed analysis.

## Stack

- **Backend**: Node.js 18+ with Express, GitHub REST API (Octokit), Google Gemini API, in-memory storage (1h cache).
- **Frontend**: React 18+ with Vite, Tailwind CSS v3, react-diff-viewer-continued, Lucide React, React Router v6, Axios.

## Installation

### Prerequisites

- Node.js 18+
- A GitHub token ([Create a token](https://github.com/settings/tokens))
- A Gemini API key ([AI Studio](https://aistudio.google.com/apikey))

### Configuration

1. Clone the repository.
2. Copy `.env.example` to `.env` at the root and fill in:
   - `GITHUB_TOKEN`
   - `GEMINI_API_KEY`
3. At the monorepo root:
```bash
# Backend
cd api && npm install && npm run dev

# In another terminal: Frontend
cd client && npm install && npm run dev
```

- API: http://localhost:3001  
- Client: http://localhost:5173 (proxy `/api` to 3001)

### Environment Variables

| Variable         | Description                    |
|------------------|--------------------------------|
| `GITHUB_TOKEN`   | GitHub token (API access)      |
| `GEMINI_API_KEY` | Google Gemini API key          |
| `GEMINI_MODEL`   | Optional, default `gemini-2.5-flash` |
| `NODE_ENV`       | `development` or `production`  |
| `PORT`           | API server port (default 3001) |



## API

- **POST /api/analyze-pr**  
  Body: `{ "prUrl": "https://github.com/owner/repo/pull/123" }`  
  Response: `prInfo`, `analysis` (score, fileAnalyses), `fileContents`, `downloads` (reportMd, howtoMd, correctedCode in base64).

- **GET /api/repo-stats/:owner/:repo**  
  Response: `repo`, `pullRequests`, `stats` (totalPRs, averageScore, problemDistribution).

## Security and Limitations (MVP)

- Do not commit `.env` or secrets.
- GitHub: 5000 requests/hour (authenticated).
- Gemini: according to AI Studio free tier.
- No user authentication, no webhooks, no persistent storage, static analysis only.

## License

MIT.
# OpenGuard
# OpenGuard