# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # Production build (output → dist/)
npm run preview   # Preview the production build locally
```

No lint or typecheck scripts exist — the frontend is plain JSX with no TypeScript. `npm run build` is the only verification step.

**Lockfile footgun:** both `package-lock.json` (current, used by Vercel + local) and a stale `pnpm-lock.yaml` from an earlier toolchain are checked in. Always use `npm`; running `pnpm install` will diverge the two lockfiles further.

## Architecture

Single-page React 18 + Vite + TailwindCSS landing site for **buildingoro.ca**, plus Vercel serverless functions for waitlist signup, contact form, and newsletter unsubscribes.

### Frontend (src/)

- `App.jsx` — root router; chooses between the home view and `/newsletter/:slug`. Conditionally inits Google Analytics based on cookie consent stored in `localStorage` (`oro_cookie_consent`). Wraps the tree in `ThemeProvider`.
- `src/context/ThemeContext.jsx` — dark/light theme provider. Default is dark; persisted to `localStorage['oro_theme']`; toggles `<html data-theme="dark|light">` so the CSS variables in `index.css` flip, and sets `<body>` background to avoid overscroll color flashes.
- `src/components/layout/` — chrome rendered on every route: `SiteHeader.jsx`, `SiteFooter.jsx`.
- `src/components/overlays/` — global floating UI: `CookieConsent.jsx` (GDPR banner; calls `setAnalyticsConsent()` from `src/lib/analytics.js`) and `WaitlistModal.jsx` (email signup; POSTs to `api/waitlist`, returns 409 if already registered).
- `src/components/home/` — sections only used on `/`: `IntroSection.jsx` (nav, hero headline, waitlist CTA — opens `WaitlistModal` when clicked or when `window.location.hash` contains `access_token` from a Supabase magic-link redirect) and `NewsletterSection.jsx` (carousel of newsletter cards).
- `src/components/newsletter/` — only used on `/newsletter/:slug`: `NewsletterPage.jsx` (article view — hero, MDX body, end-of-article CTA) and `NewsletterRecommendations.jsx` (sticky sidebar with the 3 most recent other newsletters).
- `src/content/newsletters/*.mdx` — newsletter source. Each file's filename is its slug (URL becomes `/newsletter/<filename>`); the `export const meta = {…}` block supplies title, tag, date, image, and summary, all rendered by `NewsletterPage`. `src/lib/newsletters.js` globs them with `import.meta.glob` and sorts by date descending.
- `src/lib/analytics.js` — thin wrapper around `window.gtag`; consent-gated; reads `VITE_GA_MEASUREMENT_ID`.

Each component has a co-located `.css` file for layout/animation styles that can't easily be done with Tailwind.

**Vite alias:** `@newsletter-images` → `src/assets/newsletters` (defined in `vite.config.js`); use this in MDX `meta.image` and component imports rather than relative paths.

### Static legal pages

`/terms`, `/privacy`, `/cookies` are standalone HTML files served from `public/`. Vite dev server rewrites these paths (via a custom plugin in `vite.config.js`); Vercel handles the same rewrites via `vercel.json`.

### Vercel build & routing (`vercel.json`)

- `buildCommand` is `npm run build && mkdir -p dist/src && cp -R src/assets dist/src/` — the asset copy step is **load-bearing**: MDX content references images at `/src/assets/...` paths that Vite doesn't emit to `dist/`. Don't drop the copy step or newsletter images 404 in prod.
- SPA fallback: `/((?!api/)(?!.*\\.).*)` → `/index.html` so client-side routes (`/newsletter/:slug` and renamed redirects like `/from-the-closet`, `/honestly`) resolve to React Router.
- Long cache headers on `/src/assets/*`, `/static/*`, and `/assets/*`.

### API (api/) — Vercel Serverless Functions

- `api/waitlist.js` — `POST`; inserts email + consent into Supabase `waitlist` table; optionally forwards to `GOOGLE_SHEETS_WEBHOOK_URL` if set.
- `api/contact.js` — `POST`; validates name/email/topic/message (topic must be one of `hello`/`support`/`press`/`partnership`/`careers`/`feedback`, defaults to `hello`), then does **two independent delivery paths**: inserts into Supabase `contact_messages` *and* sends a notification email via Resend. Returns 201 if either succeeded, 500 only if both failed (so the form shows its mailto fallback).
- `api/unsubscribe.ts` — `GET` (renders confirmation HTML) and `POST` (one-click unsubscribe for email clients). Verifies an HMAC-signed token, then updates `unsubscribed_at` in Supabase `waitlist` table.
- `api/_lib/unsubscribe-token.ts` — signs and verifies tokens using `crypto.createHmac('sha256', secret)` with timing-safe comparison. Token format: `base64url(email).timestamp.hmac_hex`.

The API has no frontend bundling — it runs as Node.js on Vercel's serverless runtime via `@vercel/node`.

## Environment variables

Frontend env vars must be prefixed `VITE_` to be exposed to the browser bundle.

| Variable | Where used | Notes |
|---|---|---|
| `VITE_GA_MEASUREMENT_ID` | `src/lib/analytics.js` | Google Analytics 4 measurement ID |
| `SUPABASE_URL` | `api/waitlist.js`, `api/contact.js`, `api/unsubscribe.ts` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | same as above | Service role key (not anon) — server-side only |
| `UNSUBSCRIBE_SECRET` | `api/unsubscribe.ts` | HMAC secret — **must match** `UNSUBSCRIBE_SECRET` in `oro-newsletter/.env.local` |
| `GOOGLE_SHEETS_WEBHOOK_URL` | `api/waitlist.js` | Optional — forwards signups to a Google Sheets webhook |
| `RESEND_API_KEY` | `api/contact.js` | Same Resend key/domain as `oro-newsletter` (buildingoro.ca is verified). If unset, contact-form emails are skipped silently and only the Supabase insert path runs. |
| `CONTACT_TO_EMAIL` | `api/contact.js` | Optional — defaults to `admin@buildingoro.ca` |
| `CONTACT_FROM_EMAIL` | `api/contact.js` | Optional — defaults to `Oro Contact <admin@buildingoro.ca>` |
| `VITE_BACKEND_URL` | `vite.config.js` | Dev-only proxy target for `/api` + `/static`. Defaults to `https://oro-kmuj.onrender.com` (the central backend). |
