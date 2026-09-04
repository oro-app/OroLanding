# Newsletter MDX — how to add an issue

Each newsletter is one `.mdx` file in this folder. The **filename is the URL slug**, so
`the-rule-of-three.mdx` is served at `/newsletter/the-rule-of-three`. `src/lib/newsletters.js`
globs every `*.mdx` here, keeps the ones that are `published: true` **and whose `date` has
arrived**, and sorts them by `date` descending for the home carousel and the `/journal`
("from the closet") page.

Source copy comes from the `oro-newsletter` repo's `drafts/NNN-*.md`. Those drafts are
**inline-styled email HTML** — you convert them to clean markdown here.

---

## The 5-step checklist

1. **Create the file.** `slug.mdx` where `slug` is a kebab-case phrase from the title
   (e.g. `you-should-be-an-outfit-repeater`). Filename = URL.
2. **Write the `meta` block** (see fields below). Pull `title`/`tag`/`summary` straight from
   the draft; compute `date` and `readTime`.
3. **Convert the body** to markdown (see conversion rules). Drop the logo header, the
   "Issue 00X" eyebrow, the `<h1>` title (it lives in `meta`), the footer, and the
   `{{UNSUBSCRIBE_URL}}` block.
4. **Add images.** Copy every referenced asset into `public/newsletter-images/` and reference
   it as `/newsletter-images/<name>` — **never `/static/...`** (see the image trap below).
5. **Verify:** `npm run build` (the only real check — catches MDX errors) and eyeball it on
   `npm run dev` at `/journal` and `/newsletter/<slug>`.

There's no "featured" flag to set: `/journal` always features the **latest released letter**
automatically (top of the date-sorted list).

---

## Scheduling & visibility

- Set `date` to the issue's send date. An issue **only appears once its date has arrived** —
  future-dated issues are hidden from the carousel, the rack, and the featured slot until then.
  So you can write issues ahead of time and they auto-release on schedule.
- The newsletter ships **Tuesdays and Saturdays**. Order issues by that cadence and skip the
  slot for any issue that never shipped (don't leave a gap).
- `published: false` hides an issue **completely and permanently** (ignores the date) — use it
  for posts that announce a product feature that hasn't shipped yet (e.g. a version update that
  should never auto-appear). This is different from a future `date`, which is just "not yet."

---

## `meta` fields

```mdx
export const meta = {
  published: true,                 // false = hidden everywhere, ignores date (unshipped product posts)
  title: 'The rule of three.',     // from the draft's <h1>; double-quote it if it contains an apostrophe
  italicTitle: 'three.',           // OPTIONAL — a substring of title rendered in italic on /journal
  tag: 'From the Closet · Issue 008',  // from the draft's eyebrow line
  date: '2026-05-26',              // YYYY-MM-DD; cadence is Tuesdays & Saturdays; gates visibility (above)
  readTime: '3 min',               // ~200 words/min, rounded
  image: '/newsletter-images/breakfast-at-tiffanys.webp',  // card art; omit -> /oro-logo.webp fallback
  summary: "One line — the draft's preheader.",
}

Body in plain markdown starts here, after a blank line.
```

## Body conversion rules (email HTML → markdown)

| Draft (email HTML) | MDX (markdown) |
|---|---|
| `<h2 style="…">Heading</h2>` | `## Heading` |
| `<blockquote style="…">…</blockquote>` | `> …` |
| `<hr style="…">` | `---` (with a blank line above and below) |
| `<strong>` / `<b>` | `**bold**` |
| `<em>` / `<i>` | `_italic_` |
| `<img src="https://buildingoro.ca/static/newsletter-images/x.webp" alt="…">` | `![alt](/newsletter-images/x.webp)` |
| image caption `<p style="…italic">Still from…</p>` | `_Still from…_` on the next line |
| logo header / "Issue 00X" eyebrow / `<h1>` / footer / `{{UNSUBSCRIBE_URL}}` | **delete** |
| sign-off | `_- Oro_` |

Plain markdown is valid MDX. Avoid a literal `<` followed by a letter (MDX reads it as JSX)
and literal `{` (read as an expression). `°`, `€`, `+`, em-dashes are all fine.

## The image trap (this is the one that bites)

`vite.config.js` **proxies `/static/*` to the backend in dev**, so any `/static/newsletter-images/…`
path 404s locally even though the file exists in `public/`. Always:

1. Copy the asset into `public/newsletter-images/` (not just `public/static/newsletter-images/`).
2. Reference it as `/newsletter-images/<name>` in both `meta.image` and the body.

This path is unproxied, served straight from `public/`, and works in dev **and** prod. Every
already-live newsletter uses it.
