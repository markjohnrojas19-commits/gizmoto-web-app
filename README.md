# Gizmoto

> **Trendy accessories for students — stickers today, keychains & pen spinners next.**

Gizmoto is a lightweight storefront and community-voting web app for student desk accessories. It launches with a sticker availability feed and is structured from day one to grow into keychains, pen spinners, and beyond — without rewriting existing logic.

---

## 📖 Origin Story

Gizmoto started with my niece, who designed custom stickers and sold out her entire stock to local students. That demand proved there was a real market, and this project exists to scale it: a clean, fast web app where students can see what's in stock and vote on what should drop next.

---

## ✨ Features

| Feature | Who | Description |
| --- | --- | --- |
| **Category browser** | Everyone | Filter the catalog by category, with live item counts. |
| **Product availability feed** | Everyone | Product cards with *In stock* / *Sold out* status; in-stock items listed first. |
| **Community Picks** | Everyone | Suggest a new product and vote on others. The list re-sorts by vote count instantly. |
| **Catalog management** | Admin | Add new items or remove existing ones from the catalog. |
| **Persistence** | — | Data is saved to `localStorage` (a simulated backend) and survives page reloads. |

---

## 🛠 Tech Stack

- **HTML5**: semantic markup and accessible landmarks
- **Tailwind CSS**: utility-first styling via the Play CDN (pinned to `3.4.16`)
- **Vanilla JavaScript (ES6+ modules)**: no framework and no build step

---

## 🚀 Getting Started

ES modules can't be loaded from `file://`, so serve the folder over HTTP:

```bash
git clone https://github.com/markjohnrojas19-commits/gizmoto-web-app.git
cd gizmoto-web-app

# Pick one:
python -m http.server 5173
npx serve .
```

Then open:

- **Shopper view:** <http://localhost:5173>
- **Admin view:** <http://localhost:5173/?admin=true>

> ⚠️ The `?admin=true` flag is a **client-side demo switch, not security**. Real access control must be enforced by a server before production.

To reset to the seed data, run `localStorage.removeItem('gizmoto:data:v1')` in the browser console and reload.

---

## 🏛 Architecture

Gizmoto follows a **Component-Driven State Architecture** with strict **Separation of Concerns**. A single global state object is the source of truth. UI components are decoupled rendering functions that read from it, and only the service layer may change it.

### Data Flow (one direction only)

```
 user event ──▶ component handler ──▶ dataService action ──▶ setState()
      ▲                                                          │
      └──────────── renderAll() ◀──── subscribe() ◀──────────────┘
```

1. A **component** captures a user event and calls a handler that `app.js` passed in.
2. The handler is a **dataService action**. It validates input, checks permissions, and commits a new immutable state.
3. **`state.js`** notifies subscribers. `app.js` batches the notifications into a single re-render per animation frame.
4. Every **component** re-renders from the new state. Pages never fully reload, and keyboard focus is preserved.

### Layer Responsibilities

| Layer | File(s) | Responsibility | Must **not** |
| --- | --- | --- | --- |
| **Shell** | `index.html` | Static header and empty grid mount points | Contain dynamic content |
| **Coordinator** | `js/app.js` | Registers components, maps UI events to actions, schedules renders | Hold business rules or HTML |
| **State** | `js/state.js` | Frozen state snapshot, `setState` / `subscribe`, category config, selectors | Touch the DOM |
| **Services** | `js/services/dataService.js` | Validation, admin checks, mutations, persistence | Produce HTML |
| **Components** | `js/components/*.js` | Turn state into HTML, report user events | Mutate state |
| **Utilities** | `js/utils/dom.js` | Shared HTML escaping and status-message helpers | Hold app logic |

### Folder Structure

```
/
├── index.html                  # Core skeleton: header + grid mount points
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

### Data Models

```js
// Product
{ id: 'p-holo-cat', name: 'Holo Cat', category: 'sticker', isAvailable: true }

// Suggestion
{ id: 's-pen-spinner-v2', name: 'Pen Spinner V2', votes: 12, createdAt: 1 }

// Global state
{ isAdmin: false, activeCategory: 'all', products: [...], suggestions: [...] }
```

---

## 📐 UI & Layout Architecture

A balanced **4-column CSS grid** on desktop (`grid-cols-1 lg:grid-cols-4`) that stacks into a single column on mobile.

```
┌──────────────────────────────────────────────────────────────────┐
│                         Header: Gizmoto                          │
├───────────────┬────────────────────────────────┬─────────────────┤
│  Category     │                                │ Community Picks │
│  Browser      │    Product Availability Feed   │  • Suggest form │
│  (col-span-1) │         (col-span-2)           │  • Live voting  │
│               │                                │   scoreboard    │
│  Admin Panel  │                                │  (col-span-1)   │
│  (admin only) │                                │                 │
└───────────────┴────────────────────────────────┴─────────────────┘
```

- **Left column:** category browser. Below it, the admin panel appears only for admins.
- **Center (2 columns):** product availability feed.
- **Right column:** Community Picks suggestion form and live-voting scoreboard. Full names wrap instead of being cut off, and the sidebar is set apart with a border and spacing.

---

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

### Coding conventions

- **Never** call `setState()` outside `js/services/`.
- **Always** pass user-provided text through `escapeHtml()` before interpolating it into a template.
- Service actions return `{ ok: true, message }` or `{ ok: false, error }`. They never throw for validation failures.
- Store derived data such as sorting and filtering as **selectors** in `state.js`, not as duplicated state.

---

## 🗺 Roadmap & Milestones

Every milestone has a **Double-Check Verification Rule**. A milestone is only checked off once its rule has been tested and passes, with no regressions in earlier milestones.

- [x] **Milestone 0: Branding & Context Initialization**
  - Defined the Gizmoto brand, tagline, and student-focused market.
  - 🔍 **Double-Check Verification Rule:** Confirm the brand strategy accounts for expansion past stickers (keychains, pen spinners), as reflected in the `CATEGORIES` config.

- [x] **Milestone 0.5: Codebase Repository Synchronization**
  - Initialized the Git repository with the structured directory system and pushed it to GitHub.
  - 🔍 **Double-Check Verification Rule:** Confirm the GitHub repo is live and initialized with the structured directory system shown above.

- [x] **Milestone 1: Rigid Balanced 4-Column Layout Setup**
  - `grid-cols-1 lg:grid-cols-4` with a 1 / 2 / 1 column split, and sidebar names that wrap.
  - 🔍 **Double-Check Verification Rule:** Verify on a widescreen display that right-sidebar text does not cut off, and that the layout scales down cleanly to a single stacked column on mobile.

- [x] **Milestone 2: Extensible State Mechanism Configuration**
  - Frozen state store with `getState` / `setState` / `subscribe`, plus selectors and a category registry.
  - 🔍 **Double-Check Verification Rule:** Verify state variables are fully isolated and that mutations happen only through the unified actions in `dataService.js` (searching for `setState(` should find it only in `state.js` and `js/services/`).

- [ ] **Milestone 3: Modular UI Component Rendering Lifecycle**
  - *Status: implemented. Pending verification.*
  - 🔍 **Double-Check Verification Rule:** Confirm HTML strings are completely separated from state data (templates exist only in `js/components/`) and that the UI re-renders dynamically without a full-page reload.

- [ ] **Milestone 4: Event-driven Student Request & Voting Engines**
  - *Status: implemented. Pending verification.*
  - 🔍 **Double-Check Verification Rule:** Ensure that submitting a new suggestion or voting re-sorts the list by highest vote count on the fly, without erasing text typed in other inputs.

- [ ] **Milestone 5: Role-based Protected Inventory Controls (Admin Panel)**
  - *Status: implemented. Pending verification.*
  - 🔍 **Double-Check Verification Rule:** Load the app without `?admin=true` (so `isAdmin` is `false`) and confirm all Add/Remove controls are completely gone from the page, not just hidden visually. Also confirm that calling `addProduct` / `removeProduct` directly is refused by the service layer.

- [ ] **Milestone 6: Performance Optimization & State Freeze**
  - *Status: state snapshots are frozen and renders are batched per frame. Pending verification.*
  - 🔍 **Double-Check Verification Rule:** Check the browser console to confirm zero uncaught runtime errors during intense add/remove and voting cycles.

- [ ] **Milestone 7: Production Environmental Masking (`.gitignore` & secrets)**
  - 🔍 **Double-Check Verification Rule:** Ensure local environment configuration templates (for example `.env.example`) are set up, and that real environment files are excluded from public tracking by `.gitignore`.

- [ ] **Milestone 8: Seamless Cloud Ecosystem Deployment**
  - 🔍 **Double-Check Verification Rule:** Confirm the live web URL loads successfully and keeps full state responsiveness (filtering, suggesting, voting) on public networks.

---

## 🔐 Security Notes

- Admin mode is a **simulated, client-side flag** for development. Anyone can add `?admin=true` to the URL, so it must be replaced with server-side authentication before real inventory is managed online.
- All user-submitted text is HTML-escaped before rendering to prevent XSS.

---

<p align="center"><strong>Gizmoto</strong>: built by students, for students. 🖊️✨🔑</p>
