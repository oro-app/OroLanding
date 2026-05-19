# Newsletter MDX

Add newsletter files here as `.mdx`. The filename becomes the URL slug, so
`may-update.mdx` is available at `/newsletter/may-update`.

Each file should export a `meta` object before the markdown:

```mdx
export const meta = {
  published: true,
  title: 'May Update',
  tag: 'Oro Insiders · Issue 00X',
  date: '2026-05-03',
  image: '/newsletter-images/may-update.webp',
  summary: 'One sentence that appears in the homepage carousel.',
}

Write the full newsletter body here with normal markdown.
```

Body must be valid MDX — plain markdown only. Do **not** paste the
raw inline-styled email HTML from the `oro-newsletter` drafts (string
`style="..."`, `<!-- comments -->`, `</br>` all break the MDX build).

Photo assets live in `public/newsletter-images/` and are referenced
as `/newsletter-images/<name>.webp`. Shared illustrations in
`public/static/` are referenced as `/static/<name>.png`. The card
fallback when `image` is omitted is `/static/oro-logo.png`.
