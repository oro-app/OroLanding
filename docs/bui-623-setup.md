# Approved beta setup

Manual approval emails should link to `/get-started`. The page is public; access is enforced by oro-central before sending a verification code and again before saving setup. Sharing the URL does not grant access.

The page uses oro-kit controls. Approved new and existing accounts follow the same flow. A successful `200 {"status":"verified"}` confirms setup is saved. Completion says “You’re all set. Your beta setup is complete.” It does not ask the tester to message Oro or promise an automatic welcome message.

`beta_invite_required` links to `/beta` and `sunny@buildingoro.ca`. Account conflicts, closed setup, expired sessions, failed saves, and uncertain network responses have recovery screens. Fresh-code recovery preserves the answers. Codes stay in memory; existing draft answers stay in browser storage until setup succeeds. Analytics initialization and link tracking are disabled on this route.

## Backend and release

Depends on [oro-central #418](https://github.com/oro-app/oro-central/pull/418). Local verification used its `d502cff38ab800c9676c7fbdbe831eb49abb7c36` contract.

- `POST /onboarding/start` returns `otp_sent`; `POST /onboarding/verify` returns `verified` only after activation is saved.
- Structured `detail.code` and legacy string details are supported, including the top-level `otp_cooldown` code.
- `VITE_ORO_API_URL` sets the backend origin at build time; the default is `https://api.buildingoro.ca`.
- Deploy the backend migration and confirm the cohort/`BETA_ONBOARDING_ENABLED` settings before releasing this frontend. Setup should stay closed until the approved test cohort is ready.
- Before opening invitations, verify the deployed approval-import → setup flow with designated test identities. An imported approval must remain usable without contacting Google Sheets during setup.
- To close setup, disable backend onboarding. The frontend explains that setup is not open; it never grants access itself.

## Verification

`E2E_BASE_URL=http://127.0.0.1:4623 npm run e2e -- e2e/get-started.spec.js` runs browser coverage with every onboarding request intercepted, so it never sends verification messages. `npm run build` checks client, server rendering, and generated metadata.

Local integration also used the real #418 router/services, a disposable PostgreSQL schema and Redis, synthetic OTP delivery, and an injected commit failure. Browser checks read back saved activations and confirmed that existing account data was preserved. This does not replace a deployed migration/import check or real-device message delivery check.
