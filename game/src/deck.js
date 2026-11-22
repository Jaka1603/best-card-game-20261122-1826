// deck.js — from catalogue rows to live cards, and from deck to hand.
// An instance copies its definition and adds the parts that change in
// play (current attack/health, rest state); definitions stay pristine.
import { CARD_BY_ID, DECK_LIST } from './config.js';
import { shuffle } from './random.js';

let uidCounter = 1;

function makeInstance(def) {
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
}

/** A new shuffled deck of thirty card instances. */
export function buildDeck(rng) {
  return shuffle(DECK_LIST, rng).map((id) => makeInstance(CARD_BY_ID[id]));
}

/** Move up to `count` cards from the top of `deck` into `hand`. */
export function drawFrom(deck, hand, count, maxHand) {
  const drawn = [];
  while (count > 0 && deck.length > 0 && hand.length < maxHand) {
    drawn.push(deck.shift());
    count -= 1;
  }
  hand.push(...drawn);
  return drawn;
}
