// リポジトリ内の置き場所: /api/stripe-webhook.js
// 役割: Stripeからの通知(Webhook)を受けて、Supabaseの members 表に会員状態を書き込む。
//   - 支払い完了(checkout.session.completed) → active=true
//   - サブスク更新(customer.subscription.updated) → status次第でactive切替
//   - サブスク解約(customer.subscription.deleted) → active=false
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Stripeの署名検証には「生のリクエストボディ」が必要なので、Vercelの自動パースを無効化する。
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function setMember(email, active, extra = {}) {
  if (!email) return;
  await admin.from('members').upsert(
    { email: email.toLowerCase(), active, updated_at: new Date().toISOString(), ...extra },
    { onConflict: 'email' }
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    const buf = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const email = s.customer_details?.email || s.customer_email;
        await setMember(email, true, { stripe_customer_id: s.customer });
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const active = ['active', 'trialing'].includes(sub.status);
        const cust = await stripe.customers.retrieve(sub.customer);
        await setMember(cust.email, active, {
          stripe_customer_id: sub.customer,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const cust = await stripe.customers.retrieve(sub.customer);
        await setMember(cust.email, false, { stripe_customer_id: sub.customer });
        break;
      }
      default:
        // 他のイベントは無視
        break;
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: 'handler_error' });
  }
}
