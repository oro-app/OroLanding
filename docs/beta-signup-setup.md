# Connect beta invite requests

The website saves invite requests through `POST /api/beta-request`. That server-side function validates the answers, normalizes the phone, checks the Vercel rate limit, and calls a dedicated Apps Script writer. Apps Script saves one row in a private Google Sheet. Only a confirmed save returns the request reference shown on the website.

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
| `BETA_COHORT` | `2026-09-25`, or the exact cohort chosen for backend onboarding |
| `BETA_SUBMISSION_SECRET` | A new random secret, at least 32 characters; use the same value in the website's server environment |

Generate the secret with a password manager. Never put it in Git, a ticket, a screenshot, or a `VITE_` variable.

Run `setupResponseSheet` once from the editor and authorize the requested Sheets access. It creates the `Responses` tab and its column headers, refusing to overwrite an existing response table. Protect this tab so only the script owner can edit it. Give reviewers their own `Review` tab, keyed by `request_id`, for notes and selections. Keep raw rows and headers intact; use filter views rather than moving cells independently.

Deploy a **Web app**, execute as the deploying account, with access **Anyone**. The endpoint must accept server calls without an interactive Google sign-in; the dedicated secret authorizes writes. The Sheet itself remains private. The endpoint offers no response-reading API. Copy the deployed `/exec` URL, not `/dev`. See [Google web app deployment](https://developers.google.com/apps-script/guides/web).

On later code changes, rebuild both script files and update the existing deployment to a new version. Keep the same project, Sheet, and response keys. Updating editor code alone does not update the deployed `/exec` version.

## 2. Configure the website and rate limit

In the OroLanding Vercel project, configure the server environment for the intended deployment scope. Start with Preview pointing to the **test** Google project. Keep Production disabled until the rehearsal passes.

| Variable | Value |
| --- | --- |
| `BETA_SIGNUP_ENABLED` | `false` until ready; `true` opens requests when the other settings are valid |
| `BETA_APPS_SCRIPT_URL` | The dedicated `https://script.google.com/macros/s/.../exec` URL |
| `BETA_SUBMISSION_SECRET` | The matching secret from Script Properties |
| `BETA_COHORT` | Exact match to the Google property and eventual `BETA_ONBOARDING_COHORT` |
| `BETA_RATE_LIMIT_ID` | The SDK rule ID configured below, e.g. `beta-request` |
| `BETA_ALLOWED_ORIGINS` | Comma-separated full origins, e.g. `https://buildingoro.ca,https://www.buildingoro.ca`; no paths or trailing slashes |

Enable Vercel's automatically exposed system environment variables. `VERCEL=1`, `VERCEL_URL` and `NODE_ENV=production` are required; these are provided by Vercel, not browser configuration. The exact `VERCEL_URL` origin is also accepted for that deployment. Custom preview aliases need an explicit allowed origin. Do not promote a build made with `VERCEL_ENV=preview` into production; create a production build so the design-preview controls are excluded.

In **Firewall → Configure → New Rule**, select `@vercel/firewall` and enter the same **Rate Limit ID**. Configure a rate limit of **5 requests per minute per IP**, with a one-minute block duration, then save and enable it. This is the server's required distributed limit, including the Vercel deployment hostname; a Cloudflare rule on the custom domain alone would not cover alternate hosts. A missing rule or an SDK error makes saving unavailable. The initial availability GET checks configuration, not the health of Google or the rate-limit rule.

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

Both optional consent boxes refer to email **and** text in this form version. `futureBeta` covers future beta opportunities; `marketing` covers updates/promotions. The separate required `terms` flag is not a marketing opt-in. The exact copy for `2026-09-24.1` is in `Beta.jsx`; bump `CONSENT_VERSION` when that meaning changes, and `FORM_VERSION` when the accepted form changes. Deploy matching website and writer versions together. Consent is a record for later use, not an active sending integration.

A script-wide lock surrounds lookup and append. The request key/hash and answers are written in **one row**; retries look for that key before writing. After an ambiguous write, the script re-reads the Sheet and only reports a saved receipt when it can find it. Never remove response keys or use a second independent script project against this Sheet. Google failures still need operational review if they outlive a retry; this small beta flow does not claim database-level guarantees across independent projects or manual row edits.

The browser retains answers and the retry key **in memory only**. Refreshing or closing loses them. A new form session or an explicit updated request gets a new key and may create another application for the same contact. Review by `request_id` and check repeat contacts manually; do not treat email or phone as a request ID.

For selection, map Sheet `request_id` to backend `source_request_id`, keep the saved `phone`, and use the exact `cohort`. Follow [PR #418's backend selection guide](https://github.com/oro-app/oro-central/blob/codex/beta-signup-consolidated/docs/beta-access.md) in the merged backend version. An operator prepares, reviews and applies approved phones, then sends invitations manually. A Sheet selection alone does not allow onboarding. Do not edit an already-selected application's phone in place; review the corrected request separately.

`/get-started` compatibility and “message Oro first” completion are tracked in [BUI-623](https://linear.app/buildingoro/issue/BUI-623/update-get-started-for-approved-beta-testers-and-message-first-setup). Backend migration/configuration and that website work must be ready before sending invitations. Signup saving can be configured and rehearsed independently of those invitations.

## Close or roll back intake

Set `BETA_SIGNUP_ENABLED=false` and redeploy. New page loads show the availability notice; forms already open receive a closed response and keep their answers. Preserve the response Sheet, writer project and request keys so earlier receipts and retry records remain valid. To rotate the writer secret, close intake, update both server and Script Properties, verify a test request, then reopen. A public link to the form never grants access to the Sheet.
