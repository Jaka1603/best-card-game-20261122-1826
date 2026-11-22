# EMBER COURT — Duel of the Four Flames

[![Competition](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://make.fun/badge/best-card-game-20261122-1826/silver-koala-27/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Reward](https://make.fun/badge/best-card-game-20261122-1826/silver-koala-27/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Outwit Warden Veyla at the candlelit table — and take the Ember Court.**

A complete, original turn-based card duel that runs offline in a desktop browser
from static files. You and Veyla each hold 30 life and a 30-card deck of
creatures and spells drawn from four original elements — **Flame, Tide, Leaf,
Stone** — told apart by colour *and* shape. Spend ember to summon creatures,
attack with them, and chain two cards of one element in a turn for
**Resonance +1/+1**. Veyla plays by readable rules (she trades into your
dangerous creatures and saves her Ember Burst for lethal), and narrates every
move in the match log, so her choices can be read and countered.

## Play

Open `game/index.html` in a desktop browser (or serve the entry with
`node serve.ts`, then open http://localhost:8080).

- **Click a card** — play it (damage spells then ask you to click a target)
- **Click one of your creatures, then an enemy creature or Veyla** — attack
  (the defender strikes back if it survives)
- **End Turn** button or **Space** — hand the table to Veyla · **1–8** — play a
  hand card · **Esc** — cancel a selection · **M** — mute · **R** — rematch

## The four beats

1. **Title** — the court, the four flames, the rules in one breath.
2. **Table** — mid-duel: both hands, both boards, life and ember on both sides.
3. **Victory** — Veyla at 0 life, the court yours, the duel's numbers.
4. **Defeat** — your life at 0, Veyla keeps the court, one click to rematch.

## How it is built

One module per job, all original code (see `research.md` for the judge-taste
notes behind the design):

- `game/src/config.js` — tuning tables and all 19 card definitions
- `game/src/random.js` — the seeded RNG (one seed replays one duel)
- `game/src/deck.js` — the 30-card deck, built and drawn
- `game/src/state.js` — the one mutable duel state
- `game/src/rules.js` — the rules; damage flows through a single function
- `game/src/ai.js` — Veyla's readable play, one action at a time
- `game/src/render.js` — the table, the cards, the floaters, the ember motes
- `game/src/audio.js` — every sound synthesized live with WebAudio
- `game/src/input.js` — mouse + keyboard play
- `game/src/shots.js` — the staged screenshot scenes (real rules, fixed seeds)
- `game/src/main.js` — wiring only
- `game/assets/table.jpg` — one AI-painted table illustration (no text in it);
  every card face, glyph and icon is drawn in code

No network: the only image is the local table illustration, the only sounds
are synthesized, the only font is the system stack.

## QA (measured, not asserted)

- **Unit probes** (`/tmp/ember-qa/unit.mjs`): 25/25 — opening deal, over-cost
  refusal, Resonance +1/+1, attack + retaliation (dead defenders cannot strike
  back), lethal damage ending the duel, turn rotation and ember growth,
  40 autopilot duels all finishing with both outcomes (player 23 – Veyla 17),
  every autopilot action legal.
- **Browser probes** (`/tmp/ember-qa/probe.mjs`): 18/18 — clean boot, real
  clicks (Play, play a card, End Turn, AI answers and returns the table),
  in-page duels finishing both ways, all four staged screenshots real renders
  with no page errors and each under 256 KiB.
