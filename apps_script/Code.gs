// Apps Script V14 - lưu kết quả thi online vào Google Sheets
// Sheet cần tên KETQUA. Triển khai dạng Web App, quyền truy cập: Bất kỳ ai.

const HEADERS_ = [
  'submitTime','studentId','studentName','className','examId','examTitle',
  'score','maxScore','choiceScore','truefalseScore','shortScore','essayScore','correct','total',
  'startTime','scoringRule','answers','detail','userAgent'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('KETQUA');
  if (!sheet) sheet = ss.insertSheet('KETQUA');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_);
  } else {
    const current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let changed = false;
    HEADERS_.forEach(h => {
      if (current.indexOf(h) === -1) { current.push(h); changed = true; }
    });
    if (changed) sheet.getRange(1, 1, 1, current.length).setValues([current]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getEssayFolder_() {
  const name = 'BaiLamTuLuanOnline';
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function saveEssayImagesToDrive_(data) {
  const detail = data.detail || [];
  if (!Array.isArray(detail)) return data;
  const folder = getEssayFolder_();
  detail.forEach(d => {
    if (d.type !== 'essay' || !Array.isArray(d.images)) return;
    d.images = d.images.map((img, i) => {
      try {
        if (!img || !img.dataUrl || img.error) return img;
        const m = String(img.dataUrl).match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (!m) return img;
        const mime = m[1];
        const ext = mime.indexOf('png') >= 0 ? 'png' : (mime.indexOf('webp') >= 0 ? 'webp' : 'jpg');
        const bytes = Utilities.base64Decode(m[2]);
        const fname = [data.examId || 'DE', data.className || 'LOP', data.studentId || 'HS', 'q' + d.id, (i+1)].join('_') + '.' + ext;
        const blob = Utilities.newBlob(bytes, mime, fname);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return {name: img.name || fname, type: mime, size: img.size || bytes.length, url: file.getUrl(), driveFileId: file.getId()};
      } catch (err) {
        return {name: img && img.name || ('image_' + (i+1)), error: String(err && err.message || err)};
      }
    });
  });
  return data;
}


function doGet(e) {
  const action = e && e.parameter && e.parameter.action || 'ping';
  const sheet = getSheet_();
  if (action === 'list') {
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return json_({success:true, results:[]});
    const headers = values.shift();
    const results = values.map(row => {
      const obj = {};
      headers.forEach((h,i) => obj[h] = row[i]);
      try { obj.partScores = {choice:Number(obj.choiceScore||0), truefalse:Number(obj.truefalseScore||0), short:Number(obj.shortScore||0), essay:Number(obj.essayScore||0)}; } catch(err) {}
      try { obj.answers = JSON.parse(obj.answers || '{}'); } catch(err) {}
      try { obj.detail = JSON.parse(obj.detail || '[]'); } catch(err) {}
      return obj;
    });
    return json_({success:true, results});
  }
  return json_({success:true, message:'Apps Script V14 đang hoạt động'});
}

function doPost(e) {
  try {
    let data = JSON.parse(e.postData.contents || '{}');
    data = saveEssayImagesToDrive_(data);
    const sheet = getSheet_();
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    const ps = data.partScores || {};
    const obj = {
      submitTime: data.submitTime || new Date().toISOString(),
      studentId: data.studentId || '', studentName: data.studentName || '', className: data.className || '',
      examId: data.examId || '', examTitle: data.examTitle || '', score: data.score || 0, maxScore: data.maxScore || 10,
      choiceScore: ps.choice || 0, truefalseScore: ps.truefalse || 0, shortScore: ps.short || 0, essayScore: ps.essay || 0,
      correct: data.correct || 0, total: data.total || 0, startTime: data.startTime || '', scoringRule: data.scoringRule || '',
      answers: JSON.stringify(data.answers || {}), detail: JSON.stringify(data.detail || []), userAgent: data.userAgent || ''
    };
    sheet.appendRow(headers.map(h => obj[h] !== undefined ? obj[h] : ''));
    return json_({success:true, message:'Đã lưu kết quả vào Google Sheets'});
  } catch (err) {
    return json_({success:false, error:String(err && err.message || err)});
  }
}
