// ============================================================
// Google Apps Script cho hệ thống thi trực tuyến Thầy Đoàn Văn Mùi
// Dùng với GitHub Pages. Dán toàn bộ file này vào Apps Script.
// ============================================================

const SHEET_NAME = 'KETQUA';

function setupSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) sh = ss.insertSheet(SHEET_NAME);

  const headers = [
    'Thời gian ghi nhận','Mã HS','Họ tên','Lớp','Mã đề','Tên đề',
    'Điểm','Điểm tối đa','Điểm TN','Điểm ĐS','Điểm TLN',
    'Đúng hoàn toàn','Tổng câu','Quy tắc điểm',
    'Bài làm JSON','Chi tiết JSON','Thời gian bắt đầu','Thời gian nộp','UserAgent'
  ];

  if(sh.getLastRow() === 0){
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }else{
    const first = sh.getRange(1,1,1,headers.length).getValues()[0];
    if(first[0] !== headers[0]){
      sh.insertRowBefore(1);
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseBody_(e){
  if(!e || !e.postData || !e.postData.contents) return {};
  try{return JSON.parse(e.postData.contents);}catch(err){return {raw:e.postData.contents};}
}

function doPost(e){
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try{
    const sh = setupSheet_();
    const data = parseBody_(e);
    const ps = data.partScores || {};
    const row = [
      new Date(),
      data.studentId || '',
      data.studentName || '',
      data.className || '',
      data.examId || '',
      data.examTitle || '',
      Number(data.score || 0),
      Number(data.maxScore || 10),
      Number(ps.choice || 0),
      Number(ps.truefalse || 0),
      Number(ps.short || 0),
      Number(data.correct || 0),
      Number(data.total || 0),
      data.scoringRule || '',
      JSON.stringify(data.answers || {}),
      JSON.stringify(data.detail || []),
      data.startTime || '',
      data.submitTime || new Date().toISOString(),
      data.userAgent || ''
    ];
    sh.appendRow(row);
    return json_({success:true,message:'Đã lưu Google Sheets'});
  }catch(err){
    return json_({success:false,message:String(err)});
  }finally{
    lock.releaseLock();
  }
}

function doGet(e){
  const action = (e && e.parameter && e.parameter.action) || 'ping';
  if(action === 'ping'){
    setupSheet_();
    return json_({success:true,message:'API Google Sheets đang hoạt động'});
  }
  if(action !== 'list') return json_({success:false,message:'Action không hợp lệ'});

  const sh = setupSheet_();
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1).filter(r => r.join('').trim() !== '').map(r => ({
    recordedAt: r[0],
    studentId: r[1],
    studentName: r[2],
    className: r[3],
    examId: r[4],
    examTitle: r[5],
    score: r[6],
    maxScore: r[7],
    partScores: {choice:r[8], truefalse:r[9], short:r[10]},
    correct: r[11],
    total: r[12],
    scoringRule: r[13],
    answers: r[14],
    detail: r[15],
    startTime: r[16],
    submitTime: r[17],
    userAgent: r[18]
  }));
  return json_({success:true,results:rows});
}
