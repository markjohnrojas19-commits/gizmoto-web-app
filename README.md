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

## 📚 Project Documentation

The project specification is split into three files. Read all three before adding files or features.

| File | Covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Structural setup: data flow, layer responsibilities, folder structure, data models, and how to extend the app |
| [PRINCIPLES.md](PRINCIPLES.md) | Code quality rules (DRY, SRP, strict separation), coding conventions, and the 4-column UI layout |
| [MILESTONES.md](MILESTONES.md) | Roadmap and each milestone's Double-Check Verification Rule |

---

## 🔐 Security Notes

- Admin mode is a **simulated, client-side flag** for development. Anyone can add `?admin=true` to the URL, so it must be replaced with server-side authentication before real inventory is managed online.
- All user-submitted text is HTML-escaped before rendering to prevent XSS.

---

<p align="center"><strong>Gizmoto</strong>: built by students, for students. 🖊️✨🔑</p>
