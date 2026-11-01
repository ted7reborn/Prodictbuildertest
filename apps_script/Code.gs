/**
 * AMPLE:N アメブロ連載 — Google Drive 업로드 수신용 Apps Script
 * 1) 스크립트 속성(Script Properties)에 UPLOAD_TOKEN, ROOT_FOLDER_ID 를 저장
 * 2) 배포 > 새 배포 > 웹 앱 (실행: 나 / 액세스: 모든 사용자)
 */
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
    if (f.asGoogleDoc) {
      var blob = Utilities.newBlob(Utilities.base64Decode(f.base64), 'text/html', f.name + '.html');
      var file = Drive.Files.create({ name: f.name, mimeType: 'application/vnd.google-apps.document', parents: [folder.getId()] }, blob);
      created = DriveApp.getFileById(file.id);
    } else {
      created = folder.createFile(Utilities.newBlob(Utilities.base64Decode(f.base64), f.mimeType, f.name));
    }
    results.push({ name: f.name, id: created.getId(), url: created.getUrl() });
  });
  return json_({ ok: true, folderUrl: folder.getUrl(), files: results });
}

function child_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
