// ============================================================
// API lưu kết quả Google Sheets
// ============================================================
// Cách cấu hình chính thức: mở js/config.js và dán Web App URL vào EXAM_API_URL.
// Cách thử nhanh cho giáo viên: vào admin.html, dán URL rồi bấm lưu trên trình duyệt này.

const DEFAULT_EXAM_API_URL = 'https://script.google.com/macros/s/AKfycbzZSLHoLn4maS56NRozYge0CWhkX7Sd6X_FwiiXzLBCopZTQao7JafxtWZ-AMlJikx6/exec';

function getApiUrl(){
  const fromConfig = String(globalThis.EXAM_API_URL || '').trim();
  const fromLocal = String(localStorage.getItem('EXAM_API_URL') || '').trim();
  const apiUrl = fromConfig || fromLocal || DEFAULT_EXAM_API_URL;
  if(apiUrl && !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(apiUrl)){
    console.warn('URL Apps Script có định dạng bất thường:', apiUrl);
  }
  return apiUrl;
}

function getLocalResults(){
  try{return JSON.parse(localStorage.getItem('examResults') || '[]');}catch(e){return []}
}
function lightenForLocalStorage(payload){
  try{
    const copy = JSON.parse(JSON.stringify(payload));
    if(Array.isArray(copy.detail)){
      copy.detail.forEach(d=>{
        if(Array.isArray(d.images)) d.images = d.images.map(img=>({name:img.name||'', type:img.type||'', size:img.size||0, error:img.error||'', url:img.url||''}));
      });
    }
    return copy;
  }catch(e){return payload;}
}
function saveResultLocal(payload){
  const list = getLocalResults();
  list.push(lightenForLocalStorage(payload));
  try{ localStorage.setItem('examResults', JSON.stringify(list)); }
  catch(e){ console.warn('localStorage đầy, chỉ giữ kết quả mới nhất.'); localStorage.setItem('examResults', JSON.stringify([lightenForLocalStorage(payload)])); }
}

function clearLocalResults(){ localStorage.removeItem('examResults'); }

async function saveResultOnline(payload){
  const API_URL = getApiUrl();
  if(!API_URL){
    throw new Error('Không tìm thấy URL Apps Script. Hãy mở admin.html và bấm Kiểm tra kết nối.');
  }

  const body = JSON.stringify({
    action:'save',
    ...payload,
    userAgent: navigator.userAgent || ''
  });

  let res;
  try{
    // Dùng text/plain để tránh CORS preflight với Google Apps Script.
    res = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body,
      cache:'no-store',
      redirect:'follow'
    });
  }catch(err){
    throw new Error('Không kết nối được Apps Script. Kiểm tra Internet, URL và quyền "Bất cứ ai". Chi tiết: '+String(err && err.message || err));
  }

  if(!res.ok){
    throw new Error(`Apps Script trả về HTTP ${res.status} ${res.statusText || ''}`.trim());
  }

  const text = await res.text();
  let data;
  try{
    data = JSON.parse(text);
  }catch(e){
    const shortText = String(text || '').replace(/\s+/g,' ').slice(0,180);
    throw new Error('Apps Script không trả về JSON hợp lệ. Có thể URL đang yêu cầu đăng nhập hoặc trỏ nhầm bản triển khai. Phản hồi: '+shortText);
  }

  if(!data || data.success !== true){
    throw new Error((data && (data.message || data.error)) || 'Google Sheets không xác nhận đã lưu bài.');
  }
  return data;
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
