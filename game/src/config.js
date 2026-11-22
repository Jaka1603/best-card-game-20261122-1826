// config.js — every tuning number and every card definition lives here, nowhere else.
// One field-name schema for cards: { id, name, element, kind, cost, attack, health, text }.
// Elements are told apart by colour AND shape glyph (see render.js ELEMENT_GLYPHS).

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
  aiOpeningHand: 5, // Veyla moves second: one extra card, like the coin in classic duels
  aiOpeningEmber: 2, // ...and 2 ember on her first turn; both sides match from round 2
  drawPerTurn: 1,
  maxHand: 8,
  maxBoard: 5,
  resonanceAttackBonus: 1,
  resonanceHealthBonus: 1,
  resonanceSpellBonus: 1,
  resonanceHealBonus: 2,
  aiThinkMs: 650,
};

// Element key -> { label, color (main), dark, light, glyph name }
export const ELEMENTS = {
  flame: { label: 'Flame', color: '#e8491d', dark: '#7a1e05', light: '#ffb347', ink: '#ffd9a0' },
  tide: { label: 'Tide', color: '#1d7fd6', dark: '#0a3a6b', light: '#7fd4ff', ink: '#cfeeff' },
  leaf: { label: 'Leaf', color: '#3da33d', dark: '#123f16', light: '#a5e08a', ink: '#dcf7c8' },
  stone: { label: 'Stone', color: '#c98a2b', dark: '#5c3a08', light: '#ffd98a', ink: '#ffeec2' },
};
export const ELEMENT_KEYS = ['flame', 'tide', 'leaf', 'stone'];

// Creature definitions. kind 'creature': attack/health are its body.
// Spell definitions. kind 'spell': effect is one of 'damage' | 'heal' | 'draw',
// amount is the base effect; resonance adds TUNING.resonanceSpellBonus (heal: +2).
export const CARD_DEFS = [
  // -- Flame creatures --
  { id: 'cinder-imp', name: 'Cinder Imp', element: 'flame', kind: 'creature', cost: 1, attack: 1, health: 1, text: 'A spark with teeth.' },
  { id: 'spark-lynx', name: 'Spark Lynx', element: 'flame', kind: 'creature', cost: 2, attack: 2, health: 2, text: 'It hunts in flashes.' },
  { id: 'ember-drake', name: 'Ember Drake', element: 'flame', kind: 'creature', cost: 4, attack: 4, health: 4, text: 'It breathes coal smoke.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', element: 'flame', kind: 'creature', cost: 5, attack: 5, health: 5, text: 'Burns, then returns.' },
  // -- Tide creatures --
  { id: 'dew-sprite', name: 'Dew Sprite', element: 'tide', kind: 'creature', cost: 1, attack: 1, health: 2, text: 'Small and slippery.' },
  { id: 'mist-heron', name: 'Mist Heron', element: 'tide', kind: 'creature', cost: 2, attack: 2, health: 3, text: 'It strikes from fog.' },
  { id: 'kelp-knight', name: 'Kelp Knight', element: 'tide', kind: 'creature', cost: 3, attack: 3, health: 4, text: 'Green-tide armour.' },
  { id: 'pearl-serpent', name: 'Pearl Serpent', element: 'tide', kind: 'creature', cost: 5, attack: 5, health: 6, text: 'Moon-coiled serpent.' },
  // -- Leaf creatures --
  { id: 'briar-wolf', name: 'Briar Wolf', element: 'leaf', kind: 'creature', cost: 2, attack: 3, health: 2, text: 'Thorns for fur.' },
  { id: 'moss-troll', name: 'Moss Troll', element: 'leaf', kind: 'creature', cost: 3, attack: 2, health: 5, text: 'It naps for decades.' },
  { id: 'thornback', name: 'Thornback', element: 'leaf', kind: 'creature', cost: 4, attack: 4, health: 5, text: 'Do not hug it.' },
  { id: 'root-warden', name: 'Root Warden', element: 'leaf', kind: 'creature', cost: 5, attack: 5, health: 7, text: 'The forest stands.' },
  // -- Stone creatures --
  { id: 'pebble-pup', name: 'Pebble Pup', element: 'stone', kind: 'creature', cost: 1, attack: 2, health: 1, text: 'Fetches boulders.' },
  { id: 'flint-golem', name: 'Flint Golem', element: 'stone', kind: 'creature', cost: 3, attack: 3, health: 5, text: 'Sparks when struck.' },
  { id: 'granite-bear', name: 'Granite Bear', element: 'stone', kind: 'creature', cost: 4, attack: 4, health: 6, text: 'A growling mountain.' },
  { id: 'mountain-sage', name: 'Stone Sage', element: 'stone', kind: 'creature', cost: 5, attack: 6, health: 6, text: 'Older than the court.' },
  // -- Spells --
  { id: 'ember-burst', name: 'Ember Burst', element: 'flame', kind: 'spell', cost: 2, effect: 'damage', amount: 3, text: 'Deal 3 damage.' },
  { id: 'tide-mend', name: 'Tide Mend', element: 'tide', kind: 'spell', cost: 2, effect: 'heal', amount: 6, text: 'Restore 6 life.' },
  { id: 'leaf-bloom', name: 'Leaf Bloom', element: 'leaf', kind: 'spell', cost: 1, effect: 'draw', amount: 2, text: 'Draw 2 cards.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((d) => [d.id, d]));

// The 30-card duel deck: every creature once, a second copy of each 1–2 cost
// creature, two extra heavy creatures, and two copies of each spell.
export const DECK_LIST = [
  ...CARD_DEFS.filter((d) => d.kind === 'creature').map((d) => d.id),
  'cinder-imp', 'pebble-pup', 'dew-sprite', 'spark-lynx', 'mist-heron', 'briar-wolf',
  'ember-drake', 'granite-bear',
  'ember-burst', 'ember-burst', 'tide-mend', 'tide-mend', 'leaf-bloom', 'leaf-bloom',
];
