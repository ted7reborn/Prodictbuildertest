// Usage: node scripts/upload_to_drive.js output/posts/02_peptide "No.02_ペプチドショット2X"
// Env: DRIVE_UPLOAD_URL (Apps Script web app URL), DRIVE_UPLOAD_TOKEN
const fs = require('fs');
const path = require('path');

(async () => {
  const [, , postDir, folderName] = process.argv;
  const { DRIVE_UPLOAD_URL: url, DRIVE_UPLOAD_TOKEN: token } = process.env;
  if (!url || !token) throw new Error('DRIVE_UPLOAD_URL / DRIVE_UPLOAD_TOKEN 환경변수가 없습니다');
  const b64 = (p) => fs.readFileSync(p).toString('base64');
  const files = [];
  const html = path.join(postDir, 'post.html');
  if (fs.existsSync(html)) files.push({ name: `${folderName}_本文（コピペ用）`, asGoogleDoc: true, base64: b64(html) });
  const imgDir = path.join(postDir, 'images');
  for (const f of fs.readdirSync(imgDir).filter((f) => f.endsWith('.png')).sort()) {
    files.push({ name: f, mimeType: 'image/png', base64: b64(path.join(imgDir, f)) });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script는 preflight 없는 text/plain 권장
    body: JSON.stringify({ token, folderPath: [folderName], files }),
    redirect: 'follow',
  });
  const text = await res.text();
  let out;
  try { out = JSON.parse(text); } catch { throw new Error('응답 해석 실패: ' + text.slice(0, 300)); }
  if (!out.ok) throw new Error('업로드 실패: ' + out.error);
  console.log('폴더:', out.folderUrl);
  out.files.forEach((f) => console.log(' -', f.name, f.url));
})().catch((e) => { console.error(e.message); process.exit(1); });
