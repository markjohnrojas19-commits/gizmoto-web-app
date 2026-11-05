/**
 * adminPanel.js — Catalog management (left column, admins only).
 *
 * Renders nothing unless `state.isAdmin` is true. The service layer
 * re-checks the flag too, so actions are refused even if called directly.
 */

import { CATEGORIES } from '../state.js';
import { escapeHtml, showStatus } from '../utils/dom.js';

export function mountAdminPanel(root, { onAddProduct, onRemoveProduct }) {
  // Delegated listeners: they keep working when the panel's markup is (re)created.
  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-role="add-product-form"]');
    if (!form) return;
    event.preventDefault();

    const { productName, productCategory, productAvailable } = form.elements;
    const result = onAddProduct({
      name: productName.value,
      category: productCategory.value,
      isAvailable: productAvailable.checked,
    });
    showStatus(root.querySelector('[data-role="status"]'), result);
    if (result.ok) {
      form.reset();
      productName.focus();
    }
  });

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-id]');
    if (button) showStatus(root.querySelector('[data-role="status"]'), onRemoveProduct(button.dataset.removeId));
  });
}

export function renderAdminPanel(root, { isAdmin, products }) {
  root.hidden = !isAdmin;
  if (!isAdmin) {
    root.innerHTML = '';
    return;
  }

  // Build the form shell once so in-progress input isn't wiped on re-render.
  if (!root.querySelector('[data-role="inventory"]')) root.innerHTML = panelShell();

  root.querySelector('[data-role="inventory"]').innerHTML = products.length
    ? products.map(inventoryRow).join('')
    : '<li class="py-3 text-center text-sm text-slate-500">Catalog is empty.</li>';
}

function panelShell() {
  const inputClasses =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200';

  return `
    <div class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <span class="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">Admin</span>
        <h2 class="font-display font-bold text-slate-900">Manage catalog</h2>
      </div>

      <form data-role="add-product-form" class="space-y-3">
        <div>
          <label for="admin-product-name" class="mb-1 block text-xs font-medium text-slate-600">Item name</label>
          <input id="admin-product-name" name="productName" type="text" maxlength="40" autocomplete="off"
            placeholder="e.g. Galaxy Unicorn" class="${inputClasses}" />
        </div>
        <div>
          <label for="admin-product-category" class="mb-1 block text-xs font-medium text-slate-600">Category</label>
          <select id="admin-product-category" name="productCategory" class="${inputClasses}">
            ${CATEGORIES.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>`).join('')}
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input name="productAvailable" type="checkbox" checked class="h-4 w-4 rounded border-slate-300 accent-violet-600" />
          Available now
        </label>
        <button type="submit"
          class="btn-press w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2">
          Add New Item
        </button>
      </form>
      <p data-role="status" class="mt-2 min-h-[1.25rem] text-sm" role="status" aria-live="polite"></p>

      <h3 class="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Current items</h3>
      <ul data-role="inventory" class="mt-2 max-h-72 divide-y divide-amber-100 overflow-y-auto"></ul>
    </div>
  `;
}

function inventoryRow(product) {
  const name = escapeHtml(product.name);
  return `
    <li class="flex items-center justify-between gap-2 py-2">
      <span class="min-w-0 truncate text-sm text-slate-700" title="${name}">${name}</span>
      <button type="button" data-remove-id="${escapeHtml(product.id)}" aria-label="Remove ${name}"
        class="btn-press shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
        Remove Item
      </button>
    </li>
  `;
}
