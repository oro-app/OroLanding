# Newsletter MDX

Add newsletter files here as `.mdx`. The filename becomes the URL slug, so
`may-update.mdx` is available at `/newsletter/may-update`.

Each file should export a `meta` object before the markdown:

```mdx
export const meta = {
  title: 'May Update',
  date: '2026-05-03',
  image: '/static/newsletters/may-update.jpg',
  summary: 'One sentence that appears in the homepage carousel.',
}

Write the full newsletter body here with normal markdown.
```

Images should live in `public/static/newsletters/` or another public path.
