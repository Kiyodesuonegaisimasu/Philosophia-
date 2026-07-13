// リポジトリ内の置き場所: /api/premium.js
// 役割: アクセス権のあるユーザー（有料会員 or トライアル中）だけに会員限定コンテンツを返す。
//   コンテンツ本体は _premium_content.js にあり、このサーバー関数からしか読めない。
//   → HTMLソースを見ても中身は漏れない。※リポジトリは非公開(private)推奨。
import { createClient } from '@supabase/supabase-js';
import PREMIUM_CONTENT from './_premium_content.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TRIAL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'not_logged_in' });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error } = await admin.auth.getUser(token);
    if (error || !userData?.user?.email) return res.status(401).json({ error: 'invalid_token' });

    const email = userData.user.email.toLowerCase();

    // トライアル判定
    const createdAt = userData.user.created_at ? new Date(userData.user.created_at).getTime() : Date.now();
    const trialActive = Date.now() < createdAt + TRIAL_MS;

    // 会員判定
    const { data: member } = await admin
      .from('members')
      .select('active')
      .eq('email', email)
      .maybeSingle();
    const active = !!(member && member.active);

    // アクセス権チェック
    if (!active && !trialActive) return res.status(403).json({ error: 'not_member' });

    const welcome = active
      ? 'ようこそ、Philosophia プレミアムへ。学びの地図を、ここから広げていきましょう。'
      : '無料トライアル中です。会員限定コンテンツをすべてお試しいただけます。気に入ったら、ぜひ会員登録を。';

    return res.status(200).json({
      welcome,
      access: active ? 'member' : 'trial',
      updatedAt: '2026-07-13',
      content: PREMIUM_CONTENT
    });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
