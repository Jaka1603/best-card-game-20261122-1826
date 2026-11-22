// audio.js — every sound is synthesized live with WebAudio. No audio files,
// no network, and a mute toggle (M). Sounds are short and quiet by design.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (muted) return;
  try {
    const ac = ensureCtx();
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch (e) { /* audio is decoration; a failure never breaks the duel */ }
}

export const sfx = {
  playCard() { tone(520, 0.14, 'triangle', 0.12); tone(780, 0.18, 'triangle', 0.08, 0.05); },
  draw() { tone(660, 0.08, 'sine', 0.06); },
  hit() { tone(180, 0.16, 'square', 0.10, 0, 90); },
  bigHit() { tone(140, 0.3, 'sawtooth', 0.12, 0, 60); tone(90, 0.35, 'square', 0.10, 0.02, 50); },
  heal() { tone(523, 0.2, 'sine', 0.08); tone(784, 0.25, 'sine', 0.07, 0.08); },
  resonance() { tone(880, 0.12, 'triangle', 0.09); tone(1174, 0.2, 'triangle', 0.09, 0.07); },
  turn() { tone(392, 0.1, 'triangle', 0.07); },
  error() { tone(160, 0.12, 'square', 0.07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.11, i * 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sine', 0.10, i * 0.14)); },
};
