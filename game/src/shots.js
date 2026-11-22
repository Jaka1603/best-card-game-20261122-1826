// shots.js — the screenshot scenes behind ?shot=title|play|win|loss.
// Each scene plays the REAL rules forward from a fresh duel with a fixed seed,
// steered by the same autopilot that drives QA (planNextAction), so the frame
// is what a short game really looks like and the same seed always gives the
// same frame. Win/loss scenes search seeds until the autopilot duel ends the
// way the shot needs, then render that real final state.
import { applyAction, planNextAction } from './ai.js';
import { endTurn } from './rules.js';
import { createGame, startDuel } from './state.js';

/** Play one whole turn synchronously (no animation delays) for `side`. */
export function runTurnSync(state, side) {
  for (let guard = 0; guard < 40; guard += 1) {
    if (state.winner) break;
    const action = planNextAction(state, side);
    if (!action) break;
    applyAction(state, side, action);
  }
}

/** Play a full duel synchronously; returns the winner ('player' | 'ai' | null). */
export function simulateDuel(seed, maxTurns = 60) {
  const state = createGame(seed);
  startDuel(state);
  while (!state.winner && state.turn <= maxTurns) {
    runTurnSync(state, 'player');
    if (state.winner) break;
    endTurn(state); // -> ai
    runTurnSync(state, 'ai');
    if (state.winner) break;
    endTurn(state); // -> player, turn + 1
  }
  return { state, winner: state.winner };
}

/** A mid-game state worth photographing: both boards busy, hands full, turn 4+. */
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
    if (state.player.board.length >= 2 && state.ai.board.length >= 2
      && state.player.hand.length >= 3 && state.ai.hand.length >= 2) {
      return state;
    }
  }
  return null;
}

/** The first seed whose autopilot duel ends with `wanted` winning. */
function findEndState(wanted) {
  for (let seed = 1; seed <= 80; seed += 1) {
    const { state, winner } = simulateDuel(seed);
    if (winner === wanted) return state;
  }
  return null;
}

/**
 * Stage the named scene on a fresh state and return it (title, play, win, loss;
 * anything else is title). The caller renders the returned state.
 */
export function stageShot(name) {
  if (name === 'play') {
    return findPlayState() ?? createGame(7);
  }
  if (name === 'win') {
    return findEndState('player') ?? createGame(7);
  }
  if (name === 'loss') {
    return findEndState('ai') ?? createGame(7);
  }
  return createGame(7);
}
