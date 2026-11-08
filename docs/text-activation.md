# Text Oro entry

The homepage is the public entry point. All signup buttons use the same phone link on mobile and QR dialog on desktop. The QR and phone link contain only `hey oro, let's get started!`; visitors send the draft themselves.

Old `/beta`, `/beta/career`, `/beta/dating`, `/invite`, `/tester/referrals`, `/getstarted`, `/get-started`, `/get-started/setup`, and `/meet-oro` links redirect to `/`. The website no longer contains a beta application, phone verification, invitation lookup, referral tracking, rewards page, or Google Sheets signup writer.

With backend `ONBOARDING_MODE=open` and `PUBLIC_ONBOARDING_ENABLED=0`, ordinary new texters give their name and email and receive a queue number and graphic, then wait for the team to arrange a sales call. There is no referral link or referral reward. Existing subscribers keep using their conversation. Internal tester exceptions remain controlled by the backend.

`/checkout` remains the subscription payment page. Public checkout availability is enforced by the backend. Newsletter subscriptions remain separate from the texting waitlist.
