
let allRows = [];
function getLocalRows(){try{return JSON.parse(localStorage.getItem('examResults')||'[]')}catch(e){return []}}
function fmtTime(s){ if(!s) return ''; try{return new Date(s).toLocaleString('vi-VN')}catch(e){return s} }
function fmt(n){ const x=Number(n||0); return Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,''); }
function parseMaybeJson(x){ if(Array.isArray(x) || typeof x==='object') return x; try{return JSON.parse(x||'[]')}catch(e){return []} }
function norm(s){ return String(s||'').toLowerCase().trim(); }
function filteredRows(){
  const exam=document.getElementById('examFilter').value;
  const cls=norm(document.getElementById('classFilter').value);
  const stu=norm(document.getElementById('studentFilter').value);
  return allRows.filter(r=>{
    if(exam && String(r.examId||'')!==exam) return false;
    if(cls && !norm(r.className).includes(cls)) return false;
    if(stu && !(norm(r.studentId).includes(stu) || norm(r.studentName).includes(stu))) return false;
    return true;
  });
}
function csv(rows){
  const header=['Ma HS','Ho ten','Lop','Ma de','Ten de','Diem','TN','DungSai','TLN','Dung/Tong','Thoi gian nop','Bai lam JSON'];
  const lines=[header.join(',')].concat(rows.map(r=>[
    r.studentId,r.studentName,r.className,r.examId,r.examTitle,r.score,r.partScores?.choice,r.partScores?.truefalse,r.partScores?.short,`${r.correct}/${r.total}`,fmtTime(r.submitTime),JSON.stringify(r.answers||'')
  ].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')));
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ket_qua_thi.csv'; a.click();
}
function renderStats(rows){
  const n=rows.length;
  const scores=rows.map(r=>Number(r.score||0));
  const avg=n? scores.reduce((a,b)=>a+b,0)/n:0;
  const max=n? Math.max(...scores):0;
  const min=n? Math.min(...scores):0;
  const pass=n? rows.filter(r=>Number(r.score||0)>=5).length:0;
  document.getElementById('statsBox').innerHTML=`
    <div class="stat"><b>${n}</b><span>Lượt nộp</span></div>
    <div class="stat"><b>${fmt(avg)}</b><span>Điểm TB</span></div>
    <div class="stat"><b>${fmt(max)}</b><span>Cao nhất</span></div>
    <div class="stat"><b>${fmt(min)}</b><span>Thấp nhất</span></div>
    <div class="stat"><b>${n?Math.round(pass*100/n):0}%</b><span>Đạt từ 5 điểm</span></div>`;
}
function detailHtml(r){
  const detail=parseMaybeJson(r.detail);
  if(!detail.length) return '<em>Không có chi tiết</em>';
  return '<details><summary>Xem</summary><div class="detail-list">'+detail.map(d=>`<div><b>Câu ${d.id}</b> (${d.typeLabel||d.type}): ${fmt(d.point)}/${fmt(d.maxPoint)} điểm</div>`).join('')+'</div></details>';
}
function renderTable(rows){
  document.querySelector('#resultTable tbody').innerHTML=rows.map((r,i)=>`<tr>
    <td>${i+1}</td><td>${r.studentId||''}</td><td>${r.studentName||''}</td><td>${r.className||''}</td><td>${r.examTitle||r.examId||''}</td>
    <td><b>${fmt(r.score)}</b></td><td>${fmt(r.partScores?.choice)}</td><td>${fmt(r.partScores?.truefalse)}</td><td>${fmt(r.partScores?.short)}</td>
    <td>${r.correct??''}/${r.total??''}</td><td>${fmtTime(r.submitTime)}</td><td>${detailHtml(r)}</td></tr>`).join('');
}
function renderQuestionStats(rows){
  const map=new Map();
  rows.forEach(r=>{
    parseMaybeJson(r.detail).forEach(d=>{
      if(!map.has(d.id)) map.set(d.id,{id:d.id,type:d.typeLabel||d.type,n:0,correct:0,totalPoint:0});
      const x=map.get(d.id); x.n++; if(d.isCorrect) x.correct++; x.totalPoint+=Number(d.point||0);
    });
  });
  const arr=[...map.values()].sort((a,b)=>Number(a.id)-Number(b.id));
  document.querySelector('#questionTable tbody').innerHTML=arr.map(x=>`<tr><td>${x.id}</td><td>${x.type}</td><td>${x.correct}/${x.n}</td><td>${x.n?Math.round(x.correct*100/x.n):0}%</td><td>${fmt(x.n?x.totalPoint/x.n:0)}</td></tr>`).join('');
}
function render(){ const rows=filteredRows(); document.getElementById('sourceNote').textContent=`Đang hiển thị ${rows.length}/${allRows.length} lượt nộp.`; renderStats(rows); renderTable(rows); renderQuestionStats(rows); }
async function fillExamFilter(){
  const sel=document.getElementById('examFilter');
  try{ const res=await fetch('exams/index.json?_='+Date.now()); const idx=await res.json(); sel.innerHTML='<option value="">Tất cả đề</option>'+(idx.exams||[]).map(e=>`<option value="${e.id}">${e.title||e.id}</option>`).join(''); }catch(e){}
}
async function loadLocal(){ allRows=getLocalRows(); document.getElementById('sourceNote').textContent='Dữ liệu cục bộ trên trình duyệt này.'; render(); }
async function loadOnline(){
  const rows=await loadOnlineResults();
  if(rows.length){ allRows=rows; document.getElementById('sourceNote').textContent='Dữ liệu lấy từ Google Sheets.'; render(); }
  else { alert('Chưa lấy được dữ liệu Google Sheets. Kiểm tra js/config.js đã dán Web App URL chưa.'); }
}
document.addEventListener('DOMContentLoaded', async()=>{
  await fillExamFilter(); await loadLocal();
  ['examFilter','classFilter','studentFilter'].forEach(id=>document.getElementById(id).addEventListener('input', render));
  document.getElementById('reloadBtn').onclick=loadLocal;
  document.getElementById('onlineBtn').onclick=loadOnline;
  document.getElementById('csvBtn').onclick=()=>csv(filteredRows());
  document.getElementById('clearBtn').onclick=()=>{if(confirm('Xóa kết quả cục bộ trên trình duyệt này?')){localStorage.removeItem('examResults'); loadLocal();}};
});
