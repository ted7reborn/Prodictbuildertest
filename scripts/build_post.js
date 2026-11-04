// Usage: node scripts/build_post.js content/ampoules/02_peptide.json output/posts/02_peptide
// Env (optional): RAKUTEN_AFFILIATE_ID -> wraps product URL as a Rakuten affiliate link
const fs = require('fs');
const path = require('path');

const SAFE_EMOJI = { '🌿': '✿', '📒': '✎', '💧': '❁', '👇': '↓', '🙋‍♀️': '♪', '👑': '♛', '🎉': '☆' };
const safe = (s) => Object.entries(SAFE_EMOJI).reduce((t, [a, b]) => t.split(a).join(b), s)
  .replace(/[\u{10000}-\u{10FFFF}]/gu, ''); // drop any other 4-byte emoji (breaks in Google Docs)

function rakutenLink(url) {
  const id = process.env.RAKUTEN_AFFILIATE_ID;
  if (!id) return { url, affiliate: false };
  const e = encodeURIComponent(url);
  return { url: `https://hb.afl.rakuten.co.jp/hgc/${id}/?pc=${e}&m=${e}`, affiliate: true };
}

function buildMarkdown(d) {
  const link = rakutenLink(d.rakuten_url);
  const img = (n) => `[画像 ${d.no}_${d.slug}_${n}.png]`;
  const H = (t) => ['━━━━━━━━━━━━', `■ ${t}`, '━━━━━━━━━━━━', ''];
  const L = [];
  L.push('# タイトル', `【成分ノートNo.${d.no}】${d.name_ja}はいつ使う？日本のスキンケア順で解説｜AMPLE:N公式`, '');
  L.push('# ハッシュタグ（アメブロのハッシュタグ欄に入力）', d.hashtags.map((h) => '#' + h).join(' '), '');
  L.push('# 本文（ここから下をアメブロ編集画面に貼り付け）');
  L.push(link.affiliate ? '※本記事はAMPLE:N公式ブログです。記事内のリンクには広告（アフィリエイト）が含まれます。' : '※本記事はAMPLE:N公式ブログです。', '');
  L.push('こんにちは！', 'AMPLE:N（アンプルエヌ）公式スタッフです🌿', '');
  if (d.series_intro) {
    L.push('今日から新連載', '**「AMPLE:N 成分ノート」**がスタートします✍️', '',
      'AMPLE:Nのアンプルは', '**“肌悩みごとに、テーマ成分をギュッと1本に”**', 'がコンセプト。', '',
      'この連載では、1本ずつ', '✔ どんな成分が入っているの？', '✔ 日本のスキンケアのどのタイミングで使うの？', '✔ どんな肌悩みの方におすすめ？', 'を、手書きノート風にまとめていきます📒', '',
      '記念すべき第1回は…', `**${d.name_ja}**💧`, '');
  } else {
    L.push('**「AMPLE:N 成分ノート」**', 'アンプルを1本ずつ、手書きノート風にご紹介する連載です📒', '',
      `第${Number(d.no)}回は…`, `**${d.name_ja}**！`, '');
  }
  if (d.award) {
    L.push(img('0_award'), '', ...d.award.post_lines, '');
  }
  L.push(...H(`${d.name_short}ってどんなアンプル？`), img('1_ingredients'), '');
  L.push(`テーマは**${d.theme}**。`, '');
  L.push('ポイントの成分はこちら👇', '');
  d.ingredients.forEach((g, i) => {
    L.push(`${'①②③④⑤'[i]} **${g.name.replace(/\n/g, '')}**（${g.tag}）`, ...g.post.split('\n'), '');
  });
  L.push(`テクスチャーは**${d.texture}**タイプ。`, d.texture_post, '');
  L.push(...H('いつ使う？日本のスキンケア順でチェック'), img('2_routine'), '');
  L.push('「アンプルって、化粧水の前？後？」', 'よくいただく質問です🙋‍♀️', '', '答えは…', '**化粧水のあと、乳液・クリームの前**！', '日本のスキンケアでいう**「美容液」のステップ**です。', '');
  L.push('1. クレンジング・洗顔', '2. 化粧水', `3. **${d.name_ja}** ←ココ！`, '4. 乳液・クリーム', '5. 日焼け止め（朝）', '');
  L.push('適量を手にとり、顔全体にやさしくなじませてください。', d.usage_tip, '');
  const mn = d.routine.morning && d.routine.night ? '**朝・夜どちらも◎**' : d.routine.night ? '**夜のケアがおすすめ**（朝使う日は日焼け止めを忘れずに）' : '**朝のケアにおすすめ**';
  L.push(`${d.name_short}は${mn}。`, '');
  L.push(...H('こんな肌悩みにおすすめ'), img('3_concerns'), '', ...d.concerns.map((c) => '☑ ' + c), '', 'ひとつでも当てはまったら、ぜひ試してほしいです💧', '');
  L.push(`**${d.pairing.with}**との組み合わせもおすすめ。`, ...d.pairing.tip.split('\n'), '');
  L.push(...H('今日のまとめ'), ...d.summary.map((s) => '💧 ' + s), '');
  L.push(`▼${d.name_ja}はこちら（コリアナコスメティックス公式店）`, link.url, '');
  if (d.next) L.push(`次回の成分ノートNo.${String(Number(d.no) + 1).padStart(2, '0')}は`, `**「${d.next}」**をご紹介予定です。`, 'お楽しみに🌿', '');
  L.push('AMPLE:N公式スタッフ', '', ...(d.award ? d.award.note.split('\n').filter((n) => !d.footnote.includes(n.replace('※', ''))) : []), ...d.footnote.split('　'), ...(d.cautions || []), '※肌に合わない場合はご使用をおやめください。');
  return safe(L.join('\n'));
}

function toHtml(md) {
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const body = md.split('\n').map((line) => {
    if (line.startsWith('# ')) return `<h2>${esc(line.slice(2))}</h2>`;
    let t = esc(line).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    t = t.replace(/\[(画像.+?)\]/g, '<span style="background:#eef6fb;color:#2f7fb8">【$1】</span>');
    t = t.replace(/^(https?:\/\/\S+)$/, '<a href="$1">$1</a>');
    return t + '<br>';
  }).join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}

const [, , jsonPath, outDir] = process.argv;
const d = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const md = buildMarkdown(d);
fs.writeFileSync(path.join(outDir, 'post.md'), md);
fs.writeFileSync(path.join(outDir, 'post.html'), toHtml(md));
console.log(path.join(outDir, 'post.md'));
