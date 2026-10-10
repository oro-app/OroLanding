# Text Oro handoff

`/getstarted` opens a conversation instead of repeating the signup questionnaire. There is no form, OTP request, or account write on this page. The phone button opens Messages with a greeting; the person still taps Send. Oro confirms missing eligibility and service-texting consent in the conversation before creating their account.

On desktop, the QR contains a direct SMS draft to Oro with the greeting `hey oro, your newest oronaut just landed 🚀`. The phone button chooses the SMS draft format for the visitor's device. The visible phone number also works as a fallback. When a visitor arrives through `/invite?ref=…`, the same draft appends that exact invite URL on its own line. The text intake must retain that URL when it creates the conversation so the existing referral code can be credited; it must not be discarded as an untrusted display value.

The screenshots below are real local Chromium renders of the production build, with the bundled fonts loaded, with the cookie banner declined and focus moved off the heading. The phone screenshot is a responsive web viewport, not a native Messages screenshot. Browser tests check iPhone/Android user agents, draft links, CTA visibility, and horizontal overflow.

## Desktop · 1440 × 1000

![Desktop texting handoff](screenshots/text-activation-desktop.png)

## Phone · 390 × 844

![Phone texting handoff](screenshots/text-activation-mobile.png)

Deploy alongside the backend text-activation change after the open-access PR. Share `https://askoro.now/getstarted`. Existing `/get-started` email links permanently redirect to `/getstarted`. The previous verified questionnaire remains at `/get-started/setup` for explicitly configured beta/legacy modes; it is no longer the public activation flow. Waitlist contact details must be imported on the backend before launch emails to avoid asking those people for their names again.
