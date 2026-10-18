import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('.');
const batFiles = fs.readdirSync(rootDir).filter(f => f.toLowerCase().endsWith('.bat'));

console.log(`[verify-bat] Verificando ${batFiles.length} arquivos .bat na raiz: ${batFiles.join(', ')}`);

let hasError = false;

for (const file of batFiles) {
  const filePath = path.join(rootDir, file);
  const buf = fs.readFileSync(filePath);
  const str = buf.toString('latin1');
  const errors = [];

  // 1. BOM check
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    errors.push('Possui UTF-8 BOM no cabecalho');
  }

  // 2. Byte > 127 (non-ASCII)
  const nonAsciiPositions = [];
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 127) {
      nonAsciiPositions.push({ byte: buf[i], index: i });
    }
  }
  if (nonAsciiPositions.length > 0) {
    errors.push(`Possui ${nonAsciiPositions.length} bytes > 127 (nao-ASCII)`);
  }

  // 3. LF sem CR check (deve ser CRLF estrito)
  let bareLfCount = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0A) {
      if (i === 0 || buf[i - 1] !== 0x0D) {
        bareLfCount++;
      }
    }
  }
  if (bareLfCount > 0) {
    errors.push(`Possui ${bareLfCount} quebras de linha LF isoladas (sem CR)`);
  }

  // 4. chcp check
  if (/\bchcp\b/i.test(str)) {
    errors.push('Contem comando "chcp"');
  }

  // 5. enabledelayedexpansion check
  if (/enabledelayedexpansion/i.test(str)) {
    errors.push('Contem "enabledelayedexpansion"');
  }

  // 6. ! check
  if (str.includes('!')) {
    const count = (str.match(/!/g) || []).length;
    errors.push(`Contem ${count} caractere(s) "!"`);
  }

  if (errors.length > 0) {
    console.error(`[FALHA] ${file}:`);
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    hasError = true;
  } else {
    console.log(`[OK] ${file}: 100% compativel (ASCII estrito, CRLF, sem BOM, sem chcp, sem delayedexpansion, sem !)`);
  }
}

if (hasError) {
  console.error('\n[verify-bat] ERRO: Um ou mais arquivos .bat violam as regras estritas.');
  process.exit(1);
} else {
  console.log('\n[verify-bat] SUCESSO: Todos os arquivos .bat da raiz foram aprovados.');
  process.exit(0);
}
