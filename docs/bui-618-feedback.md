# Beta feedback entry

`/feedback#token=<invitation>` removes the fragment before app startup and keeps the credential in `oro_feedback_session` in tab session storage. Another invitation replaces the previous session. Malformed links clear it; blocked storage shows recovery guidance. Feedback has no analytics, public sitemap entry, or shared caching.

This first BUI-618 slice shows missing-link/unavailable states using Oro Kit. It does not validate tokens or collect answers. Backend-driven questions and immutable submission/recovery follow; live API and Google workbook verification depend on BUI-624.

`loadFeedbackForm` provides a read-only bearer client using `VITE_ORO_API_URL` (default `https://api.buildingoro.ca`). It preserves form definitions, validates status/receipt envelopes, rejects insecure destinations and redirects, and returns safe error codes and retry delays. It never stores data or retries automatically; the page integration will own polling and session cleanup. Verify its mocked transport contract with `npm run test:feedback`; these tests do not establish live API/CORS readiness.

Verify with `npm run build` and `E2E_BASE_URL=<preview-url> npm run e2e`. The feedback privacy spec also runs against local preview; HTTP header checks require Vercel. Use synthetic invitation tokens in tests and screenshots.
