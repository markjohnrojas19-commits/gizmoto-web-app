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

import { ALL_CATEGORIES, DEFAULT_CATEGORIES, getState, setState } from '../state.js';

// v2: starts from an empty catalog, so data saved under the old v1 mock seed is not loaded.
const STORAGE_KEY = 'gizmoto:data:v2';
// Kept apart from catalog data: it records what THIS visitor voted for, not shared content.
const VOTES_KEY = 'gizmoto:votes:v1';
const MAX_NAME_LENGTH = 40;
const NEW_CATEGORY_EMOJI = '🏷️';

/** Starting data used on first visit (or if stored data is unreadable): a blank canvas. */
const SEED_DATA = Object.freeze({
  categories: DEFAULT_CATEGORIES,
  products: [],
  suggestions: [],
});

// ── Storage adapter (simulated backend) ──────────────────────────────────

const storage = {
  load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(data?.products) || !Array.isArray(data?.suggestions)) return null;
      // Data saved before categories were editable has none stored: use the defaults.
      return { ...data, categories: Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES };
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

/**
 * Remembers which suggestions this browser has voted for, so each visitor gets
 * one vote per suggestion. Client-side only: clearing site data resets it, so
 * a real backend must enforce one vote per account.
 */
const voteStorage = {
  load() {
    try {
      const ids = JSON.parse(localStorage.getItem(VOTES_KEY));
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  },
  save(ids) {
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable: votes are still limited for this page session.
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

const isKnownCategory = (categoryId) => getState().categories.some((category) => category.id === categoryId);

/** Commits changes to persisted collections (categories/products/suggestions) and saves them. */
function commit(patch) {
  setState(patch);
  const { categories, products, suggestions } = getState();
  storage.save({ categories, products, suggestions });
}

/** Commits this visitor's voted ids and saves them. */
function commitVotedIds(votedIds) {
  setState({ votedIds });
  voteStorage.save(votedIds);
}

/** Returns a copy of `suggestions` with one suggestion's votes changed by `delta` (never below 0). */
function adjustVotes(suggestions, suggestionId, delta) {
  return suggestions.map((suggestion) =>
    suggestion.id === suggestionId ? { ...suggestion, votes: Math.max(0, suggestion.votes + delta) } : suggestion,
  );
}

// ── Public actions ───────────────────────────────────────────────────────

/** Loads persisted data (or the empty seed) into state. Called once by app.js. */
export function initData({ isAdmin = false } = {}) {
  const { categories, products, suggestions } = storage.load() ?? SEED_DATA;
  // Drop votes for suggestions that no longer exist.
  const votedIds = voteStorage.load().filter((id) => suggestions.some((suggestion) => suggestion.id === id));
  setState({ categories, products, suggestions, votedIds, isAdmin });
}

export function setActiveCategory(categoryId) {
  const isKnown = categoryId === ALL_CATEGORIES || isKnownCategory(categoryId);
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
  if (!isKnownCategory(category)) return failure('Please choose a valid category.');

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

/** Admin only: adds a category to the Browse list. */
export function addCategory(label) {
  const denied = requireAdmin();
  if (denied) return denied;

  const cleanLabel = normalizeName(label);
  const nameError = validateName(cleanLabel, 'category name');
  if (nameError) return failure(nameError);

  const { categories } = getState();
  if (categories.some((category) => isSameName(category.label, cleanLabel))) {
    return failure(`"${cleanLabel}" is already a category.`);
  }

  const category = { id: createId('c'), label: cleanLabel, emoji: NEW_CATEGORY_EMOJI };
  commit({ categories: [...categories, category] });
  return success(`Added "${cleanLabel}".`);
}

/** Admin only: removes an empty category. Categories that still hold items are kept. */
export function removeCategory(categoryId) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { categories, products, activeCategory } = getState();
  const target = categories.find((category) => category.id === categoryId);
  if (!target) return failure('That category no longer exists.');

  const itemCount = products.filter((product) => product.category === categoryId).length;
  if (itemCount) {
    return failure(`Remove the ${itemCount} item${itemCount === 1 ? '' : 's'} in "${target.label}" first.`);
  }

  commit({
    categories: categories.filter((category) => category.id !== categoryId),
    activeCategory: activeCategory === categoryId ? ALL_CATEGORIES : activeCategory,
  });
  return success(`Removed "${target.label}".`);
}

/**
 * Adds a community suggestion with the suggester's vote already counted.
 * Suggesting an existing name (case-insensitive) counts as a vote for it instead.
 */
export function addSuggestion(rawName) {
  const name = normalizeName(rawName);
  const nameError = validateName(name, 'suggestion');
  if (nameError) return failure(nameError);

  const { suggestions, votedIds } = getState();
  const existing = suggestions.find((suggestion) => isSameName(suggestion.name, name));
  if (existing) {
    if (votedIds.includes(existing.id)) return failure(`"${existing.name}" is already on the board with your vote.`);
    voteForSuggestion(existing.id);
    return success(`"${existing.name}" was already suggested — we counted your vote!`);
  }

  const suggestion = { id: createId('s'), name, votes: 1, createdAt: Date.now() };
  commit({ suggestions: [...suggestions, suggestion] });
  commitVotedIds([...votedIds, suggestion.id]);
  return success(`Thanks! "${name}" is on the board.`);
}

/** Toggles this visitor's single vote: votes if they haven't yet, otherwise takes the vote back. */
export function voteForSuggestion(suggestionId) {
  const { suggestions, votedIds } = getState();
  const target = suggestions.find((suggestion) => suggestion.id === suggestionId);
  if (!target) return failure('That suggestion no longer exists.');

  if (votedIds.includes(suggestionId)) {
    commit({ suggestions: adjustVotes(suggestions, suggestionId, -1) });
    commitVotedIds(votedIds.filter((id) => id !== suggestionId));
    return success(`Removed your vote for "${target.name}".`);
  }

  commit({ suggestions: adjustVotes(suggestions, suggestionId, 1) });
  commitVotedIds([...votedIds, suggestionId]);
  return success(`Voted for "${target.name}".`);
}

/** Admin only: removes a suggestion from the board. */
export function removeSuggestion(suggestionId) {
  const denied = requireAdmin();
  if (denied) return denied;

  const { suggestions, votedIds } = getState();
  const target = suggestions.find((suggestion) => suggestion.id === suggestionId);
  if (!target) return failure('That suggestion no longer exists.');

  commit({ suggestions: suggestions.filter((suggestion) => suggestion.id !== suggestionId) });
  commitVotedIds(votedIds.filter((id) => id !== suggestionId));
  return success(`Removed "${target.name}".`);
}
