// リポジトリ内の置き場所: /api/p.js
// 役割: /p/<slug> を書き換えでここに送り、哲学者ごとのSEO/共有ページHTMLをサーバー生成して返す。
//   vercel.json の rewrites: { source: "/p/:slug", destination: "/api/p?slug=:slug" }
import { BY } from './_data.js';

const BASE = 'https://philosophia-psi.vercel.app';
const CATLABEL = { 'west-ancient':'西洋古代','west-medieval':'西洋中世','west-modern':'西洋近代','west-contemporary':'西洋現代','east':'東洋','islamic-jewish':'イスラーム・ユダヤ' };
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function enc(s){ return encodeURIComponent(s); }
function descOf(p){ const t=(p.summary||p.easy||'').replace(/\s+/g,' '); return t.length>118 ? t.slice(0,116)+'…' : t; }

function render(p){
  const url = BASE + '/p/' + p.slug;
  const cat = CATLABEL[p.category] || '';
  const d = descOf(p);
  const imgUrl = p.img ? ('https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(p.img)+'?width=500') : '';
  const ogImg = imgUrl || (BASE+'/icon-512.png');
  const ch = esc((p.name||'？').trim().charAt(0));
  const hue = (function(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%360;})(p.name||'');
  const portrait = imgUrl
    ? '<img class="portrait" src="'+imgUrl+'" alt="'+esc(p.name)+'の肖像" loading="lazy" width="132" height="132">'
    : '<div class="portrait ph-ph" style="background:linear-gradient(135deg,hsl('+hue+' 45% 32%),hsl('+((hue+40)%360)+' 50% 20%))">'+ch+'</div>';
  const kw = [p.name, p.en].concat((p.concepts||[]).slice(0,4).map(c=>c.t)).map(esc).join(',');
  const ld = { '@context':'https://schema.org','@type':'Person','name':p.name,'alternateName':p.en||undefined,'description':d,'url':url,'jobTitle':'哲学者','nationality':p.country||undefined };
  const relHTML = (p.rels||[]).map(r=>{
    const label = esc(r.to) + (r.how ? '（'+esc(r.how)+(r.theme?'・'+esc(r.theme):'')+'）' : '');
    const link = r.slug ? '<a href="/p/'+r.slug+'">'+label+'</a>' : label;
    return '    <li>'+link+'：'+esc(r.desc||'')+'</li>';
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)}（${esc(p.en||'')}）とは｜思想をわかりやすく解説 - Philosophia</title>
<meta name="description" content="${esc(d)}">
<meta name="keywords" content="${kw}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.name)}（${esc(p.en||'')}）｜思想をやさしく解説">
<meta property="og:description" content="${esc(d)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogImg}">
<meta property="og:site_name" content="Philosophia 哲学の泉">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.name)}（${esc(p.en||'')}）｜思想をやさしく解説">
<meta name="twitter:description" content="${esc(d)}">
<meta name="twitter:image" content="${ogImg}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/icon-180.png">
<meta name="theme-color" content="#0a0a0a">
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#eaeaea;font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,system-ui,sans-serif;line-height:1.85}
a{color:#e8c672;text-decoration:none}a:hover{text-decoration:underline}
header{position:sticky;top:0;background:rgba(10,10,10,.92);backdrop-filter:blur(8px);border-bottom:1px solid #2c2c2c;padding:13px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;z-index:5}
header .brand{font-weight:800;font-size:18px;color:#f4dfa0}
header .r{margin-left:auto;display:flex;gap:14px;align-items:center}
header .cta{background:#e8c672;color:#111;font-weight:800;font-size:13px;padding:8px 15px;border-radius:20px}
header .cta:hover{text-decoration:none;opacity:.9}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 70px}
.crumb{font-size:12.5px;color:#9a9a9a;margin-bottom:14px}
h1{font-size:29px;color:#fff;line-height:1.4}
h1 .en{font-size:14px;color:#8f8f8f;font-weight:400;margin-left:8px}
.meta{font-size:13px;color:#9a9a9a;margin:6px 0 16px}
.p-head{display:flex;gap:20px;align-items:center;margin-bottom:4px}
.portrait{width:132px;height:132px;border-radius:16px;object-fit:cover;flex:none;border:1px solid #2a2a2a;background:#161616}
.ph-ph{display:grid;place-items:center;font-size:54px;font-weight:800;color:rgba(255,255,255,.92)}
.p-headinfo{min-width:0}
.p-headinfo h1{font-size:27px}
@media(max-width:520px){.p-head{gap:14px}.portrait{width:96px;height:96px;border-radius:14px}.ph-ph{font-size:40px}}
blockquote{border-left:3px solid #7b5cff;padding:6px 0 6px 14px;color:#cfc6ff;font-size:16px;margin:16px 0}
.easy{background:rgba(232,198,114,.10);border:1px solid #3a3222;border-radius:12px;padding:13px 16px;margin:16px 0;font-size:14.5px;color:#efe3c4}
section{margin-top:26px}
section h2{font-size:18px;color:#f4dfa0;border-left:4px solid #e8c672;padding-left:11px;margin-bottom:9px}
section p{font-size:15px;color:#e2e2e2}
.kw{list-style:none;display:flex;flex-direction:column;gap:8px}
.kw li{background:#161616;border:1px solid #262626;border-radius:10px;padding:10px 13px;font-size:14px}
.kw b{color:#c9b8ff}
.rel{list-style:none;display:flex;flex-direction:column;gap:9px}
.rel li{font-size:14px;color:#dcdcdc}
.cta{margin-top:34px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;padding:20px}
.cta-main{display:block;background:linear-gradient(180deg,#f4dfa0,#e8c672);color:#1a1408;font-weight:800;text-align:center;padding:14px;border-radius:26px;font-size:15px}
.cta-main:hover{text-decoration:none;opacity:.92}
.cta-sub{display:block;text-align:center;margin-top:12px;font-size:14px;color:#c9b8ff}
.back{margin-top:26px;font-size:14px}
footer{border-top:1px solid #2c2c2c;margin-top:50px;padding:24px 20px;text-align:center;color:#888;font-size:12.5px}
</style>
</head>
<body>
<header>
  <a class="brand" href="/philosophia.html">Φ Philosophia</a>
  <div class="r">
    <a href="/guide.html">哲学者一覧</a>
    <a class="cta" href="/philosophia.html#${enc(p.name)}">アプリで開く →</a>
  </div>
</header>
<main class="wrap">
  <nav class="crumb"><a href="/guide.html">哲学者一覧</a> › ${esc(cat)}</nav>
  <div class="p-head">
    ${portrait}
    <div class="p-headinfo">
      <h1>${esc(p.name)}${p.en?`<span class="en">${esc(p.en)}</span>`:''}</h1>
      <p class="meta">${esc(p.era||'')}${p.country?`　/　${esc(p.country)}`:''}　/　${esc(cat)}</p>
    </div>
  </div>
  ${p.quote?`<blockquote>「${esc(p.quote)}」</blockquote>`:''}
  ${p.easy?`<div class="easy">💡 ${esc(p.easy)}</div>`:''}
  <section><h2>何を言っていたか</h2><p>${esc(p.summary||'')}</p></section>
  ${p.system?`<section><h2>どういう思想体系を作ったか</h2><p>${esc(p.system)}</p></section>`:''}
  ${(p.concepts&&p.concepts.length)?`<section><h2>キーワード</h2><ul class="kw">${p.concepts.map(c=>`<li><b>${esc(c.t)}</b> ― ${esc(c.d||'')}</li>`).join('')}</ul></section>`:''}
  ${(p.rels&&p.rels.length)?`<section><h2>つながり（関係性）</h2><ul class="rel">
${relHTML}
  </ul></section>`:''}
  <div class="cta">
    <a class="cta-main" href="/philosophia.html#${enc(p.name)}">▶ インタラクティブ版で${esc(p.name)}をさらに詳しく（キーワード解説・年表・つながり）</a>
    <a class="cta-sub" href="/members.html">🔒 会員限定の深掘り解説を読む（1日無料）</a>
  </div>
  <p class="back"><a href="/guide.html">← ほかの哲学者を見る（全${Object.keys(BY).length}人）</a></p>
</main>
<footer>Philosophia｜哲学を、体系的に。　<a href="/philosophia.html">インタラクティブ版</a>　/　<a href="/guide.html">一覧</a></footer>
</body>
</html>`;
}

export default function handler(req, res){
  const slug = (req.query && req.query.slug ? String(req.query.slug) : '').replace(/\.html$/,'');
  const p = BY[slug];
  if(!p){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.status(404).send('<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>見つかりません - Philosophia</title></head><body style="background:#0a0a0a;color:#eee;font-family:system-ui;text-align:center;padding:60px"><h1>ページが見つかりません</h1><p><a href="/guide.html" style="color:#e8c672">哲学者一覧へ</a></p></body></html>');
    return;
  }
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(render(p));
}
