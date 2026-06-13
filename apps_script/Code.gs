function setupSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('KETQUA');
  if (!sheet) sheet = ss.insertSheet('KETQUA');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Mã HS', 'Họ tên', 'Lớp', 'Mã đề', 'Điểm', 'Số câu đúng', 'Tổng số câu',
      'Bài làm JSON', 'Chi tiết JSON', 'Thời gian bắt đầu', 'Thời gian nộp'
    ]);
  }
  return sheet;
}

function doPost(e) {
  const sheet = setupSheet_();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.studentId || '',
    data.studentName || '',
    data.className || '',
    data.examId || '',
    data.score || 0,
    data.correct || 0,
    data.total || 0,
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
    correct: r[5],
    total: r[6],
    answers: r[7],
    detail: r[8],
    startTime: r[9],
    submitTime: r[10]
  }));
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, results: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
