// リポジトリ内の置き場所: /api/config.js
// 役割: フロント(members.html)に「公開してよい設定」だけを渡す。
//   SUPABASE_URL と anonキーは公開前提の値なので露出してOK。service_role等の秘密は絶対に返さない。
export default function handler(req, res) {
  res.status(200).json({
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    stripeLink: "https://buy.stripe.com/cNi4gz4MK54EdBL6qXfMA01"
  });
}
