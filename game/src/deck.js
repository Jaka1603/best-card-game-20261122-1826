// deck.js — turns the card catalogue into live card instances and moves
// them from deck to hand. An instance copies its definition row and adds
// the mutable body (attack/health can change in play); the definition row
// itself is never written to.
import { CARD_BY_ID, DECK_LIST } from './config.js';
import { shuffle } from './random.js';

let nextUid = 1;

function instantiate(def) {
  return {
    uid: nextUid++,
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
}

/** A fresh, shuffled 30-card deck of instances. */
export function buildDeck(rng) {
  return shuffle(DECK_LIST, rng).map((id) => instantiate(CARD_BY_ID[id]));
}

/** Draw up to `count` cards into `hand`, respecting the hand limit. */
export function drawFrom(deck, hand, count, maxHand) {
  const drawn = [];
  while (count > 0 && deck.length > 0 && hand.length < maxHand) {
    drawn.push(deck.shift());
    count -= 1;
  }
  for (const card of drawn) hand.push(card);
  return drawn;
}
