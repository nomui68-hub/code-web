
let allRows = [];
function getLocalRows(){try{return JSON.parse(localStorage.getItem('examResults')||'[]').map((r,i)=>({...r,_localIndex:i,_source:'local'}))}catch(e){return []}}
function setLocalRows(rows){localStorage.setItem('examResults', JSON.stringify(rows.map(({_localIndex,_source,...r})=>r)));}
function fmtTime(s){ if(!s) return ''; try{return new Date(s).toLocaleString('vi-VN')}catch(e){return s} }
function fmt(n){ const x=Number(n||0); return Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,''); }
function parseMaybeJson(x){ if(Array.isArray(x) || typeof x==='object') return x; try{return JSON.parse(x||'[]')}catch(e){return []} }
function norm(s){ return String(s||'').toLowerCase().trim(); }

function rowKey(r){return [r.examId||'',r.studentId||'',r.submitTime||''].join('|');}
function gradeStore(){try{return JSON.parse(localStorage.getItem('manualEssayGrades')||'{}')}catch(e){return {}}}
function setGradeStore(x){localStorage.setItem('manualEssayGrades', JSON.stringify(x));}
function gradeKey(r, qid, idx=''){return rowKey(r)+'|q'+qid+(idx!==''?'|r'+idx:'');}
function getManualPoint(r,d){const gs=gradeStore(); const k=gradeKey(r,d.id); if(gs[k]!==undefined) return Number(gs[k]||0); return Number(d.point||0);}
function manualTotal(r){return parseMaybeJson(r.detail).filter(d=>d.type==='essay' && d.needsManual).reduce((a,d)=>a+getManualPoint(r,d),0);}
function displayScore(r){
  const base=Number(r.score||0);
  const oldEssay=Number(r.partScores?.essay||0);
  const manual=manualTotal(r);
  return base-oldEssay+manual;
}
function saveManualPoint(rowIndex,qid,val){
  const r=filteredRows()[rowIndex]; if(!r) return;
  const gs=gradeStore(); gs[gradeKey(r,qid)] = Math.max(0, Number(val||0)); setGradeStore(gs); render();
}
window.saveManualPoint=saveManualPoint;
function imageThumbs(d){
  const imgs=Array.isArray(d.images)?d.images:[];
  if(!imgs.length) return '';
  return '<div><b>Ảnh bài làm:</b><div class="essay-images">'+imgs.map((img,i)=>{
    if(img.error) return `<div class="bad">${img.name||'Ảnh'}: ${img.error}</div>`;
    if(img.url) return `<a class="btn" href="${img.url}" target="_blank">Mở ảnh ${i+1}</a>`;
    if(!img.dataUrl) return `<span class="muted">${img.name||'Ảnh '+(i+1)}</span>`;
    return `<a href="${img.dataUrl}" target="_blank"><img src="${img.dataUrl}" alt="Ảnh bài làm ${i+1}" style="max-width:160px;max-height:160px;border:1px solid #ccc;border-radius:8px;margin:6px"></a>`;
  }).join('')+'</div></div>';
}

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
  const header=['Ma HS','Ho ten','Lop','Ma de','Ten de','Diem','TN','DungSai','TLN','Tu luan','Dung/Tong','Thoi gian nop','Bai lam JSON','Chi tiet tu luan JSON'];
  const lines=[header.join(',')].concat(rows.map(r=>[
    r.studentId,r.studentName,r.className,r.examId,r.examTitle,displayScore(r),r.partScores?.choice,r.partScores?.truefalse,r.partScores?.short,manualTotal(r)||r.partScores?.essay,`${r.correct}/${r.total}`,fmtTime(r.submitTime),JSON.stringify(r.answers||''), JSON.stringify(parseMaybeJson(r.detail).filter(d=>d.type==='essay').map(d=>({id:d.id,given:d.given,images:(d.images||[]).map(x=>({name:x.name,size:x.size,error:x.error||''})),manualPoint:getManualPoint(r,d)})))
  ].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')));
  const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ket_qua_thi.csv'; a.click();
}
function renderStats(rows){
  const n=rows.length;
  const scores=rows.map(r=>Number(displayScore(r)||0));
  const avg=n? scores.reduce((a,b)=>a+b,0)/n:0;
  const max=n? Math.max(...scores):0;
  const min=n? Math.min(...scores):0;
  const pass=n? rows.filter(r=>Number(displayScore(r)||0)>=5).length:0;
  document.getElementById('statsBox').innerHTML=`
    <div class="stat"><b>${n}</b><span>Lượt nộp</span></div>
    <div class="stat"><b>${fmt(avg)}</b><span>Điểm TB</span></div>
    <div class="stat"><b>${fmt(max)}</b><span>Cao nhất</span></div>
    <div class="stat"><b>${fmt(min)}</b><span>Thấp nhất</span></div>
    <div class="stat"><b>${n?Math.round(pass*100/n):0}%</b><span>Đạt từ 5 điểm</span></div>`;
}
function detailHtml(r,rowIndex){
  const detail=parseMaybeJson(r.detail);
  if(!detail.length) return '<em>Không có chi tiết</em>';
  return '<details><summary>Xem / chấm tự luận</summary><div class="detail-list">'+detail.map(d=>{
    if(d.type==='essay' && d.needsManual){
      const val=getManualPoint(r,d);
      const rub=(Array.isArray(d.rubric)&&d.rubric.length)?'<ul>'+d.rubric.map(x=>`<li>${fmt(x.point)} điểm: ${x.desc||''}</li>`).join('')+'</ul>':'';
      return `<div class="essay-grade"><b>Câu ${d.id}</b> (Tự luận): <input type="number" step="0.25" min="0" max="${fmt(d.maxPoint)}" value="${fmt(val)}" onchange="saveManualPoint(${rowIndex},${d.id},this.value)"> / ${fmt(d.maxPoint)} điểm ${rub}<div><b>Bài làm:</b><pre>${String(d.given||'').replace(/[&<>]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]))}</pre></div>${imageThumbs(d)}</div>`;
    }
    return `<div><b>Câu ${d.id}</b> (${d.typeLabel||d.type}): ${fmt(d.point)}/${fmt(d.maxPoint)} điểm</div>`;
  }).join('')+'</div></details>';
}
function renderTable(rows){
  document.querySelector('#resultTable tbody').innerHTML=rows.map((r,i)=>`<tr>
    <td><input type="checkbox" class="rowCheck" value="${r._localIndex ?? ''}" ${r._source==='local'?'':'disabled title="Chỉ xóa được dữ liệu cục bộ"'}></td><td>${i+1}</td><td>${r.studentId||''}</td><td>${r.studentName||''}</td><td>${r.className||''}</td><td>${r.examTitle||r.examId||''}</td>
    <td><b>${fmt(displayScore(r))}</b></td><td>${fmt(r.partScores?.choice)}</td><td>${fmt(r.partScores?.truefalse)}</td><td>${fmt(r.partScores?.short)}</td><td>${fmt(manualTotal(r)||r.partScores?.essay)}</td>
    <td>${r.correct??''}/${r.total??''}</td><td>${fmtTime(r.submitTime)}</td><td>${detailHtml(r,i)}</td></tr>`).join('');
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
function render(){ const rows=filteredRows(); document.getElementById('sourceNote').textContent=`Đang hiển thị ${rows.length}/${allRows.length} lượt nộp.`; renderStats(rows); renderTable(rows); renderQuestionStats(rows); const ca=document.getElementById('checkAllRows'); if(ca) ca.checked=false; }
async function fillExamFilter(){
  const sel=document.getElementById('examFilter');
  try{ const res=await fetch('exams/index.json?_='+Date.now()); const idx=await res.json(); sel.innerHTML='<option value="">Tất cả đề</option>'+(idx.exams||[]).map(e=>`<option value="${e.id}">${e.title||e.id}</option>`).join(''); }catch(e){}
}
async function loadLocal(){ allRows=getLocalRows(); document.getElementById('sourceNote').textContent='Dữ liệu cục bộ trên trình duyệt này.'; render(); }
async function loadOnline(){
  const API_URL=(typeof getApiUrl==='function'?getApiUrl():'');
  if(!API_URL){
    document.getElementById('sourceNote').innerHTML='<span class="bad">Chưa cấu hình Google Sheets trong js/config.js. Bảng này chỉ xem được dữ liệu cục bộ trên máy giáo viên.</span>';
    return false;
  }
  document.getElementById('sourceNote').textContent='Đang lấy dữ liệu từ Google Sheets...';
  const rows=await loadOnlineResults();
  allRows=rows;
  document.getElementById('sourceNote').textContent=rows.length ? 'Dữ liệu lấy từ Google Sheets.' : 'Google Sheets chưa có lượt nộp nào hoặc Web App chưa trả dữ liệu.';
  render();
  return true;
}

function deleteLocalByIndices(indices){
  const raw=JSON.parse(localStorage.getItem('examResults')||'[]');
  const set=new Set(indices.map(Number));
  const kept=raw.filter((_,i)=>!set.has(i));
  localStorage.setItem('examResults', JSON.stringify(kept));
  loadLocal();
}
function selectedLocalIndices(){
  return [...document.querySelectorAll('.rowCheck:checked')].map(x=>Number(x.value)).filter(x=>Number.isInteger(x));
}
function deleteSelectedRows(){
  const ids=selectedLocalIndices();
  if(!ids.length){alert('Chưa chọn dòng nào để xóa.'); return;}
  if(confirm(`Xóa ${ids.length} dòng kết quả đã chọn trên trình duyệt này?`)) deleteLocalByIndices(ids);
}
function deleteFilteredRows(){
  const ids=filteredRows().map(r=>r._localIndex).filter(x=>Number.isInteger(x));
  if(!ids.length){alert('Không có dòng cục bộ nào trong bộ lọc hiện tại.'); return;}
  const label=[document.getElementById('examFilter').value, document.getElementById('classFilter').value, document.getElementById('studentFilter').value].filter(Boolean).join(' / ') || 'bộ lọc hiện tại';
  if(confirm(`Xóa ${ids.length} dòng kết quả theo ${label}?`)) deleteLocalByIndices(ids);
}

document.addEventListener('DOMContentLoaded', async()=>{
  await fillExamFilter(); if(typeof getApiUrl==='function' && getApiUrl()){ await loadOnline(); } else { await loadLocal(); }
  ['examFilter','classFilter','studentFilter'].forEach(id=>document.getElementById(id).addEventListener('input', render));
  document.getElementById('reloadBtn').onclick=loadLocal;
  document.getElementById('onlineBtn').onclick=loadOnline;
  document.getElementById('csvBtn').onclick=()=>csv(filteredRows());
  document.getElementById('deleteSelectedBtn').onclick=deleteSelectedRows;
  document.getElementById('deleteFilteredBtn').onclick=deleteFilteredRows;
  document.getElementById('clearBtn').onclick=()=>{if(confirm('Xóa TOÀN BỘ kết quả cục bộ trên trình duyệt giáo viên này? Thao tác này KHÔNG xóa Google Sheets và KHÔNG mở lại lượt làm trên điện thoại học sinh.')){localStorage.removeItem('examResults'); loadLocal();}};
  document.getElementById('checkAllRows')?.addEventListener('change',e=>document.querySelectorAll('.rowCheck:not(:disabled)').forEach(x=>x.checked=e.target.checked));
});
