function getLocalResults(){
  try{return JSON.parse(localStorage.getItem('examResults') || '[]');}catch(e){return []}
}
function fmtTime(s){
  if(!s) return '';
  try{return new Date(s).toLocaleString('vi-VN');}catch(e){return s}
}
function downloadCSV(rows){
  const header = ['Ma HS','Ho ten','Lop','Ma de','Ten de','Diem','TN','DungSai','TLN','Dung/Tong','Thoi gian nop'];
  const lines = [header.join(',')].concat(rows.map(r => [
    r.studentId, r.studentName, r.className, r.examId, r.examTitle,
    r.score, r.partScores?.choice, r.partScores?.truefalse, r.partScores?.short,
    `${r.correct}/${r.total}`, fmtTime(r.submitTime)
  ].map(v => '"' + String(v ?? '').replace(/"/g,'""') + '"').join(',')));
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download='ket_qua_thi.csv'; a.click();
}
function render(rows){
  const examFilter=document.getElementById('examFilter')?.value || '';
  const classFilter=(document.getElementById('classFilter')?.value || '').trim().toLowerCase();
  let data=rows;
  if(examFilter) data=data.filter(r=>String(r.examId||'')===examFilter);
  if(classFilter) data=data.filter(r=>String(r.className||'').toLowerCase().includes(classFilter));
  document.getElementById('summary').textContent = `Có ${data.length} lượt nộp bài.`;
  document.getElementById('resultsBody').innerHTML = data.map((r,i)=>`<tr>
    <td>${i+1}</td><td>${r.studentId||''}</td><td>${r.studentName||''}</td><td>${r.className||''}</td>
    <td>${r.examTitle || r.examId || ''}</td><td><b>${r.score ?? ''}</b></td>
    <td>${r.partScores?.choice ?? ''}</td><td>${r.partScores?.truefalse ?? ''}</td><td>${r.partScores?.short ?? ''}</td>
    <td>${r.correct ?? ''}/${r.total ?? ''}</td><td>${fmtTime(r.submitTime)}</td>
  </tr>`).join('');
  document.getElementById('exportBtn').onclick=()=>downloadCSV(data);
}
async function init(){
  const rows=getLocalResults();
  const select=document.getElementById('examFilter');
  try{
    const res=await fetch('exams/index.json?_=' + Date.now());
    const idx=await res.json();
    select.innerHTML='<option value="">Tất cả đề</option>' + (idx.exams||[]).map(e=>`<option value="${e.id}">${e.title||e.id}</option>`).join('');
  }catch(e){select.innerHTML='<option value="">Tất cả đề</option>';}
  select.onchange=()=>render(rows);
  document.getElementById('classFilter').oninput=()=>render(rows);
  document.getElementById('clearBtn').onclick=()=>{if(confirm('Xóa kết quả lưu trên trình duyệt này?')){localStorage.removeItem('examResults'); location.reload();}};
  render(rows);
}
document.addEventListener('DOMContentLoaded', init);
