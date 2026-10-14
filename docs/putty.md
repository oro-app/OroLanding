# Merch

`/merch` sends payment to Stripe-hosted Checkout. Subscription consent and
subscription prices are not reused: Putty is a one-time placement bid.

The form requires email, bid totals, and terms/privacy acceptance. Display name is optional. No
phone, email verification, account signup, artwork, or file upload is required.
An omitted name appears as Anonymous. Prices are USD. Each input is the desired
**cumulative total for that square**, not an additional payment. Submitting
the form starts a three-minute hold and opens Stripe Checkout, where the final
amount is shown before payment. Previously paid contributions remain after
someone is outbid.

Set `VITE_ORO_API_URL` to the matching backend (default:
`https://api.buildingoro.ca`). The accompanying backend branch is
`feat/putty-bidding`, in `.putty-backend`. See its `docs/putty.md` for migration,
environment flags, Stripe webhook events, reconciliation, and staff follow-up.
Deploy that backend before opening bidding. Without the backend this page
always shows the placement grid with unknown availability, and cannot accept a local-only claim.

The old `/putty` URL redirects to `/merch`. API requests use `/merch/*`.
The existing site navigation is reused. Front/back thumbnails sit to the left
of the canvas, with enlarge/shrink controls. The board defaults to a preview of
claimed display names; a separate choosing view shows placement IDs, minimum prices,
claimed states, and a green-to-red price scale. Availability polls every ten seconds and is checked again when
selecting a square. When a hold expires, its status is reconciled, the board is
refreshed, stale selected prices are raised to the latest minimum, and choosing is
re-enabled without another button press. Terms/privacy acceptance is required and validated by the
backend before checkout creation.

The supplied 800 × 1200 blanks use percentage overlays: back at left 27.5%,
top 35.8%, width 45%, height 36%; front at left 57.5%, top 37.5%, width 15%,
height 6%. The grid stays six columns by eight rows. At the default 0% added
zoom, the preview fits the canvas width on a white surface. Enlarge/shrink
controls adjust magnification. Thumbnails have accessible labels without visible
front/back captions. Names are truncated inside squares but available in accessible labels
and selected-square details. Selection survives switching front/back views.

Order UUIDs are private checkout capabilities, saved only in session storage
and temporarily in the payment-return fragment. No email or name is saved in
browser storage. Analytics and cookie overlays are suppressed on this payment
route, as on `/checkout`. Email-only credit attribution intentionally does not
prove identity; it must never authorize private account access or refunds.
After Stripe returns to `/merch`, the page checks the order with the backend.
Only Stripe's verified paid Session changes the page to the confirmed claim state.
No auction closing date is configured; the date in the supplied form reference
was not treated as a requested deadline. Outbid customer contact and artwork
collection are manual.

Verification must not build or start the app unless explicitly requested.
