import { defineConfig, Plugin } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function getGitSha(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

function getFormattedDate(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value])
  );
  if (process.env.INCLUDE_BUILD_SECONDS === '1') {
    return `${parts.day}/${parts.month} ${parts.hour}:${parts.minute}:${parts.second}`;
  }
  return `${parts.day}/${parts.month} ${parts.hour}:${parts.minute}`;
}

function buildVersionPlugin(): Plugin {
  let buildId = '';

  return {
    name: 'hell-survivor-build-version',
    configResolved() {
      const sha = getGitSha();
      const dateStr = getFormattedDate();
      buildId = `${sha} • ${dateStr}`;
    },
    transformIndexHtml(html) {
      return html.replace(
        /(<div id="build-version"[^>]*>)([\s\S]*?)(<\/div>)/,
        `$1${buildId}$3`
      );
    },
    closeBundle() {
      const swDistPath = path.resolve(__dirname, 'dist', 'sw.js');
      if (fs.existsSync(swDistPath)) {
        let swContent = fs.readFileSync(swDistPath, 'utf8');
        swContent = swContent.replace(/__BUILD_ID__/g, buildId);
        fs.writeFileSync(swDistPath, swContent, 'utf8');
      }
    }
  };
}

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  },
  plugins: [
    buildVersionPlugin()
  ]
});
