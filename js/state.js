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
 * SCALING: categories live in state, so admins can add or remove product
 * lines at runtime. DEFAULT_CATEGORIES is only the starting set.
 */

/** Starting product categories. `id` is stored on each product's `category` field. */
export const DEFAULT_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'sticker', label: 'Stickers', emoji: '✨' }),
  Object.freeze({ id: 'keychain', label: 'Keychains', emoji: '🔑' }),
  Object.freeze({ id: 'pen-spinner', label: 'Pen Spinners', emoji: '🖊️' }),
]);

/** Special filter value meaning "show every category". */
export const ALL_CATEGORIES = 'all';

/**
 * State shape:
 * - isAdmin:        boolean flag that unlocks the admin panel
 * - activeCategory: ALL_CATEGORIES or a category id
 * - categories:     Array<{ id, label, emoji }>
 * - products:       Array<{ id, name, category, isAvailable }>
 * - suggestions:    Array<{ id, name, votes, createdAt }>
 * - votedIds:       suggestion ids this visitor has voted for (one vote each)
 */
let state = Object.freeze({
  isAdmin: false,
  activeCategory: ALL_CATEGORIES,
  categories: DEFAULT_CATEGORIES,
  products: [],
  suggestions: [],
  votedIds: [],
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

export function getCategory(categories, categoryId) {
  return categories.find((category) => category.id === categoryId);
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
