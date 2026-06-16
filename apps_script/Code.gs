// Apps Script V9 - lưu kết quả thi online vào Google Sheets
// Sheet cần tên KETQUA. Triển khai dạng Web App, quyền truy cập: Bất kỳ ai.

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('KETQUA');
  if (!sheet) sheet = ss.insertSheet('KETQUA');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'submitTime','studentId','studentName','className','examId','examTitle',
      'score','maxScore','choiceScore','truefalseScore','shortScore','correct','total',
      'startTime','scoringRule','answers','detail','userAgent'
    ]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
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
      try { obj.partScores = {choice:Number(obj.choiceScore||0), truefalse:Number(obj.truefalseScore||0), short:Number(obj.shortScore||0)}; } catch(err) {}
      try { obj.answers = JSON.parse(obj.answers || '{}'); } catch(err) {}
      try { obj.detail = JSON.parse(obj.detail || '[]'); } catch(err) {}
      return obj;
    });
    return json_({success:true, results});
  }
  return json_({success:true, message:'Apps Script V9 đang hoạt động'});
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = getSheet_();
    const ps = data.partScores || {};
    sheet.appendRow([
      data.submitTime || new Date().toISOString(),
      data.studentId || '',
      data.studentName || '',
      data.className || '',
      data.examId || '',
      data.examTitle || '',
      data.score || 0,
      data.maxScore || 10,
      ps.choice || 0,
      ps.truefalse || 0,
      ps.short || 0,
      data.correct || 0,
      data.total || 0,
      data.startTime || '',
      data.scoringRule || '',
      JSON.stringify(data.answers || {}),
      JSON.stringify(data.detail || []),
      data.userAgent || ''
    ]);
    return json_({success:true, message:'Đã lưu kết quả vào Google Sheets'});
  } catch (err) {
    return json_({success:false, error:String(err && err.message || err)});
  }
}
