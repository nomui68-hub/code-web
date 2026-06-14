
function setupSheet_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName('KETQUA');
  if(!sh) sh=ss.insertSheet('KETQUA');
  if(sh.getLastRow()===0){
    sh.appendRow(['Mã HS','Họ tên','Lớp','Mã đề','Tên đề','Điểm','Điểm tối đa','Điểm TN','Điểm ĐS','Điểm TLN','Đúng hoàn toàn','Tổng câu','Quy tắc điểm','Bài làm JSON','Chi tiết JSON','Thời gian bắt đầu','Thời gian nộp','UserAgent']);
  }
  return sh;
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
  const sh=setupSheet_();
  const data=JSON.parse(e.postData.contents||'{}');
  const ps=data.partScores||{};
  sh.appendRow([data.studentId||'',data.studentName||'',data.className||'',data.examId||'',data.examTitle||'',data.score||0,data.maxScore||10,ps.choice||0,ps.truefalse||0,ps.short||0,data.correct||0,data.total||0,data.scoringRule||'',JSON.stringify(data.answers||{}),JSON.stringify(data.detail||[]),data.startTime||'',data.submitTime||new Date().toISOString(),data.userAgent||'']);
  return json_({success:true,message:'Đã lưu Google Sheets'});
}
function doGet(e){
  const action=(e&&e.parameter&&e.parameter.action)||'ping';
  if(action==='ping') return json_({success:true,message:'API đang hoạt động'});
  if(action!=='list') return json_({success:false,message:'Action không hợp lệ'});
  const sh=setupSheet_();
  const values=sh.getDataRange().getValues();
  const rows=values.slice(1).map(r=>({
    studentId:r[0],studentName:r[1],className:r[2],examId:r[3],examTitle:r[4],score:r[5],maxScore:r[6],partScores:{choice:r[7],truefalse:r[8],short:r[9]},correct:r[10],total:r[11],scoringRule:r[12],answers:r[13],detail:r[14],startTime:r[15],submitTime:r[16]
  }));
  return json_({success:true,results:rows});
}
