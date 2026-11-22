// input.js — mouse and keyboard play, as one click flow:
//   1. click a hand card to play it (a damage spell then asks for a target)
//   2. click an enemy creature or Veyla's portrait to fire the spell
//   3. click one of your ready creatures to make it the attacker
//   4. click an enemy creature or Veyla's portrait to land the attack
//   5. End Turn (button or Space) hands the table to Veyla
// Clicking the selected thing again, or Esc, cancels the selection.
import { attackCreature, playBlockReason, playCard } from './rules.js';
import { SIDE_AI, SIDE_PLAYER } from './state.js';

/**
 * Wire the stage's clicks and keys. `api` is what main.js owns:
 * { state, ui, refs, render, endPlayerTurn, playAgain, startGame,
 *   afterPlayerAction, toggleMute, sounds }.
 */
export function bindInput(api) {
  const { refs } = api;

  refs.playerHand.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.in-hand');
    if (!cardEl || api.state.phase !== 'player' || api.state.winner) return;
    selectHandCard(api, Number(cardEl.dataset.index));
  });

  refs.playerBoard.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.on-board');
    if (!cardEl || api.state.phase !== 'player' || api.state.winner) return;
    selectAttacker(api, Number(cardEl.dataset.index));
  });

  refs.aiBoard.addEventListener('click', (ev) => {
    const cardEl = ev.target.closest('.card.on-board');
    if (!cardEl) return;
    resolveTargetClick(api, { kind: 'creature', side: SIDE_AI, index: Number(cardEl.dataset.index) });
  });

  refs.aiHero.addEventListener('click', () => {
    resolveTargetClick(api, { kind: 'hero', side: SIDE_AI });
  });

  refs.playerHero.addEventListener('click', () => {
    // Your own portrait only cancels a pending choice; it never hurts you.
    clearSelection(api);
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
      clearSelection(api);
    } else if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      api.endPlayerTurn();
    } else if (/^[1-8]$/.test(ev.key)) {
      selectHandCard(api, Number(ev.key) - 1);
    }
  });
}

function clearSelection(api) {
  api.ui.selectedHand = null;
  api.ui.selectedAttacker = null;
  api.ui.hint = '';
  api.render();
}

function selectHandCard(api, index) {
  const { state, ui } = api;
  const card = state.player.hand[index];
  if (!card) return;
  if (ui.selectedHand === index) {
    clearSelection(api);
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

function selectAttacker(api, index) {
  const { state, ui } = api;
  const creature = state.player.board[index];
  if (!creature) return;
  if (ui.selectedAttacker === index) {
    clearSelection(api);
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

function resolveTargetClick(api, target) {
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
