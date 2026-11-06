# 🏛 Gizmoto Architecture

> Structural setup. Read this together with [PRINCIPLES.md](PRINCIPLES.md) and [MILESTONES.md](MILESTONES.md) before adding files or features.

Gizmoto follows a **Component-Driven State Architecture** with strict **Separation of Concerns**. A single global state object is the source of truth. UI components are decoupled rendering functions that read from it, and only the service layer may change it.

## Core Rules

- **Single Source of Truth:** All UI components read data from `js/state.js`. UI rendering is entirely decoupled from data storage.
- **Encapsulation:** Components never modify data directly. They call functions in `js/services/dataService.js` to trigger state updates.

## Data Flow (one direction only)

```
 user event ──▶ component handler ──▶ dataService action ──▶ setState()
      ▲                                                          │
      └──────────── renderAll() ◀──── subscribe() ◀──────────────┘
```

1. A **component** captures a user event and calls a handler that `app.js` passed in.
2. The handler is a **dataService action**. It validates input, checks permissions, and commits a new immutable state.
3. **`state.js`** notifies subscribers. `app.js` batches the notifications into a single re-render per animation frame.
4. Every **component** re-renders from the new state. Pages never fully reload, and keyboard focus is preserved.

## Layer Responsibilities

| Layer | File(s) | Responsibility | Must **not** |
| --- | --- | --- | --- |
| **Shell** | `index.html` | Static header and empty grid mount points | Contain dynamic content |
| **Coordinator** | `js/app.js` | Registers components, maps UI events to actions, schedules renders | Hold business rules or HTML |
| **State** | `js/state.js` | Frozen state snapshot, `setState` / `subscribe`, category config, selectors | Touch the DOM |
| **Services** | `js/services/dataService.js` | Validation, admin checks, mutations, persistence | Produce HTML |
| **Components** | `js/components/*.js` | Turn state into HTML, report user events | Mutate state |
| **Utilities** | `js/utils/dom.js` | Shared HTML escaping and status-message helpers | Hold app logic |

## Folder Structure

```
/
├── index.html                  # Core skeleton: header + grid mount points
├── README.md                   # Project overview & getting started
├── ARCHITECTURE.md             # Structural setup (this file)
├── PRINCIPLES.md               # Code quality & UI design rules
├── MILESTONES.md               # Roadmap & verification rules
├── css/
│   └── styles.css              # Custom styling overrides (animations, a11y helpers)
└── js/
    ├── app.js                  # Application bootstrapper & coordinator
    ├── state.js                # Single source of truth (data models, selectors)
    ├── services/
    │   └── dataService.js      # State mutations (add, remove, suggest, vote) + persistence
    ├── components/             # Pure UI modules
    │   ├── categoryNav.js      # Left column: category browser
    │   ├── productList.js      # Center: product availability feed
    │   ├── suggestionSidebar.js# Right: Community Picks form + voting scoreboard
    │   └── adminPanel.js       # Admin-only catalog controls
    └── utils/
        └── dom.js              # escapeHtml (XSS-safe templates) + status messages
```

## Data Models

```js
// Product
{ id: 'p-holo-cat', name: 'Holo Cat', category: 'sticker', isAvailable: true }

// Suggestion
{ id: 's-pen-spinner-v2', name: 'Pen Spinner V2', votes: 12, createdAt: 1 }

// Global state
{ isAdmin: false, activeCategory: 'all', products: [...], suggestions: [...] }
```

## 🧩 Extending Gizmoto

### Add a new product category

1. Add one entry to `CATEGORIES` in `js/state.js`:
   ```js
   Object.freeze({ id: 'phone-charm', label: 'Phone Charms', emoji: '📱' }),
   ```
2. *(Optional)* Add a card gradient to `CATEGORY_THEMES` in `js/components/productList.js`.

The nav, product cards, admin form, and validation all pick it up automatically.

### Add a new feature / component

1. Create `js/components/myFeature.js` exporting `render(root, state)` and, if it handles events, `mount(root, handlers)`.
2. Add an empty mount point in `index.html` (for example `<section id="my-feature"></section>`).
3. Register it in the `COMPONENTS` array in `js/app.js`.
4. Put any new state changes in `dataService.js` and expose them through `HANDLERS` in `app.js`.

### Connect a real backend

Replace the `storage` adapter in `js/services/dataService.js` with API calls (and make the actions `async`). Components and `state.js` don't need to change.
