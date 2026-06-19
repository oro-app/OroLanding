# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # Client build → SSR build → SEO prerender (see below)
npm run preview   # Preview the production build locally
```

No lint or typecheck scripts exist — the frontend is plain JSX with no TypeScript. `npm run build` is the only verification step.

`build` is **not** a bare `vite build`. It runs three stages in sequence: (1) the client bundle; (2) an SSR bundle of `src/entry-server.jsx` into `.seo-server/`; (3) `node scripts/generate-seo.mjs`, which imports the SSR `render()` to prerender each public route into its own `dist/<route>/index.html`, enriches the static legal pages' `<head>`, and emits `dist/sitemap.xml` + `dist/llms.txt`. A build can therefore fail in the SSR or SEO stage, not just the client bundle. The runtime is still a client-rendered SPA — the SSR pass is build-time prerendering only (used for SEO/meta/crawlers).

**Lockfile footgun:** both `package-lock.json` (current, used by Vercel + local) and a stale `pnpm-lock.yaml` from an earlier toolchain are checked in. Always use `npm`; running `pnpm install` will diverge the two lockfiles further.

## Architecture

React 18 + Vite + TailwindCSS marketing site for **buildingoro.ca**, plus Vercel serverless functions for waitlist signup, contact form, and newsletter unsubscribes. Client-rendered SPA with a build-time SSR prerender pass for SEO (see Commands).

### Routing (no router library)

There is **no** React Router (or any router) dependency. `App.jsx` does its own routing: `getRouteFromPath(pathname)` maps `window.location.pathname` to a `route.type`, and a chain of ternaries in `App` renders the matching page. Navigation between pages is full-page (`window.location.assign`), not client-side push — only the home sections, the newsletter article view, and the product sub-pages are React. Routes:

| Path | `route.type` | Component |
|---|---|---|
| `/` | `home` | inline home sections (`Hero`, `WhyOro`, `TheFilm`, `FitsByOro`, `Testimonials`, `TheJournal`, `OroInsiders`, `FinalCTA`) |
| `/newsletter/:slug` | `newsletter` | `newsletter/NewsletterPage` |
| `/from-the-closet` | `journal` | `journal/JournalPage` (editorial archive) |
| `/try-oro` | `try-oro` | `try-oro/TryOro` |
| `/how-it-works` | `how-it-works` | `how-it-works/HowItWorks` |
| `/why-oro` | `why-oro` | `why-oro/WhyOro` |
| `/honestly` | `manifesto` | `manifesto/Manifesto` |
| `/contact` | `contact` | `contact/Contact` |

All non-home pages are `React.lazy` + `Suspense` code-split. `vercel.json` redirects the old `/journal` → `/from-the-closet` and `/manifesto` → `/honestly` (permanent).

**Adding/renaming a route touches two files that must stay in sync:** `getRouteFromPath` in `App.jsx` (runtime routing) **and** `ROUTE_SEO` + `PUBLIC_ROUTE_TYPES` in `src/lib/seo.js` (prerender + sitemap + llms.txt). A route missing from `seo.js` won't be prerendered; one missing from `App.jsx` renders the home page at that URL.

### SEO pipeline (`src/lib/seo.js` + `scripts/generate-seo.mjs`)

`src/lib/seo.js` is the single source of truth for per-route titles/descriptions/JSON-LD. `getSeoForRoute()` builds the `<head>` tags and a JSON-LD `@graph` (Organization + WebSite + WebPage + Breadcrumb, plus `SoftwareApplication` on the product pages and `FAQPage` where a route declares `faqs`). `scripts/generate-seo.mjs` consumes it at build time to write per-route HTML, `sitemap.xml`, and `llms.txt` (an LLM-facing site summary built from `src/lib/faqs.js` + recent newsletters). It is also imported by `src/entry-server.jsx`.

### Frontend (src/)

- `App.jsx` — routing (above) + analytics wiring. A global `click` listener tracks outbound/internal link navigations and social-link clicks; `popstate`/`hashchange` re-fire page views. Inits Google Analytics only with cookie consent (`localStorage['oro_cookie_consent'] === 'accepted'`). Wraps the tree in `ThemeProvider`.
- `src/context/ThemeContext.jsx` — dark/light theme provider. Default is dark; persisted to `localStorage['oro_theme']`; toggles `<html data-theme="dark|light">` so the CSS variables in `index.css` flip, and sets `<body>` background to avoid overscroll color flashes.
- `src/components/` — grouped by feature/page: `layout/` (`SiteHeader`, `SiteFooter` — chrome on every route), `overlays/` (`CookieConsent`, `WaitlistModal`), `home/`, `newsletter/`, `journal/`, `try-oro/`, `how-it-works/`, `why-oro/`, `manifesto/`, `contact/`, plus shared `marketing/`, `closet/`. Each component has a co-located `.css` file for layout/animation that's awkward in Tailwind.
- `src/components/overlays/WaitlistModal.jsx` — email signup; POSTs to `api/waitlist`, returns 409 if already registered. Mounted lazily from `App.jsx` (the journal/newsletter mailing-list CTAs); most "try Oro" CTAs instead route to `/try-oro`.
- `src/content/newsletters/*.mdx` — newsletter source. Filename = slug (URL `/newsletter/<filename>`). The `export const meta = {…}` block supplies title/tag/date/image/summary/readTime. **Gating fields the build respects:** only `published === true` entries are prerendered/sitemapped/listed; `comingSoon === true` marks an entry as not-yet-readable (listed but no article prerender). `src/lib/newsletters.js` globs them with `import.meta.glob` for the client; `generate-seo.mjs` re-parses the meta independently at build time.
- `src/lib/` — `analytics.js` (consent-gated `window.gtag` wrapper + event helpers; has a hardcoded fallback GA ID), `seo.js`, `faqs.js`, `newsletters.js`, `links.js`/`siteLinks.js` (external + nav URLs), `stats.js`, `placeholderPhotos.js`.

**Vite alias:** `@newsletter-images` → `src/assets/newsletters` (defined in `vite.config.js`); use this in MDX `meta.image` and component imports rather than relative paths.

### Static legal pages

`/terms`, `/privacy`, `/cookies`, `/google-play` (account-deletion page) are standalone HTML files in `public/`. The Vite dev server rewrites these paths to their `.html` files (custom plugin in `vite.config.js`); Vercel does the same via `vercel.json` rewrites. At build time `generate-seo.mjs` injects SEO `<head>` tags into them in place (head-only, since they aren't React-rendered).

### Vercel build & routing (`vercel.json`)

- `buildCommand` is `npm run build && mkdir -p dist/src && cp -R src/assets dist/src/` — the asset copy step is **load-bearing**: MDX content references images at `/src/assets/...` paths that Vite doesn't emit to `dist/`. Don't drop the copy step or newsletter images 404 in prod.
- SPA fallback: `/((?!api/)(?!.*\\.).*)` → `/index.html`. Per-route prerendered `dist/<route>/index.html` files (from the SEO pipeline) take precedence over the fallback, so crawlers get real meta; anything else lands on the SPA shell.
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
