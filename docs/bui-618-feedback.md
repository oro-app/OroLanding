# Beta feedback

`/feedback#token=<invitation>` removes the fragment before app startup and keeps the credential in `oro_feedback_session` in tab session storage. Another invitation replaces the previous session. Malformed links clear it; blocked storage shows recovery guidance. Feedback has no analytics, public sitemap entry, or shared caching.

The Oro Kit page renders task, daily, and end-of-beta questions from the API, one question per step with Back/Continue and a final review. It preserves backend wording, option IDs/order, requiredness, helpers, and explicit score metadata. Only a validated receipt produces thanks. Live API and Google workbook verification depend on BUI-624.

`loadFeedbackForm` and `saveFeedback` use `VITE_ORO_API_URL` (default `https://api.buildingoro.ca`) with HTTPS bearer authorization, no caching/cookies/referrers, and rejected redirects. The client validates question definitions and status/receipt envelopes, exposes safe errors, and respects Retry-After. It submits choice IDs, not labels or scores. Text is trimmed at submission, limited to 2,000 Unicode code points, and the complete UTF-8 JSON body is limited to 64 KiB.

`createFeedbackReader` owns invitation-scoped scheduling, persisted cooldowns, terminal credential cleanup, and pause/resume/stop controls. Saving checks wait at least 15 seconds; transient failures back off and honor Retry-After. It ignores cancelled or replaced invitations. The page resumes the reader only while visible and stops it on replacement or unmount.

Verify with `npm run build` and `E2E_BASE_URL=<preview-url> npm run e2e`. The feedback privacy spec also runs against local preview; HTTP header checks require Vercel. Use synthetic invitation tokens in tests and screenshots.

`pruneFeedbackDraft(questions, draft)` returns visible questions in backend order and a copied answer draft with hidden/unknown answers and inactive explanation fields removed. The form replaces its editable draft with that result after each change. Raw text remains unchanged while typing. `prepareFeedbackAnswers` validates visible answers, omits optional blanks, requires an explanation for Other, and sorts checklist IDs without changing display order. An invalid optional comment cannot hide its question's follow-up.

`createFeedbackFlow` keeps drafts and the current step in the invitation's tab session, scoped to invitation ID and survey version. Before PUT it persists one UUID and an exact JSON body, then locks editing. HTTP 202 stays pending and only polls; HTTP 200 must contain a matching receipt. An uncertain response survives refresh, reconciles through GET, and offers only an identical retry when the backend reports open. A fresh tab finding saving only polls. Definite validation/size rejections allow correction; a version mismatch reloads questions and requires fresh answers. Conflicts reconcile without generating a replacement UUID. Changing invitations, completing, or receiving a terminal credential error clears private state. Storage failures stop further writes.

## Testing links

- UI demo after merge/deployment: `https://www.askoro.now/feedback?demo=daily`. Navigation also offers Task with outfit, Task without outfit, and End of beta.
- Real collection: `https://www.askoro.now/feedback#token=<internal-invitation-token>`. The bare `/feedback` route asks for the personal invitation.

The demo reuses the questionnaire and validation components with in-memory sample data. It never calls the feedback API, stores entered answers, or changes an existing invitation draft. It says explicitly that nothing is saved or sent. `demoForms.json` mirrors the approved definitions at backend commit `afd525f4ad57a32198ae348631b8c4b2dc3a8371`; update it when the approved contract changes. Live task visibility always comes from returned questions, not a frontend outfit guess.

At implementation verification, backend PRs #425/#427/#428/#429 remained open and live API GET/preflights from the canonical site were rejected by Cloudflare without CORS headers. A frontend merge alone does not make real invitations usable. BUI-624 owns deployed API/CORS, exposed Retry-After, approved TEST destinations, internal invitation issuance, worker/Google confirmation, and task enablement. Do not enable production collection or send invitations from this frontend workflow.

Run `npm run test:feedback`, `npm run test:beta`, and `npm run build`, then run the three `e2e/feedback-*.spec.js` files against a production preview. Browser fixtures mock every feedback submission. Coverage includes all survey types, conditional/Other answers, keyboard focus, narrow layouts, private entry, refresh/replacement, validation rejection, lost PUT recovery, accepted polling, and demo isolation. Deployed browser checks establish page behavior and private headers; the internal live GET/PUT/Google rehearsal remains a separate BUI-624 prerequisite.
