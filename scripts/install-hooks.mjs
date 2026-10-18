import { execSync } from 'child_process';

console.log('[install-hooks] Configurando guarda de qualidade do Hell Survivor...');

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
  console.log('\n[OK] Git configurado com sucesso: core.hooksPath = .githooks');
  console.log('[OK] O hook de pre-commit foi ativado.');
  console.log('[OK] A partir de agora, "npm run check" rodara automaticamente antes de cada commit.\n');
} catch (e) {
  console.error('\n[ERRO] Falha ao configurar git hook:', e.message);
  process.exit(1);
}
