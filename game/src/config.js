// config.js — the duel's single tuning table and card catalogue.
// Every card uses one field schema: { id, name, element, kind, cost,
// attack, health, text } for creatures, { ..., effect, amount, text } for
// spells. Card texts are kept short on purpose: a card face must never
// need to clip its own words, in the hand or on the board.

export const GAME_NAME = 'Ember Court';
export const GAME_SUBTITLE = 'Duel of the Four Flames';
export const AI_NAME = 'Warden Veyla';
export const PLAYER_NAME = 'You';

export const TUNING = {
  startLife: 30,
  maxLife: 30,
  startEmber: 1,
  maxEmber: 8,
  openingHand: 4,
  aiOpeningHand: 5, // Veyla moves second, so she opens with one extra card...
  aiOpeningEmber: 2, // ...and 2 ember on her first turn; rounds match after that
  drawPerTurn: 1,
  maxHand: 8,
  maxBoard: 5,
  resonanceAttackBonus: 1,
  resonanceHealthBonus: 1,
  resonanceSpellBonus: 1,
  resonanceHealBonus: 2,
  aiThinkMs: 650,
};

// Element key -> display facts. Suits differ by colour AND by glyph shape
// (render.js draws the glyphs), never by the label text alone.
export const ELEMENTS = {
  flame: { label: 'Flame', color: '#e8491d', dark: '#7a1e05', light: '#ffb347', ink: '#ffd9a0' },
  tide: { label: 'Tide', color: '#1d7fd6', dark: '#0a3a6b', light: '#7fd4ff', ink: '#cfeeff' },
  leaf: { label: 'Leaf', color: '#3da33d', dark: '#123f16', light: '#a5e08a', ink: '#dcf7c8' },
  stone: { label: 'Stone', color: '#c98a2b', dark: '#5c3a08', light: '#ffd98a', ink: '#ffeec2' },
};
export const ELEMENT_KEYS = ['flame', 'tide', 'leaf', 'stone'];

// The nineteen original cards. Creature text is flavour; spell text is the
// exact effect. Every text fits a card face whole — checked on screenshots.
export const CARD_DEFS = [
  // Flame creatures
  { id: 'cinder-imp', name: 'Cinder Imp', element: 'flame', kind: 'creature', cost: 1, attack: 1, health: 1, text: 'A biting spark.' },
  { id: 'spark-lynx', name: 'Spark Lynx', element: 'flame', kind: 'creature', cost: 2, attack: 2, health: 2, text: 'Hunts in flashes.' },
  { id: 'ember-drake', name: 'Ember Drake', element: 'flame', kind: 'creature', cost: 4, attack: 4, health: 4, text: 'Coal-smoke breath.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', element: 'flame', kind: 'creature', cost: 5, attack: 5, health: 5, text: 'It always returns.' },
  // Tide creatures
  { id: 'dew-sprite', name: 'Dew Sprite', element: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'Slippery sprite.' },
  { id: 'mist-heron', name: 'Mist Heron', element: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'Strikes from fog.' },
  { id: 'kelp-knight', name: 'Kelp Knight', element: 'tide', kind: 'creature', cost: 3, attack: 3, health: 4, text: 'Armour of kelp.' },
  { id: 'pearl-serpent', name: 'Pearl Serpent', element: 'tide', kind: 'creature', cost: 5, attack: 5, health: 6, text: 'Coiled in pearl.' },
  // Leaf creatures
  { id: 'briar-wolf', name: 'Briar Wolf', element: 'leaf', kind: 'creature', cost: 2, attack: 3, health: 2, text: 'Thorns for fur.' },
  { id: 'moss-troll', name: 'Moss Troll', element: 'leaf', kind: 'creature', cost: 3, attack: 2, health: 5, text: 'Naps for decades.' },
  { id: 'thornback', name: 'Thornback', element: 'leaf', kind: 'creature', cost: 4, attack: 4, health: 5, text: 'Do not hug it.' },
  { id: 'root-warden', name: 'Root Warden', element: 'leaf', kind: 'creature', cost: 5, attack: 5, health: 7, text: 'The forest stands.' },
  // Stone creatures
  { id: 'pebble-pup', name: 'Pebble Pup', element: 'stone', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'Fetches boulders.' },
  { id: 'flint-golem', name: 'Flint Golem', element: 'stone', kind: 'creature', cost: 3, attack: 3, health: 5, text: 'Sparks on impact.' },
  { id: 'granite-bear', name: 'Granite Bear', element: 'stone', kind: 'creature', cost: 4, attack: 4, health: 6, text: 'A living mountain.' },
  { id: 'stone-sage', name: 'Stone Sage', element: 'stone', kind: 'creature', cost: 5, attack: 6, health: 6, text: 'Older than kings.' },
  // Spells: effect is 'damage' | 'heal' | 'draw'; resonance adds the tuning bonus
  { id: 'ember-burst', name: 'Ember Burst', element: 'flame', kind: 'spell', cost: 2, effect: 'damage', amount: 3, text: 'Deal 3 damage.' },
  { id: 'tide-mend', name: 'Tide Mend', element: 'tide', kind: 'spell', cost: 2, effect: 'heal', amount: 6, text: 'Restore 6 life.' },
  { id: 'leaf-bloom', name: 'Leaf Bloom', element: 'leaf', kind: 'spell', cost: 1, effect: 'draw', amount: 2, text: 'Draw 2 cards.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((d) => [d.id, d]));

// The painted face of a card definition, as a path under game/.
export function cardArtPath(defId) {
  return `assets/cards/${defId}.jpg`;
}

// The 30-card deck both duelists draw from: each creature once, a second
// copy of every cheap creature, two extra heavies, two of each spell.
export const DECK_LIST = [
  ...CARD_DEFS.filter((d) => d.kind === 'creature').map((d) => d.id),
  'cinder-imp', 'pebble-pup', 'dew-sprite', 'spark-lynx', 'mist-heron', 'briar-wolf',
  'ember-drake', 'granite-bear',
  'ember-burst', 'ember-burst', 'tide-mend', 'tide-mend', 'leaf-bloom', 'leaf-bloom',
];
