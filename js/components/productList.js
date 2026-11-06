/**
 * productList.js — Product catalog (center column). Display only, no events.
 */

import { ALL_CATEGORIES, getCategory, selectVisibleProducts } from '../state.js';
import { escapeHtml } from '../utils/dom.js';

/** Card artwork gradient per category. Add an entry when adding a category. */
const CATEGORY_THEMES = {
  sticker: 'from-fuchsia-200 via-violet-100 to-amber-100',
  keychain: 'from-sky-200 via-indigo-100 to-cyan-100',
  'pen-spinner': 'from-emerald-200 via-lime-100 to-teal-100',
};
const DEFAULT_THEME = 'from-slate-200 to-slate-100';

export function renderProductList(root, state) {
  const products = selectVisibleProducts(state);
  const inStock = products.filter((product) => product.isAvailable).length;
  const title =
    state.activeCategory === ALL_CATEGORIES ? 'All items' : getCategory(state.activeCategory)?.label ?? 'Items';

  root.innerHTML = `
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-violet-600">Shop</p>
        <h2 id="products-heading" class="font-display text-2xl font-bold text-slate-900">${escapeHtml(title)}</h2>
      </div>
      <p class="text-sm text-slate-500">${inStock} of ${products.length} in stock</p>
    </div>
    ${products.length ? productGrid(products) : emptyState()}
  `;
}

function productGrid(products) {
  return `<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">${products.map(productCard).join('')}</ul>`;
}

function productCard(product) {
  const category = getCategory(product.category);
  const theme = CATEGORY_THEMES[product.category] ?? DEFAULT_THEME;

  return `
    <li class="product-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${product.isAvailable ? '' : 'opacity-60'}">
      <div class="flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${theme}">
        <span class="product-emoji text-5xl drop-shadow-sm" aria-hidden="true">${category?.emoji ?? '🎁'}</span>
      </div>
      <div class="flex items-start justify-between gap-3 p-4">
        <div class="min-w-0">
          <h3 class="truncate font-semibold text-slate-900">${escapeHtml(product.name)}</h3>
          <p class="text-sm text-slate-500">${escapeHtml(category?.label ?? product.category)}</p>
        </div>
        ${availabilityBadge(product.isAvailable)}
      </div>
    </li>
  `;
}

function availabilityBadge(isAvailable) {
  return isAvailable
    ? '<span class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">In stock</span>'
    : '<span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Sold out</span>';
}

function emptyState() {
  return `
    <div class="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <p class="text-4xl" aria-hidden="true">📦</p>
      <p class="mt-3 font-medium text-slate-700">No items available</p>
      <p class="mt-1 text-sm text-slate-500">This collection is coming soon — vote for what you want in the sidebar!</p>
    </div>
  `;
}
