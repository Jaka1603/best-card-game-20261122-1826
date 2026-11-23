# EMBER COURT — v4 notes (final polish round)

Jaka's order on v3 (verbatim): "perbaiki sekali lagi dengan lebih detail
dan teliti setelah tidak ada kesalahan lagi langsung submit". One last,
very detailed pass; after this, the main agent verifies and submits
directly. Mechanics, stats, deck and card texts are UNCHANGED from v3.
All source files were rewritten fresh by hand in this session (the git
diff against v3 shows logic identical — only comments, the CSS changes
below, and seven art files differ).

## 1. Card-art readability audit — all 19, at real sizes

Method: contact sheets rendered from the actual art files at native
size, at board size (96×56 art window) and at hand size (104×64), read
pixel by pixel — then re-audited after the fixes, and finally rendered
once more through the game's real CSS pipeline (all-19 grid at board
size, game's own buildCardEl + styles).

Findings and fixes:
- **root-warden — painting had NO HEAD** (a torso among roots; at board
  size it read as texture). REGENERATED: full warden with head, glowing
  amber eyes and a raised lantern, same painterly candlelit anchor.
- **stone-sage — face cropped off above the beard**. REGENERATED: the
  complete carved face, crown, candle in hand.
- **flint-golem — no head at all** (shoulders and lava cracks only).
  REGENERATED: stone head with ember eyes and lava seams.
- **granite-bear — head out of frame** (body and one ear visible).
  REGENERATED: the whole standing stone bear, head inside the frame.
- **thornback — too dark and muddy at board size** (subject dissolved
  into its background). Targeted grade: masked lift on the creature
  (gamma + contrast), background untouched, so the spiky silhouette
  now reads instantly.
- **kelp-knight — subject too small in its frame**. Centre crop-zoom
  (≈0.15–0.85 × 0.03–0.99) before the standard cover-crop; the knight
  now fills the window like every other card.
- **moss-troll — face too dim**. Masked lift on the face only.
- The other 12 paintings were verified readable at BOTH sizes and are
  unchanged: cinder-imp, spark-lynx, ember-drake, ash-phoenix,
  dew-sprite, mist-heron, pearl-serpent, briar-wolf, pebble-pup,
  ember-burst, tide-mend, leaf-bloom.

Post-fix audit: **all 19 subjects are identifiable at board size and
at hand size**, in the raw sheets and in the real-pipeline grid. The
four regenerations keep the v3 integration untouched (same full-bleed
feather, same grade gamma 1.06 / brightness 1.02 / colour 1.02 +
unsharp, same skin) — they sit in the scene exactly like the originals.

## 2. The gilt frame is now real metal

v3's frame was a flat colour with a relief shadow. v4:
- The ring itself is a **multi-stop gold gradient** (struck gold at the
  upper left where the candlelight lands → antique gold at the lower
  right), cut to the 2px frame band with a mask-composite, so the
  gradient lives only in the metal.
- An **inner bevel** (::before): pale catch-light on the top/left inner
  edges, dark seat on the bottom/right.
- A **specular streak** (::after) along the top edge.
- A dark seat line added to the card's own shadow.
Verified live: the computed background of .card-frame is the gradient;
by eye the frames now catch light consistently with the scene grade
on every card, including the card backs.

## 3. The log plaque sizes itself to its news

v3's log was a wide dark band, mostly empty on short logs. v4: the
plaque is `height: fit-content` (max 68px, overflow hidden), same
parchment-wash material as the other plaques, and the midline row grew
56 → 76px so the stage total stays exactly 720. Measured in the live
DOM: **32px with one line, 68px with three** — slim when quiet, full
when busy, never dominant.

## 4. Full zero-defect audit (every screen, full res + crops)

- **FOUND & FIXED — player hero panel clipped by the stage's bottom
  edge.** The panel is 64px tall but the bottom bar was 52px, so its
  lower border and the ember-gem row were cut off in every table view.
  Bottom bar 52 → 66px; the two board rows gave back 7px each
  (138 → 131px; board cards are 130px and still fit). Total remains
  exactly 720. The panel now sits fully in frame, gems and all.
- Text overflow: **0** in every scene (title, staged table, win, loss,
  live turns 1–2), measured in the DOM over names, texts, labels, log
  lines, hint and hero names.
- Alignment/spacing: board slots uniform, hand fan even, hero panels
  aligned; nothing tilted, nothing out of frame after the fix above.
- Stats and gems are never covered by art; the cost gem and element
  badge sit on the art by design and stay legible on the brightest
  and darkest paintings alike.
- Element identity is triple-redundant and consistent on all 19:
  glyph shape + colour + printed label.
- Interaction states verified live: playable glow, hover lift,
  click-to-play and click-to-target flows, resting desaturation,
  can-attack outline (staged scene), End Turn hand-off to Veyla.
- Title, win and loss screens re-audited at full resolution: clean.

**Final findings list: EMPTY.** Nothing known remains unfixed.

## 5. QA results (all green)

- Unit suite, written fresh for this round: **24/24 pass** (catalogue,
  opening deal, ember blocks, resonance ×3, spells ×4, combat ×4,
  turn/ember growth, fatigue, board cap, determinism, autopilot).
- Balance: 40 autopilot duels, seeds 1000–1039 → **player 22, AI 18**
  (identical to v3 — mechanics untouched, as ordered).
- Browser probe, written fresh: **ALL GREEN** — four staged scenes
  captured, overflow 0 everywhere, real mouse click-through (start,
  play a card, end turn, Veyla acts, turn 2 begins), zero console or
  page errors, gilt gradient confirmed in computed style, log plaque
  heights measured (32px / 68px).
- Dossier dry-build (`node main.ts`): clean — dossier.json written,
  game/ = 37 files / 1,619,619 bytes (caps: 993 files / 48 MiB), all
  four screenshots ≤ 262,144 bytes each.

## 6. Honest screenshot assessment

The table scene reads as one candlelit hall: every staged card is
identifiable at board size, the gilt frames catch the same top-left
light as the scene grade, the slim log plaque no longer competes with
the boards, and the player's panel is whole. Title, victory and defeat
screens are unchanged from v3 and clean. One inherited tightness, kept
deliberately: the longest flavour lines ("The forest stands.") run
close to the frame at hand size — inside the DOM budget (no overflow,
v3's ≤19-character rule) and fully readable; shortening card texts was
outside this round's mandate (texts unchanged).

## Files changed in v4

Text: `game/styles.css` (gilt frame, adaptive log, midline/bottombar/
board row heights), `game/src/random.js` + `game/src/render.js`
(header comments only — all sources rewritten fresh this session;
the rest came out byte-identical to v3), this file.
Binary: `game/assets/cards/` — root-warden, stone-sage, flint-golem,
granite-bear (regenerated), thornback, kelp-knight, moss-troll
(re-graded/cropped); `screenshots/` — all four captures retaken.
