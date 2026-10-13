# Checkout review screenshots

These captures show the actual Oro landing UI using synthetic checkout API responses,
a frozen October 13 review clock, and the mocked Stripe SDK from the checkout browser
tests. The payment area is intentionally labeled as a mock. No real card details,
personal checkout credentials, or transactions are included.

- `launch.png`: first-month promotion and countdown.
- `mobile.png`: the same checkout at a 390px phone width.
- `declined.png`: card decline displayed on the form.
- `pending.png`: payment confirmation and activation still pending.
- `success.png`: backend-confirmed access with a link back to the text conversation.
- `expired-link.png`: expired personal link and recovery.
- `unavailable.png`: unavailable checkout API with retry and support.
- `regular-price.png`: regular monthly price after the promotion ends.

These are visual review evidence, not verification of real Stripe payment fields,
3DS, or a live purchase. Complete a Stripe test-mode purchase before enabling rollout.
