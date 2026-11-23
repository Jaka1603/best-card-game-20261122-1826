// random.js — the duel's single source of chance.
// One seeded generator drives every shuffle in the game, so a given
// seed always replays the same duel; that determinism is what lets
// shots.js stage a real mid-game frame and lets the QA duels be
// repeated exactly, run after run.

/** mulberry32: a small, fast, seedable PRNG. Returns values in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A shuffled copy of `list`, Fisher–Yates, driven by the given rng. */
export function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
