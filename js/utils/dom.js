/**
 * dom.js — Small helpers shared by UI components (no business logic).
 */

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text before interpolating it into an HTML template string (prevents XSS). */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Displays a service result ({ ok, message } | { ok, error }) in a status element. */
export function showStatus(element, result) {
  if (!element) return;
  element.textContent = result.ok ? result.message : result.error;
  element.classList.toggle('text-emerald-600', result.ok);
  element.classList.toggle('text-rose-600', !result.ok);
}
