// state.js — the one mutable game state. Every system reads and writes this
// object and nothing else, so the live game, the autopilot and the screenshot
// staging (shots.js) all run the same duel.
import { TUNING } from './config.js';
import { mulberry32 } from './random.js';
import { buildDeck, drawFrom } from './deck.js';

export const SIDE_PLAYER = 'player';
export const SIDE_AI = 'ai';

function freshSide(rng) {
  return {
    life: TUNING.startLife,
    maxLife: TUNING.maxLife,
    ember: TUNING.startEmber,
    maxEmber: TUNING.startEmber,
    deck: buildDeck(rng),
    hand: [],
    board: [],
    lastElement: null, // element of the last card this side played this turn (resonance)
    cardsPlayed: 0,
    damageDealt: 0,
    spellsCast: 0,
  };
}

/** Create a new duel state for `seed`; the duel starts when startDuel runs. */
export function createGame(seed) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title', // title | play | over
    turn: 1,
    sideToMove: SIDE_PLAYER,
    phase: 'title', // title | player | ai | over
    winner: null, // 'player' | 'ai' | null
    player: freshSide(rng),
    ai: freshSide(rng),
    log: [],
    stats: { turnsPlayed: 0, cardsPlayed: 0, damageDealt: 0 },
    aiBusy: false,
  };
  return state;
}

/** Deal opening hands and open the table. The player always moves first;
 * Veyla, moving second, draws one extra card and starts with 2 ember. */
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
