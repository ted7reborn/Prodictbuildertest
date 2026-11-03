// Usage: node scripts/render_cards.js content/ampoules/01_hyaluron.json out/dir
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FONT = (f) => 'file://' + path.join(ROOT, 'assets/fonts', f);
const W = 1080, H = 1350;
const foot = (s) => String(s).split('　').map((x) => `<span style="white-space:nowrap">${x}</span>`).join('　');
const nl = (s) => String(s).replace(/\n/g, '<br>');

const css = (d) => `
@font-face{font-family:Klee;src:url('${FONT('KleeOne-SemiBold.ttf')}');font-weight:600}
@font-face{font-family:Klee;src:url('${FONT('KleeOne-Regular.ttf')}');font-weight:400}
@font-face{font-family:Yomogi;src:url('${FONT('Yomogi-Regular.ttf')}')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;background:#fff;font-family:Klee;color:#333;position:relative;overflow:hidden}
.pad{position:absolute;inset:70px 80px}
.label{font-family:Yomogi;font-size:30px;color:#777;letter-spacing:2px}
.label b{color:${d.accent};font-weight:400}
.mark{position:relative;display:inline-block;z-index:1}
.mark:before{content:"";position:absolute;left:-14px;right:-14px;bottom:4px;height:46%;background:${d.color};opacity:.55;z-index:-1;border-radius:40% 60% 50% 40%/60% 40% 60% 50%;transform:rotate(-1.2deg)}
h1{font-size:78px;font-weight:600;line-height:1.25;margin-top:18px}
.en{font-family:Yomogi;font-size:28px;color:${d.accent};letter-spacing:4px;margin-top:6px}
.theme{font-size:40px;margin-top:22px}
.sk{position:absolute;pointer-events:none;overflow:visible}
.sk path,.sk circle,.sk rect,.sk line,.sk ellipse{fill:none;stroke:#444;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;filter:url(#rough)}
.ing{display:flex;align-items:flex-start;gap:26px;margin-top:34px}
.num{flex:0 0 76px;height:76px;position:relative;font-family:Yomogi;font-size:44px;color:${d.accent};display:flex;align-items:center;justify-content:center}
.ing h3{font-size:46px;font-weight:600;line-height:1.25}
.tag{display:inline-block;font-family:Yomogi;font-size:24px;color:${d.accent};border:2.5px solid ${d.accent};border-radius:30px 26px 32px 24px;padding:2px 16px;margin-left:12px;vertical-align:middle;transform:rotate(-2deg)}
.ing p{font-size:31px;line-height:1.6;color:#555;margin-top:8px;font-weight:400}
.foot{position:absolute;left:80px;right:80px;bottom:46px;font-family:Yomogi;font-size:22px;color:#999;line-height:1.5}
.brand{position:absolute;right:80px;bottom:90px;font-family:Yomogi;font-size:30px;color:#bbb;letter-spacing:3px}
.step{display:flex;align-items:center;gap:28px;height:118px;position:relative;padding-left:20px}
.step .t{font-size:42px;font-weight:600}
.step .s{font-size:27px;color:#888;font-weight:400}
.step.hi .t{font-size:50px}
.box{position:relative;padding:36px 44px;margin-top:30px}
.chk{font-size:38px;line-height:1.5;margin:20px 0;display:flex;gap:22px;align-items:flex-start}
.chk i{flex:0 0 44px;height:44px;position:relative;margin-top:6px}
.sun{font-family:Yomogi;font-size:34px}
`;

const defs = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4.5"/></filter>
</defs></svg>`;

// hand-drawn primitives (absolute positioned svg)
const sk = (x, y, w, h, inner, extra = '') =>
  `<svg class="sk" style="left:${x}px;top:${y}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${extra}>${inner}</svg>`;
const roughRect = (w, h, color = '#444') =>
  `<path style="stroke:${color}" d="M6 8 Q${w / 2} 2 ${w - 6} 6 Q${w - 2} ${h / 2} ${w - 8} ${h - 6} Q${w / 2} ${h - 1} 8 ${h - 8} Q3 ${h / 2} 6 8 M${w - 30} 5 L${w - 4} 12"/>`;

const doodles = {
  drop: (c) => `<path style="stroke:${c}" d="M60 10 C40 50 18 75 18 102 a42 42 0 0 0 84 0 C102 75 80 50 60 10Z"/><path d="M40 100 q2 18 18 24"/>`,
  ampoule: () => `<path d="M48 8 h24 v26 h-24z"/><path d="M44 34 h32 l6 14 v100 q0 10 -10 10 h-24 q-10 0 -10 -10 v-100z"/><path d="M50 80 h20 M50 92 h14"/>`,
};

function bottle(d) {
  return sk(880, 560, 140, 180, doodles.ampoule()) + sk(840, 760, 120, 150, doodles[d.doodle] ? doodles[d.doodle](d.accent) : '');
}

function card1(d) {
  const ings = d.ingredients.map((g, i) => `
    <div class="ing"><div class="num">${i + 1}${sk(0, 0, 76, 76, `<ellipse cx="38" cy="38" rx="34" ry="32" style="stroke:${d.accent}"/>`)}</div>
    <div><h3>${nl(g.name)}<span class="tag">${g.tag}</span></h3><p>${nl(g.desc)}</p></div></div>`).join('');
  return `<div class="pad">
    <div class="label">AMPLE:N 成分ノート <b>No.${d.no}</b></div>
    <h1><span class="mark">${d.name_ja.replace('アンプル', '</span><br><span style="font-size:60px">アンプル</span>')}</h1>
    <div class="en">${d.name_en}</div>
    <div class="theme">${d.theme}</div>
    <div style="position:relative;height:30px">${sk(0, 6, 920, 20, `<path d="M4 10 Q230 2 460 11 T916 8"/>`)}</div>
    <div style="margin-top:30px">${ings}</div>
    <div class="theme" style="font-size:32px;margin-top:46px;color:#666">テクスチャー：<span class="mark">${d.texture}</span></div>
  </div>${d.award ? stamp(d) : bottle(d)}<div class="foot">${foot(d.footnote)}</div>`;
}

function stamp(d) {
  return `<div style="position:absolute;right:60px;top:530px;width:250px;height:250px;transform:rotate(8deg);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#c8463d;text-align:center">
    ${sk(0, 0, 250, 250, `<circle cx="125" cy="125" r="115" style="stroke:#c8463d"/><circle cx="125" cy="125" r="102" style="stroke:#c8463d;stroke-width:2"/>`)}
    <div style="font-family:Yomogi;font-size:24px">${d.award.stamp_top}</div>
    <div style="font-size:64px;font-weight:600;line-height:1.1">${d.award.stamp_main}</div>
    <div style="font-family:Yomogi;font-size:30px">${d.award.stamp_sub}</div></div>`;
}

function cardAward(d) {
  const a = d.award;
  const G = '#d9a441';
  const branch = (flip) => {
    const leaves = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const t = i / 6, y = 330 - t * 290, x = 70 - Math.sin(t * Math.PI) * 45;
      return `<ellipse cx="${x - 26}" cy="${y}" rx="26" ry="11" transform="rotate(${-40 + t * 30} ${x - 26} ${y})" style="stroke:${G}"/><ellipse cx="${x + 22}" cy="${y - 14}" rx="24" ry="10" transform="rotate(${30 + t * 20} ${x + 22} ${y - 14})" style="stroke:${G}"/>`;
    }).join('');
    return `<g transform="${flip ? 'translate(140,0) scale(-1,1)' : ''}"><path style="stroke:${G}" d="M95 350 Q20 200 75 30"/>${leaves}</g>`;
  };
  const pts = (a.points || []).map((p) => `<div class="chk" style="justify-content:center;font-size:36px;margin:8px 0">${sk(0, 0, 0, 0, '')}<span style="color:${d.accent}">✓</span><span>${p}</span></div>`).join('');
  return `<div class="pad" style="text-align:center">
    <div class="label" style="text-align:left">AMPLE:N 成分ノート <b>No.${d.no}</b></div>
    <div style="font-size:44px;margin-top:40px">${a.lead}</div>
    <div style="position:relative;height:440px;margin-top:20px">
      ${sk(120, 30, 140, 360, branch(false))}${sk(660, 30, 140, 360, branch(true))}
      ${sk(250, 20, 420, 400, `<ellipse cx="210" cy="200" rx="195" ry="185" style="stroke:#c8463d"/><ellipse cx="210" cy="200" rx="178" ry="168" style="stroke:#c8463d;stroke-width:2"/>`)}
      <div style="position:absolute;left:0;right:0;top:115px">
        <div style="font-size:40px;color:#c8463d;font-family:Yomogi">${a.stamp_top}</div>
        <div style="font-size:120px;font-weight:600;line-height:1.15"><span class="mark">${a.stamp_main}</span></div>
        <div style="font-size:46px;color:#c8463d;font-family:Yomogi">${a.stamp_sub}</div>
      </div>
    </div>
    <h1 style="font-size:58px;margin-top:20px"><span class="mark">${d.name_ja}</span></h1>
    <div class="theme" style="font-size:34px;line-height:1.6;color:#555;margin-top:18px">${nl(a.message)}</div>
    <div style="margin-top:26px">${pts}</div>
  </div><div class="foot">${nl(a.note)}</div>`;
}

function card2(d) {
  const steps = [
    ['クレンジング・洗顔', '汚れをオフ'],
    ['化粧水', 'まずは肌をととのえる'],
    [d.name_ja.replace('アンプル', ''), 'AMPLE:N 美容液ステップ　適量を顔全体に', true],
    ['乳液・クリーム', 'うるおいにフタを'],
    ['日焼け止め', '朝のみ'],
  ];
  const rows = steps.map(([t, s, hi], i) => `
    <div class="step ${hi ? 'hi' : ''}" style="${hi ? `background:${d.color_soft};border-radius:30px 40px 34px 28px;margin:10px -20px;padding-left:40px;height:150px` : ''}">
      <div class="num" style="${hi ? '' : 'color:#999'}">${i + 1}${sk(0, 0, 76, 76, `<ellipse cx="38" cy="38" rx="33" ry="31" style="stroke:${hi ? d.accent : '#aaa'}"/>`)}</div>
      <div><div class="t">${hi ? `<span class="mark">${t}</span>` : t}</div><div class="s">${s}</div></div>
      ${hi ? sk(800, 50, 120, 70, `<path style="stroke:${d.accent}" d="M110 35 Q60 30 12 36 M30 18 L10 36 L32 54"/>`) + `<div style="position:absolute;right:34px;top:10px;font-family:Yomogi;font-size:30px;color:${d.accent};transform:rotate(-6deg)">ココ！</div>` : ''}
    </div>
    ${i < steps.length - 1 ? `<div style="height:24px;position:relative">${sk(48, -4, 40, 34, `<path style="stroke:#bbb" d="M20 2 V26 M10 18 L20 28 L30 18"/>`)}</div>` : ''}`).join('');
  return `<div class="pad">
    <div class="label">AMPLE:N 成分ノート <b>No.${d.no}</b></div>
    <h1 style="font-size:64px">いつ使う？<br><span class="mark">日本のスキンケア順</span>で</h1>
    <div style="margin-top:40px">${rows}</div>
    <div class="theme" style="font-size:36px;margin-top:40px">
      <span class="sun">☀ 朝 ${d.routine.morning ? '◎' : '△'}</span>　<span class="sun">☾ 夜 ${d.routine.night ? '◎' : '△'}</span>
      <div style="font-size:30px;color:#666;margin-top:10px">${d.routine.note}</div>
    </div>
  </div><div class="foot">${foot(d.footnote)}</div>`;
}

function card3(d) {
  const items = d.concerns.map((c) => `<div class="chk"><i>${sk(0, 0, 44, 44, `<rect x="3" y="3" width="38" height="38" rx="6"/><path style="stroke:${d.accent};stroke-width:5" d="M8 22 L19 34 L44 2"/>`)}</i><span>${c}</span></div>`).join('');
  return `<div class="pad">
    <div class="label">AMPLE:N 成分ノート <b>No.${d.no}</b></div>
    <h1 style="font-size:64px">こんな肌悩みに<br><span class="mark">おすすめ</span></h1>
    <div class="box rough">${items}</div>
    <div class="theme" style="font-size:40px;margin-top:56px">組み合わせるなら…</div>
    <div class="box" style="margin-top:16px;background:${d.color_soft};border-radius:36px 30px 40px 28px">
      <div style="font-size:44px;font-weight:600">${d.name_ja.replace('アンプル', '')} <span style="color:${d.accent}">＋</span> ${d.pairing.with}</div>
      <div style="font-size:32px;color:#555;margin-top:12px;line-height:1.6">${nl(d.pairing.tip)}</div>
    </div>
  </div><div class="foot">${foot(d.footnote)}</div>`;
}

const roughJs = `document.querySelectorAll('.rough').forEach(el=>{const w=el.offsetWidth,h=el.offsetHeight;const d='M6 8 Q'+w/2+' 2 '+(w-6)+' 6 Q'+(w-2)+' '+h/2+' '+(w-8)+' '+(h-6)+' Q'+w/2+' '+(h-1)+' 8 '+(h-8)+' Q3 '+h/2+' 6 8 M'+(w-30)+' 5 L'+(w-4)+' 12';el.insertAdjacentHTML('afterbegin','<svg class="sk" style="left:0;top:0" width="'+w+'" height="'+h+'"><path d="'+d+'"/></svg>')})`;

(async () => {
  const [, , jsonPath, outDir] = process.argv;
  const d = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const cards = { ...(d.award ? { '0_award': cardAward } : {}), '1_ingredients': card1, '2_routine': card2, '3_concerns': card3 };
  for (const [name, fn] of Object.entries(cards)) {
    const html = path.join(outDir, `_${name}.html`);
    fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css(d)}</style></head><body>${defs}${fn(d)}<script>${roughJs}</script></body></html>`);
    await page.goto('file://' + path.resolve(html), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = path.join(outDir, `${d.no}_${d.slug}_${name}.png`);
    await page.screenshot({ path: file });
    fs.unlinkSync(html);
    console.log(file);
  }
  await browser.close();
})();
