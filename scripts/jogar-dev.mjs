import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec, execSync, spawn } from 'node:child_process';

const logFile = path.resolve('reports/ultimo-jogar.txt');
fs.mkdirSync(path.dirname(logFile), { recursive: true });
fs.writeFileSync(logFile, `=== INICIO DO LOG JOGAR.BAT - ${new Date().toISOString()} ===\n`, 'utf8');

function log(msg) {
  const line = `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + '\n', 'utf8');
  } catch {}
}

function freePort3000() {
  log('[*] Verificando se a porta 3000 esta ocupada...');
  try {
    const netstatOut = execSync('netstat -aon', { encoding: 'utf8' });
    const lines = netstatOut.split('\n');
    const pids = new Set();
    for (const l of lines) {
      if (l.includes(':3000') && l.includes('LISTENING')) {
        const parts = l.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          pids.add(pid);
        }
      }
    }

    for (const pid of pids) {
      try {
        const taskOut = execSync(`tasklist /fi "pid eq ${pid}" /nh`, { encoding: 'utf8' });
        if (/node\.exe/i.test(taskOut)) {
          log(`[*] Liberando porta 3000 (encerrando processo node.exe PID ${pid})...`);
          execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' });
        } else {
          log(`[!] Porta 3000 em uso por processo nao-node (PID ${pid}). Nao sera encerrado.`);
        }
      } catch {
        // Processo pode ja ter encerrado
      }
    }
  } catch (err) {
    log(`[*] Verificacao de porta concluida: ${err.message}`);
  }
}

function cleanCaches() {
  log('[*] Limpando caches residuais (node_modules/.vite e dist)...');
  try {
    if (fs.existsSync('node_modules/.vite')) {
      fs.rmSync('node_modules/.vite', { recursive: true, force: true });
      log('[OK] Cache node_modules/.vite removido com sucesso.');
    }
  } catch (e) {
    log(`[!] Aviso ao limpar node_modules/.vite: ${e.message}`);
  }
  try {
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
      log('[OK] Pasta dist residual removida com sucesso.');
    }
  } catch (e) {
    log(`[!] Aviso ao limpar dist: ${e.message}`);
  }
}

function openBrowser(url) {
  log(`[*] Abrindo navegador padrao em ${url}...`);
  exec(`start "" "${url}"`, (err) => {
    if (err) {
      log(`[!] Aviso ao abrir navegador: ${err.message}`);
    } else {
      log('[OK] Navegador aberto com sucesso.');
    }
  });
}

async function main() {
  freePort3000();
  cleanCaches();

  log('[*] Iniciando servidor Vite na porta 3000 com --force...');
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');

  const viteProcess = spawn(process.execPath, [viteBin, '--port', '3000', '--force'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false
  });

  viteProcess.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    try {
      fs.appendFileSync(logFile, chunk);
    } catch {}
  });

  viteProcess.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    try {
      fs.appendFileSync(logFile, chunk);
    } catch {}
  });

  viteProcess.on('exit', (code) => {
    log(`[*] Servidor Vite finalizado com codigo ${code}.`);
    process.exit(code || 0);
  });

  const startTime = Date.now();
  const timeoutMs = 60000;
  let browserOpened = false;

  const pollInterval = setInterval(() => {
    if (browserOpened) {
      clearInterval(pollInterval);
      return;
    }

    if (Date.now() - startTime > timeoutMs) {
      clearInterval(pollInterval);
      log('ERRO: O servidor nao respondeu na porta 3000 em 60 segundos.');
      viteProcess.kill();
      process.exit(1);
    }

    const req = http.get('http://localhost:3000', (res) => {
      if (!browserOpened) {
        browserOpened = true;
        clearInterval(pollInterval);
        log(`[OK] Servidor respondeu na porta 3000 (status ${res.statusCode}).`);
        openBrowser('http://localhost:3000');
      }
    });

    req.on('error', () => {
      // Servidor ainda subindo
    });

    req.setTimeout(800, () => {
      req.destroy();
    });
  }, 300);

  process.on('SIGINT', () => {
    log('[*] Encerrando servidor via SIGINT...');
    viteProcess.kill();
    process.exit(0);
  });
}

main().catch((err) => {
  log(`ERRO: ${err.message}`);
  process.exit(1);
});
