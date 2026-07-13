// リポジトリ内の置き場所: /api/me.js
// 役割: ログイン中ユーザーの「アクセス権」を返す。
//   access = 有料会員(active) または 無料トライアル中(登録から24時間以内)。
// フロントは Authorization: Bearer <SupabaseのアクセスToken> を付けて呼ぶ。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TRIAL_MS = 24 * 60 * 60 * 1000; // 1日 = 24時間

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'not_logged_in' });

    // service role key はサーバー専用（絶対にフロントに出さない）。RLSをバイパスして会員表を読める。
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // トークンから本人（メール・登録日時）を検証つきで取り出す
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'invalid_token' });

    const email = userData.user.email.toLowerCase();

    // --- 無料トライアル判定（アカウント登録から24時間以内なら true）---
    const createdAt = userData.user.created_at ? new Date(userData.user.created_at).getTime() : Date.now();
    const trialEndsMs = createdAt + TRIAL_MS;
    const now = Date.now();
    const trialActive = now < trialEndsMs;

    // --- 有料会員判定 ---
    const { data: member } = await admin
      .from('members')
      .select('active,current_period_end')
      .eq('email', email)
      .maybeSingle();
    const active = !!(member && member.active);

    // アクセス権 = 会員 or トライアル中
    const access = active || trialActive;

    return res.status(200).json({
      email,
      active,                                   // 有料会員かどうか
      trial: trialActive && !active,            // トライアル中（未課金）かどうか
      trial_ends: new Date(trialEndsMs).toISOString(),
      access,                                   // 限定コンテンツを見られるか
      current_period_end: member?.current_period_end || null
    });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
