/**
 * categoryNav.js — Category filter (left column).
 * Horizontal scrolling chips on mobile, vertical list on desktop.
 */

import { ALL_CATEGORIES, CATEGORIES } from '../state.js';
import { escapeHtml } from '../utils/dom.js';

export function mountCategoryNav(root, { onSelectCategory }) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (button) onSelectCategory(button.dataset.category);
  });
}

export function renderCategoryNav(root, { products, activeCategory }) {
  const options = [
    { id: ALL_CATEGORIES, label: 'All items', emoji: '🛍️' },
    ...CATEGORIES,
  ];

  root.innerHTML = `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Browse</h2>
      <ul class="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        ${options.map((option) => categoryButton(option, countFor(option.id, products), option.id === activeCategory)).join('')}
      </ul>
    </div>
  `;
}

function countFor(categoryId, products) {
  return categoryId === ALL_CATEGORIES
    ? products.length
    : products.filter((product) => product.category === categoryId).length;
}

function categoryButton({ id, label, emoji }, count, isActive) {
  const stateClasses = isActive
    ? 'bg-violet-600 text-white shadow-sm'
    : 'bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700';

  return `
    <li class="shrink-0">
      <button
        type="button"
        data-category="${escapeHtml(id)}"
        data-focus-key="category-${escapeHtml(id)}"
        aria-pressed="${isActive}"
        class="btn-press flex w-full items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${stateClasses}"
      >
        <span aria-hidden="true">${emoji}</span>
        <span class="flex-1 text-left">${escapeHtml(label)}</span>
        <span class="rounded-full px-2 text-xs ${isActive ? 'bg-white/20' : 'bg-slate-200/70 text-slate-500'}">${count}</span>
      </button>
    </li>
  `;
}
