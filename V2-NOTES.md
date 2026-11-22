# V2 NOTES — Ember Court (best-card-game-20261122-1826)

Build session: 23 Nov 2026 ~06:35–07:20 WIB. Jaka rejected the v1 submit
and ordered three fixes; the main agent's fix plan was approved by Jaka.
All v2 work is LOCAL: no push, no submit, no About change (parent agent).

## What changed vs v1

1. **Painted card faces.** Every one of the 19 unique cards now leads
   with its own painted illustration (was: a flat element glyph on a
   gradient). One style anchor across all art: rich painterly fantasy,
   candlelit ember court, warm gold/ember light, deep bronze + dark
   green, chiaroscuro. The card face is a column — art window (cost gem
   + element badge on the art), name band, element label, text zone,
   stats band — nothing overlaps, so nothing clips.
2. **Card texts rewritten short.** All flavour/ability texts are now
   ≤ 19 characters and verified uncut on the rendered screenshots, in
   hand AND on board (v1 hid board text and still clipped hand text).
3. **Title screen rebuilt.** New painted hall backdrop (hundreds of
   candles, the four element banners over the duelling table) under a
   soft readability veil; the Play button is now a struck-gold plate
   with the house flame emblem and a breathing ember glow. Veyla's hand
   also shows a painted card back (gold flame + four gems on filigree).

## New assets (all generated this session, style-anchored)

- game/assets/cards/<id>.jpg — 19 card faces, 480×300, 32–49 KB each:
  cinder-imp, spark-lynx, ember-drake, ash-phoenix, dew-sprite,
  mist-heron, kelp-knight, pearl-serpent, briar-wolf, moss-troll,
  thornback, root-warden, pebble-pup, flint-golem, granite-bear,
  stone-sage, ember-burst, tide-mend, leaf-bloom.
  (flint-golem and kelp-knight were regenerated once: first crops cut
  the heads; the shipped crops frame the whole creature.)
- game/assets/card-back.jpg — painted back, 250×350, 44 KB.
- game/assets/title.jpg — title hall, 1280×720, 178 KB.
- game/assets/table.jpg — unchanged from v1.

## Final card texts

Cinder Imp "A biting spark." · Spark Lynx "Hunts in flashes." ·
Ember Drake "Coal-smoke breath." · Ash Phoenix "It always returns." ·
Dew Sprite "Slippery sprite." · Mist Heron "Strikes from fog." ·
Kelp Knight "Armour of kelp." · Pearl Serpent "Coiled in pearl." ·
Briar Wolf "Thorns for fur." · Moss Troll "Naps for decades." ·
Thornback "Do not hug it." · Root Warden "The forest stands." ·
Pebble Pup "Fetches boulders." · Flint Golem "Sparks on impact." ·
Granite Bear "A living mountain." · Stone Sage "Older than kings." ·
Ember Burst "Deal 3 damage." · Tide Mend "Restore 6 life." ·
Leaf Bloom "Draw 2 cards."
Stats, costs, deck list and mechanics are IDENTICAL to v1.

## Source

All game source rewritten fresh this session (config, random, deck,
state, rules, ai, render, audio, input, shots, main, index.html,
styles.css, main.ts, serve.ts, README). vendor/makefun-game.ts is the
kit's vendored library, unchanged, as in v1.

## QA evidence (this session)

- Unit (/tmp/ember-qa2/unit.mjs): **33/33** — opening deal, over-cost
  refusal, Resonance +1/+1, attack + retaliation (dead defender cannot
  strike back), lethal ends the duel, turn rotation, ember growth once
  per round with matched caps, heal cap, draw, fatigue, catalogue
  sanity (19 cards, 30-card deck, every text ≤ 20 chars, every face on
  disk), 40 autopilot duels all finishing, every action legal.
  Balance identical to v1: player 23 — Veyla 17 over seeds 1–40.
- Browser (/tmp/ember-qa2/probe.mjs, headless Chrome, real clicks):
  **14/14** — all four screenshots captured with zero page errors;
  programmatic audit found NO card text/name overflow on the table
  scene; every table card shows painted art; Veyla's backs are the
  painted back; title screen + painted hall load; Play deals; a clicked
  playable card plays; End Turn round-trips to turn 2; in-page duels
  finish both ways.
- Screenshots (1280×720 JPEG, all under the 256 KiB cap):
  1-title.jpg 187.773 B · 2-table.jpg 215.830 B · 3-win.jpg 62.405 B ·
  4-loss.jpg 60.700 B. All four inspected by eye by the builder, plus
  native-resolution crops of the hand and board rows: every text whole,
  every face painted, title bright and readable.
- Entry program: `node main.ts` builds /output cleanly — dossier.json
  written; game/ = 36 files, 1,20 MiB (caps: 993 files / 48 MiB).

## Known soft spots (honest)

- Board-size art is small by design (96×130 cards); a few dark arts
  (Thornback, Root Warden) read more as texture than creature at board
  size, though they are clearly painted scenes, never flat icons.
- The mid-table green stays empty in the staged scene, as in v1 — it is
  the duelling surface between the two boards.
