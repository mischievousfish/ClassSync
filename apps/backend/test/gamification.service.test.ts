jest.mock('../src/config/firebase', () => ({ db: {} }));

import { levelForXp, xpRequiredForLevel } from '../src/services/gamification.service';

describe('gamification progression', () => {
  it('uses the documented level curve', () => {
    expect(xpRequiredForLevel(1)).toBe(100);
    expect(xpRequiredForLevel(2)).toBe(283);
    expect(xpRequiredForLevel(5)).toBe(1119);
  });

  it('returns the highest level fully reached by XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(100)).toBe(1);
    expect(levelForXp(283)).toBe(2);
    expect(levelForXp(1000)).toBe(4);
  });
});