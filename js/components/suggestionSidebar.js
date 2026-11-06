/**
 * suggestionSidebar.js — Community suggestions + voting (right sidebar).
 *
 * The form is mounted once so typed text survives re-renders;
 * only the ranked list is re-rendered on state changes.
 * Each visitor gets one vote per suggestion (click again to undo);
 * admins also get a remove button per suggestion.
 */

import { selectRankedSuggestions } from '../state.js';
import { escapeHtml, showStatus } from '../utils/dom.js';

export function mountSuggestionSidebar(root, { onSuggest, onVote, onRemoveSuggestion }) {
  root.innerHTML = `
    <div class="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <h2 id="suggestions-heading" class="font-display text-lg font-bold text-slate-900">Community picks</h2>
      <p class="mt-1 text-sm text-slate-500">Suggest what Gizmoto should drop next and vote for your favorites.</p>

      <form data-role="suggest-form" class="mt-4 flex gap-2">
        <label for="suggestion-input" class="sr-only">Product suggestion</label>
        <input
          id="suggestion-input"
          name="suggestion"
          type="text"
          maxlength="40"
          autocomplete="off"
          placeholder="e.g. Pen Spinner V2"
          class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        <button
          type="submit"
          class="btn-press shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
        >Suggest</button>
      </form>
      <p data-role="status" class="mt-2 min-h-[1.25rem] text-sm" role="status" aria-live="polite"></p>

      <ol data-role="list" class="mt-2 space-y-2" aria-label="Suggestions ranked by votes"></ol>
    </div>
  `;

  const form = root.querySelector('[data-role="suggest-form"]');
  const status = root.querySelector('[data-role="status"]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = onSuggest(form.elements.suggestion.value);
    showStatus(status, result);
    if (result.ok) form.reset();
  });

  root.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-suggestion]');
    if (removeButton) {
      showStatus(status, onRemoveSuggestion(removeButton.dataset.removeSuggestion));
      return;
    }

    const button = event.target.closest('[data-vote-id]');
    if (button) showStatus(status, onVote(button.dataset.voteId));
  });
}

export function renderSuggestionSidebar(root, state) {
  const suggestions = selectRankedSuggestions(state);
  const { votedIds, isAdmin } = state;
  root.querySelector('[data-role="list"]').innerHTML = suggestions.length
    ? suggestions.map((suggestion, index) => suggestionItem(suggestion, index, votedIds.includes(suggestion.id), isAdmin)).join('')
    : '<li class="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">No suggestions yet — be the first!</li>';
}

function suggestionItem(suggestion, index, hasVoted, isAdmin) {
  const isLeader = index === 0 && suggestion.votes > 0;
  const name = escapeHtml(suggestion.name);
  const id = escapeHtml(suggestion.id);
  const voteLabel = suggestion.votes === 1 ? 'vote' : 'votes';

  return `
    <li class="flex gap-3 rounded-xl border px-3 py-2 ${isLeader ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}">
      <span class="w-5 shrink-0 pt-0.5 text-center font-display text-sm font-bold ${isLeader ? 'text-amber-500' : 'text-slate-400'}" aria-hidden="true">${index + 1}</span>
      <div class="min-w-0 flex-1">
        <!-- Name gets the full row width; buttons sit on the row below so they can't squeeze it. -->
        <p class="break-words text-sm font-medium leading-snug text-slate-900">${name}</p>
        <div class="mt-1.5 flex flex-wrap items-center gap-2">
          <p class="mr-auto text-xs text-slate-500">${suggestion.votes} ${voteLabel}${isLeader ? ' · 🔥 Leading' : ''}</p>
          <div class="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-vote-id="${id}"
              data-focus-key="vote-${id}"
              aria-pressed="${hasVoted}"
              aria-label="${hasVoted ? 'Remove your vote for' : 'Vote for'} ${name} (${suggestion.votes} ${voteLabel})"
              title="${hasVoted ? 'Click to remove your vote' : 'Vote'}"
              class="btn-press shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${hasVoted ? 'border-violet-600 bg-violet-600 text-white hover:bg-violet-700' : 'border-violet-200 bg-white text-violet-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white'}"
            >${hasVoted ? '✓ Voted' : '▲ Vote'}</button>
            ${isAdmin ? removeButton(id, name) : ''}
          </div>
        </div>
      </div>
    </li>
  `;
}

/** `id` and `name` arrive already escaped. */
function removeButton(id, name) {
  return `
    <button type="button" data-remove-suggestion="${id}" data-focus-key="remove-suggestion-${id}"
      aria-label="Remove suggestion ${name}" title="Remove suggestion"
      class="btn-press shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300">
      ✕
    </button>
  `;
}
