// リポジトリ内の置き場所: /api/deep.js
// 役割: /deep/<slug> ＝ 診断結果の哲学者を「深める」ページ。
//   vercel.json の rewrites: { source: "/deep/:slug", destination: "/api/deep?slug=:slug" }
//   ?v=a,b,c,d で診断の4軸ベクトルを受け取ると「なぜあなたに」「最も遠い思想」が出る。
//   個人向けページのため noindex（/p/ と内容が重複するのを避ける）。
import { BY, P } from './_data.js';
import { ASK } from './_ask.js';
import { LV } from './_levels.js';
import { VEC } from './_vec.js';
import { LIFE } from './_life.js';

const BASE = 'https://philosophia-psi.vercel.app';
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function enc(s){ return encodeURIComponent(s); }
function imgOf(f,w){ return f ? 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f)+'?width='+(w||400) : ''; }
function hue(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h%360; }

/* 4軸：あなたの回答と、この哲学者の立ち位置を照合する文 */
const AXIS_TEXT = [
  { neg:'あなたは判断のよりどころを「筋道を立てて考えること」の側に置きました。{N}もまた、理性を信じた人です。',
    pos:'あなたは判断のよりどころを「心の動き」の側に置きました。{N}もまた、理性より意志や情熱を信じた人です。' },
  { neg:'あなたはよく生きることを「自分の内面」に見ました。{N}も、群れではなく一人の生き方を問いました。',
    pos:'あなたはよく生きることを「社会との関わり」に見ました。{N}も、人は共同体の中でこそ人になると考えました。' },
  { neg:'あなたは本当のことが「この現実の中」にあると答えました。{N}も、経験と現実から出発した人です。',
    pos:'あなたは本当のことが「現実の奥」にあると答えました。{N}も、目に見えるものの背後を見ようとしました。' },
  { neg:'あなたは秩序と体系のほうを選びました。{N}も、揺るがない筋の通った枠組みを築いた人です。',
    pos:'あなたは「まず疑う」を選びました。{N}も、当たり前を壊すところから始めた人です。' }
];

function parseVec(q){
  if(!q) return null;
  const a = String(q).split(',').map(Number);
  if(a.length!==4 || a.some(x=>!isFinite(x))) return null;
  return a.map(x=>Math.max(-2.5,Math.min(2.5,x)));
}
function cosSim(a,b){
  let d=0,x=0,y=0;
  for(let i=0;i<4;i++){ d+=a[i]*b[i]; x+=a[i]*a[i]; y+=b[i]*b[i]; }
  return (x>0&&y>0) ? d/Math.sqrt(x*y) : 0;
}
function whyText(u, pv, name){
  const out=[];
  for(let i=0;i<4;i++){
    if(Math.abs(u[i])<0.35 || Math.abs(pv[i])<1) continue;
    if((u[i]>0) !== (pv[i]>0)) continue;
    out.push((u[i]>0?AXIS_TEXT[i].pos:AXIS_TEXT[i].neg).replace('{N}', name));
  }
  return out;
}
function farthest(u, selfName){
  let best=null, bv=2;
  for(const [n,o] of Object.entries(VEC)){
    if(n===selfName) continue;
    const c=cosSim(u,o.v);
    if(c<bv){ bv=c; best={name:n, slug:o.s, c:c}; }
  }
  return best;
}

function render(p, u){
  const url = BASE + '/deep/' + p.slug;
  const im = imgOf(p.img,400);
  const ask = ASK[p.name];
  const lv = LV[p.name];
  const life = LIFE[p.name];
  const why = u ? whyText(u, (VEC[p.name]||{}).v || [0,0,0,0], p.name) : [];
  const far = u ? farthest(u, p.name) : null;
  const farP = far ? BY[far.slug] : null;
  const farAsk = farP ? ASK[farP.name] : null;

  const portrait = im
    ? '<img class="por" src="'+im+'" alt="'+esc(p.name)+'の肖像" width="130" height="130">'
    : '<div class="por ph" style="background:linear-gradient(135deg,hsl('+hue(p.name)+' 45% 32%),hsl('+((hue(p.name)+40)%360)+' 50% 20%))">'+esc(p.name.charAt(0))+'</div>';

  // 深める段階：levels があれば初級/中級/上級、無ければ2段
  let stages;
  if(lv && lv.beg && lv.adv){
    stages = [
      {t:'初級', s:'まずここから', b:lv.beg},
      {t:'中級', s:'何を言っていたか', b:p.summary||''},
      {t:'上級', s:'思想の構造', b:lv.adv}
    ];
  } else {
    stages = [
      {t:'まず', s:'何を言っていたか', b:p.summary||''},
      {t:'つぎに', s:'どういう思想体系を作ったか', b:p.system||''}
    ].filter(x=>x.b);
  }

  const rels = (p.rels||[]).filter(r=>r.slug).slice(0,3);

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)}を深く知る｜あなたの哲学者 - Philosophia</title>
<meta name="description" content="${esc(p.name)}の思想を、問い・核心概念・段階的な解説でたどります。">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.name)}を深く知る｜Philosophia">
<meta property="og:description" content="${ask?esc(ask.q):esc(p.name)+'の思想をたどる。'}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${im||BASE+'/icon-512.png'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<meta name="theme-color" content="#0a0a0a">
<script defer src="/_vercel/insights/script.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0a;color:#eaeaea;font-family:"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,system-ui,sans-serif;line-height:1.86;-webkit-font-smoothing:antialiased}
a{color:#e8c672;text-decoration:none}a:hover{text-decoration:underline}
header{position:sticky;top:0;background:rgba(10,10,10,.94);backdrop-filter:blur(8px);border-bottom:1px solid #2c2c2c;padding:12px 20px;display:flex;align-items:center;gap:14px;z-index:9}
header .brand{font-weight:800;font-size:17px;color:#f4dfa0}
header .r{margin-left:auto;display:flex;gap:14px;font-size:13.5px}
.wrap{max-width:700px;margin:0 auto;padding:26px 20px 70px}
.hero{text-align:center}
.lb{font-size:12px;letter-spacing:.2em;color:#8a7a52;font-weight:700}
.por{width:130px;height:130px;border-radius:50%;object-fit:cover;border:3px solid #e8c672;display:block;margin:15px auto 0;background:#181818}
.por.ph{display:grid;place-items:center;font-size:52px;font-weight:800;color:rgba(255,255,255,.92)}
h1{font-size:30px;color:#fff;margin-top:14px;line-height:1.34}
.en{font-size:13px;color:#8f8f8f}.era{font-size:12.5px;color:#7e7e7e}
.quote{border-left:3px solid #7b5cff;text-align:left;padding:8px 0 8px 15px;color:#cfc6ff;font-size:15.5px;margin:20px 0 0}
sec,section{display:block}
.sec{margin-top:34px}
.sec>h2{font-size:16px;color:#f4dfa0;border-left:4px solid #e8c672;padding-left:11px;margin-bottom:13px}
.why{background:rgba(232,198,114,.07);border:1px solid #3a3222;border-radius:14px;padding:16px 18px}
.why p{font-size:14.5px;color:#efe3c4;margin-bottom:9px}.why p:last-child{margin-bottom:0}
.askbox{background:linear-gradient(165deg,#1b1830,#111017);border:1px solid #4a3a86;border-radius:18px;padding:24px 22px;text-align:center}
.askbox .mark{font-size:30px;color:#7b5cff;line-height:1}
.askbox .q{font-size:19.5px;color:#fff;font-weight:700;line-height:1.6;margin-top:10px}
.askbox .w{font-size:13.5px;color:#a99fd6;margin-top:14px;text-align:left;border-top:1px solid #33305a;padding-top:13px}
.life{background:linear-gradient(165deg,#141b17,#101512);border:1px solid #2a4034;border-radius:16px;padding:20px 20px}
.life .scene{font-size:14px;color:#8fd3a8;font-weight:700;line-height:1.7;margin-bottom:12px}
.life p{font-size:15px;color:#e6ede8;line-height:1.95}
.life .step{margin-top:16px;background:rgba(143,211,168,.09);border:1px solid #2f5a41;border-radius:12px;padding:13px 15px;font-size:14px;color:#dbeee2;line-height:1.75}
.life .step .sl{display:inline-block;background:#8fd3a8;color:#0c1a12;font-size:11px;font-weight:800;border-radius:8px;padding:2px 9px;margin-right:9px;vertical-align:2px}
.kw{list-style:none;display:flex;flex-direction:column;gap:9px}
.kw li{background:#151515;border:1px solid #262626;border-radius:11px;padding:11px 14px;font-size:14px;color:#dcdcdc}
.kw b{color:#c9b8ff}
.stage{background:#131313;border:1px solid #242424;border-radius:13px;padding:14px 16px;margin-bottom:11px}
.stage .tag{display:inline-block;background:#e8c672;color:#1a1408;font-size:11px;font-weight:800;border-radius:9px;padding:2px 9px;vertical-align:2px}
.stage .st{font-size:13px;color:#9a9a9a;margin-left:8px}
.stage p{font-size:14.5px;color:#e2e2e2;margin-top:9px}
.far{background:#141414;border:1px solid #3a2727;border-radius:16px;padding:18px}
.far .fh{display:flex;align-items:center;gap:13px}
.far img,.far .fp{width:56px;height:56px;border-radius:50%;object-fit:cover;flex:none;background:#222}
.far .fp{display:grid;place-items:center;font-size:22px;font-weight:800;color:rgba(255,255,255,.9)}
.far .fn{font-size:17px;font-weight:800;color:#fff}
.far .fs{font-size:12.5px;color:#9a8a8a}
.far .fq{font-size:14.5px;color:#e8d5d5;margin-top:13px;border-top:1px solid #3a2727;padding-top:12px}
.far .fl{display:inline-block;margin-top:12px;font-size:13.5px}
.rel{list-style:none;display:flex;flex-direction:column;gap:9px}
.rel a{display:block;background:#151515;border:1px solid #262626;border-radius:11px;padding:11px 14px;color:#e4e4e4;font-size:14px}
.rel a:hover{border-color:#e8c672;text-decoration:none}
.rel .rn{font-weight:700;color:#fff}
.cta{margin-top:34px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;padding:20px}
.cta-main{display:block;background:linear-gradient(180deg,#f4dfa0,#e8c672);color:#1a1408;font-weight:800;text-align:center;padding:14px;border-radius:26px;font-size:15px}
.cta-main:hover{text-decoration:none;opacity:.92}
.cta-sub{display:block;text-align:center;margin-top:12px;font-size:14px;color:#c9b8ff}
.back{margin-top:24px;font-size:13.5px;text-align:center}
footer{border-top:1px solid #2c2c2c;margin-top:46px;padding:22px 20px;text-align:center;color:#888;font-size:12.5px}
@media(max-width:520px){h1{font-size:25px}.askbox .q{font-size:17px}.wrap{padding:20px 15px 60px}}
</style>
</head>
<body>
<header>
  <a class="brand" href="/philosophia.html">Φ Philosophia</a>
  <div class="r"><a href="/quiz.html">診断</a><a href="/guide.html">一覧</a></div>
</header>

<main class="wrap">
  <div class="hero">
    <div class="lb">${u?'あなたの哲学者':'この哲学者を深く知る'}</div>
    ${portrait}
    <h1>${esc(p.name)}</h1>
    <div class="en">${esc(p.en||'')}</div>
    <div class="era">${esc(p.era||'')}</div>
    ${p.quote?`<blockquote class="quote">「${esc(p.quote)}」</blockquote>`:''}
  </div>

  ${why.length?`<div class="sec"><h2>なぜ、あなたにこの人なのか</h2>
    <div class="why">${why.map(t=>'<p>'+esc(t)+'</p>').join('')}</div></div>`:''}

  ${ask?`<div class="sec"><h2>${esc(p.name)}が、あなたに投げ返す問い</h2>
    <div class="askbox">
      <div class="mark">?</div>
      <div class="q">${esc(ask.q)}</div>
      <div class="w">${esc(ask.w)}</div>
    </div></div>`:''}

  ${life?`<div class="sec"><h2>この考えを、あなたの毎日で</h2>
    <div class="life">
      <div class="scene">${esc(life.scene)}</div>
      <p>${esc(life.body)}</p>
      ${life.step?`<div class="step"><span class="sl">今日の一歩</span>${esc(life.step)}</div>`:''}
    </div></div>`:''}

  ${(p.concepts&&p.concepts.length)?`<div class="sec"><h2>思想の核心</h2>
    <ul class="kw">${p.concepts.map(c=>'<li><b>'+esc(c.t)+'</b> ― '+esc(c.d||'')+'</li>').join('')}</ul></div>`:''}

  ${stages.length?`<div class="sec"><h2>段階で深める</h2>
    ${stages.map(s=>'<div class="stage"><span class="tag">'+esc(s.t)+'</span><span class="st">'+esc(s.s)+'</span><p>'+esc(s.b)+'</p></div>').join('')}</div>`:''}

  ${(far&&farP)?`<div class="sec"><h2>あなたから、最も遠い思想</h2>
    <div class="far">
      <div class="fh">
        ${farP.img?'<img src="'+imgOf(farP.img,120)+'" alt="">':'<div class="fp" style="background:linear-gradient(135deg,hsl('+hue(farP.name)+' 45% 32%),hsl('+((hue(farP.name)+40)%360)+' 50% 20%))">'+esc(farP.name.charAt(0))+'</div>'}
        <div><div class="fn">${esc(farP.name)}</div><div class="fs">${esc(farP.era||'')}</div></div>
      </div>
      ${farAsk?`<div class="fq">「${esc(farAsk.q)}」</div>`:''}
      <a class="fl" href="/p/${farP.slug}">この思想を見にいく →</a>
    </div>
    <p style="font-size:13px;color:#8f8f8f;margin-top:11px">似た思想だけを読んでも、視界は広がりません。最も反発を覚える相手こそ、あなたの前提を映す鏡になります。</p>
    </div>`:''}

  ${rels.length?`<div class="sec"><h2>次に読むなら</h2>
    <ul class="rel">${rels.map(r=>'<li><a href="/p/'+r.slug+'"><span class="rn">'+esc(r.to)+'</span>'+(r.how?'（'+esc(r.how)+'）':'')+'<br>'+esc(r.desc||'')+'</a></li>').join('')}</ul></div>`:''}

  <div class="cta">
    <a class="cta-main" href="/members.html">🔒 ${esc(p.name)}の深掘り解説を読む（1日無料）</a>
    <a class="cta-sub" href="/philosophia.html#${enc(p.name)}">インタラクティブ版で開く（年表・つながり）</a>
  </div>

  <p class="back"><a href="/quiz.html">← もう一度、診断する</a>　/　<a href="/p/${p.slug}">${esc(p.name)}の基本ページ</a></p>
</main>

<footer>Philosophia｜哲学を、体系的に。　<a href="/philosophia.html">インタラクティブ版</a>　/　<a href="/era.html">その年、世界では</a></footer>
</body>
</html>`;
}

export default function handler(req, res){
  const q = req.query || {};
  const slug = (q.slug ? String(q.slug) : '').replace(/\.html$/,'');
  const p = BY[slug];
  if(!p){
    res.writeHead(302, { Location: '/quiz.html' });
    res.end();
    return;
  }
  const u = parseVec(q.v);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(render(p, u));
}
