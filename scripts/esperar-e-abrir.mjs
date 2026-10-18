import http from 'node:http';
import { exec } from 'node:child_process';

const port = process.argv[2] || '8080';
const checkUrl = `http://127.0.0.1:${port}/`;
const openUrl = `http://localhost:${port}`;
const startTime = Date.now();
const timeoutMs = 60000;

console.log(`[*] Aguardando servidor de preview responder na porta ${port}...`);

const pollInterval = setInterval(() => {
  if (Date.now() - startTime > timeoutMs) {
    clearInterval(pollInterval);
    console.error(`[ERRO] O servidor nao respondeu na porta ${port} em 60 segundos.`);
    process.exit(1);
  }

  const req = http.get(checkUrl, (res) => {
    clearInterval(pollInterval);
    console.log(`[OK] Servidor ativo na porta ${port} (HTTP ${res.statusCode}). Abrindo navegador...`);
    exec(`start "" "${openUrl}"`, (err) => {
      if (err) {
        console.error(`[!] Erro ao abrir navegador: ${err.message}`);
      }
      process.exit(0);
    });
  });

  req.on('error', () => {
    // Servidor ainda iniciando
  });

  req.setTimeout(800, () => {
    req.destroy();
  });
}, 200);
