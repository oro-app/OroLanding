import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resend — same key/domain oro-newsletter uses (buildingoro.ca is verified).
// Add RESEND_API_KEY to this project's Vercel env (Production + Preview).
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO = process.env.CONTACT_TO_EMAIL || 'admin@buildingoro.ca';
const CONTACT_FROM = process.env.CONTACT_FROM_EMAIL || 'Oro Contact <admin@buildingoro.ca>';

const TOPICS = ['hello', 'support', 'press', 'partnership', 'careers', 'feedback'];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function sendEmail({ name, email, topic, message }) {
  if (!RESEND_API_KEY) return { sent: false, reason: 'no_api_key' };

  const safeMsg = escapeHtml(message).replace(/\n/g, '<br>');
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;color:#0E0B07;line-height:1.6">
      <p style="margin:0 0 16px"><strong>new contact — ${escapeHtml(topic)}</strong></p>
      <p style="margin:0 0 4px"><strong>name:</strong> ${escapeHtml(name)}</p>
      <p style="margin:0 0 4px"><strong>email:</strong> ${escapeHtml(email)}</p>
      <p style="margin:0 0 16px"><strong>topic:</strong> ${escapeHtml(topic)}</p>
      <p style="margin:0 0 6px"><strong>message:</strong></p>
      <p style="margin:0;white-space:pre-wrap">${safeMsg}</p>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_TO],
      reply_to: email,            // hitting "reply" answers the sender directly
      subject: `new contact (${topic}) — ${name}`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Resend send failed:', res.status, detail);
    return { sent: false, reason: `resend_${res.status}` };
  }
  return { sent: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, topic, message } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const cleanTopic = TOPICS.includes(topic) ? topic : 'hello';
  const payload = {
    name: name.trim(),
    email: cleanEmail,
    topic: cleanTopic,
    message: message.trim(),
  };

  // Two independent delivery paths — the message reaches oro if EITHER works.
  // 1) durable record in Supabase  2) email notification to the team.
  let dbOk = false;
  let emailOk = false;

  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert([{ ...payload, created_at: new Date().toISOString() }]);
    if (error) console.error('Supabase contact insert error:', error);
    else dbOk = true;
  } catch (err) {
    console.error('Supabase contact insert threw:', err);
  }

  try {
    const r = await sendEmail(payload);
    emailOk = r.sent;
  } catch (err) {
    console.error('Contact email threw:', err);
  }

  if (!dbOk && !emailOk) {
    // Both paths failed — the message would be lost. Report the error so the
    // form shows its mailto fallback.
    return res.status(500).json({ error: 'Failed to send message' });
  }

  return res.status(201).json({ success: true, stored: dbOk, emailed: emailOk });
}
