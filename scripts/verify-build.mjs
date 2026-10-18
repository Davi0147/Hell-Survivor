import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

const swPath = path.join(distDir, 'sw.js');
const indexPath = path.join(distDir, 'index.html');

console.log('[verify-build] Iniciando verificação de integridade pós-build...');

if (!fs.existsSync(swPath)) {
  console.error('[verify-build] ERRO: dist/sw.js não encontrado.');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('[verify-build] ERRO: dist/index.html não encontrado.');
  process.exit(1);
}

const swContent = fs.readFileSync(swPath, 'utf8');
if (swContent.includes('__BUILD_ID__')) {
  console.error('[verify-build] ERRO: dist/sw.js ainda contém o marcador não-substituído "__BUILD_ID__".');
  process.exit(1);
}

const swMatch = swContent.match(/const\s+BUILD_ID\s*=\s*['"]([^'"]+)['"]/);
if (!swMatch || !swMatch[1] || swMatch[1].trim() === '') {
  console.error('[verify-build] ERRO: Não foi possível extrair um BUILD_ID válido de dist/sw.js.');
  process.exit(1);
}

const swBuildId = swMatch[1].trim();
console.log(`[verify-build] BUILD_ID detectado em dist/sw.js: "${swBuildId}"`);

const indexContent = fs.readFileSync(indexPath, 'utf8');
const indexMatch = indexContent.match(/<div\s+id="build-version"[^>]*>([\s\S]*?)<\/div>/);
if (!indexMatch || !indexMatch[1]) {
  console.error('[verify-build] ERRO: Elemento #build-version não encontrado em dist/index.html.');
  process.exit(1);
}

const indexBuildId = indexMatch[1].trim();
console.log(`[verify-build] Texto em #build-version de dist/index.html: "${indexBuildId}"`);

if (swBuildId !== indexBuildId) {
  console.error(`[verify-build] ERRO: Divergência entre sw.js ("${swBuildId}") e index.html ("${indexBuildId}").`);
  process.exit(1);
}

console.log('[verify-build] SUCESSO: Build verificado com integridade atômica entre sw.js e index.html.');
process.exit(0);
