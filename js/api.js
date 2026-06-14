
const API_URL = (window.EXAM_API_URL || '').trim();

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
  if(!API_URL){
    console.warn('Chưa cấu hình Google Sheets API_URL, chỉ lưu cục bộ.');
    return {success:false, localOnly:true, message:'Chưa cấu hình Google Sheets'};
  }
  try{
    const res = await fetch(API_URL, { method:'POST', body:JSON.stringify(payload) });
    const data = await res.json();
    return data;
  }catch(err){
    console.error(err);
    return {success:false, error:String(err), message:'Không gửi được Google Sheets'};
  }
}

async function loadOnlineResults(){
  if(!API_URL) return [];
  try{
    const res = await fetch(API_URL + '?action=list&_=' + Date.now());
    const data = await res.json();
    return data.results || [];
  }catch(e){ console.error(e); return []; }
}

async function pingOnline(){
  if(!API_URL) return {success:false, message:'Chưa cấu hình API_URL'};
  try{
    const res = await fetch(API_URL + '?action=ping&_=' + Date.now());
    return await res.json();
  }catch(e){ return {success:false, message:String(e)}; }
}
