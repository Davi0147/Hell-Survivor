import { spawnSync } from 'child_process';

console.log('\n[guarda-qualidade] Executando catraca de qualidade antes do commit (npm run check)...');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const result = spawnSync(npmCmd, ['run', 'check'], {
  stdio: 'inherit',
  shell: true
});

if (result.status !== 0) {
  console.error('\n❌ [guarda-qualidade] COMMIT BLOQUEADO: "npm run check" falhou!');
  console.error('   Corrija as falhas de TypeScript, ESLint, catraca de cores ou testes acima antes de commitar.\n');
  process.exit(1);
}

console.log('\n✅ [guarda-qualidade] Aprovado! TypeScript, ESLint, Cores e Testes validados com sucesso.\n');
process.exit(0);
