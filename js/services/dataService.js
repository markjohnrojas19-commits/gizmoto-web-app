/**
 * dataService.js — Business logic and (simulated) persistence.
 *
 * This is the ONLY layer that changes application state. Every action:
 *   1. validates its input (and admin permission where required),
 *   2. computes the next state immutably and commits it,
 *   3. returns a result object: { ok: true, message } | { ok: false, error }.
 *
 * Persistence is simulated with localStorage. To move to a real backend,
 * replace the `storage` adapter (and make actions async) — components and
 * state.js stay unchanged.
 */

import { ALL_CATEGORIES, CATEGORIES, getState, setState } from '../state.js';

// v2: starts from an empty catalog, so data saved under the old v1 mock seed is not loaded.
const STORAGE_KEY = 'gizmoto:data:v2';
const MAX_NAME_LENGTH = 40;

/** Starting data used on first visit (or if stored data is unreadable): a blank canvas. */
const SEED_DATA = Object.freeze({
  products: [],
  suggestions: [],
});

// ── Storage adapter (simulated backend) ──────────────────────────────────

const storage = {
  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data?.products) && Array.isArray(data?.suggestions) ? data : null;
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable (private mode, quota): the app keeps working in memory.
    }
  },
};

// ── Internal helpers ─────────────────────────────────────────────────────

const success = (message = '') => ({ ok: true, message });
const failure = (error) => ({ ok: false, error });

function createId(prefix) {
  const unique =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${unique}`;
}

/** Trims and collapses whitespace so "  Pen   Spinner " === "Pen Spinner". */
function normalizeName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ');
}

function validateName(name, label) {
  if (!name) return `Please enter a ${label}.`;
  if (name.length > MAX_NAME_LENGTH) return `Keep it under ${MAX_NAME_LENGTH} characters.`;
  return null;
}

const isSameName = (a, b) => a.toLowerCase() === b.toLowerCase();

function requireAdmin() {
  return getState().isAdmin ? null : failure('Only admins can manage the catalog.');
}

/** Commits changes to persisted collections (products/suggestions) and saves them. */
function commit(patch) {
  setState(patch);
  const { products, suggestions } = getState();
  storage.save({ products, suggestions });
}

// ── Public actions ───────────────────────────────────────────────────────

/** Loads persisted data (or the empty seed) into state. Called once by app.js. */
export function initData({ isAdmin = false } = {}) {
  const { products, suggestions } = storage.load() ?? SEED_DATA;
  setState({ products, suggestions, isAdmin });
}

export function setActiveCategory(categoryId) {
  const isKnown = categoryId === ALL_CATEGORIES || CATEGORIES.some((category) => category.id === categoryId);
  if (!isKnown) return failure('Unknown category.');
  setState({ activeCategory: categoryId });
  return success();
}

/** Admin only: adds an item to the catalog. */
export function addProduct({ name, category, isAvailable = true }) {
  const denied = requireAdmin();
  if (denied) return denied;

  const cleanName = normalizeName(name);
  const nameError = validateName(cleanName, 'product name');
  if (nameError) return failure(nameError);
  if (!CATEGORIES.some((item) => item.id === category)) return failure('Please choose a valid category.');

  const { products } = getState();
  if (products.some((product) => product.category === category && isSameName(product.name, cleanName))) {
    return failure(`"${cleanName}" is already in the catalog.`);
  }

  const product = { id: createId('p'), name: cleanName, category, isAvailable: Boolean(isAvailable) };
  commit({ products: [...products, product] });
  return success(`Added "${cleanName}".`);
}

/** Admin only: removes an item from the catalog. */
export function removeProduct(productId) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { products } = getState();
  const target = products.find((product) => product.id === productId);
  if (!target) return failure('That item no longer exists.');

  commit({ products: products.filter((product) => product.id !== productId) });
  return success(`Removed "${target.name}".`);
}

/**
 * Adds a community suggestion with the suggester's vote already counted.
 * Suggesting an existing name (case-insensitive) counts as a vote for it instead.
 */
export function addSuggestion(rawName) {
  const name = normalizeName(rawName);
  const nameError = validateName(name, 'suggestion');
  if (nameError) return failure(nameError);

  const { suggestions } = getState();
  const existing = suggestions.find((suggestion) => isSameName(suggestion.name, name));
  if (existing) {
    voteForSuggestion(existing.id);
    return success(`"${existing.name}" was already suggested — we counted your vote!`);
  }

  const suggestion = { id: createId('s'), name, votes: 1, createdAt: Date.now() };
  commit({ suggestions: [...suggestions, suggestion] });
  return success(`Thanks! "${name}" is on the board.`);
}

export function voteForSuggestion(suggestionId) {
  const { suggestions } = getState();
  if (!suggestions.some((suggestion) => suggestion.id === suggestionId)) {
    return failure('That suggestion no longer exists.');
  }

  commit({
    suggestions: suggestions.map((suggestion) =>
      suggestion.id === suggestionId ? { ...suggestion, votes: suggestion.votes + 1 } : suggestion,
    ),
  });
  return success();
}
