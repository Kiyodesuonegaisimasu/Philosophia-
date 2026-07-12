// リポジトリ内の置き場所: /api/premium.js
// 役割: 有効な会員だけに「会員限定コンテンツ」を返す。非会員は403。
// 限定コンテンツはこのサーバー関数だけが持つ（HTMLに出さない）ので、
// ソースを見てもコンテンツは漏れない。※リポジトリは「非公開(private)」にすること（下のREADME参照）。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ===== 会員限定コンテンツ（ここを充実させていく）=====
const PREMIUM = {
  welcome: 'ようこそ、Philosophia プレミアムへ。ここは有効な会員だけが読めるエリアです。',
  updatedAt: '2026-07-12',
  items: [
    {
      title: '原典ガイド：プラトン『国家』の歩き方',
      body: 'いきなり通読せず、まず「洞窟の比喩」（第7巻）から入るのがおすすめ。次に正義の定義をめぐる第1〜2巻へ戻ると、全体の狙いが見えてきます。訳は光文社古典新訳文庫か岩波文庫を。'
    },
    {
      title: '今月の特集：ストア派を1週間で生活に取り入れる',
      body: '初日はエピクテトス『提要』の第1節だけ。「自分に左右できること」と「できないこと」を紙に書き分ける——それを7日間、朝に1回。'
    }
  ]
};
// =====================================================

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'not_logged_in' });

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error } = await admin.auth.getUser(token);
    if (error || !userData?.user?.email) return res.status(401).json({ error: 'invalid_token' });

    const email = userData.user.email.toLowerCase();
    const { data: member } = await admin
      .from('members')
      .select('active')
      .eq('email', email)
      .maybeSingle();

    if (!member || !member.active) return res.status(403).json({ error: 'not_member' });

    return res.status(200).json(PREMIUM);
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
