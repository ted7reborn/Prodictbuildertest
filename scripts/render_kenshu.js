// 「コリアナ社内研修ノート」用 手書き風カード生成
// Usage: node scripts/render_kenshu.js content/kenshu/00_prologue.js output/posts/kenshu00/images
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FONT = (f) => 'file://' + path.join(ROOT, 'assets/fonts', f);
const PHOTO = (f) => 'file://' + path.join(ROOT, 'assets/photos', f);
const W = 1080, H = 1350;

const css = (d) => `
@font-face{font-family:Klee;src:url('${FONT('KleeOne-SemiBold.ttf')}');font-weight:600}
@font-face{font-family:Klee;src:url('${FONT('KleeOne-Regular.ttf')}');font-weight:400}
@font-face{font-family:Yomogi;src:url('${FONT('Yomogi-Regular.ttf')}')}
*{box-sizing:border-box;margin:0;padding:0}
body{width:${W}px;height:${H}px;background:#fff;font-family:Klee;color:#333;position:relative;overflow:hidden}
.pad{position:absolute;inset:64px 76px}
.label{font-family:Yomogi;font-size:28px;color:#888;letter-spacing:2px;display:flex;justify-content:space-between}
.label b{color:${d.accent};font-weight:400}
.mark{position:relative;display:inline-block;z-index:1}
.mark:before{content:"";position:absolute;left:-12px;right:-12px;bottom:4px;height:44%;background:${d.color};opacity:.65;z-index:-1;border-radius:40% 60% 50% 40%/60% 40% 60% 50%;transform:rotate(-1.2deg)}
h1{font-size:68px;font-weight:600;line-height:1.3;margin-top:22px}
h2{font-size:44px;font-weight:600;line-height:1.35}
.sub{font-size:32px;color:#666;line-height:1.6;margin-top:14px}
.y{font-family:Yomogi}
.acc{color:${d.accent}}
.sk{position:absolute;pointer-events:none;overflow:visible;left:0;top:0}
.sk path,.sk ellipse,.sk circle{fill:none;stroke:#444;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:url(#rough)}
.rough,.roughA{position:relative}
.foot{position:absolute;left:76px;right:76px;bottom:40px;font-family:Yomogi;font-size:21px;color:#999;line-height:1.5}
.stamp{position:absolute;font-family:Yomogi;color:#c8463d;border:4px solid #c8463d;border-radius:14px 10px 16px 12px;padding:6px 20px;transform:rotate(-8deg);font-size:34px;letter-spacing:3px;background:rgba(255,255,255,.85)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:34px}
.stat{padding:26px 30px;min-height:220px}
.stat .n{font-size:84px;font-weight:600;color:${d.accent};line-height:1.1}
.stat .n small{font-size:34px}
.stat .t{font-size:32px;font-weight:600;margin-top:6px}
.stat .s{font-size:24px;color:#777;line-height:1.5;margin-top:6px}
.step{display:flex;gap:26px;align-items:flex-start;margin-top:30px}
.num{flex:0 0 74px;height:74px;position:relative;font-family:Yomogi;font-size:40px;color:${d.accent};display:flex;align-items:center;justify-content:center}
.step h3{font-size:40px;font-weight:600}
.step p{font-size:28px;color:#666;line-height:1.55;margin-top:4px}
.row{display:flex;align-items:center;gap:18px;padding:13px 0;border-bottom:2px dashed #ddd;font-size:31px}
.row .c{flex:0 0 470px}
.row .arr{color:#bbb;font-family:Yomogi}
.row .p{font-weight:600;color:${d.accent}}
`;

const defs = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="4.5"/></filter></defs></svg>`;
// 要素サイズを測って手書き枠・丸を描く
const js = (accent) => `document.fonts.ready.then(()=>{
document.querySelectorAll('.rough,.roughA').forEach(el=>{const w=el.offsetWidth,h=el.offsetHeight,c=el.classList.contains('roughA')?'${accent}':'#444';
const d='M6 8 Q'+w/2+' 2 '+(w-6)+' 6 Q'+(w-2)+' '+h/2+' '+(w-8)+' '+(h-6)+' Q'+w/2+' '+(h-1)+' 8 '+(h-8)+' Q3 '+h/2+' 6 8 M'+(w-28)+' 5 L'+(w-4)+' 12';
el.insertAdjacentHTML('afterbegin','<svg class="sk" width="'+w+'" height="'+h+'"><path style="stroke:'+c+'" d="'+d+'"/></svg>')});
document.querySelectorAll('.num').forEach(el=>el.insertAdjacentHTML('beforeend','<svg class="sk" width="74" height="74"><ellipse cx="37" cy="37" rx="33" ry="31" style="stroke:${accent}"/></svg>'));window.__done=true;});`;

const label = (d, page) => `<div class="label"><span>コリアナ社内研修ノート <b>#${d.no}</b></span><span>${page}</span></div>`;

module.exports = { css, defs, js, label, PHOTO, W, H };

if (require.main === module) {
  (async () => {
    const [, , specPath, outDir] = process.argv;
    const spec = require(path.resolve(specPath)); // { meta, cards: [{name, html(d)}], foot }
    const d = spec.meta;
    fs.mkdirSync(outDir, { recursive: true });
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    for (const card of spec.cards) {
      const html = path.join(outDir, `_${card.name}.html`);
      fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css(d)}</style></head><body>${defs}${card.html(d)}<div class="foot">${String(card.foot || spec.foot || '').split('　').map((x) => `<span style="white-space:nowrap">${x}</span>`).join('　')}</div><script>${js(d.accent)}</script></body></html>`);
      await page.goto('file://' + path.resolve(html), { waitUntil: 'load' });
      await page.waitForFunction(() => window.__done === true);
      const file = path.join(outDir, `${d.no}_kenshu_${card.name}.png`);
      await page.screenshot({ path: file });
      fs.unlinkSync(html);
      console.log(file);
    }
    await browser.close();
  })();
}
