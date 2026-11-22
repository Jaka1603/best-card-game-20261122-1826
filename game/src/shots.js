// shots.js — the staged scenes behind ?shot=title|play|win|loss.
// A scene is played, not posed: the autopilot fights real turns from a
// fresh duel on a fixed seed until the frame the screenshot names is
// genuinely reached, so the same seed always photographs the same game.
import { applyAction, planNextAction } from './ai.js';
import { endTurn } from './rules.js';
import { createGame, startDuel } from './state.js';

/** One whole turn for `side`, applied at once (no animation delays). */
export function runTurnSync(state, side) {
  for (let guard = 0; guard < 40; guard += 1) {
    if (state.winner) break;
    const action = planNextAction(state, side);
    if (!action) break;
    applyAction(state, side, action);
  }
}

/** A whole duel, both sides on autopilot; returns { state, winner }. */
export function simulateDuel(seed, maxTurns = 60) {
  const state = createGame(seed);
  startDuel(state);
  while (!state.winner && state.turn <= maxTurns) {
    runTurnSync(state, 'player');
    if (state.winner) break;
    endTurn(state); // to Veyla
    runTurnSync(state, 'ai');
    if (state.winner) break;
    endTurn(state); // back to the player, turn + 1
  }
  return { state, winner: state.winner };
}

/** The first seed that reaches a photogenic turn 5: both boards busy,
 * both hands still holding cards, nobody dead yet. */
function findPlayState() {
  for (let seed = 1; seed <= 80; seed += 1) {
    const state = createGame(seed);
    startDuel(state);
    while (!state.winner && state.turn < 5) {
      runTurnSync(state, 'player');
      if (state.winner) break;
      endTurn(state);
      runTurnSync(state, 'ai');
      if (state.winner) break;
      endTurn(state);
    }
    if (state.winner) continue;
    const busy = state.player.board.length >= 2 && state.ai.board.length >= 2;
    const full = state.player.hand.length >= 3 && state.ai.hand.length >= 2;
    if (busy && full) return state;
  }
  return null;
}

/** The first seed whose autopilot duel ends with `wanted` the winner. */
function findEndState(wanted) {
  for (let seed = 1; seed <= 80; seed += 1) {
    const { state, winner } = simulateDuel(seed);
    if (winner === wanted) return state;
  }
  return null;
}

/** Stage the named scene on a fresh state and return it for rendering. */
export function stageShot(name) {
  if (name === 'play') return findPlayState() ?? createGame(7);
  if (name === 'win') return findEndState('player') ?? createGame(7);
  if (name === 'loss') return findEndState('ai') ?? createGame(7);
  return createGame(7);
}
