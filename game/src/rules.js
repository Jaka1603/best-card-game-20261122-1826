// rules.js — the duel's law, as functions over state.js.
// Every point of damage in the game passes through applyDamage, so a
// creature's death, a hero's fall and the winner flag are decided in
// exactly one place and can never drift apart between call sites.
import { TUNING } from './config.js';
import { drawFrom } from './deck.js';
import { SIDE_AI, SIDE_PLAYER, otherSide, pushLog } from './state.js';

const nameOf = (side) => (side === SIDE_PLAYER ? 'You' : 'Veyla');
const castVerb = (side) => (side === SIDE_AI ? 'casts' : 'cast');

/** Resonance: the card's element matches the side's previous card this turn. */
export function hasResonance(state, side, card) {
  const s = state[side];
  return s.lastElement !== null && s.lastElement === card.element;
}

/** Why the card at `handIndex` may not be played right now, or null. */
export function playBlockReason(state, side, handIndex) {
  const s = state[side];
  const card = s.hand[handIndex];
  if (!card) return 'no such card';
  if (card.cost > s.ember) return 'not enough ember';
  if (card.kind === 'creature' && s.board.length >= TUNING.maxBoard) return 'board is full';
  return null;
}

/**
 * Play a card from a hand. A damage spell needs `target`:
 * { kind: 'creature', side, index } or { kind: 'hero', side }.
 * Returns { ok, reason?, events } for the renderer to narrate.
 */
export function playCard(state, side, handIndex, target) {
  const blocked = playBlockReason(state, side, handIndex);
  if (blocked) return { ok: false, reason: blocked, events: [] };
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
  const who = nameOf(side);

  if (card.kind === 'creature') {
    if (resonance) {
      card.attack += TUNING.resonanceAttackBonus;
      card.health += TUNING.resonanceHealthBonus;
      card.maxHealth += TUNING.resonanceHealthBonus;
      events.push({ type: 'resonance', side, card });
    }
    card.canAttack = false; // a creature rests on the turn it arrives
    card.justPlayed = true;
    s.board.push(card);
    pushLog(state, `${who} ${side === SIDE_PLAYER ? 'play' : 'plays'} ${card.name} (${card.attack}/${card.health})${resonance ? ' — RESONANCE! +1/+1' : ''}.`);
    return { ok: true, events };
  }

  s.spellsCast += 1;
  if (card.effect === 'damage') {
    const amount = card.amount + (resonance ? TUNING.resonanceSpellBonus : 0);
    events.push(...applyDamage(state, side, target, amount, card.name));
    pushLog(state, `${who} ${castVerb(side)} ${card.name} for ${amount} damage${resonance ? ' — RESONANCE! +1' : ''}.`);
  } else if (card.effect === 'heal') {
    const amount = card.amount + (resonance ? TUNING.resonanceHealBonus : 0);
    const before = s.life;
    s.life = Math.min(s.maxLife, s.life + amount);
    events.push({ type: 'heal', side, amount: s.life - before });
    pushLog(state, `${who} ${castVerb(side)} ${card.name}, restoring ${s.life - before} life.`);
  } else if (card.effect === 'draw') {
    const amount = card.amount + (resonance ? TUNING.resonanceSpellBonus : 0);
    const drawn = drawFrom(s.deck, s.hand, amount, TUNING.maxHand);
    events.push({ type: 'draw', side, count: drawn.length });
    pushLog(state, `${who} ${castVerb(side)} ${card.name} and draw${side === SIDE_AI ? 's' : ''} ${drawn.length} card${drawn.length === 1 ? '' : 's'}.`);
  }
  return { ok: true, events };
}

/**
 * THE damage function. Hurts a creature or a hero, removes the dead,
 * credits the source side's tally, and ends the duel at zero life.
 */
export function applyDamage(state, fromSide, target, amount, sourceName) {
  const events = [];
  const foe = state[target.side];
  if (target.kind === 'hero') {
    foe.life = Math.max(0, foe.life - amount);
    state[fromSide].damageDealt += amount;
    if (fromSide === SIDE_PLAYER) state.stats.damageDealt += amount;
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
  if (fromSide === SIDE_PLAYER) state.stats.damageDealt += amount;
  events.push({ type: 'damage', side: target.side, amount, target: 'creature', index: target.index, source: sourceName });
  if (creature.health <= 0) {
    foe.board.splice(target.index, 1);
    events.push({ type: 'death', side: target.side, card: creature });
    pushLog(state, `${creature.name} is destroyed.`);
  }
  return events;
}

/** Why the creature at `boardIndex` may not attack right now, or null. */
export function attackBlockReason(state, side, boardIndex) {
  const creature = state[side].board[boardIndex];
  if (!creature) return 'no such creature';
  if (!creature.canAttack) return creature.justPlayed ? 'resting — it just arrived' : 'already attacked';
  return null;
}

/**
 * One creature attacks. A defender that survives strikes back; one that
 * dies does not. The defender object is captured BEFORE damage lands,
 * because applyDamage may splice it out of the board mid-resolution.
 */
export function attackCreature(state, side, boardIndex, target) {
  const blocked = attackBlockReason(state, side, boardIndex);
  if (blocked) return { ok: false, reason: blocked, events: [] };
  const attacker = state[side].board[boardIndex];
  attacker.canAttack = false;
  attacker.justPlayed = false;
  const events = [{ type: 'attack', side, card: attacker, target }];
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

/**
 * Open a side's turn: refill ember, wake its creatures, draw a card.
 * Ember grows once per ROUND, at the player's turn start, and Veyla's
 * cap is matched to the player's — moving second never becomes a
 * permanent ember lead. Drawing from an empty deck costs 1 life.
 */
export function startTurn(state, side) {
  const s = state[side];
  if (side === SIDE_PLAYER) {
    s.maxEmber = Math.min(TUNING.maxEmber, s.maxEmber + 1);
    state.ai.maxEmber = Math.min(TUNING.maxEmber, s.maxEmber);
  }
  s.ember = s.maxEmber;
  s.lastElement = null;
  for (const c of s.board) {
    c.canAttack = true;
    c.justPlayed = false;
  }
  const drawn = drawFrom(s.deck, s.hand, TUNING.drawPerTurn, TUNING.maxHand);
  if (drawn.length === 0 && s.deck.length === 0) {
    s.life = Math.max(0, s.life - 1);
    pushLog(state, `${side === SIDE_PLAYER ? 'Your' : "Veyla's"} deck is empty — fatigue takes 1 life.`);
    if (s.life <= 0) {
      state.winner = otherSide(side);
      state.screen = 'over';
      state.phase = 'over';
    }
  }
}

/** Pass the turn to the other side and open theirs. */
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

/** The winner, once a hero has fallen (or the flag is already set). */
export function checkWinner(state) {
  if (state.player.life <= 0) return SIDE_AI;
  if (state.ai.life <= 0) return SIDE_PLAYER;
  return state.winner;
}
