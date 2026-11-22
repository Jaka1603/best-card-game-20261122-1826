// ai.js — the court's other duellist: Warden Veyla, plus the autopilot
// that stages screenshots and fights the QA duels. Her play is meant to
// be read and countered, so every choice follows one plain rule the
// match log can narrate — no hidden lookahead, no dice.
//
// planNextAction reads the live state and names ONE next action; the
// caller applies it, shows it, and asks again. A plan therefore never
// runs ahead of the board it was made from.
import { attackCreature, hasResonance, playBlockReason, playCard } from './rules.js';
import { SIDE_AI, SIDE_PLAYER } from './state.js';

/**
 * The next action for `side`:
 *   { type: 'play', handIndex, target? } | { type: 'attack', boardIndex, target }
 * or null when the turn is done. Cards first; then each ready creature
 * attacks exactly once.
 */
export function planNextAction(state, side) {
  const foe = side === SIDE_AI ? SIDE_PLAYER : SIDE_AI;
  const pick = chooseCard(state, side, foe);
  if (pick) return pick;
  const s = state[side];
  for (let i = 0; i < s.board.length; i += 1) {
    const creature = s.board[i];
    if (!creature || !creature.canAttack) continue;
    const target = chooseAttackTarget(state, foe, creature);
    if (target) return { type: 'attack', boardIndex: i, target };
  }
  return null;
}

/** The most valuable card to play next, by plain scoring, or null. */
function chooseCard(state, side, foe) {
  const s = state[side];
  const f = state[foe];
  let bestIndex = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < s.hand.length; i += 1) {
    const card = s.hand[i];
    if (playBlockReason(state, side, i)) continue;
    let score = card.cost * 2;
    if (hasResonance(state, side, card)) score += 4; // an element chain pays
    if (card.kind === 'spell') {
      if (card.effect === 'damage') {
        const lethal = card.amount >= f.life;
        const bigThreat = f.board.some((c) => c.attack >= 4);
        if (!lethal && !bigThreat) continue; // hold the burst for a real threat
        score += lethal ? 20 : 8;
      } else if (card.effect === 'heal') {
        if (s.life > s.maxLife - 4) continue; // nothing worth mending yet
        score += 6;
      } else if (card.effect === 'draw') {
        if (s.hand.length > 4) continue;
        score += 5;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  if (bestIndex < 0) return null;
  const card = s.hand[bestIndex];
  const target = card.kind === 'spell' && card.effect === 'damage'
    ? chooseDamageTarget(state, foe, card)
    : null;
  return { type: 'play', handIndex: bestIndex, target };
}

/** A damage spell: the hero when it is lethal, else the biggest threat. */
function chooseDamageTarget(state, foe, card) {
  const f = state[foe];
  if (card.amount >= f.life) return { kind: 'hero', side: foe };
  let bigIndex = -1;
  let bigAttack = 0;
  f.board.forEach((c, idx) => {
    if (c.attack > bigAttack) {
      bigAttack = c.attack;
      bigIndex = idx;
    }
  });
  return bigIndex >= 0
    ? { kind: 'creature', side: foe, index: bigIndex }
    : { kind: 'hero', side: foe };
}

/** An attack: trade into a dangerous enemy this creature can kill,
 * otherwise go for the enemy hero. */
function chooseAttackTarget(state, foe, creature) {
  const f = state[foe];
  let preyIndex = -1;
  let preyAttack = 0;
  for (let i = 0; i < f.board.length; i += 1) {
    const enemy = f.board[i];
    if (enemy.attack >= 4 && creature.attack >= enemy.health && enemy.attack > preyAttack) {
      preyIndex = i;
      preyAttack = enemy.attack;
    }
  }
  return preyIndex >= 0
    ? { kind: 'creature', side: foe, index: preyIndex }
    : { kind: 'hero', side: foe };
}

/** Apply one planned action through the rules; returns its result. */
export function applyAction(state, side, action) {
  return action.type === 'play'
    ? playCard(state, side, action.handIndex, action.target)
    : attackCreature(state, side, action.boardIndex, action.target);
}

/**
 * Play a whole turn for `side`, one action at a time, calling
 * `onStep(action, result)` after each so the table can animate it.
 */
export async function runTurn(state, side, onStep, delayMs) {
  for (let guard = 0; guard < 40; guard += 1) {
    if (state.winner) break;
    const action = planNextAction(state, side);
    if (!action) break;
    const result = applyAction(state, side, action);
    if (onStep) onStep(action, result);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
