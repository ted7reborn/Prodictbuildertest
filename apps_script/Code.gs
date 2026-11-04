/**
 * AMPLE:N アメブロ連載 — Google Drive 업로드 수신용 Apps Script
 * 1) 위쪽 함수 선택에서 setup 을 고르고 ▶실행 → 실행 로그에 나온 토큰을 복사
 * 2) 배포 > 새 배포 > 웹 앱 (실행: 나 / 액세스: 모든 사용자)
 */
var ROOT_FOLDER_ID = '1xW61r7RXsvBaRpwGglnWLNi5MWKCzEPX'; // 「AMPLE:N アメブロ連載」 폴더

// 처음 한 번만 실행: 폴더 ID 저장 + 업로드 토큰 자동 생성
function setup() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('ROOT_FOLDER_ID', ROOT_FOLDER_ID);
  var token = props.getProperty('UPLOAD_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('UPLOAD_TOKEN', token);
  }
  DriveApp.getFolderById(ROOT_FOLDER_ID); // 폴더 접근 권한 확인
  var check = DocumentApp.create('권한확인용'); // 문서 작성 권한 확인
  DriveApp.getFileById(check.getId()).setTrashed(true);
  Logger.log('설정 완료! 아래 토큰을 복사하세요 (DRIVE_UPLOAD_TOKEN):');
  Logger.log(token);
}
function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var req = JSON.parse(e.postData.contents);
  if (!req.token || req.token !== props.getProperty('UPLOAD_TOKEN')) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  var folder = DriveApp.getFolderById(props.getProperty('ROOT_FOLDER_ID'));
  (req.folderPath || []).forEach(function (name) { folder = child_(folder, name); });

  var results = [];
  (req.files || []).forEach(function (f) {
    // 같은 이름 파일은 휴지통으로 옮기고 새로 저장 (재업로드 대응)
    var old = folder.getFilesByName(f.name);
    while (old.hasNext()) old.next().setTrashed(true);
    var created;
    if (f.docText !== undefined) {
      created = makeDoc_(folder, f.name, f.docText);
    } else {
      created = folder.createFile(Utilities.newBlob(Utilities.base64Decode(f.base64), f.mimeType, f.name));
    }
    results.push({ name: f.name, id: created.getId(), url: created.getUrl() });
  });
  return json_({ ok: true, folderUrl: folder.getUrl(), files: results });
}

// 원고 텍스트(# 제목, **굵게**)를 구글 문서로 만들기 — Drive API 불필요
function makeDoc_(folder, name, text) {
  var doc = DocumentApp.create(name);
  var body = doc.getBody();
  body.clear();
  text.split('\n').forEach(function (line) {
    var heading = line.indexOf('# ') === 0;
    if (heading) line = line.substring(2);
    var plain = '', bolds = [], re = /\*\*(.+?)\*\*/g, last = 0, m;
    while ((m = re.exec(line)) !== null) {
      plain += line.substring(last, m.index);
      bolds.push([plain.length, plain.length + m[1].length - 1]);
      plain += m[1];
      last = m.index + m[0].length;
    }
    plain += line.substring(last);
    var p = body.appendParagraph(plain);
    if (heading) p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    var t = p.editAsText();
    bolds.forEach(function (b) { if (b[1] >= b[0]) t.setBold(b[0], b[1], true); });
  });
  doc.saveAndClose();
  var file = DriveApp.getFileById(doc.getId());
  file.moveTo(folder);
  return file;
}

function child_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
