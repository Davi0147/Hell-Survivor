import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      // Modo "Catraca": regras que o código legado viola começam como WARN
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'warn',
      'no-empty': 'warn',
      'no-constant-condition': 'warn',
      'prefer-const': 'warn',
      'no-useless-assignment': 'warn',

      // Erros reais bloqueiam
      'no-undef': 'off', // TypeScript compiler (tsc) já valida escopo e símbolos estritamente
      'no-unreachable': 'error',
      'no-dupe-keys': 'error'
    }
  },
  {
    ignores: ['dist/', 'node_modules/', 'backups/', 'scratch/', 'public/']
  }
];
