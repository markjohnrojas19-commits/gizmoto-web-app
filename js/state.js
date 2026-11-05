/**
 * state.js — Global Application State (single source of truth).
 *
 * - `getState()` reads the current, frozen state snapshot.
 * - `setState(patch)` replaces state immutably and notifies subscribers.
 *   Only services (js/services/) should call it; components never mutate state.
 * - `subscribe(listener)` lets app.js re-render whenever state changes.
 * - Selectors (`select*`) derive view data (filtering, sorting) without
 *   storing duplicates in state.
 *
 * SCALING: to launch a new product line, add one entry to CATEGORIES.
 * The nav, product cards, and admin form all read from this list.
 */

/** Product categories. `id` is stored on each product's `category` field. */
export const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'sticker', label: 'Stickers', emoji: '✨' }),
  Object.freeze({ id: 'keychain', label: 'Keychains', emoji: '🔑' }),
  Object.freeze({ id: 'pen-spinner', label: 'Pen Spinners', emoji: '🖊️' }),
]);

/** Special filter value meaning "show every category". */
export const ALL_CATEGORIES = 'all';

/**
 * State shape:
 * - isAdmin:        boolean flag that unlocks the admin panel
 * - activeCategory: ALL_CATEGORIES or a CATEGORIES id
 * - products:       Array<{ id, name, category, isAvailable }>
 * - suggestions:    Array<{ id, name, votes, createdAt }>
 */
let state = Object.freeze({
  isAdmin: false,
  activeCategory: ALL_CATEGORIES,
  products: [],
  suggestions: [],
});

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(patch) {
  state = Object.freeze({ ...state, ...patch });
  listeners.forEach((listener) => listener(state));
}

/** Registers a listener for state changes. Returns an unsubscribe function. */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Selectors ────────────────────────────────────────────────────────────

export function getCategory(categoryId) {
  return CATEGORIES.find((category) => category.id === categoryId);
}

/** Products in the active category, in-stock items first. */
export function selectVisibleProducts({ products, activeCategory }) {
  return products
    .filter((product) => activeCategory === ALL_CATEGORIES || product.category === activeCategory)
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
}

/** Suggestions ordered by votes (highest first); ties keep the oldest first. */
export function selectRankedSuggestions({ suggestions }) {
  return [...suggestions].sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);
}
