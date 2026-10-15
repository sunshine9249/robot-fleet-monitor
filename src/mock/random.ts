/**
 * 시드 고정 난수 (mulberry32).
 * 데모를 열 때마다 처음 몇 분의 모습이 같도록 Math.random 대신 씁니다.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** [min, max) */
    range(min: number, max: number) {
      return min + (max - min) * next();
    },
    int(min: number, max: number) {
      return Math.floor(min + (max - min + 1) * next());
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)];
    },
    chance(probability: number) {
      return next() < probability;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
