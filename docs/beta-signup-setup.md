# Archived beta invite writer

The website no longer offers beta signup or onboarding forms. The `/beta`, campaign, and `/invite` pages hand visitors directly to Messages or a QR code, and the former `/api/beta-request` web endpoint is not deployed. The Apps Script and its contract remain in this repository to preserve the existing response Sheet, signup counts, tester referral lookups, and historical verification coverage. The instructions below document the retired writer and must not be used to reopen browser intake.

No Google Form is required. No Google credentials, Sheet ID, or writer secret belong in browser code. This flow does not create accounts, approve testers, send confirmation emails, add contacts to the newsletter, or start conversations. Questions go to sunny@buildingoro.ca.

## 1. Create the Google destination

Use a team-owned Google account that will remain available through the beta. Create a **private Sheet** and a **standalone Apps Script project**, with separate test and production projects/Sheets. Do not use two independent writer projects for the same response Sheet: their locks do not coordinate.

Give these six team members access to review the Sheet: sunny@buildingoro.ca, patrick@buildingoro.ca, angela@buildingoro.ca, arav@buildingoro.ca, admin@buildingoro.ca, and w5alam@uwaterloo.ca. Keep general access **Restricted**, not “anyone with the link.” Grant Apps Script editor access only to the operators managing deployment and secrets. Team reviewers do not need access to the script or its properties.

Build the writer from the checked-out PR:

```sh
npm ci
npm run build:beta-script
```

In the Apps Script editor, copy the generated `integrations/beta-signup/dist/Code.gs` and `BetaContract.gs` into matching script files. Show the manifest in Project Settings and replace `appsscript.json` with the generated manifest. Do not paste the source `Code.js` alone: `BetaContract.gs` contains the same field and phone validation used by the website.

The manifest enables the **Google Sheets v4 advanced service**. If using a standard Google Cloud project, also enable its Google Sheets API. See [Google's advanced service setup](https://developers.google.com/apps-script/guides/services/advanced).

Add these **Script Properties** under Project Settings:

| Property | Value |
| --- | --- |
| `BETA_SHEET_ID` | The ID from the private Sheet URL |
| `BETA_COHORT` | Exact cohort chosen for backend onboarding, e.g. `2026-09-26`; use the same value in Google, Vercel, and the backend |
| `BETA_SUBMISSION_SECRET` | A new random secret, at least 32 characters; use the same value in the website's server environment |

Generate the secret with a password manager. Never put it in Git, a ticket, a screenshot, or a `VITE_` variable.

Run `setupResponseSheet` from the editor and authorize the requested Sheets access. It creates a new `Responses` tab or upgrades an existing one to the current headers. It preserves existing responses and refuses unexpected headers. Protect this tab so only the script owner can edit it. Give reviewers their own `Review` tab, keyed by `request_id`, for notes and selections. Keep raw rows and headers intact; use filter views rather than moving cells independently.

For the existing production Sheet, back it up, then run `setupResponseSheet` **before** deploying the campaign-enabled writer. The same function adds any missing referral columns and backfills referral codes, then adds `campaign_source` with `unknown` for historical rows whose acquisition link cannot be recovered. Keep `BETA_SUBMISSION_SECRET` set while backfilling. Deploy the matching Apps Script and website versions together; a missing column causes the writer to refuse submissions.

Setup also imports earlier signups from `Responses backup`, matching columns by name and preserving their original signup dates and consents. The backup stays unchanged. Each phone occupies one place in the queue; repeated setup is safe, and incomplete historical rows stop the import for review. Test and production Sheets remain separate.

Use links to `/beta?src=reddit-12` or `/beta?src=poster-job`. For Instagram, X, and LinkedIn, use `ig-`, `x-`, or `linkedin-` followed by a lowercase creator or account name, such as `ig-carmen`, `x-patrick`, `linkedin-arav`, or `ig-creator-name`, `x-creator-name`, or `linkedin-creator-name`. Reddit IDs are positive post numbers; poster types and creator names use lowercase letters, numbers, and hyphens. Give each placement its own stable tag. The first valid campaign source stays with an unfinished beta draft; untagged and invalid links save as `direct`. The form's `source` answer remains self-reported, and `ref` continues to track referrals independently. For campaign counts, count distinct phones by `campaign_source` using each phone's earliest response row so repeat requests do not inflate a channel.

Deploy a **Web app**, execute as the deploying account, with access **Anyone**. The endpoint must accept server calls without an interactive Google sign-in; the dedicated secret authorizes writes. The Sheet itself remains private. The endpoint offers no response-reading API. Copy the deployed `/exec` URL, not `/dev`. See [Google web app deployment](https://developers.google.com/apps-script/guides/web).

On later code changes, rebuild both script files and update the existing deployment to a new version. Keep the same project, Sheet, and response keys. Updating editor code alone does not update the deployed `/exec` version.

The home page reads the number of distinct signup phone numbers through `GET /api/beta-count`. This server endpoint asks the same Apps Script deployment for a count with the server-side secret; it never exposes the Sheet or secret to the browser. Redeploy the Apps Script version containing the count action before deploying the updated website. The page only shows the count when the read succeeds and there are more than 100 people.

Valid campaign and referral tags are retained in session storage across landing-page navigation, then cleared after a confirmed signup or lookup. The first valid source stays with an unfinished session; a newly opened valid referral link replaces an older invitation. Direct tagged signup links also work when storage is blocked.

## 2. Configure the website and rate limit

In the OroLanding Vercel project, configure the server environment for the intended deployment scope. Start with Preview pointing to the **test** Google project. Keep Production disabled until the rehearsal passes.

| Variable | Value |
| --- | --- |
| `BETA_SIGNUP_ENABLED` | `false` until ready; `true` opens requests when the other settings are valid |
| `BETA_APPS_SCRIPT_URL` | The dedicated `https://script.google.com/macros/s/.../exec` URL |
| `BETA_SUBMISSION_SECRET` | The matching secret from Script Properties |
| `BETA_COHORT` | Exact match to the Google property and eventual `BETA_ONBOARDING_COHORT` |
| `BETA_RATE_LIMIT_ID` | The SDK rule ID configured below, e.g. `beta-request` |
| `BETA_ALLOWED_ORIGINS` | Comma-separated full origins, e.g. `https://askoro.now,https://www.askoro.now`; no paths or trailing slashes. Include the old website origins only if that deployment will also accept requests. |
| `TWILIO_ACCOUNT_SID` | Account SID for the existing Twilio account (`AC...`) |
| `TWILIO_AUTH_TOKEN` | Server-only auth token for that account |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID (`VA...`); an existing suitable Verify Service can be reused |

The phone step uses Twilio Verify to send an SMS code. It does not require a new Twilio phone number. Configure the Verify Service's SMS channel and allowed countries in Twilio before opening signups. The beta server accepts a request only when its phone has a code verification proof issued within the last hour. The proof is kept in browser memory and is never written to the Sheet. The shared rate limit covers sending codes, checking codes, looking up signups, and submitting requests.

Enable Vercel's automatically exposed system environment variables. `VERCEL=1`, `VERCEL_URL` and `NODE_ENV=production` are required; these are provided by Vercel, not browser configuration. The exact `VERCEL_URL` origin is also accepted for that deployment. Custom preview aliases need an explicit allowed origin. Do not promote a build made with `VERCEL_ENV=preview` into production; create a production build so the design-preview controls are excluded.

In **Firewall → Configure → New Rule**, select `@vercel/firewall` and enter the same **Rate Limit ID**. Configure a rate limit of **60 requests per minute per IP**, with a one-minute block duration, then save and enable it. A completed signup uses four requests, so this allows about 15 signups per minute from one shared Wi-Fi network. The old five-request limit could block the second person on the same network. Keep [Twilio Verify's per-number send and code-check protections](https://www.twilio.com/docs/verify/developer-best-practices) enabled. This is the server's required distributed limit, including the Vercel deployment hostname; a Cloudflare rule on the custom domain alone would not cover alternate hosts. A missing rule or an SDK error makes saving unavailable. The initial availability GET checks configuration, not the health of Google or the rate-limit rule.

If the deployment has Vercel Deployment Protection, configure a protection-bypass secret for automation in its server environment (`VERCEL_AUTOMATION_BYPASS_SECRET`), as required by the [rate-limit SDK guide](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting-sdk). The SDK uses the deployment hostname from the server environment and the Vercel-provided client IP. Limits are per region, so this is basic abuse protection, not a global application quota. Shared networks may hit the same limit.

Redeploy after configuring the environment. Set `BETA_SIGNUP_ENABLED=true` only in the test scope first and redeploy. `GET /api/beta-request` should return `{"enabled":true}`. With missing settings or the switch off it returns false, and POST returns 503. Production then shows “Invites open soon.” Local development and preview builds retain a clearly labeled design-only form while saving is disabled; its confirmation preview is never a saved receipt.

## 3. Rehearse on the test Sheet

Use synthetic answers and contact details controlled by the team. Do not test against real applicants or the production Sheet.

1. Submit from the actual deployed website. Check the confirmation reference against `Responses.request_id`, all answers, canonical phone/email, blank optional answers, and each independent consent value. The saved phone must match the number the tester will verify during onboarding.
2. Confirm `futureBeta=false` and `marketing=true` remain different values. Then verify both false. These values are recorded only; no mailing/texting enrollment happens.
3. Retry an identical request with the **same** `submission_key`. Expect the same `request_id` and one row. Simulate losing the successful browser response, then retry without refreshing. Expect the same outcome.
4. Retry that key with changed answers. Expect 409 and the “earlier answers were already saved” notice. Only clicking **Send updated request** should use a new key and create a separate request.
5. Submit an answer beginning with `=` and confirm it remains literal text, not a formula. Phone cells must retain the leading `+`. The writer uses the Sheets API's `RAW` value mode.
6. Temporarily use the wrong test writer secret, disable intake, and exercise the rate limit. Confirm errors preserve entered answers and never show a saved receipt. Restore the test settings afterward.
7. Call the Apps Script URL without the secret and with the wrong secret. Neither should add rows. Check the protected Sheet is inaccessible to a signed-out nonmember, and the writer offers no reading endpoint.
8. Verify successful submission on a phone-sized browser and through the exact custom domain intended for launch. Check the deployment hostname's rate limit too.

The automated suite uses real local HTTP, the built Apps Script code with simulated Google services, and browser-intercepted responses. It cannot prove actual Google permissions, deployment versions, Vercel rule configuration, or provider timeouts. The rehearsal above remains required before production intake is opened.

```sh
npm run test:beta
npm run build
E2E_BASE_URL=<preview-url> npm run e2e -- e2e/beta.spec.js e2e/beta-submission.spec.js
E2E_BASE_URL=<production-build-url> npm run e2e -- e2e/beta-availability.spec.js e2e/beta-submission.spec.js
```

Browser tests intercept `/api/beta-request`; they never write to the real Sheet. The draft suite requires a development/preview build. The availability suite checks a production build with requests disabled. The submission suite checks enabled/error UI states on either build.

## Records, retries, and selection

Every saved row contains an immutable UUID4 `request_id`, a browser-generated UUID4 `submission_key`, a hash of the normalized answers/cohort/versions, UTC received/consent timestamps, cohort, form/consent versions, and all answers. Multi-select choices are stored as a JSON array. Missing optional consent values default false on the server. The current page's three prechecked boxes follow the approved frontend revision; the server still stores their explicit, independent values.

Each phone gets a deterministic HMAC-SHA256 referral code, stored in `referral_code` and shown as an `/invite?ref=...` link after a confirmed save. The writer records valid first-signup attribution in `referred_by`; repeat requests, retries, unknown codes, and self referrals earn no credit. `referred_signups` counts distinct referred phones. At three, `referral_completed_date` records the third friend's signup time and stays fixed. `signup_number` is the current overall position: qualified people first by completion time, then everyone else by original signup time, with one place per phone. Existing completion dates remain unchanged. Lookup reconciles missed referral updates before returning position and progress. No rows are reordered and `accepted` remains a manual selection field; qualification does not grant app access. Deploy the matching Apps Script before using the new queue UI. Users can verify their phone again to check their place. Mobile Messages links prefill the invite where supported, with copy-link available on all devices; native message composition still needs a real iPhone/Android rehearsal.

Both optional consent boxes refer to email **and** text in this form version. `futureBeta` covers future beta opportunities; `marketing` covers updates/promotions. The separate required `terms` flag is not a marketing opt-in. The exact copy for `2026-09-24.1` is in `Beta.jsx`; bump `CONSENT_VERSION` when that meaning changes, and `FORM_VERSION` when the accepted form changes. Deploy matching website and writer versions together. Consent is a record for later use, not an active sending integration.

A script-wide lock surrounds lookup and append. The request key/hash and answers are written in **one row**; retries look for that key before writing. After an ambiguous write, the script re-reads the Sheet and only reports a saved receipt when it can find it. Never remove response keys or use a second independent script project against this Sheet. Google failures still need operational review if they outlive a retry; this small beta flow does not claim database-level guarantees across independent projects or manual row edits.

The browser saves draft answers and the retry key in local storage, scoped to the current form and consent versions. Refreshing or reopening restores them; a confirmed receipt clears them. An explicit updated request gets a new key and may create another application for the same contact. Review by `request_id` and check repeat contacts manually; do not treat email or phone as a request ID.

For selection, map Sheet `request_id` to backend `source_request_id`, keep the saved `phone`, and use the exact `cohort`. Follow [PR #418's backend selection guide](https://github.com/oro-app/oro-central/blob/codex/beta-signup-consolidated/docs/beta-access.md) in the merged backend version. An operator prepares, reviews and applies approved phones, then sends invitations manually. A Sheet selection alone does not allow onboarding. Do not edit an already-selected application's phone in place; review the corrected request separately.

`/get-started` compatibility and “message oro first” completion are tracked in [BUI-623](https://linear.app/buildingoro/issue/BUI-623/update-get-started-for-approved-beta-testers-and-message-first-setup). Backend migration/configuration and that website work must be ready before sending invitations. Signup saving can be configured and rehearsed independently of those invitations.

## Close or roll back intake

Set `BETA_SIGNUP_ENABLED=false` and redeploy. New page loads show the availability notice; forms already open receive a closed response and keep their answers. Preserve the response Sheet, writer project and request keys so earlier receipts and retry records remain valid. To rotate the writer secret, close intake, update both server and Script Properties, verify a test request, then reopen. A public link to the form never grants access to the Sheet.

## Tester referral reward

`/tester/referrals` reuses SMS verification and the private lookup to show a tester's existing invite link and progress toward one hoodie + tote at eight distinct referred phones. Team progress stays in `Responses.referred_signups`; approved rows at eight or more are highlighted green in the production Sheet. No extra tab or columns are needed. Reward fulfillment is manual via sunny@buildingoro.ca.

Deploy the rebuilt Apps Script writer before deploying the website, so lookup returns `tester`. A tester needs an existing signup row with their verified phone and `accepted=TRUE`; mark the original row for that phone. Testers missing from the Sheet must complete the invite form once before the team accepts them. Setting this flag does not itself grant backend app access. The three-referral queue completion date and ordering remain unchanged.
