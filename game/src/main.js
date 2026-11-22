// main.js — wiring only: collect the DOM, own the selection state, run
// the turn loop, stage screenshot scenes, and expose window.__game so
// headless probes can play the real game the way a person would.
import { applyAction, planNextAction, runTurn } from './ai.js';
import { sfx, toggleMute } from './audio.js';
import { bindInput } from './input.js';
import { preloadCardArt, renderAll, shakeStage, showFloater, startEmbers } from './render.js';
import { endTurn } from './rules.js';
import { simulateDuel, stageShot } from './shots.js';
import { createGame, startDuel } from './state.js';

const $ = (id) => document.getElementById(id);

const refs = {
  stage: $('stage'),
  embers: $('embers'),
  aiHero: $('ai-hero'),
  playerHero: $('player-hero'),
  aiHand: $('ai-hand'),
  aiHandCount: $('ai-hand-count'),
  playerHand: $('player-hand'),
  aiBoard: $('ai-board'),
  playerBoard: $('player-board'),
  logBox: $('log'),
  hintBar: $('hint'),
  endTurnBtn: $('end-turn'),
  turnLabel: $('turn-label'),
  scoreLine: $('score-line'),
  titleScreen: $('title-screen'),
  endScreen: $('end-screen'),
  endTitle: $('end-title'),
  endSub: $('end-sub'),
  endStats: $('end-stats'),
  playBtn: $('play-btn'),
  againBtn: $('again-btn'),
  muteBtn: $('mute-btn'),
};

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || Date.now() % 100000);
const shotName = params.get('shot');

let state = createGame(seed);
const ui = { selectedHand: null, selectedAttacker: null, hint: '' };
let endSoundPlayed = false;

function render() {
  refs.stage.classList.toggle('overlay-up', state.screen === 'title' || state.screen === 'over');
  renderAll(state, ui, refs);
}

/** A point on the stage above a hero panel or a board slot, for floaters. */
function stagePoint(target) {
  const stageRect = refs.stage.getBoundingClientRect();
  if (target.kind === 'hero') {
    const hero = target.side === 'ai' ? refs.aiHero : refs.playerHero;
    const r = hero.getBoundingClientRect();
    return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 };
  }
  const board = target.side === 'ai' ? refs.aiBoard : refs.playerBoard;
  const slot = board.children[target.index];
  if (!slot) return { x: 640, y: 360 };
  const r = slot.getBoundingClientRect();
  return { x: r.left - stageRect.left + r.width / 2, y: r.top - stageRect.top + r.height / 2 };
}

/** Sounds and floaters for one rules result, then a fresh render. */
function afterPlayerAction(result) {
  if (!result || !result.ok) {
    if (result) sfx.error();
    return;
  }
  render();
  for (const ev of result.events) {
    if (ev.type === 'play') sfx.playCard();
    if (ev.type === 'resonance') {
      sfx.resonance();
      showFloater(refs, 'RESONANCE! +1/+1', 640, 300, 'resonance');
    }
    if (ev.type === 'damage') {
      const target = ev.target === 'hero'
        ? { kind: 'hero', side: ev.side }
        : { kind: 'creature', side: ev.side, index: ev.index };
      const p = stagePoint(target);
      showFloater(refs, `-${ev.amount}`, p.x, p.y, ev.amount >= 4 ? 'dmg-big' : 'dmg');
      if (ev.amount >= 4) {
        sfx.bigHit();
        shakeStage(refs, true);
      } else {
        sfx.hit();
      }
    }
    if (ev.type === 'heal') {
      const p = stagePoint({ kind: 'hero', side: ev.side });
      showFloater(refs, `+${ev.amount}`, p.x, p.y, 'heal');
      sfx.heal();
    }
    if (ev.type === 'draw') sfx.draw();
    if (ev.type === 'death') sfx.bigHit();
  }
  if (state.winner && !endSoundPlayed) {
    endSoundPlayed = true;
    if (state.winner === 'player') sfx.win();
    else sfx.lose();
  }
}

async function endPlayerTurn() {
  if (state.phase !== 'player' || state.winner || state.aiBusy) return;
  ui.selectedHand = null;
  ui.selectedAttacker = null;
  ui.hint = '';
  endTurn(state); // to Veyla
  state.aiBusy = true;
  render();
  await runTurn(state, 'ai', (action, result) => afterPlayerAction(result), 650);
  state.aiBusy = false;
  if (!state.winner) {
    endTurn(state); // back to the player, turn + 1
    sfx.turn();
  }
  render();
}

function startGame() {
  refs.titleScreen.classList.remove('show');
  refs.endScreen.classList.remove('show');
  startDuel(state);
  render();
}

function playAgain() {
  state = createGame((Date.now() % 100000) + 1);
  endSoundPlayed = false;
  ui.selectedHand = null;
  ui.selectedAttacker = null;
  ui.hint = '';
  refs.endScreen.classList.remove('show');
  refs.titleScreen.classList.remove('show');
  startDuel(state);
  render();
}

const api = {
  get state() { return state; },
  ui,
  refs,
  render,
  endPlayerTurn,
  playAgain,
  startGame,
  afterPlayerAction,
  toggleMute,
  sounds: sfx,
};

bindInput(api);
preloadCardArt();
startEmbers(refs.embers);

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'm' || ev.key === 'M') {
    const nowMuted = toggleMute();
    refs.muteBtn.textContent = nowMuted ? 'Sound: off (M)' : 'Sound: on (M)';
  }
});

// Probe handle: the state, the UI, and the planners a probe can drive.
window.__game = {
  get state() { return state; },
  ui,
  planNextAction,
  applyAction,
  simulateDuel,
  render,
  startGame,
  playAgain,
  endPlayerTurn,
};

if (shotName) {
  // A staged screenshot scene: real rules, a fixed seed, no waiting.
  state = stageShot(shotName);
  if (state.screen === 'over') {
    refs.titleScreen.classList.remove('show');
  } else if (shotName === 'play') {
    refs.titleScreen.classList.remove('show');
    state.screen = 'play';
    state.phase = 'player';
  } else {
    refs.titleScreen.classList.add('show');
  }
  render();
  window.__shotReady = true;
} else {
  refs.titleScreen.classList.add('show');
  render();
  window.__shotReady = true;
}
