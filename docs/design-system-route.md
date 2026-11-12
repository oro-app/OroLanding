# Design system route

[Oro’s design system](https://www.askoro.now/design-system) is a standalone site built from the `oro-app/oro-kit` repository. The landing build extracts `vendor/oro-design-system.tar.gz` into `dist/design-system/` after its own pages are built. Vercel serves the docs at `/design-system` and `/design-system/`. The path is unlisted in navigation and the sitemap and carries `X-Robots-Tag: noindex`.

To update it, run `pnpm docs:build --base=/design-system/` from `oro-kit`. Archive the contents of `site/dist/`, keeping `index.html` at the archive root, and replace `vendor/oro-design-system.tar.gz` in this repo. The standalone host’s `_headers` file can be omitted because Vercel reads the header rule in `vercel.json`.

The current archive was built from `oro-kit` commit `e295dc71f2c14160d60111e77cb5d13add823f7c`. Its SHA-256 is `b109008e2cfcc68398fcca1cc5619a5a45cf33f33101d66aea401a6b3056aa39`. Update these references when replacing the archive.

Run `npm ci`, `npm run build`, and `npm run preview` here, then open `/design-system/`. Verify the design system title, the brand kit ZIP, and the reference downloads. On a Vercel preview, also check the `noindex` response header and confirm an unknown child path returns 404.
