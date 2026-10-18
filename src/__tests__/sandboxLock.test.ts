import { describe, it, expect, vi, afterEach } from 'vitest';
import { isDevSandboxEnabled } from '../config/balance';
import { STORAGE_KEYS } from '../config/storageKeys';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, String(value));
    },
    removeItem: (key: string): boolean => store.delete(key),
    clear: (): void => store.clear(),
    get length(): number {
      return store.size;
    },
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null
  };
}

describe('isDevSandboxEnabled (Bloqueio Estrito do Modo de Teste em Produção Pública)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
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

    it('retorna false em endereço público mesmo com a chave de dev ligada no localStorage', () => {
      const mockStorage = createMemoryStorage();
      mockStorage.setItem(STORAGE_KEYS.DEV_UNLOCKED, 'true');

      vi.stubGlobal('window', {
        location: {
          hostname: 'davi0147.github.io',
          search: ''
        },
        localStorage: mockStorage
      });
      vi.stubGlobal('localStorage', mockStorage);

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

    it('em localhost com PROD=true, retorna false SEM ?debug=1 e true COM ?debug=1', () => {
      vi.stubEnv('PROD', true);

      // SEM ?debug=1 -> false
      vi.stubGlobal('window', {
        location: {
          hostname: 'localhost',
          search: ''
        }
      });
      expect(isDevSandboxEnabled()).toBe(false);

      // COM ?debug=1 -> true
      vi.stubGlobal('window', {
        location: {
          hostname: 'localhost',
          search: '?debug=1'
        }
      });
      expect(isDevSandboxEnabled()).toBe(true);
    });
  });
});
