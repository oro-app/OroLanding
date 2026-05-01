// Manual smoke test:
//   GET  https://buildingoro.ca/api/unsubscribe?token=<signed-token>  → 200 HTML confirmation page
//   POST https://buildingoro.ca/api/unsubscribe?token=<signed-token>  (body: confirm=1)       → 200 HTML success page
//   POST https://buildingoro.ca/api/unsubscribe?token=<signed-token>  (body: List-Unsubscribe=One-Click) → 200 {"ok":true}
//   GET  https://buildingoro.ca/api/unsubscribe?token=bad             → 400 HTML error page
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyUnsubscribeToken } from './_lib/unsubscribe-token.js';

const SHARED_STYLES = `
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 480px; margin: 80px auto; padding: 24px; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 28px; font-weight: 500; letter-spacing: -0.01em; margin-bottom: 16px; }
  p { color: #4a4a4a; font-size: 17px; }
  .meta { font-size: 12px; color: #8a8a8a; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 32px; font-family: -apple-system, sans-serif; }
  a { color: #1a1a1a; }
`;

function confirmHtml(token: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribe — Oro Insiders</title>
  <style>
    ${SHARED_STYLES}
    .btn { display: inline-block; margin-top: 8px; padding: 10px 24px; background: #1a1a1a; color: #fff; font-family: -apple-system, sans-serif; font-size: 15px; border: none; cursor: pointer; border-radius: 4px; text-decoration: none; }
    .btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="meta">Oro Insiders</div>
  <h1>Unsubscribe from Oro Insiders?</h1>
  <p>You'll stop receiving all future issues. If this was an accidental click, just close this page — you're still subscribed.</p>
  <form method="POST" action="/api/unsubscribe?token=${encodeURIComponent(token)}">
    <input type="hidden" name="confirm" value="1">
    <button type="submit" class="btn">Yes, unsubscribe me</button>
  </form>
</body>
</html>`;
}

const SUCCESS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Unsubscribed — Oro Insiders</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="meta">Oro Insiders</div>
  <h1>You're unsubscribed.</h1>
  <p>You won't receive any more issues of Oro Insiders. If this was a mistake, reply to any past issue and we'll add you back.</p>
  <p>The Oro app waitlist is separate. Visit <a href="https://buildingoro.ca">buildingoro.ca</a> if you want to manage that.</p>
</body>
</html>`;

const ERROR_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Invalid link</title>
<style>body{font-family:Georgia,serif;max-width:480px;margin:80px auto;padding:24px;color:#1a1a1a;line-height:1.6}h1{font-weight:500}p{color:#4a4a4a}</style>
</head><body><h1>This unsubscribe link is invalid or expired.</h1><p>If you keep getting Oro Insiders, reply to the latest issue and we'll remove you manually.</p></body></html>`;

function html(res: VercelResponse, status: number, body: string) {
  return res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }

  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const secret = process.env.UNSUBSCRIBE_SECRET ?? '';
  if (!secret) return res.status(500).send('Server misconfigured.');

  const verified = verifyUnsubscribeToken(token, secret);
  if (!verified) {
    if (req.method === 'POST') return res.status(400).json({ ok: false, error: 'Invalid token' });
    return html(res, 400, ERROR_HTML);
  }

  // GET — show confirmation page; do not unsubscribe yet
  if (req.method === 'GET') {
    return html(res, 200, confirmHtml(token));
  }

  // POST from email client one-click (RFC 8058): List-Unsubscribe=One-Click in body
  const isOneClick = req.body?.['List-Unsubscribe'] === 'One-Click';
  // POST from the confirmation form: confirm=1 in body
  const isConfirmed = req.body?.confirm === '1';

  if (!isOneClick && !isConfirmed) {
    return res.status(400).json({ ok: false, error: 'Missing confirmation.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { persistSession: false } },
  );

  const source = isOneClick ? 'one_click' : 'confirmed_link';
  const { error } = await supabase
    .from('waitlist')
    .update({ unsubscribed_at: new Date().toISOString(), unsubscribe_source: source })
    .eq('email', verified.email)
    .is('unsubscribed_at', null);

  if (error) {
    console.error('unsubscribe error', error);
    if (isOneClick) return res.status(500).json({ ok: false, error: 'DB error' });
    return res.status(500).send('Could not process unsubscribe. Reply to the email and we will remove you manually.');
  }

  if (isOneClick) return res.status(200).json({ ok: true });
  return html(res, 200, SUCCESS_HTML);
}
