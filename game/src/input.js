// input.js — how a person plays: one click flow for mouse and keys.
//   1. Click a hand card to play it (a damage spell then asks for a target)
//   2. Click an enemy creature or Veyla's portrait to land the spell
//   3. Click one of your ready creatures to name it the attacker
//   4. Click an enemy creature or Veyla's portrait to land the attack
//   5. End Turn (button or Space) hands the table to Veyla
// Clicking the chosen thing again — or pressing Esc — cancels it.
import { attackCreature, playBlockReason, playCard } from './rules.js';
import { SIDE_AI, SIDE_PLAYER } from './state.js';

/**
 * Wire clicks and keys onto the stage. `api` is main.js's surface:
 * { state, ui, refs, render, endPlayerTurn, playAgain, startGame,
 *   afterPlayerAction, toggleMute, sounds }.
 */
export function bindInput(api) {
  const { refs } = api;

  refs.playerHand.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.in-hand');
    if (!cardEl || api.state.phase !== 'player' || api.state.winner) return;
    pickHandCard(api, Number(cardEl.dataset.index));
  });

  refs.playerBoard.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.on-board');
    if (!cardEl || api.state.phase !== 'player' || api.state.winner) return;
    pickAttacker(api, Number(cardEl.dataset.index));
  });

  refs.aiBoard.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.on-board');
    if (!cardEl) return;
    clickTarget(api, { kind: 'creature', side: SIDE_AI, index: Number(cardEl.dataset.index) });
  });

  refs.aiHero.addEventListener('click', () => {
    clickTarget(api, { kind: 'hero', side: SIDE_AI });
  });

  refs.playerHero.addEventListener('click', () => {
    // Your own portrait only cancels a pending choice; it never hurts you.
    cancelPick(api);
  });

  refs.endTurnBtn.addEventListener('click', () => api.endPlayerTurn());
  refs.playBtn.addEventListener('click', () => api.startGame());
  refs.againBtn.addEventListener('click', () => api.playAgain());
  refs.muteBtn.addEventListener('click', () => {
    const nowMuted = api.toggleMute();
    refs.muteBtn.textContent = nowMuted ? 'Sound: off (M)' : 'Sound: on (M)';
  });

  document.addEventListener('keydown', (ev) => {
    if (api.state.screen === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
      api.startGame();
      return;
    }
    if (api.state.screen === 'over' && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
      api.playAgain();
      return;
    }
    if (api.state.phase !== 'player' || api.state.winner) return;
    if (ev.key === 'Escape') {
      cancelPick(api);
    } else if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      api.endPlayerTurn();
    } else if (/^[1-8]$/.test(ev.key)) {
      pickHandCard(api, Number(ev.key) - 1);
    }
  });
}

function cancelPick(api) {
  api.ui.selectedHand = null;
  api.ui.selectedAttacker = null;
  api.ui.hint = '';
  api.render();
}

function pickHandCard(api, index) {
  const { state, ui } = api;
  const card = state.player.hand[index];
  if (!card) return;
  if (ui.selectedHand === index) {
    cancelPick(api);
    return;
  }
  const reason = playBlockReason(state, SIDE_PLAYER, index);
  if (reason) {
    ui.hint = `Cannot play ${card.name}: ${reason}.`;
    api.sounds.error();
    api.render();
    return;
  }
  if (card.kind === 'spell' && card.effect === 'damage') {
    // The one two-click play: choose the spell, then its victim.
    ui.selectedHand = index;
    ui.selectedAttacker = null;
    ui.hint = `${card.name}: click an enemy creature or Veyla to deal ${card.amount} damage.`;
    api.render();
    return;
  }
  // Creatures and self-targeted spells resolve at once.
  const result = playCard(state, SIDE_PLAYER, index, null);
  ui.selectedHand = null;
  ui.selectedAttacker = null;
  ui.hint = result.ok ? '' : `Cannot play: ${result.reason}.`;
  api.afterPlayerAction(result);
  api.render();
}

function pickAttacker(api, index) {
  const { state, ui } = api;
  const creature = state.player.board[index];
  if (!creature) return;
  if (ui.selectedAttacker === index) {
    cancelPick(api);
    return;
  }
  if (!creature.canAttack) {
    ui.hint = `${creature.name} ${creature.justPlayed ? 'is resting — it just arrived.' : 'already attacked this turn.'}`;
    api.sounds.error();
    api.render();
    return;
  }
  ui.selectedAttacker = index;
  ui.selectedHand = null;
  ui.hint = `${creature.name} (${creature.attack}) is ready — click an enemy creature or Veyla.`;
  api.render();
}

function clickTarget(api, target) {
  const { state, ui } = api;
  if (state.phase !== 'player' || state.winner) return;
  if (ui.selectedHand !== null) {
    const card = state.player.hand[ui.selectedHand];
    if (card && card.kind === 'spell' && card.effect === 'damage') {
      const result = playCard(state, SIDE_PLAYER, ui.selectedHand, target);
      ui.selectedHand = null;
      ui.hint = result.ok ? '' : `Cannot cast: ${result.reason}.`;
      api.afterPlayerAction(result);
      api.render();
    }
    return;
  }
  if (ui.selectedAttacker !== null) {
    const result = attackCreature(state, SIDE_PLAYER, ui.selectedAttacker, target);
    ui.selectedAttacker = null;
    ui.hint = result.ok ? '' : `Cannot attack: ${result.reason}.`;
    api.afterPlayerAction(result);
    api.render();
  }
}
