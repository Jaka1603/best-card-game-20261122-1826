// state.js — the single mutable object every part of the game shares.
// Rules mutate it, the AI reads it, the renderer paints it, and the
// screenshot staging drives it through real turns — so a photographed
// frame and a live frame are the same kind of thing.
import { TUNING } from './config.js';
import { buildDeck, drawFrom } from './deck.js';
import { mulberry32 } from './random.js';

export const SIDE_PLAYER = 'player';
export const SIDE_AI = 'ai';

function blankSide(rng) {
  return {
    life: TUNING.startLife,
    maxLife: TUNING.maxLife,
    ember: TUNING.startEmber,
    maxEmber: TUNING.startEmber,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    lastElement: null, // element of the last card this side played this turn
    cardsPlayed: 0,
    damageDealt: 0,
    spellsCast: 0,
  };
}

/** A fresh duel for `seed`; cards are dealt by startDuel, not here. */
export function createGame(seed) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    screen: 'title', // title | play | over
    turn: 1,
    sideToMove: SIDE_PLAYER,
    phase: 'title', // title | player | ai | over
    winner: null,
    player: blankSide(rng),
    ai: blankSide(rng),
    log: [],
    stats: { turnsPlayed: 0, cardsPlayed: 0, damageDealt: 0 },
    aiBusy: false,
  };
}

/** Deal the opening hands. The player moves first; Veyla, moving
 * second, opens with one extra card and a second ember on turn one. */
export function startDuel(state) {
  state.screen = 'play';
  state.phase = 'player';
  state.sideToMove = SIDE_PLAYER;
  drawFrom(state.player.deck, state.player.hand, TUNING.openingHand, TUNING.maxHand);
  drawFrom(state.ai.deck, state.ai.hand, TUNING.aiOpeningHand, TUNING.maxHand);
  state.ai.maxEmber = TUNING.aiOpeningEmber;
  state.ai.ember = TUNING.aiOpeningEmber;
  pushLog(state, 'The duel begins. You move first — spend your ember well.');
}

export function otherSide(side) {
  return side === SIDE_PLAYER ? SIDE_AI : SIDE_PLAYER;
}

export function pushLog(state, text) {
  state.log.push(text);
  if (state.log.length > 6) state.log.shift();
}
