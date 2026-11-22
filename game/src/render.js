// render.js — turns the state into the table the player sees. Cards are DOM
// (crisp at any size, clickable, legible at thumbnail size); the painted table
// illustration sits behind them and ember motes drift on a canvas overlay.
import { AI_NAME, ELEMENTS, PLAYER_NAME, TUNING } from './config.js';

// Element glyphs as inline SVG: flame, wave, leaf, mountain. Suits are told
// apart by colour AND shape, never by text alone.
export const ELEMENT_GLYPHS = {
  flame: '<svg viewBox="0 0 24 24"><path d="M12 2c1 3-2 4.5-2 7 0 1.5 1 2.5 2 2.5S14 10 14 8.5c2 1.5 3 3.5 3 5.5a5 5 0 0 1-10 0c0-4 3-7 5-12z"/></svg>',
  tide: '<svg viewBox="0 0 24 24"><path d="M2 9c2.5-2.5 5-2.5 7.5 0S14.5 11.5 17 9s3.5-2 5 0v2.5c-2.5-2-5-2-7.5.5S9.5 14.5 7 12 4 10 2 11.5zM2 16c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5 0v2.5c-2.5-2-5-2-7.5.5S9.5 21.5 7 19s-3-2-5-.5z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M20 4C10 4 4 10 4 20c10 0 16-6 16-16zM4 20C8 14 12 10 18 6"/></svg>',
  stone: '<svg viewBox="0 0 24 24"><path d="M12 3 3 20h18zM12 3l-3.5 6 3.5-1.5L15.5 9z"/></svg>',
};

const HEART_SVG = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.9-10-9.3C.4 8.6 2 4.5 6 4.5c2.2 0 3.6 1.2 4.5 2.6.9-1.4 2.3-2.6 4.5-2.6 4 0 5.6 4.1 4 7.2C19.5 16.1 12 21 12 21z"/></svg>';
const EMBER_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2 19 9l-7 13L5 9z"/></svg>';

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function elementStyle(element) {
  const e = ELEMENTS[element];
  return `background:linear-gradient(160deg, ${e.color} 0%, ${e.dark} 100%);--el-light:${e.light};--el-ink:${e.ink};`;
}

/** One card face. `opts` picks hand/board/back and wires data attributes. */
export function buildCardEl(card, opts = {}) {
  const { inHand = false, onBoard = false, back = false, selected = false, playable = false, canAttack = false, resting = false } = opts;
  if (back) {
    const node = el('div', 'card card-back');
    node.innerHTML = `<div class="card-back-glyph">${ELEMENT_GLYPHS.flame}</div><div class="card-back-word">EMBER<br>COURT</div>`;
    return node;
  }
  const e = ELEMENTS[card.element];
  const node = el('div', `card el-${card.element}${inHand ? ' in-hand' : ''}${onBoard ? ' on-board' : ''}${selected ? ' selected' : ''}${playable ? ' playable' : ''}${canAttack ? ' can-attack' : ''}${resting ? ' resting' : ''}`);
  node.style.cssText = elementStyle(card.element);
  node.dataset.uid = String(card.uid);
  const stats = card.kind === 'creature'
    ? `<div class="card-atk" title="Attack">${card.attack}</div><div class="card-hp" title="Health">${card.health}</div>`
    : `<div class="card-spell-tag">SPELL</div>`;
  node.innerHTML = `
    <div class="card-cost">${card.cost}</div>
    <div class="card-glyph">${ELEMENT_GLYPHS[card.element]}</div>
    <div class="card-name">${card.name}</div>
    <div class="card-element-label">${e.label}</div>
    <div class="card-text">${card.text}</div>
    ${stats}`;
  return node;
}

/** Rebuild every dynamic zone from the state. Called after each action. */
export function renderAll(state, ui, refs) {
  renderHeroes(state, refs);
  renderBoards(state, ui, refs);
  renderHands(state, ui, refs);
  renderMidline(state, ui, refs);
  if (state.screen === 'over') renderEndScreen(state, refs);
}

function renderHeroes(state, refs) {
  setHero(refs.aiHero, AI_NAME, state.ai, state.sideToMove === 'ai');
  setHero(refs.playerHero, PLAYER_NAME, state.player, state.sideToMove === 'player');
  refs.turnLabel.textContent = state.winner ? 'Duel over' : state.sideToMove === 'player' ? `Your turn — Turn ${state.turn}` : `Veyla's turn — Turn ${state.turn}`;
  refs.scoreLine.textContent = `Damage dealt ${state.player.damageDealt} · Cards played ${state.player.cardsPlayed} · Deck ${state.player.deck.length}`;
}

function setHero(node, name, side, isActive) {
  node.querySelector('.hero-name').textContent = name;
  node.querySelector('.hero-life-num').textContent = String(side.life);
  node.querySelector('.hero-life-max').textContent = `/ ${side.maxLife}`;
  const hearts = node.querySelector('.hero-hearts');
  hearts.innerHTML = HEART_SVG.repeat(1);
  hearts.classList.toggle('low', side.life <= 10);
  const embers = node.querySelector('.hero-embers');
  embers.innerHTML = '';
  for (let i = 0; i < side.maxEmber; i += 1) {
    const gem = el('span', `ember-gem${i < side.ember ? ' lit' : ''}`, EMBER_SVG);
    embers.appendChild(gem);
  }
  node.classList.toggle('active', isActive);
}

function renderBoards(state, ui, refs) {
  renderBoard(refs.aiBoard, state.ai.board, 'ai', state, ui);
  renderBoard(refs.playerBoard, state.player.board, 'player', state, ui);
}

function renderBoard(node, board, side, state, ui) {
  node.innerHTML = '';
  for (let i = 0; i < TUNING.maxBoard; i += 1) {
    const slot = el('div', 'board-slot');
    const card = board[i];
    if (card) {
      const selected = ui.selectedAttacker !== null && side === 'player' && ui.selectedAttacker === i;
      const canAttack = side === 'player' && state.phase === 'player' && card.canAttack;
      const cardEl = buildCardEl(card, { onBoard: true, selected, canAttack, resting: card.justPlayed });
      cardEl.dataset.side = side;
      cardEl.dataset.index = String(i);
      slot.appendChild(cardEl);
    }
    node.appendChild(slot);
  }
}

function renderHands(state, ui, refs) {
  // Opponent's hand: face-down backs, fanned.
  refs.aiHand.innerHTML = '';
  state.ai.hand.forEach((card, i) => {
    const back = buildCardEl(card, { back: true });
    back.style.setProperty('--fan', `${(i - (state.ai.hand.length - 1) / 2) * 4}deg`);
    refs.aiHand.appendChild(back);
  });
  refs.aiHandCount.textContent = `${state.ai.hand.length} cards`;

  // Player's hand: face-up, clickable.
  refs.playerHand.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    const selected = ui.selectedHand === i;
    const playable = state.phase === 'player' && !state.winner && card.cost <= state.player.ember
      && !(card.kind === 'creature' && state.player.board.length >= TUNING.maxBoard);
    const cardEl = buildCardEl(card, { inHand: true, selected, playable });
    cardEl.dataset.index = String(i);
    cardEl.style.setProperty('--fan', `${(i - (state.player.hand.length - 1) / 2) * 3}deg`);
    refs.playerHand.appendChild(cardEl);
  });
}

function renderMidline(state, ui, refs) {
  refs.logBox.innerHTML = state.log.slice(-3).map((line) => `<div>${line}</div>`).join('');
  refs.endTurnBtn.disabled = state.phase !== 'player' || !!state.winner || state.aiBusy;
  refs.endTurnBtn.textContent = state.phase === 'ai' ? 'Veyla is thinking…' : 'End Turn ⏎';
  refs.hintBar.textContent = ui.hint || defaultHint(state);
}

function defaultHint(state) {
  if (state.winner) return state.winner === 'player' ? 'Victory is yours.' : 'Veyla keeps the court.';
  if (state.phase === 'ai') return 'Watch Veyla — her moves are in the log.';
  if (state.player.lastElement) return `Resonance ready: your next ${ELEMENTS[state.player.lastElement].label} card gains +1/+1.`;
  return 'Play a card, attack with a creature, then End Turn. Keys 1–8 play cards, Space ends turn.';
}

function renderEndScreen(state, refs) {
  const won = state.winner === 'player';
  refs.endTitle.textContent = won ? 'VICTORY' : 'DEFEAT';
  refs.endTitle.className = `end-title ${won ? 'win' : 'lose'}`;
  refs.endSub.textContent = won
    ? 'The Ember Court is yours. Veyla bows — and the four flames burn for you.'
    : 'Veyla keeps the court. The embers dim… but a rematch is one click away.';
  refs.endStats.innerHTML = `
    <div><b>${state.turn}</b><span>turns</span></div>
    <div><b>${state.player.damageDealt}</b><span>damage dealt</span></div>
    <div><b>${state.player.cardsPlayed}</b><span>cards played</span></div>
    <div><b>${state.player.life}</b><span>life left</span></div>`;
  refs.endScreen.classList.add('show');
  if (won) burstEmbers(refs);
}

/** A floater (damage number, heal, RESONANCE!) that rises and fades over a point. */
export function showFloater(refs, text, x, y, kind) {
  const node = el('div', `floater ${kind || ''}`, text);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  refs.stage.appendChild(node);
  setTimeout(() => node.remove(), 1400);
}

/** Shake the whole table — a big hit should be felt. */
export function shakeStage(refs, hard) {
  refs.stage.classList.remove('shake', 'shake-hard');
  void refs.stage.offsetWidth; // restart the animation
  refs.stage.classList.add(hard ? 'shake-hard' : 'shake');
}

/** Win flourish: a burst of ember sparks across the table. */
function burstEmbers(refs) {
  for (let i = 0; i < 26; i += 1) {
    const node = el('div', 'spark');
    node.style.left = `${15 + Math.random() * 70}%`;
    node.style.top = `${20 + Math.random() * 50}%`;
    node.style.animationDelay = `${Math.random() * 0.5}s`;
    refs.stage.appendChild(node);
    setTimeout(() => node.remove(), 2200);
  }
}

/** Drifting ember motes on the background canvas. Cheap: ~36 particles, one rAF. */
export function startEmbers(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const motes = [];
  for (let i = 0; i < 36; i += 1) {
    motes.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.2, v: 0.12 + Math.random() * 0.35, drift: (Math.random() - 0.5) * 0.2, a: 0.25 + Math.random() * 0.5 });
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (const m of motes) {
      m.y -= (m.v * dt) / 16;
      m.x += (m.drift * dt) / 16;
      if (m.y < -4) { m.y = H + 4; m.x = Math.random() * W; }
      ctx.globalAlpha = m.a;
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
