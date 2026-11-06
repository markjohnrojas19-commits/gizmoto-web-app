/**
 * app.js — Application entry point and coordinator.
 *
 * Data flow (one direction only):
 *
 *   user event ─▶ component handler ─▶ dataService action ─▶ setState()
 *        ▲                                                       │
 *        └──────── renderAll() ◀── subscribe() ◀─────────────────┘
 *
 * - Components (js/components/) turn state into HTML and report user events
 *   through the handlers passed to `mount`. They never change state.
 * - Services (js/services/) validate input and are the only code that calls setState().
 * - This file wires the two together and re-renders after every state change.
 *
 * TO ADD A FEATURE: create a component exporting `render(root, state)` (and
 * optionally `mount(root, handlers)`), add a mount point to index.html, and
 * register it in COMPONENTS below. New actions go in dataService and HANDLERS.
 */

import { getState, subscribe } from './state.js';
import * as dataService from './services/dataService.js';
import { mountCategoryNav, renderCategoryNav } from './components/categoryNav.js';
import { mountProductList, renderProductList } from './components/productList.js';
import { mountSuggestionSidebar, renderSuggestionSidebar } from './components/suggestionSidebar.js';
import { mountAdminPanel, renderAdminPanel } from './components/adminPanel.js';

/** Component registry: which component renders into which mount point. */
const COMPONENTS = [
  { selector: '#category-nav', mount: mountCategoryNav, render: renderCategoryNav },
  { selector: '#admin-panel', mount: mountAdminPanel, render: renderAdminPanel },
  { selector: '#products', mount: mountProductList, render: renderProductList },
  { selector: '#suggestions', mount: mountSuggestionSidebar, render: renderSuggestionSidebar },
];

/** UI events → service actions. Each returns { ok, message } | { ok, error }. */
const HANDLERS = {
  onSelectCategory: dataService.setActiveCategory,
  onAddCategory: dataService.addCategory,
  onRemoveCategory: dataService.removeCategory,
  onSuggest: dataService.addSuggestion,
  onVote: dataService.voteForSuggestion,
  onRemoveSuggestion: dataService.removeSuggestion,
  onAddProduct: dataService.addProduct,
  onRemoveProduct: dataService.removeProduct,
  onAddProductImages: dataService.addProductImages,
  onRemoveProductImage: dataService.removeProductImage,
};

let mountedComponents = [];
let renderScheduled = false;

/**
 * Simulated role check: open the app with `?admin=true` to enable admin mode.
 * This is a client-side demo flag, not security — real access control must
 * live on a server once Gizmoto has a backend.
 */
function readAdminFlag() {
  return new URLSearchParams(window.location.search).get('admin') === 'true';
}

/** Re-renders every component, keeping keyboard focus on the same control. */
function renderAll(state) {
  const focusKey = document.activeElement?.dataset?.focusKey;

  mountedComponents.forEach(({ root, render }) => render(root, state));

  if (focusKey) document.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus();
}

/** Batches multiple state changes in one tick into a single render per frame. */
function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    renderAll(getState());
  });
}

function init() {
  mountedComponents = COMPONENTS.map((component) => ({
    ...component,
    root: document.querySelector(component.selector),
  }));
  mountedComponents.forEach(({ root, mount }) => mount?.(root, HANDLERS));

  subscribe(scheduleRender);
  dataService.initData({ isAdmin: readAdminFlag() });
}

init();
