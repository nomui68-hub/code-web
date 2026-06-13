function setupSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('KETQUA');
  if (!sheet) sheet = ss.insertSheet('KETQUA');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Mã HS', 'Họ tên', 'Lớp', 'Mã đề', 'Điểm', 'Điểm TN', 'Điểm ĐS', 'Điểm TLN',
      'Số câu đúng hoàn toàn', 'Tổng số câu', 'Điểm tối đa', 'Quy tắc điểm',
      'Bài làm JSON', 'Chi tiết JSON', 'Thời gian bắt đầu', 'Thời gian nộp'
    ]);
  }
  return sheet;
}

function doPost(e) {
  const sheet = setupSheet_();
  const data = JSON.parse(e.postData.contents);
  const ps = data.partScores || {};
  sheet.appendRow([
    data.studentId || '',
    data.studentName || '',
    data.className || '',
    data.examId || '',
    data.score || 0,
    ps.choice || 0,
    ps.truefalse || 0,
    ps.short || 0,
    data.correct || 0,
    data.total || 0,
    data.maxScore || 10,
    data.scoringRule || '',
    JSON.stringify(data.answers || {}),
    JSON.stringify(data.detail || []),
    data.startTime || '',
    data.submitTime || new Date().toISOString()
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action !== 'list') {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, message: 'Online exam API is running.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sheet = setupSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map(r => ({
    studentId: r[0],
    studentName: r[1],
    className: r[2],
    examId: r[3],
    score: r[4],
    partScores: { choice: r[5], truefalse: r[6], short: r[7] },
    correct: r[8],
    total: r[9],
    maxScore: r[10],
    scoringRule: r[11],
    answers: r[12],
    detail: r[13],
    startTime: r[14],
    submitTime: r[15]
  }));
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, results: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
