# NORRA — Multiplatform Digital Marketing Campaign for a Fashion Brand

Static, frontend-only academic mini project. HTML + CSS + Vanilla JS only — no build step, no backend.

## Run it
Just open `index.html` in a browser, or deploy the folder as-is to GitHub Pages / Netlify / Vercel (static hosting).

## What's inside
- `index.html` — single-page app shell (all "pages" are sections toggled by JS, routed via the URL hash: `#shop`, `#product?id=p1`, `#campaign`, `#admin`, etc.)
- `style.css` — full responsive design system (mobile-first, 320px → large desktop)
- `script.js` — all logic: 26 demo products, shop filters/sort/search, product detail, cart, favourites, checkout + order placement, reviews, the 5-platform digital campaign strategy + demo analytics (SVG charts), and a demo admin dashboard

## Data persistence
Everything (cart, favourites, orders, reviews, customer profile, admin product edits, contact/newsletter submissions) is saved to `localStorage`, so it survives a page refresh. It's per-browser, not a real database.

## Demo admin login
Go to the "Admin" link in the footer or mobile menu (`#admin-login`).
- Username: `admin`
- Password: `norra123`

This is a frontend-only demo login for the academic project — there is no real authentication or backend behind it.

## Notes for the write-up
- Product images use `picsum.photos` (deterministic seeded placeholders) so links never break.
- Coupon codes to try in the cart: `NORRA10` (10% off), `WELCOME15` (15% off).
- Payment methods (UPI / Card / COD) are UI-only — no real payment processing occurs, as required for a static academic project.
