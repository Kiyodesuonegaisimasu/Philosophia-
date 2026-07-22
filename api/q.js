// リポジトリ内の置き場所: /api/q.js
// 役割: /q/<slug> を書き換えでここに送り、「診断結果シェア用」ページをサーバー生成して返す。
//   vercel.json の rewrites: { source: "/q/:slug", destination: "/api/q?slug=:slug" }
//   OG画像に本人の肖像が出るので、SNSで顔つきで拡散される。
import { BY } from './_data.js';

const BASE = 'https://philosophia-psi.vercel.app';
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function descOf(p){ const t=(p.easy||p.summary||'').replace(/\s+/g,' '); return t.length>96 ? t.slice(0,94)+'…' : t; }

function render(p){
  const url = BASE + '/q/' + p.slug;
  const imgUrl = p.img ? ('https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(p.img)+'?width=600') : (BASE+'/icon-512.png');
  const title = '私に近い哲学者は「'+p.name+'」でした｜哲学者診断';
  const d = descOf(p);
  const ld = { '@context':'https://schema.org','@type':'WebPage','name':title,'description':d,'url':url };
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} - Philosophia</title>
<meta name="description" content="${esc(d)} 6つの質問であなたに近い哲学者がわかります。無料・登録不要。">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="あなたはどの哲学者に近い？6つの質問で診断できます。">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imgUrl}">
<meta property="og:site_name" content="Philosophia 哲学の泉">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="あなたはどの哲学者に近い？6つの質問で診断できます。">
<meta name="twitter:image" content="${imgUrl}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/icon-180.png">
<meta name="theme-color" content="#0a0a0a">
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#eaeaea;font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,system-ui,sans-serif;line-height:1.8}
a{color:#e8c672;text-decoration:none}a:hover{text-decoration:underline}
header{border-bottom:1px solid #2c2c2c;padding:13px 20px;display:flex;align-items:center;gap:14px}
header .brand{font-weight:800;font-size:17px;color:#f4dfa0}
header .r{margin-left:auto;font-size:13.5px}
.wrap{max-width:620px;margin:0 auto;padding:30px 20px 70px;text-align:center}
.label{font-size:12.5px;letter-spacing:.2em;color:#8a7a52;font-weight:700}
.card{background:linear-gradient(170deg,#171717,#101010);border:1px solid #2c2c2c;border-radius:20px;padding:28px 24px;margin-top:16px}
.portrait{width:136px;height:136px;border-radius:50%;object-fit:cover;border:3px solid #e8c672;display:block;margin:14px auto 0;background:#181818}
h1{font-size:28px;color:#fff;margin-top:15px;line-height:1.35}
.en{font-size:13px;color:#8f8f8f;margin-top:3px}
.era{font-size:12.5px;color:#7e7e7e}
blockquote{border-left:3px solid #7b5cff;text-align:left;padding:7px 0 7px 14px;color:#cfc6ff;font-size:15px;margin:20px 0 0}
.desc{text-align:left;font-size:14.5px;color:#dcdcdc;margin-top:15px}
.cta{display:block;background:linear-gradient(180deg,#f4dfa0,#e8c672);color:#1a1408;font-weight:800;padding:15px;border-radius:28px;font-size:16px;margin-top:26px}
.cta:hover{text-decoration:none;opacity:.92}
.cta2{display:block;margin-top:13px;font-size:14.5px;color:#c9b8ff}
footer{border-top:1px solid #2c2c2c;margin-top:44px;padding:22px 20px;text-align:center;color:#888;font-size:12.5px}
@media(max-width:520px){h1{font-size:24px}}
</style>
</head>
<body>
<header>
  <a class="brand" href="/philosophia.html">Φ Philosophia</a>
  <div class="r"><a href="/guide.html">哲学者一覧</a></div>
</header>
<main class="wrap">
  <div class="label">哲学者診断の結果</div>
  <div class="card">
    <img class="portrait" src="${imgUrl}" alt="${esc(p.name)}の肖像" width="136" height="136">
    <h1>${esc(p.name)}</h1>
    <div class="en">${esc(p.en||'')}</div>
    <div class="era">${esc(p.era||'')}</div>
    ${p.quote?`<blockquote>「${esc(p.quote)}」</blockquote>`:''}
    ${d?`<p class="desc">${esc(d)}</p>`:''}
  </div>
  <a class="cta" href="/quiz.html">あなたに近い哲学者も診断する（1分・無料）→</a>
  <a class="cta2" href="/p/${p.slug}">${esc(p.name)}の思想をくわしく読む</a>
</main>
<footer>Philosophia｜哲学を、体系的に。　<a href="/philosophia.html">インタラクティブ版</a>　/　<a href="/guide.html">哲学者一覧</a></footer>
</body>
</html>`;
}

export default function handler(req, res){
  const slug = (req.query && req.query.slug ? String(req.query.slug) : '').replace(/\.html$/,'');
  const p = BY[slug];
  if(!p){
    res.writeHead(302, { Location: '/quiz.html' });
    res.end();
    return;
  }
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(render(p));
}
