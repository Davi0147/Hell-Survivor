/**
 * Chaves centralizadas de persistência (localStorage / sessionStorage) do Hell Survivor.
 * Todas as leituras e gravações devem obrigatoriamente utilizar estas constantes/funções.
 */

export const STORAGE_KEYS = {
  /** Save principal de meta-progressão e estatísticas permanentes (localStorage) */
  META_SAVE: 'hell_survivor_meta_save_v1',
  /** Backup automático de segurança gerado antes de migrações de save (localStorage) */
  META_SAVE_BACKUP: 'hell_survivor_meta_save_v1_backup',
  /** Recorde de sobrevivência em segundos do Modo Infinito exibido na UI (localStorage) */
  ENDLESS_RECORD_SEC: 'hell_survivor_endless_record_sec',
  /** Volume salvo de BGM / Trilha Sonora (localStorage) */
  BGM_VOLUME: 'hell_survivor_bgm_vol',
  /** Volume salvo de SFX / Efeitos Sonoros (localStorage) */
  SFX_VOLUME: 'hell_survivor_sfx_vol',
  /** Histórico dos últimos 150 registros de telemetria/erros do gravador de voo (localStorage) */
  DEBUG_SESSION_LOG: 'hell_survivor_debug_session_log',
  /** Flag de desbloqueio permanente do painel de desenvolvedor (localStorage) */
  DEV_UNLOCKED: 'hell_survivor_dev_unlocked',
  /** Flag de rejeição de instalação do PWA na sessão ativa (sessionStorage) */
  PWA_DISMISSED: 'hell_survivor_pwa_dismissed',

  /**
   * Retorna a chave de armazenamento para mapas customizados do capítulo.
   */
  getChapterMapKey: (chapter: number): string => `hell_survivor_custom_map_chapter_${chapter}`,

  /**
   * Retorna a chave de backup para mapas customizados ao sofrer downgrade de versão.
   */
  getChapterMapBackupKey: (chapter: number): string => `hell_survivor_custom_map_chapter_${chapter}_backup`,
} as const;

export const getChapterMapKey = STORAGE_KEYS.getChapterMapKey;
export const getChapterMapBackupKey = STORAGE_KEYS.getChapterMapBackupKey;
