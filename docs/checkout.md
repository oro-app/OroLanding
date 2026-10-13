## Website phone entry

All signup CTAs use `/get-started` (also available at `/getstarted`). The page
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
