// Dán URL Google Apps Script Web App vào đây sau khi triển khai.
// Ví dụ: const API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
const API_URL = '';

function getLocalResults(){
  try{
    return JSON.parse(localStorage.getItem('examResults') || '[]');
  }catch(e){
    return [];
  }
}

function saveResultLocal(payload){
  const list = getLocalResults();
  list.push(payload);
  localStorage.setItem('examResults', JSON.stringify(list));
}

function clearLocalResults(){
  localStorage.removeItem('examResults');
}

async function saveResultOnline(payload){
  if(!API_URL){
    console.warn('Chưa cấu hình API_URL, kết quả chỉ lưu trên trình duyệt này.');
    return { success:false, localOnly:true };
  }
  try{
    const res = await fetch(API_URL, {
      method:'POST',
      body: JSON.stringify(payload)
    });
    return await res.json();
  }catch(err){
    console.error(err);
    return { success:false, error:String(err) };
  }
}

async function loadOnlineResults(){
  if(!API_URL) return [];
  try{
    const res = await fetch(API_URL + '?action=list');
    const data = await res.json();
    return data.results || [];
  }catch(e){
    console.error(e);
    return [];
  }
}
