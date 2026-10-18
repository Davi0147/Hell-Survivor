import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const baselinePath = path.join(__dirname, 'theme-baseline.json');

const hexRegex = /(?:0x[0-9a-fA-F]{6}\b|#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b)/g;

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files = files.concat(walk(full));
    } else if (/\.(ts|js|tsx)$/.test(item)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(srcDir);
// Filtra fora src/config/theme.ts (ponto único da verdade)
const targetFiles = allFiles.filter(file => {
  const norm = file.replace(/\\/g, '/');
  return !norm.endsWith('/src/config/theme.ts');
});

let totalOccurrences = 0;
const distinctColors = new Set();

for (const file of targetFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(hexRegex) || [];
  if (matches.length > 0) {
    totalOccurrences += matches.length;
    for (const m of matches) {
      distinctColors.add(m.toLowerCase());
    }
  }
}

if (!fs.existsSync(baselinePath)) {
  console.error(`[verify-theme] ERRO: Arquivo de baseline não encontrado em ${baselinePath}`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const maxAllowed = baseline.maxHexLiterals;

console.log(`[verify-theme] Contagem de literais hex em src/ (fora de theme.ts): ${totalOccurrences}`);
console.log(`[verify-theme] Limite máximo permitido pela catraca: ${maxAllowed}`);
console.log(`[verify-theme] Cores distintas encontradas: ${distinctColors.size}`);

if (process.argv.includes('--update')) {
  baseline.maxHexLiterals = totalOccurrences;
  baseline.distinctColors = distinctColors.size;
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n', 'utf8');
  console.log(`[verify-theme] Baseline atualizado com sucesso para ${totalOccurrences} literais.`);
  process.exit(0);
}

if (totalOccurrences > maxAllowed) {
  console.error(`\n❌ [verify-theme] FALHA NA CATRACA DE CORES:`);
  console.error(`   Foram encontrados ${totalOccurrences} literais hex fora de src/config/theme.ts, mas o teto máximo é ${maxAllowed}.`);
  console.error(`   Excesso detectado: +${totalOccurrences - maxAllowed} ocorrência(s).`);
  console.error(`   -> Conforme a Regra 5 do AGENTS.md, novas cores DEVEM ser centralizadas como tokens semânticos em src/config/theme.ts.`);
  process.exit(1);
}

if (totalOccurrences < maxAllowed) {
  console.log(`\n🎉 [verify-theme] Parabéns! A quantidade de cores fora do tema diminuiu de ${maxAllowed} para ${totalOccurrences}.`);
  console.log(`   Execute 'node scripts/verify-theme.mjs --update' para travar a nova catraca.`);
} else {
  console.log(`\n✅ [verify-theme] Catraca de cores respeitada com perfeição (${totalOccurrences}/${maxAllowed}).`);
}

process.exit(0);
