/**
 * categoryNav.js — Category filter (left column).
 * Horizontal scrolling chips on mobile, vertical list on desktop.
 * Admins also get a remove button per category and an add-category form.
 */

import { ALL_CATEGORIES } from '../state.js';
import { escapeHtml, showStatus } from '../utils/dom.js';

export function mountCategoryNav(root, { onSelectCategory, onAddCategory, onRemoveCategory }) {
  root.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-category]');
    if (removeButton) {
      showStatus(root.querySelector('[data-role="category-status"]'), onRemoveCategory(removeButton.dataset.removeCategory));
      return;
    }

    const button = event.target.closest('[data-category]');
    if (button) onSelectCategory(button.dataset.category);
  });

  // Delegated listener: keeps working when the form's markup is (re)created.
  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-role="add-category-form"]');
    if (!form) return;
    event.preventDefault();

    const { categoryName } = form.elements;
    const result = onAddCategory(categoryName.value);
    showStatus(root.querySelector('[data-role="category-status"]'), result);
    if (result.ok) {
      form.reset();
      categoryName.focus();
    }
  });
}

export function renderCategoryNav(root, { categories, products, activeCategory, isAdmin }) {
  // Build the shell once (per role) so in-progress input isn't wiped on re-render.
  const shellRole = isAdmin ? 'admin' : 'shopper';
  if (root.dataset.shell !== shellRole) {
    root.innerHTML = navShell(isAdmin);
    root.dataset.shell = shellRole;
  }

  const options = [{ id: ALL_CATEGORIES, label: 'All items', emoji: '🛍️' }, ...categories];

  root.querySelector('[data-role="category-list"]').innerHTML = options
    .map((option) => {
      const isRemovable = isAdmin && option.id !== ALL_CATEGORIES;
      return categoryItem(option, countFor(option.id, products), option.id === activeCategory, isRemovable);
    })
    .join('');
}

function navShell(isAdmin) {
  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 class="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Browse</h2>
      <ul data-role="category-list" class="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0"></ul>
      ${isAdmin ? addCategoryForm() : ''}
    </div>
  `;
}

function addCategoryForm() {
  return `
    <form data-role="add-category-form" class="mt-3 flex gap-2 border-t border-slate-100 pt-3">
      <label for="new-category-name" class="sr-only">New category name</label>
      <input id="new-category-name" name="categoryName" type="text" maxlength="40" autocomplete="off"
        placeholder="New category"
        class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200" />
      <button type="submit"
        class="btn-press shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2">
        Add
      </button>
    </form>
    <p data-role="category-status" class="mt-2 min-h-[1.25rem] text-sm" role="status" aria-live="polite"></p>
  `;
}

function countFor(categoryId, products) {
  return categoryId === ALL_CATEGORIES
    ? products.length
    : products.filter((product) => product.category === categoryId).length;
}

function categoryItem({ id, label, emoji }, count, isActive, isRemovable) {
  const stateClasses = isActive
    ? 'bg-violet-600 text-white shadow-sm'
    : 'bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700';

  return `
    <li class="flex shrink-0 items-center gap-1">
      <button
        type="button"
        data-category="${escapeHtml(id)}"
        data-focus-key="category-${escapeHtml(id)}"
        aria-pressed="${isActive}"
        class="btn-press flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 lg:whitespace-normal ${stateClasses}"
      >
        <span aria-hidden="true">${escapeHtml(emoji)}</span>
        <span class="flex-1 break-words text-left">${escapeHtml(label)}</span>
        <span class="rounded-full px-2 text-xs ${isActive ? 'bg-white/20' : 'bg-slate-200/70 text-slate-500'}">${count}</span>
      </button>
      ${isRemovable ? removeButton(id, label) : ''}
    </li>
  `;
}

function removeButton(id, label) {
  return `
    <button type="button" data-remove-category="${escapeHtml(id)}" aria-label="Remove category ${escapeHtml(label)}"
      title="Remove category"
      class="btn-press shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
      ✕
    </button>
  `;
}
