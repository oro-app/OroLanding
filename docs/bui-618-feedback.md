# Beta feedback entry

`/feedback#token=<invitation>` removes the fragment before app startup and keeps the credential in `oro_feedback_session` in tab session storage. Another invitation replaces the previous session. Malformed links clear it; blocked storage shows recovery guidance. Feedback has no analytics, public sitemap entry, or shared caching.

The Oro Kit page reads invitation status, shows original survey context, and distinguishes pending confirmation, confirmed receipts, invalid/expired links, and retry guidance. It pauses checks while hidden or leaving and honors saved cooldowns when returning or refreshing. Confirmed or terminal responses clear credentials without losing the displayed result; skip-link navigation preserves it. Question controls and submission follow; live API and Google workbook verification depend on BUI-624.

`loadFeedbackForm` provides a read-only bearer client using `VITE_ORO_API_URL` (default `https://api.buildingoro.ca`). It preserves form definitions, validates status/receipt envelopes, rejects insecure destinations and redirects, and returns safe error codes and retry delays. The reader owns polling and session cleanup. Verify its mocked transport contract with `npm run test:feedback`; these tests do not establish live API/CORS readiness.

`createFeedbackReader` owns invitation-scoped scheduling, persisted cooldowns, terminal credential cleanup, and pause/resume/stop controls. Saving checks wait at least 15 seconds; transient failures back off and honor Retry-After. It ignores cancelled or replaced invitations. The page resumes the reader only while visible and stops it on replacement or unmount.

Verify with `npm run build` and `E2E_BASE_URL=<preview-url> npm run e2e`. The feedback privacy spec also runs against local preview; HTTP header checks require Vercel. Use synthetic invitation tokens in tests and screenshots.

`pruneFeedbackDraft(questions, draft)` returns visible questions in backend order and a copied answer draft with hidden/unknown answers and inactive explanation fields removed. Callers must replace their editable draft with the returned answers after a branch change. It preserves raw text and invalid input for correction; it does not validate or serialize a submission. The page does not collect answers yet. Verify the pure rules with `npm run test:feedback`; payload validation and the questionnaire follow separately.
