// ============================================================
// API lưu kết quả Google Sheets
// ============================================================
// Cách cấu hình chính thức: mở js/config.js và dán Web App URL vào EXAM_API_URL.
// Cách thử nhanh cho giáo viên: vào admin.html, dán URL rồi bấm lưu trên trình duyệt này.

function getApiUrl(){
  const fromConfig = (window.EXAM_API_URL || '').trim();
  const fromLocal = (localStorage.getItem('EXAM_API_URL') || '').trim();
  return fromConfig || fromLocal;
}

function getLocalResults(){
  try{return JSON.parse(localStorage.getItem('examResults') || '[]');}catch(e){return []}
}
function saveResultLocal(payload){
  const list = getLocalResults();
  list.push(payload);
  localStorage.setItem('examResults', JSON.stringify(list));
}
function clearLocalResults(){ localStorage.removeItem('examResults'); }

async function saveResultOnline(payload){
  const API_URL = getApiUrl();
  if(!API_URL){
    console.warn('Chưa cấu hình Google Sheets API_URL, chỉ lưu cục bộ.');
    return {success:false, localOnly:true, message:'Chưa cấu hình Google Sheets'};
  }
  try{
    const body = JSON.stringify({
      action:'save',
      ...payload,
      userAgent: navigator.userAgent || ''
    });

    // Dùng text/plain để tránh lỗi CORS preflight với Google Apps Script.
    const res = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body
    });

    const text = await res.text();
    try{return JSON.parse(text);}catch(e){return {success:true, message:text || 'Đã gửi Google Sheets'};}
  }catch(err){
    console.error(err);
    return {success:false, error:String(err), message:'Không gửi được Google Sheets'};
  }
}

function normalizeOnlineRow(r){
  // Hỗ trợ cả dữ liệu do Apps Script trả về dạng object và một số bản cũ.
  const partScores = r.partScores || {
    choice: Number(r.choiceScore || r.tnScore || r.tn || 0),
    truefalse: Number(r.truefalseScore || r.dsScore || r.ds || 0),
    short: Number(r.shortScore || r.tlnScore || r.tln || 0),
    essay: Number(r.essayScore || r.tuluanScore || r.tlScore || r.tuluan || 0)
  };
  return {
    studentId: r.studentId || r.maHS || r['Mã HS'] || '',
    studentName: r.studentName || r.hoTen || r['Họ tên'] || '',
    className: r.className || r.lop || r['Lớp'] || '',
    examId: r.examId || r.maDe || r['Mã đề'] || '',
    examTitle: r.examTitle || r.tenDe || r['Tên đề'] || r.examId || '',
    score: Number(r.score ?? r.diem ?? r['Điểm'] ?? 0),
    maxScore: Number(r.maxScore ?? 10),
    partScores,
    correct: Number(r.correct ?? r.dung ?? 0),
    total: Number(r.total ?? r.tongCau ?? 0),
    scoringRule: r.scoringRule || '',
    answers: r.answers || {},
    detail: r.detail || [],
    startTime: r.startTime || '',
    submitTime: r.submitTime || r.thoiGianNop || r['Thời gian nộp'] || ''
  };
}

async function loadOnlineResults(){
  const API_URL = getApiUrl();
  if(!API_URL) return [];
  try{
    const res = await fetch(API_URL + '?action=list&_=' + Date.now());
    const data = await res.json();
    const rows = data.results || [];
    return rows.map(normalizeOnlineRow);
  }catch(e){ console.error(e); return []; }
}

async function pingOnline(){
  const API_URL = getApiUrl();
  if(!API_URL) return {success:false, message:'Chưa cấu hình API_URL'};
  try{
    const res = await fetch(API_URL + '?action=ping&_=' + Date.now());
    return await res.json();
  }catch(e){ return {success:false, message:String(e)}; }
}
