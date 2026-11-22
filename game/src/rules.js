// rules.js — the duel's rules, pure functions over the state in state.js.
// Damage flows through exactly one function (applyDamage); every other rule
// calls it, so a number is never wrong in one place and right in another.
import { TUNING } from './config.js';
import { drawFrom } from './deck.js';
import { SIDE_AI, SIDE_PLAYER, otherSide, pushLog } from './state.js';

/** True when this card's element matches the last card the side played this turn. */
export function hasResonance(state, side, card) {
  const s = state[side];
  return s.lastElement !== null && s.lastElement === card.element;
}

/** Why a hand card cannot be played right now, or null when it can. */
export function playBlockReason(state, side, handIndex) {
  const s = state[side];
  const card = s.hand[handIndex];
  if (!card) return 'no such card';
  if (card.cost > s.ember) return 'not enough ember';
  if (card.kind === 'creature' && s.board.length >= TUNING.maxBoard) return 'board is full';
  return null;
}

/**
 * Play a hand card. `target` is needed only for the damage spell:
 * { kind: 'creature', side, index } or { kind: 'hero', side }.
 * Returns { ok, reason?, events } — events describe what happened for the renderer.
 */
export function playCard(state, side, handIndex, target) {
  const reason = playBlockReason(state, side, handIndex);
  if (reason) return { ok: false, reason, events: [] };
  const s = state[side];
  const card = s.hand[handIndex];
  const resonance = hasResonance(state, side, card);
  if (card.kind === 'spell' && card.effect === 'damage' && !target) {
    return { ok: false, reason: 'choose a target', events: [] };
  }
  s.hand.splice(handIndex, 1);
  s.ember -= card.cost;
  s.lastElement = card.element;
  s.cardsPlayed += 1;
  state.stats.cardsPlayed += 1;
  const events = [{ type: 'play', side, card }];

  if (card.kind === 'creature') {
    if (resonance) {
      card.attack += TUNING.resonanceAttackBonus;
      card.health += TUNING.resonanceHealthBonus;
      card.maxHealth += TUNING.resonanceHealthBonus;
      events.push({ type: 'resonance', side, card });
    }
    card.canAttack = false; // resting on the turn it is played
    card.justPlayed = true;
    s.board.push(card);
    pushLog(state, `${side === SIDE_PLAYER ? 'You play' : 'Veyla plays'} ${card.name} (${card.attack}/${card.health})${resonance ? ' — RESONANCE! +1/+1' : ''}.`);
  } else {
    s.spellsCast += 1;
    if (card.effect === 'damage') {
      const amount = card.amount + (resonance ? TUNING.resonanceSpellBonus : 0);
      events.push(...applyDamage(state, side, target, amount, card.name));
      pushLog(state, `${side === SIDE_PLAYER ? 'You cast' : 'Veyla casts'} ${card.name} for ${amount} damage${resonance ? ' — RESONANCE! +1' : ''}.`);
    } else if (card.effect === 'heal') {
      const amount = card.amount + (resonance ? TUNING.resonanceHealBonus : 0);
      const before = s.life;
      s.life = Math.min(s.maxLife, s.life + amount);
      events.push({ type: 'heal', side, amount: s.life - before });
      pushLog(state, `${side === SIDE_PLAYER ? 'You cast' : 'Veyla casts'} ${card.name}, restoring ${s.life - before} life.`);
    } else if (card.effect === 'draw') {
      const amount = card.amount + (resonance ? TUNING.resonanceSpellBonus : 0);
      const drawn = drawFrom(s.deck, s.hand, amount, TUNING.maxHand);
      events.push({ type: 'draw', side, count: drawn.length });
      pushLog(state, `${side === SIDE_PLAYER ? 'You cast' : 'Veyla casts'} ${card.name} and draw${drawn.length === 1 ? 's' : ''} ${drawn.length} card${drawn.length === 1 ? '' : 's'}.`);
    }
  }
  return { ok: true, events };
}

/**
 * THE damage function. Deals `amount` to a creature or a hero, removes dead
 * creatures, credits the attacker's damage stat, and reports the duel's winner.
 * Returns the events the renderer should show.
 */
export function applyDamage(state, fromSide, target, amount, sourceName) {
  const events = [];
  const foe = state[target.side];
  if (target.kind === 'hero') {
    foe.life = Math.max(0, foe.life - amount);
    state[fromSide].damageDealt += amount;
    state.stats.damageDealt += fromSide === SIDE_PLAYER ? amount : 0;
    events.push({ type: 'damage', side: target.side, amount, target: 'hero', source: sourceName });
    if (foe.life <= 0) {
      state.winner = fromSide;
      state.screen = 'over';
      state.phase = 'over';
    }
    return events;
  }
  const creature = foe.board[target.index];
  if (!creature) return events;
  creature.health -= amount;
  state[fromSide].damageDealt += amount;
  state.stats.damageDealt += fromSide === SIDE_PLAYER ? amount : 0;
  events.push({ type: 'damage', side: target.side, amount, target: 'creature', index: target.index, source: sourceName });
  if (creature.health <= 0) {
    foe.board.splice(target.index, 1);
    events.push({ type: 'death', side: target.side, card: creature });
    pushLog(state, `${creature.name} is destroyed.`);
  }
  return events;
}

/** Why a board creature cannot attack right now, or null when it can. */
export function attackBlockReason(state, side, boardIndex) {
  const creature = state[side].board[boardIndex];
  if (!creature) return 'no such creature';
  if (!creature.canAttack) return creature.justPlayed ? 'resting — it just arrived' : 'already attacked';
  return null;
}

/**
 * One creature attacks a target. The target fights back with its own attack
 * (creatures only); heroes take the hit and do not strike back.
 */
export function attackCreature(state, side, boardIndex, target) {
  const reason = attackBlockReason(state, side, boardIndex);
  if (reason) return { ok: false, reason, events: [] };
  const attacker = state[side].board[boardIndex];
  attacker.canAttack = false;
  attacker.justPlayed = false;
  const events = [{ type: 'attack', side, card: attacker, target }];
  // Capture the defender BEFORE damage: applyDamage may remove it from the board.
  const defender = target.kind === 'creature' ? state[target.side].board[target.index] : null;
  events.push(...applyDamage(state, side, target, attacker.attack, attacker.name));
  if (defender) {
    if (defender.health > 0) {
      events.push(...applyDamage(state, target.side, { kind: 'creature', side, index: boardIndex }, defender.attack, defender.name));
      pushLog(state, `${attacker.name} strikes ${defender.name} for ${attacker.attack} — and takes ${defender.attack} back.`);
    } else {
      pushLog(state, `${attacker.name} destroys ${defender.name}.`);
    }
  } else if (target.kind === 'hero') {
    pushLog(state, `${attacker.name} strikes ${target.side === SIDE_AI ? 'Veyla' : 'you'} for ${attacker.attack}.`);
  }
  return { ok: true, events };
}

/** Begin a side's turn: a card is drawn, creatures wake up. Ember grows once
 * per round — at the start of the player's turn — so both sides match from
 * round 2; Veyla's opening 2 ember is her second-player coin (see startDuel). */
export function startTurn(state, side) {
  const s = state[side];
  if (side === SIDE_PLAYER) {
    s.maxEmber = Math.min(TUNING.maxEmber, s.maxEmber + 1);
    state.ai.maxEmber = Math.min(TUNING.maxEmber, s.maxEmber);
  }
  s.ember = s.maxEmber;
  s.lastElement = null;
  for (const c of s.board) { c.canAttack = true; c.justPlayed = false; }
  const drawn = drawFrom(s.deck, s.hand, TUNING.drawPerTurn, TUNING.maxHand);
  if (drawn.length === 0 && s.deck.length === 0) {
    // Fatigue: an empty deck costs 1 life per turn rather than stalling the duel.
    s.life = Math.max(0, s.life - 1);
    pushLog(state, `${side === SIDE_PLAYER ? 'Your' : "Veyla's"} deck is empty — fatigue takes 1 life.`);
    if (s.life <= 0) { state.winner = otherSide(side); state.screen = 'over'; state.phase = 'over'; }
  }
}

/** End the current side's turn and open the next side's turn. */
export function endTurn(state) {
  if (state.winner) return;
  const next = otherSide(state.sideToMove);
  state.sideToMove = next;
  state.phase = next === SIDE_PLAYER ? 'player' : 'ai';
  if (next === SIDE_PLAYER) state.turn += 1;
  state.stats.turnsPlayed = state.turn;
  startTurn(state, next);
  pushLog(state, next === SIDE_PLAYER ? `Turn ${state.turn} — your move.` : 'Veyla takes her turn…');
}

/** The duel is over when a side's life hits zero; returns the winner or null. */
export function checkWinner(state) {
  if (state.player.life <= 0) return SIDE_AI;
  if (state.ai.life <= 0) return SIDE_PLAYER;
  return state.winner;
}
