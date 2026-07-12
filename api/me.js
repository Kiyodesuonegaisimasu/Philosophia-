// リポジトリ内の置き場所: /api/me.js
// 役割: ログイン中ユーザーの「会員かどうか」を返す。
// フロントは Authorization: Bearer <SupabaseのアクセスToken> を付けて呼ぶ。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'not_logged_in' });

    // service role key はサーバー専用（絶対にフロントに出さない）。RLSをバイパスして会員表を読める。
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // トークンから本人のメールを検証つきで取り出す
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user?.email) return res.status(401).json({ error: 'invalid_token' });

    const email = userData.user.email.toLowerCase();
    const { data: member } = await admin
      .from('members')
      .select('active,current_period_end')
      .eq('email', email)
      .maybeSingle();

    return res.status(200).json({
      email,
      active: !!(member && member.active),
      current_period_end: member?.current_period_end || null
    });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
