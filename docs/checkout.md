## Direct checkout entry

The embedded checkout accepts discount codes through Stripe's `applyPromotionCode`
API and displays the updated amount due. The upstream service creating Checkout
Sessions must set `allow_promotion_codes: true`, and codes must be active in Stripe.
Session creation lives outside this repository.

All signup CTAs now open `/checkout` directly, without a prior phone form.
`/get-started` and `/getstarted` also render checkout for older links. Without a
personal link, the page calls `/api/checkout?operation=entry` to start an anonymous
native Stripe Session. It stores the scoped token in the browser tab and uses
`entry-status`/`entry-checkout` to resume the same attempt, including after a
Stripe redirect. Invitation links are retained in the post-payment text handoff.

If the server rejects a saved browser checkout credential, a normal website entry
clears it and starts a fresh anonymous session. Temporary backend failures retain
the saved session for retry. An explicitly opened personal link keeps its existing
fresh-link recovery instead of silently switching checkout identities.

The existing payment screen requires phone alongside email and payment details.
Stripe Sessions enable phone collection; the form supplies the normalized number
to Stripe confirmation. Notice acceptance is recorded through `entry-accept`
before confirmation, which can send an existing subscriber back to text without
another charge. Stripe-confirmed payment/contact details supply the final account
binding, followed by the existing welcome and paid conversation.

Deploy the backend routes and migration `n1014public007` first. The existing
invoice/subscription webhook configuration is sufficient: initial paid invoices
retry while Checkout completion is pending, so account linking and welcome do
not rely on the browser staying open. Legacy personal text checkout
links keep their existing token, payment and onboarding behavior.

## Legacy website phone entry

Older website builds use `/get-started` (also available at `/getstarted`). The page
collects only a phone number and displays the combined terms/privacy, eligibility
and texting notice beside Continue to payment. It calls
`/api/checkout?operation=phone`, which forwards only the number and acceptance
flags to `/public-onboarding/phone`. Deploy backend migration `n1013public006`
and that endpoint before deploying the website.

New enrollment returns a checkout-only token; the page saves it for this browser
tab and opens the existing `/checkout` with the token in the URL fragment. The
checkout removes it from the visible URL and uses the existing payment UI,
pricing, payment verification and paid activation. Returning to the entry in the
same tab reuses the saved checkout for the same number. No OTP is requested.
Existing billing/checkouts return a generic text handoff rather than disclosing
another customer's payment session. Invitation links survive the website entry
and are included in the existing text handoff after checkout or on recovery.
Direct texters retain their current pre-payment onboarding. Billing starts at
payment, even if the customer has not texted yet.

# Native checkout

`/checkout` uses Stripe Elements and the existing public-onboarding checkout and
status endpoints. Payments, coupon validation, account identity, subscription
activation, and webhooks stay in oro-central. The site contains no Stripe secret
or webhook key. Its server function proxies only those two authenticated endpoints.

The signed personal link stores its credential in the URL fragment, removes that
fragment on entry, and retains the credential in session storage for refresh and
payment-authentication returns. Checkout is excluded from analytics and the sitemap.
An expired link asks the customer to text Oro for a fresh link.

## Deployment

1. Set `STRIPE_PUBLISHABLE_KEY` on oro-central for the same Stripe account and mode
   as its secret key. Checkout receives that public key in its authenticated
   response. `VITE_STRIPE_PUBLISHABLE_KEY` in Vercel is an optional fallback.
   Preview should use a test backend; a key is never enough to create checkout
   without a valid personal link.
2. Deploy the landing and companion backend PRs before enabling native links.
3. On oro-central, keep the existing $25 USD monthly price and set
   `PUBLIC_LAUNCH_COUPON_ID=Rwi8d2cu`. The coupon must give 50% off once and belong
   to the same Stripe mode and product as the price. Test mode needs its own coupon.
4. Set `STRIPE_NATIVE_CHECKOUT_ENABLED=true` and
   `STRIPE_NATIVE_CHECKOUT_URL=https://www.askoro.now/checkout` on oro-central.
   Leave `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` there.
5. Verify a test purchase, a decline, payment authentication, a refresh, a delayed
   webhook, and cancellation using Stripe's test mode before enabling production.

`ORO_API_URL` is the landing server's optional backend override; it defaults to
`https://api.buildingoro.ca`. Use a preview backend here when testing preview keys.

The launch countdown ends October 14, 2026 at 00:00 Eastern (04:00 UTC). At that
deadline the page refreshes the server quote, which expires an open native launch
session before creating a regular-price session. A completed payment is reconciled
through the existing activation flow. Success is never inferred from a redirect.

Disable `STRIPE_NATIVE_CHECKOUT_ENABLED` to send new customers through the existing
hosted checkout again. Keep the website available for already-issued native links.
