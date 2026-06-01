/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const REPO_OWNER = 'flyingPenguinW';
const REPO_NAME = 'PhotoFOSS';
const DONATE_URL = 'https://buymeacoffee.com/ailieisqueen';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';
const BG_BLACK = '\x1b[40m';

function center(text: string, width = 54) {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}

function box(text: string, color = CYAN) {
  const lines = text.split('\n');
  const w = Math.max(...lines.map(l => l.length));
  const top = `${color}╭${'─'.repeat(w + 2)}╮${RESET}`;
  const bottom = `${color}╰${'─'.repeat(w + 2)}╯${RESET}`;
  const mid = lines.map(l => `${color}│ ${l}${' '.repeat(w - l.length)} │${RESET}`);
  return [top, ...mid, bottom].join('\n');
}

async function fetchGitHubData() {
  try {
    const headers = { 'User-Agent': 'PhotoFOSS-server' };
    const [starRes, commitRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, { headers }),
      fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=1`, { headers }),
    ]);
    const repoData = starRes.ok ? await starRes.json() : null;
    let commitCount = '?';
    if (commitRes.ok) {
      const link = commitRes.headers.get('link');
      if (link) {
        const m = link.match(/&page=(\d+)>; rel="last"/);
        if (m) commitCount = m[1];
      } else {
        const commits = await commitRes.json();
        commitCount = String(commits.length);
      }
    }
    return {
      stars: repoData?.stargazers_count ?? '?',
      forks: repoData?.forks_count ?? '?',
      commits: commitCount,
    };
  } catch {
    return { stars: '?', forks: '?', commits: '?' };
  }
}

function buildBanner(data: { stars: string | number; forks: string | number; commits: string | number }, port: string | number) {
  const logo = `
${BOLD}${CYAN}   ___  _    _         _____  ___  ____  ____  ${RESET}
${BOLD}${CYAN}  / _ \\| |  | |       / _  |/ _ \\/ ___|| ___| ${RESET}
${BOLD}${CYAN} | |_| | |__| |  _   | (_| | |_| \\___ \\| ___| ${RESET}
${BOLD}${CYAN}  \\___/|_____| |_|   \\___/ \\___/|____/|____| ${RESET}
${BOLD}${WHITE}  Professional Photo Editor — Free & Open Source${RESET}
`;

  const info = [
    `${BOLD}${GREEN}  ⭐ Stars${RESET}    ${WHITE}${data.stars}${RESET}`,
    `${BOLD}${MAGENTA}  🍴 Forks${RESET}    ${WHITE}${data.forks}${RESET}`,
    `${BOLD}${YELLOW}  📝 Commits${RESET}  ${WHITE}${data.commits}${RESET}`,
    `${BOLD}${BLUE}  🔗 GitHub${RESET}    ${WHITE}https://github.com/${REPO_OWNER}/${REPO_NAME}${RESET}`,
    `${BOLD}${RED}  ☕ Donate${RESET}     ${WHITE}${DONATE_URL}${RESET}`,
  ].join('\n');

  const local = [
    `${BOLD}${GREEN}  🌐 Local${RESET}       ${WHITE}http://localhost:${port}${RESET}`,
    `${BOLD}${GREEN}  📡 Network${RESET}     ${WHITE}http://0.0.0.0:${port}${RESET}`,
  ].join('\n');

  const buildGuide = box(
    [
      `${BOLD}📦 Build for Production${RESET}`,
      ``,
      `${DIM}  npm install${RESET}`,
      `${DIM}  npm run build${RESET}`,
      `${DIM}  npm start${RESET}`,
    ].join('\n'),
    YELLOW
  );

  const donate = box(
    [
      `${BOLD}☕ Support PhotoFOSS${RESET}`,
      `${WHITE}  ${DONATE_URL}${RESET}`,
    ].join('\n'),
    RED
  );

  return `${logo}\n${info}\n\n${local}\n\n${buildGuide}\n\n${donate}\n`;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/github', async (req, res) => {
    const data = await fetchGitHubData();
    res.json(data);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.clear();
    const data = await fetchGitHubData();
    console.log(buildBanner(data, PORT));
  });
}

startServer().catch((err) => {
  console.error('\n  [PhotoFoss Server] Failed to start:', err, '\n');
});
