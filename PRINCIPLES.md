# 📐 Gizmoto Principles

> Code quality and UI design rules. Read this together with [ARCHITECTURE.md](ARCHITECTURE.md) and [MILESTONES.md](MILESTONES.md) before adding files or features.

## Code Quality

- **DRY (Don't Repeat Yourself):** Shared utilities and layouts are modularized (for example, `js/utils/dom.js`) instead of copied between files.
- **SRP (Single Responsibility Principle):** Each component or service file has exactly one reason to change.
- **Strict Separation:** No raw application logic or data arrays inside UI presentation strings. Templates only interpolate values read from state.

### Coding Conventions

- **Never** call `setState()` outside `js/services/`.
- **Always** pass user-provided text through `escapeHtml()` before interpolating it into a template.
- Service actions return `{ ok: true, message }` or `{ ok: false, error }`. They never throw for validation failures.
- Store derived data such as sorting and filtering as **selectors** in `state.js`, not as duplicated state.

## UI & Layout

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

- **Left column (1):** category browser. Below it, the admin panel appears only for admins.
- **Center (2 columns):** product availability feed.
- **Right column (1):** Community Picks suggestion form and live-voting scoreboard. Text is full-width and **never truncated or cut off**: long names wrap, and the sidebar is set apart with a border and spacing.
