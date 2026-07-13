// リポジトリ内の置き場所: /api/like.js
// 役割: 解説への「いいね」総数を全ユーザーで共有する。
//   GET  /api/like?names=ソクラテス,プラトン   → { "ソクラテス":12, "プラトン":8 }
//   POST /api/like  body: { philosopher, delta:1|-1 } → { philosopher, count }
// ログイン不要（公開カウント）。サーバー専用の service_role キーで likes 表を読み書きする。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    if (req.method === 'GET') {
      const names = String(req.query.names || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 100);
      const out = {};
      if (names.length) {
        const { data } = await admin.from('likes').select('philosopher,count').in('philosopher', names);
        (data || []).forEach(r => { out[r.philosopher] = r.count; });
      }
      names.forEach(n => { if (out[n] == null) out[n] = 0; });
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      const philosopher = (body && body.philosopher || '').toString().slice(0, 120);
      let delta = Number(body && body.delta);
      if (!philosopher) return res.status(400).json({ error: 'no_philosopher' });
      delta = delta > 0 ? 1 : -1; // 一度に±1だけ

      // 現在値を読んで更新（この規模では十分。厳密な原子性が必要になればRPCへ）
      const { data: cur } = await admin.from('likes').select('count').eq('philosopher', philosopher).maybeSingle();
      const next = Math.max(0, ((cur && cur.count) || 0) + delta);
      await admin.from('likes').upsert({ philosopher, count: next, updated_at: new Date().toISOString() });
      return res.status(200).json({ philosopher, count: next });
    }

    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
