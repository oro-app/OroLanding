// api/app.js — smart app-install redirect (public URL: buildingoro.ca/app).
//
// A single "get the app" link that routes to the right store per device. The
// onboarding tail (oro-central, BUI-419/BUI-437) texts this URL over SMS/WhatsApp
// where we can't know the device OS server-side (Twilio doesn't expose it), so we
// detect the platform at click-time from the browser's User-Agent and 302 to the
// matching store. Exposed at /app via the rewrite in vercel.json.
//
// Store URLs are the single source of truth in src/lib/links.js — never duplicate
// them here.
import { APP_STORE_URL, PLAY_STORE_URL } from '../src/lib/links.js';

export default function handler(req, res) {
  const ua = req.headers['user-agent'] || '';

  // Android first: some Android UAs also contain "Mobile"/"Safari" tokens, so it
  // must win before any generic checks.
  let target;
  if (/android/i.test(ua)) {
    target = PLAY_STORE_URL;
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    target = APP_STORE_URL;
  } else {
    // Desktop / unknown — no app store makes sense; send them to the landing page.
    target = '/';
  }

  // 302 + no-store: the destination depends on the requesting device, so this
  // must never be cached (a shared/CDN cache could pin one platform's store).
  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: target });
  res.end();
}
