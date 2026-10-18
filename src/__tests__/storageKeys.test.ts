import { describe, it, expect } from 'vitest';
import { STORAGE_KEYS, getChapterMapKey, getChapterMapBackupKey } from '../config/storageKeys';

describe('STORAGE_KEYS (Integridade e Imutabilidade das Chaves de Persistência)', () => {
  it('garante que a chave do save de meta-progressão é idêntica ao padrão legado v1', () => {
    expect(STORAGE_KEYS.META_SAVE).toBe('hell_survivor_meta_save_v1');
    expect(STORAGE_KEYS.META_SAVE_BACKUP).toBe('hell_survivor_meta_save_v1_backup');
  });

  it('garante que a chave do recorde do Modo Infinito é idêntica à string legada', () => {
    expect(STORAGE_KEYS.ENDLESS_RECORD_SEC).toBe('hell_survivor_endless_record_sec');
  });

  it('garante que as chaves de volume de áudio correspondem às strings legadas', () => {
    expect(STORAGE_KEYS.BGM_VOLUME).toBe('hell_survivor_bgm_vol');
    expect(STORAGE_KEYS.SFX_VOLUME).toBe('hell_survivor_sfx_vol');
  });

  it('garante que a chave do gravador de logs corresponde à string legada', () => {
    expect(STORAGE_KEYS.DEBUG_SESSION_LOG).toBe('hell_survivor_debug_session_log');
  });

  it('garante que a chave de desenvolvedor corresponde à string legada', () => {
    expect(STORAGE_KEYS.DEV_UNLOCKED).toBe('hell_survivor_dev_unlocked');
  });

  it('garante que a chave de prompt do PWA corresponde à string legada', () => {
    expect(STORAGE_KEYS.PWA_DISMISSED).toBe('hell_survivor_pwa_dismissed');
  });

  it('gera corretamente as chaves dinâmicas de mapas de capítulos e seus backups', () => {
    expect(getChapterMapKey(1)).toBe('hell_survivor_custom_map_chapter_1');
    expect(getChapterMapKey(2)).toBe('hell_survivor_custom_map_chapter_2');
    expect(getChapterMapKey(202)).toBe('hell_survivor_custom_map_chapter_202');

    expect(getChapterMapBackupKey(1)).toBe('hell_survivor_custom_map_chapter_1_backup');
    expect(getChapterMapBackupKey(2)).toBe('hell_survivor_custom_map_chapter_2_backup');
    expect(getChapterMapBackupKey(202)).toBe('hell_survivor_custom_map_chapter_202_backup');
  });
});
