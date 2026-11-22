// audio.js — the court's small sounds, synthesized with WebAudio.
// No audio files exist; every effect is a short tone shaped in code,
// kept quiet on purpose. M toggles mute, and any audio failure is
// swallowed — sound is decoration, never a dependency of the duel.
let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, gain, delay = 0, slideTo = null) {
  if (muted) return;
  try {
    const ac = audioCtx();
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // A silent court still plays.
  }
}

export const sfx = {
  playCard() { blip(520, 0.14, 'triangle', 0.12); blip(780, 0.18, 'triangle', 0.08, 0.05); },
  draw() { blip(660, 0.08, 'sine', 0.06); },
  hit() { blip(180, 0.16, 'square', 0.1, 0, 90); },
  bigHit() { blip(140, 0.3, 'sawtooth', 0.12, 0, 60); blip(90, 0.35, 'square', 0.1, 0.02, 50); },
  heal() { blip(523, 0.2, 'sine', 0.08); blip(784, 0.25, 'sine', 0.07, 0.08); },
  resonance() { blip(880, 0.12, 'triangle', 0.09); blip(1174, 0.2, 'triangle', 0.09, 0.07); },
  turn() { blip(392, 0.1, 'triangle', 0.07); },
  error() { blip(160, 0.12, 'square', 0.07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.3, 'triangle', 0.11, i * 0.11)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => blip(f, 0.35, 'sine', 0.1, i * 0.14)); },
};
