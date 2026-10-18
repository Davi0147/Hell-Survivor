import { describe, it, expect, vi, afterEach } from 'vitest';
import { isDevSandboxEnabled } from '../config/balance';

describe('isDevSandboxEnabled (Bloqueio Estrito do Modo de Teste em Produção Pública)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Endereço Público (ex: GitHub Pages davi0147.github.io ou domínio customizado)', () => {
    it('retorna false mesmo com ?debug=1 na URL em endereço público', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'davi0147.github.io',
          search: '?debug=1'
        }
      });
      expect(isDevSandboxEnabled()).toBe(false);
    });

    it('retorna false mesmo com ?sandbox=1 em endereço público', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'davi0147.github.io',
          search: '?sandbox=1'
        }
      });
      expect(isDevSandboxEnabled()).toBe(false);
    });

    it('retorna false em acesso público limpo sem parâmetros', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'davi0147.github.io',
          search: ''
        }
      });
      expect(isDevSandboxEnabled()).toBe(false);
    });
  });

  describe('Ambiente Local (localhost e 127.0.0.1)', () => {
    it('em localhost dev (não-PROD), retorna true respeitando ENABLE_DEV_SANDBOX', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: 'localhost',
          search: ''
        }
      });
      expect(isDevSandboxEnabled()).toBe(true);
    });

    it('em 127.0.0.1 dev (não-PROD), retorna true', () => {
      vi.stubGlobal('window', {
        location: {
          hostname: '127.0.0.1',
          search: ''
        }
      });
      expect(isDevSandboxEnabled()).toBe(true);
    });
  });
});
