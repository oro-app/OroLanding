import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Optional: forward each message to a Slack/Discord/email webhook so the
// team gets pinged without polling Supabase. Set CONTACT_WEBHOOK_URL to
// enable; if unset, messages just land in the contact_messages table.
const CONTACT_WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL;

const TOPICS = ['hello', 'support', 'press', 'partnership', 'careers', 'feedback'];

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

  // Topic is constrained to the chip set; default to 'hello'.
  const cleanTopic = TOPICS.includes(topic) ? topic : 'hello';

  const row = {
    name: name.trim(),
    email: cleanEmail,
    topic: cleanTopic,
    message: message.trim(),
    created_at: new Date().toISOString(),
  };

  const { error: dbError } = await supabase
    .from('contact_messages')
    .insert([row]);

  if (dbError) {
    console.error('Supabase contact insert error:', dbError);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  if (CONTACT_WEBHOOK_URL) {
    try {
      await fetch(CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    } catch (err) {
      console.error('Contact webhook error:', err);
    }
  }

  return res.status(201).json({ success: true });
}
