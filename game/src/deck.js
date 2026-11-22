// deck.js — builds a fresh 30-card deck of card instances and draws from it.
// A card instance is a copy of its CARD_DEFS row plus a unique uid and live body
// (attack/health) that rules.js mutates; the def row itself is never mutated.
import { CARD_BY_ID, DECK_LIST } from './config.js';
import { shuffle } from './random.js';

let uidCounter = 1;

/** Build one shuffled deck of card instances from DECK_LIST. */
export function buildDeck(rng) {
  const ids = shuffle(DECK_LIST, rng);
  return ids.map((id) => {
    const def = CARD_BY_ID[id];
    return {
      uid: uidCounter++,
      defId: def.id,
      name: def.name,
      element: def.element,
      kind: def.kind,
      cost: def.cost,
      attack: def.attack ?? 0,
      health: def.health ?? 0,
      maxHealth: def.health ?? 0,
      effect: def.effect ?? null,
      amount: def.amount ?? 0,
      text: def.text,
      canAttack: false,
      justPlayed: false,
    };
  });
}

/** Move up to `count` cards from the top of `deck` into `hand`; returns drawn cards. */
export function drawFrom(deck, hand, count, maxHand) {
  const drawn = [];
  while (count > 0 && deck.length > 0 && hand.length < maxHand) {
    drawn.push(deck.shift());
    count -= 1;
  }
  hand.push(...drawn);
  return drawn;
}
