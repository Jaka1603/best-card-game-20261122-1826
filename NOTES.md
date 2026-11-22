# NOTES — Ember Court (best-card-game-20261122-1826)

Build session: 23 Nov 2026 ~01:27–02:30 WIB. Entry built fresh in this session
by the builder subagent; no submit (parent agent owns bundle/check/submit).

## Bug ledger

| # | Symptom (reporter's words) | Root cause | Proof | Status |
|---|---------------------------|------------|-------|--------|
| 1 | AI won 34 of 40 autopilot duels | Ember grew once per *turn*, handing the second player a permanent +1 ember every round | Unit T7 before fix: player 6 – ai 34; after fix: 23–17 | fixed-proven |
| 2 | Player then won 40 of 40 autopilot duels | Same bug, mirrored: with per-round growth only, the first player kept the whole first-move advantage | Unit T7 after fix: 23–17 | fixed-proven |
| 3 | Defender struck back after dying | `attackCreature` re-read `foe.board[target.index]` *after* `applyDamage` spliced the dead defender out, hitting the wrong creature | Unit T4/T4b fail-before (attacker hp 2, expected 1), pass-after (attacker keeps 2 hp; surviving defender takes 2 back) | fixed-proven |
| 4 | Title/win/loss screenshots showed the table UI bleeding through the overlay (End Turn button, hero panels) | Overlay background too transparent; table rows still rendered beneath | Visual inspection v1 (cluttered) vs v2 (clean) | fixed-proven |
| 5 | Card names/text clipped mid-glyph ("Mountain S…", "The forest, standing" cut) | Flavor text wrapped to 2 lines into the stats row; long names overflowed the banner | Visual inspection v1 vs v2; texts shortened + single-line ellipsis + rename Mountain Sage → Stone Sage | fixed-proven |
| 6 | Title screenshot: title overlay never shown in `?shot=title` | Shot branch only handled `over`/`play`; title never got the `show` class | Probe T1 fail-before, pass-after | fixed-proven |
| 7 | Click-to-play probe found no playable card | Opening hand had no 1-cost card at ember 1 — probe setup, not a game bug | Probe tops ember up before clicking | fixed-proven (probe) |
| 8 | Favicon 404 in console | Browser requested /favicon.ico | Added `<link rel="icon" href="data:,">` | fixed-proven |

## Balance (measured)
- 40 autopilot duels, seeds 1–40: player 23 – Veyla 17; mean 6.9 turns, max 9.
- Veyla's second-player coin: 5 opening cards + 2 ember on her first turn;
  both sides match from round 2 (ember grows once per round, at the player's
  turn start). Fatigue: 1 life per turn on an empty deck.

## QA evidence
- Unit: 25/25 (`/tmp/ember-qa/unit.mjs`) — run 23 Nov ~02:1x WIB.
- Browser: 18/18 (`/tmp/ember-qa/probe.mjs`, headless Chrome, real clicks) —
  run 23 Nov ~02:2x WIB, after the visual fixes, re-run green.
- Screenshots re-shot from the final build after every fix; all 4 visually
  inspected by the builder (title clean, table fully legible, VICTORY/DEFEAT
  clean with stats). No known open defects.

## Files
- game/ — index.html, styles.css, package.json, src/*.js (11 modules), assets/table.jpg (1280×720, 159 KB)
- screenshots/ — 1-title.jpg (80 KB), 2-table.jpg (193 KB), 3-win.jpg (62 KB), 4-loss.jpg (60 KB); all 1280×720 JPEG
- main.ts, serve.ts, vendor/makefun-game.ts (kit copy, unchanged), LICENSE (MIT, kit copy), .makefun/owner.json, shots.json, research.md, README.md

## V2 (23 Nov 2026, Jaka-ordered fixes)

Jaka rejected the v1 submit; v2 was built locally the same morning —
painted faces for all 19 cards, card texts rewritten short and verified
uncut, rebuilt title screen with a painted hall and a flame-emblem Play
button, painted card back. Mechanics/stats/balance unchanged (23–17).
QA: unit 33/33, browser 14/14, all four screenshots re-shot and
eye-checked. Full record: V2-NOTES.md. Not pushed, not submitted —
parent agent owns bundle/check/submit after Jaka approves the shots.
