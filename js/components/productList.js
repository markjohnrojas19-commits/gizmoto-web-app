/**
 * productList.js — Product catalog (center column).
 *
 * Items with photos show them in a small carousel: transparent ‹ › buttons
 * flip through that item's photos. Which photo is showing is view-only state,
 * kept here (not in app state) and switched in the DOM without a re-render.
 *
 * Admins also get a photo overlay on each card's picture: hover it and click
 * "+" to upload from the computer, "Paste link" to add an image link, or drop
 * files/images straight onto it. The service layer re-checks admin rights.
 */

import { ALL_CATEGORIES, MAX_PRODUCT_IMAGES, getCategory, selectVisibleProducts } from '../state.js';
import { escapeHtml } from '../utils/dom.js';
import { filesToDataUrls, loadImageUrl } from '../utils/images.js';

/** Card artwork gradient per category. Add an entry when adding a category. */
const CATEGORY_THEMES = {
  sticker: 'from-fuchsia-200 via-violet-100 to-amber-100',
  keychain: 'from-sky-200 via-indigo-100 to-cyan-100',
  'pen-spinner': 'from-emerald-200 via-lime-100 to-teal-100',
};
const DEFAULT_THEME = 'from-slate-200 to-slate-100';

// View-only state for the cards (not app data).
/** Photo currently shown per product id, so it survives re-renders. */
const slideIndexes = new Map();
let linkFormProductId = null; // card whose "Paste link" box is open
let busyProductId = null; // card whose photos are still being read
let cardStatus = null; // { productId, result } shown under that card's name
let lastState = null;

export function mountProductList(root, { onAddProductImages, onRemoveProductImage }) {
  const rerender = () => lastState && renderProductList(root, lastState);
  const findProduct = (productId) => lastState?.products.find((product) => product.id === productId);

  /** Reads photos with `loadSources(room)` and adds them to the product, then shows the first new one. */
  async function addPhotos(productId, loadSources) {
    const product = findProduct(productId);
    if (!product || busyProductId) return;
    const room = MAX_PRODUCT_IMAGES - product.images.length;
    if (room <= 0) {
      cardStatus = { productId, result: { ok: false, error: `Each item can have up to ${MAX_PRODUCT_IMAGES} photos.` } };
      rerender();
      return;
    }

    busyProductId = productId;
    cardStatus = null;
    rerender();

    let result;
    try {
      const { sources, skipped } = await loadSources(room);
      result = onAddProductImages(productId, sources);
      if (result.ok) {
        slideIndexes.set(productId, product.images.length);
        if (skipped) result = { ok: true, message: `${result.message} Only ${MAX_PRODUCT_IMAGES} fit, so ${skipped} were skipped.` };
      }
    } catch (error) {
      result = { ok: false, error: error.message };
    }

    busyProductId = null;
    cardStatus = { productId, result };
    if (result.ok) linkFormProductId = null;
    // A successful add re-renders through state; this covers errors (and is harmless otherwise).
    rerender();
  }

  root.addEventListener('click', (event) => {
    const step = event.target.closest('[data-slide-step]');
    if (step) {
      const carousel = step.closest('[data-carousel]');
      const count = carousel.querySelectorAll('[data-slide]').length;
      const next = (Number(carousel.dataset.index) + Number(step.dataset.slideStep) + count) % count;
      slideIndexes.set(carousel.dataset.carousel, next);
      showSlide(carousel, next);
      return;
    }

    const addButton = event.target.closest('[data-card-add-photo]');
    if (addButton) {
      addButton.closest('[data-carousel]').querySelector('[data-card-photo-file]').click();
      return;
    }

    const linkButton = event.target.closest('[data-card-photo-link]');
    if (linkButton) {
      linkFormProductId = linkButton.dataset.cardPhotoLink;
      rerender();
      root.querySelector('[data-card-link-form] input')?.focus();
      return;
    }

    if (event.target.closest('[data-card-link-cancel]')) {
      linkFormProductId = null;
      rerender();
      return;
    }

    const removeButton = event.target.closest('[data-card-remove-photo]');
    if (removeButton) {
      const carousel = removeButton.closest('[data-carousel]');
      const productId = carousel.dataset.carousel;
      cardStatus = { productId, result: onRemoveProductImage(productId, Number(carousel.dataset.index)) };
      rerender();
    }
  });

  root.addEventListener('change', (event) => {
    const input = event.target.closest('[data-card-photo-file]');
    if (!input) return;
    const files = [...input.files];
    input.value = ''; // lets the same file be picked again later
    if (files.length) addPhotos(input.closest('[data-carousel]').dataset.carousel, (room) => filesToDataUrls(files, room));
  });

  root.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-card-link-form]');
    if (!form) return;
    event.preventDefault();
    const url = form.elements.photoUrl.value;
    addPhotos(form.closest('[data-carousel]').dataset.carousel, async () => ({ sources: [await loadImageUrl(url)], skipped: 0 }));
  });

  // Drag and drop: files from the computer, or an image dragged from another web page.
  const dropTarget = (event) => (lastState?.isAdmin ? event.target.closest('[data-photo-drop]') : null);
  root.addEventListener('dragover', (event) => {
    const target = dropTarget(event);
    if (!target) return;
    event.preventDefault();
    target.classList.add('ring-4', 'ring-inset', 'ring-violet-400');
  });
  root.addEventListener('dragleave', (event) => {
    const target = dropTarget(event);
    if (target && !target.contains(event.relatedTarget)) target.classList.remove('ring-4', 'ring-inset', 'ring-violet-400');
  });
  root.addEventListener('drop', (event) => {
    const target = dropTarget(event);
    if (!target) return;
    event.preventDefault();
    target.classList.remove('ring-4', 'ring-inset', 'ring-violet-400');

    const productId = target.dataset.photoDrop;
    const files = [...event.dataTransfer.files];
    if (files.length) {
      addPhotos(productId, (room) => filesToDataUrls(files, room));
      return;
    }
    const url = event.dataTransfer.getData('text/uri-list').split('\n')[0];
    if (url) addPhotos(productId, async () => ({ sources: [await loadImageUrl(url)], skipped: 0 }));
  });
}

function showSlide(carousel, index) {
  carousel.dataset.index = index;
  carousel.querySelectorAll('[data-slide]').forEach((slide, i) => {
    slide.hidden = i !== index;
  });
  carousel.querySelectorAll('[data-dot]').forEach((dot, i) => {
    dot.classList.toggle('bg-white', i === index);
    dot.classList.toggle('bg-white/50', i !== index);
  });
  const counter = carousel.querySelector('[data-role="slide-counter"]');
  if (counter) counter.textContent = `${index + 1}/${carousel.querySelectorAll('[data-slide]').length}`;
}

export function renderProductList(root, state) {
  lastState = state;
  const products = selectVisibleProducts(state);
  const inStock = products.filter((product) => product.isAvailable).length;
  const title =
    state.activeCategory === ALL_CATEGORIES ? 'All items' : getCategory(state.categories, state.activeCategory)?.label ?? 'Items';

  root.innerHTML = `
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-violet-600">Shop</p>
        <h2 id="products-heading" class="font-display text-2xl font-bold text-slate-900">${escapeHtml(title)}</h2>
      </div>
      <p class="text-sm text-slate-500">${inStock} of ${products.length} in stock</p>
    </div>
    ${products.length ? productGrid(products, state) : emptyState()}
  `;
}

function productGrid(products, { categories, isAdmin }) {
  return `<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">${products.map((product) => productCard(product, categories, isAdmin)).join('')}</ul>`;
}

function productCard(product, categories, isAdmin) {
  const category = getCategory(categories, product.category);
  const status = cardStatus?.productId === product.id ? cardStatus.result : null;

  return `
    <li class="product-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${product.isAvailable ? '' : 'opacity-60'}">
      ${productMedia(product, category, isAdmin)}
      <div class="flex items-start justify-between gap-3 p-4">
        <div class="min-w-0">
          <h3 class="truncate font-semibold text-slate-900">${escapeHtml(product.name)}</h3>
          <p class="text-sm text-slate-500">${escapeHtml(category?.label ?? product.category)}</p>
          ${
            status
              ? `<p class="mt-1 text-xs ${status.ok ? 'text-emerald-600' : 'text-rose-600'}" role="status">${escapeHtml(status.ok ? status.message : status.error)}</p>`
              : ''
          }
        </div>
        ${availabilityBadge(product.isAvailable)}
      </div>
    </li>
  `;
}

/** The card's picture area: photo carousel (or category emoji), plus the admin photo overlay. */
function productMedia(product, category, isAdmin) {
  const { images } = product;
  const current = Math.min(slideIndexes.get(product.id) ?? 0, Math.max(0, images.length - 1));
  const name = escapeHtml(product.name);
  const id = escapeHtml(product.id);
  const theme = CATEGORY_THEMES[product.category] ?? DEFAULT_THEME;

  const content = images.length
    ? images
        .map(
          (src, i) => `
            <img src="${escapeHtml(src)}" alt="${name}, photo ${i + 1} of ${images.length}" data-slide="${i}"
              ${i === current ? '' : 'hidden'} loading="lazy" class="h-full w-full object-cover" />`,
        )
        .join('')
    : `<div class="flex h-full w-full items-center justify-center bg-gradient-to-br ${theme}">
        <span class="product-emoji text-5xl drop-shadow-sm" aria-hidden="true">${category?.emoji ?? '🎁'}</span>
      </div>`;

  return `
    <div class="group relative aspect-[4/3] overflow-hidden bg-slate-100" data-carousel="${id}" data-index="${current}"
      ${isAdmin ? `data-photo-drop="${id}"` : ''}>
      ${content}
      ${images.length > 1 ? carouselControls(name, images.length, current) : ''}
      ${isAdmin ? adminPhotoOverlay(product, name, id) : ''}
    </div>
  `;
}

function carouselControls(name, count, current) {
  const arrow = (step, label, path) => `
    <button type="button" data-slide-step="${step}" aria-label="${label} photo of ${name}"
      class="absolute top-1/2 z-10 ${step < 0 ? 'left-2' : 'right-2'} flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="${path}" /></svg>
    </button>`;
  const dots = Array.from(
    { length: count },
    (_, i) => `<span data-dot="${i}" class="h-1.5 w-1.5 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}"></span>`,
  ).join('');

  return `
    ${arrow(-1, 'Previous', 'M12.5 4.5 7 10l5.5 5.5')}
    ${arrow(1, 'Next', 'M7.5 4.5 13 10l-5.5 5.5')}
    <span data-role="slide-counter" class="absolute right-2 top-2 z-10 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white">${current + 1}/${count}</span>
    <div class="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5" aria-hidden="true">${dots}</div>
  `;
}

/**
 * Admin-only layer over the picture. It shows on hover (or keyboard focus);
 * styles.css keeps the "+" visible on touch screens, which can't hover.
 */
function adminPhotoOverlay(product, name, id) {
  const count = product.images.length;
  const isFull = count >= MAX_PRODUCT_IMAGES;

  if (busyProductId === product.id) {
    return `
      <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/40 text-sm font-semibold text-white">
        <span class="h-8 w-8 animate-spin rounded-full border-4 border-white/40 border-t-white" aria-hidden="true"></span>
        Adding photos…
      </div>
    `;
  }

  const removeButton = count
    ? `<button type="button" data-card-remove-photo data-focus-key="card-remove-photo-${id}" aria-label="Remove the photo shown for ${name}" title="Remove this photo"
        class="admin-photo-control pointer-events-auto absolute left-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-sm text-white opacity-0 transition hover:bg-rose-600 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100">🗑</button>`
    : '';

  const linkForm =
    linkFormProductId === product.id
      ? `<form data-card-link-form class="absolute inset-x-2 bottom-2 z-30 flex gap-1.5 rounded-xl bg-white/95 p-1.5 shadow-lg">
          <label for="card-link-${id}" class="sr-only">Image link for ${name}</label>
          <input id="card-link-${id}" name="photoUrl" type="url" autocomplete="off" placeholder="Paste image link"
            class="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200" />
          <button type="submit" class="btn-press shrink-0 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700">Add</button>
          <button type="button" data-card-link-cancel aria-label="Cancel" class="shrink-0 rounded-lg px-2 text-sm text-slate-500 hover:bg-slate-100">✕</button>
        </form>`
      : '';

  return `
    <input type="file" accept="image/*" multiple hidden data-card-photo-file />
    <div class="admin-photo-overlay pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/30 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <button type="button" data-card-add-photo data-focus-key="card-add-photo-${id}" ${isFull ? 'disabled' : ''}
        aria-label="${isFull ? `${name} already has ${MAX_PRODUCT_IMAGES} photos` : `Add photos to ${name}`}"
        title="${isFull ? 'Photos full' : 'Upload from computer'}"
        class="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-violet-700 shadow-lg transition hover:scale-105 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="h-7 w-7" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <p class="text-xs font-semibold text-white drop-shadow">${isFull ? 'Photos full' : 'Add photo'} · ${count}/${MAX_PRODUCT_IMAGES}</p>
      ${
        isFull
          ? ''
          : `<button type="button" data-card-photo-link="${id}"
              class="pointer-events-auto rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">🔗 Paste link</button>`
      }
    </div>
    ${removeButton}
    ${linkForm}
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
