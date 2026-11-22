# Ember Court — v3 notes (visual integration pass)

Jaka's verdict on the v2 screenshots (verbatim): "lebih di perbaiki dengan
sangat detail buat terlihat menyatu alami jangan terlihat seperti tempelan" —
in v2 the painted art sat in a hard rectangular window on each card, and the
cards sat ON the table instead of IN the scene. v3 changes no mechanic, no
stat, no deck list and no card text (all identical to v2). Every source file
was rewritten fresh in this session from the same specification. What changed
is purely how the layers are integrated, layer by layer:

## 1. Art ↔ card (the pasted-window seam is gone)
- A card face is now built as ONE painted object. The ground of every card is
  a single shared painted parchment texture (`game/assets/parchment.jpg`,
  generated for this pass: warm bronze/olive candlelit paper), shown at a
  different offset per card (derived from the card's uid), so no two cards
  wear the identical crop.
- The element tint is no longer a flat colour plate behind a window: it is a
  gradient (element colour → element dark) blended INTO the parchment grain
  with `mix-blend-mode: hard-light`, so the colour lives in the material.
- The painting is full-bleed across the top of the card and its lower edge is
  feathered away with a mask gradient (opaque → transparent) plus an inner
  shadow, so the art MELTS into the tinted ground. There is no rectangle, no
  margin, no cut line anywhere on the face.
- The name rides directly on that feather, over a soft feathered scrim, so
  the painting still reads behind the lettering.
- Over the whole finished face lie two more unifying layers: a gilt frame
  drawn OVER the painting's edges (border + inset relief shadows + a top
  light-streak, so it reads as a frame laid on the painting, not an outline),
  and one "skin" — the same parchment grain at overlay blend plus a
  candle sheen from the upper left — covering art, words and stats alike.
- Cost gem and stat medallions were rebuilt as enamel: radial gradients with
  a light catch at upper-left and a drop-shadow that follows their clip
  shape, instead of flat colour fills.
- All 19 paintings received one uniform grade lift (gamma 1.10, brightness
  1.05, colour 1.03, re-encoded q88) so the darkest paintings (Thornback,
  Root Warden) hold up at board size; one grade for every card, again.

## 2. Text zone
- There is no text plate anymore. Name, element label, flavour text and
  stats all sit on the tinted parchment ground itself, under the shared
  skin, with soft shadows. The SPELL tag and the log panel and hero panels
  use the same parchment under a dark wash, so every plaque in the scene is
  the same material.

## 3. Card ↔ table (cards sit IN the scene)
- Empty board slots lost their dashed outline (a classic pasted-frame tell);
  an empty slot is now only a soft radial pool of shadow on the cloth.
- Every card carries a two-part contact shadow (deep soft + tight contact),
  and the whole scene passes under one final grade that sits ABOVE the
  cards: warm candle pools (`#grade-light`), one grain (`#grade-grain`,
  the same parchment, overlay blend), and the drifting ember canvas, which
  now renders over the cards too — motes cross paintings, frames and panels
  alike, tying everything into one hall.

## 4. One grade for all elements
- Table painting, card paintings, card backs (same frame + skin over the
  back painting), hero panels, log plaque, legend chips and end-screen stat
  plaques all share the parchment material, the same black levels and the
  same upper-left candlelight direction (sheen, portrait highlights, gem
  catches all agree).

## QA (this session, /tmp/ember-qa3/)
- Unit suite (fresh, imports the game's own modules): 24/24 pass —
  catalogue/deck sizes, text budget ≤19 chars, opening compensation,
  ember blocking, resonance (+1/+1, element-gated, turn reset), all three
  spells, resting/once-per-turn attacks, trade + strike-back combat, hero
  kill, ember growth matched for Veyla and capped at 8, fatigue, board cap,
  seed determinism, autopilot termination.
- Balance: 40 autopilot duels, seeds 1000–1039 → player 22 — Veyla 18
  (v2 measured 23–17 on the same seeds; same rules, sampling-identical
  ballpark).
- Browser probe (real Chrome, real clicks): all four `?shot=` scenes stage;
  text-overflow audit = 0 on the title shot, the table shot and a live game
  after a full round; click-through (Play → click a playable card → End
  Turn → Veyla's whole turn → turn 2) passes; zero console/page errors.
- Dossier dry build (`MAKEFUN_OUTPUT_DIR=/tmp/ember-out node main.ts`):
  builds clean; game/ = 37 files, 1,578,878 bytes (caps: 993 files / 48 MiB);
  screenshots 206,804 / 212,851 / 73,477 / 71,705 bytes (cap 262,144 each).

## Honest screenshot judgement (2-table.jpg + full-res crops)
- The hand is the strongest frame: paintings melt into their tinted grounds,
  names sit in the fade, the gilt frame and grain read as one worn object,
  and the fan of cards rests on the cloth with believable contact shadow.
- Board cards are smaller and their darkest paintings (Thornback, Mist
  Heron) still read more as mood than as subjects at 96 px wide — much
  improved after the grade lift (Pebble Pup's and Flint Golem's subjects are
  now plainly visible), but this remains the weakest layer.
- The midline log plaque is a wide, mostly-empty dark band when only three
  short lines are showing; it is textured and bordered like the other
  plaques, but it is the heaviest single shape on the table.
- The frame's gold is a flat border colour with relief shadows rather than a
  true gradient metal; at card size it convinces, at full-res crop it is
  merely good.
- Nothing on the table any longer reads as a sticker: no hard rectangle, no
  dashed slot, no flat plate survives in the frame.
