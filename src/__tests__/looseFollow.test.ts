import { describe, expect, it } from 'vitest';
import { shouldFollow } from '../entities/talismans/pets/looseFollow';

describe('shouldFollow (pet seguindo com folga)', () => {
  it('parado perto da heroína continua parado', () => {
    expect(shouldFollow(false, 30, 52, 14)).toBe(false);
  });

  it('começa a andar só quando ela se afasta além do início', () => {
    expect(shouldFollow(false, 53, 52, 14)).toBe(true);
  });

  it('andando, continua andando até chegar bem perto', () => {
    expect(shouldFollow(true, 30, 52, 14)).toBe(true);
    expect(shouldFollow(true, 14, 52, 14)).toBe(false);
  });
});
