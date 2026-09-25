# Beta feedback entry

`/feedback#token=<invitation>` removes the fragment before app startup and keeps the credential in `oro_feedback_session` in tab session storage. Another invitation replaces the previous session. Malformed links clear it; blocked storage shows recovery guidance. Feedback has no analytics, public sitemap entry, or shared caching.

This first BUI-618 slice shows missing-link/unavailable states using Oro Kit. It does not validate tokens or collect answers. Backend-driven questions and immutable submission/recovery follow; live API and Google workbook verification depend on BUI-624.

Verify with `npm run build` and `E2E_BASE_URL=<preview-url> npm run e2e`. The feedback privacy spec also runs against local preview; HTTP header checks require Vercel. Use synthetic invitation tokens in tests and screenshots.
