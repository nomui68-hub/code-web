function parseLocalDateTime(value){
  if(!value) return null;
  const d=new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
function formatDateTimeVN(value){
  const d=parseLocalDateTime(value);
  return d ? d.toLocaleString('vi-VN') : '';
}
function examStatusLabel(e){
  const now=new Date();
  const st=e.settings || {};
  const open=parseLocalDateTime(st.openAt || '');
  const close=parseLocalDateTime(st.closeAt || '');
  if(open && now<open) return ` — chưa mở (${formatDateTimeVN(st.openAt)})`;
  if(close && now>close) return ` — đã đóng (${formatDateTimeVN(st.closeAt)})`;
  return '';
}
function canOpenExam(e){
  const now=new Date(); const st=e.settings || {};
  const open=parseLocalDateTime(st.openAt || ''); const close=parseLocalDateTime(st.closeAt || '');
  if(open && now<open) return false;
  if(close && now>close) return false;
  return true;
}
async function loadExamList(){
  const select=document.getElementById('examSelect');
  const hidden=document.getElementById('examId');
  const status=document.getElementById('examLoadStatus');
  try{
    const res=await fetch('exams/index.json?v='+Date.now(), {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status+' khi tải exams/index.json');
    const data=await res.json();
    // V17: học sinh chỉ thấy các đề giáo viên đã giao trong exams/index.json.
    // Không bao giờ hiện DE_MAU hoặc đề mẫu trên trang học sinh.
    let exams=(data.exams||[]).filter(e=>e && e.active!==false && e.id!=='DE_MAU' && !e.sample);
    const btn=document.querySelector('#loginForm button[type="submit"]');
    if(!exams.length){
      select.innerHTML='<option value="">Chưa có đề nào được giao</option>';
      hidden.value='';
      if(btn) btn.disabled=true;
      status.textContent='Chưa có đề mới trong exams/index.json. Giáo viên cần tạo/giao đề và upload thư mục deploy lên GitHub.';
      return;
    }
    if(btn) btn.disabled=false;
    select.innerHTML=exams.map(e=>`<option value="${e.id}" ${canOpenExam(e)?'':'disabled'}>${e.title||e.id}${examStatusLabel(e)}</option>`).join('');
    const available=exams.filter(canOpenExam);
    const def=(data.defaultExamId && available.some(e=>e.id===data.defaultExamId)) ? data.defaultExamId : (available[0]&&available[0].id) || (exams[0]&&exams[0].id);
    select.value=def; hidden.value=select.value;
    localStorage.setItem('examTitle', select.options[select.selectedIndex]?.textContent || def);
    status.textContent=`Đã tải ${exams.length} đề mới, hiện mở ${exams.filter(canOpenExam).length} đề.`;
  }catch(err){
    select.innerHTML='<option value="">Không tải được danh sách đề</option>'; hidden.value=''; const btn=document.querySelector('#loginForm button[type="submit"]'); if(btn) btn.disabled=true; status.textContent='Không tải được exams/index.json: '+(err&&err.message?err.message:err)+'. Hãy upload nguyên thư mục deploy lên GitHub.';
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  loadExamList();
  document.getElementById('examSelect').addEventListener('change',function(){document.getElementById('examId').value=this.value; localStorage.setItem('examTitle',this.options[this.selectedIndex]?.textContent||this.value);});
  document.getElementById('loginForm').addEventListener('submit',function(e){
    e.preventDefault();
    const select=document.getElementById('examSelect');
    const oldApi=localStorage.getItem('EXAM_API_URL');
    localStorage.removeItem('lastResult');
    localStorage.removeItem('answers');
    localStorage.removeItem('currentResult');
    if(oldApi) localStorage.setItem('EXAM_API_URL', oldApi);
    if(!select.value){ alert('Hiện chưa có đề nào được giao.'); return; }
    if(select.selectedOptions[0] && select.selectedOptions[0].disabled){ alert('Đề này chưa đến thời gian mở hoặc đã đóng.'); return; }
    localStorage.setItem('studentId', document.getElementById('studentId').value.trim());
    localStorage.setItem('studentName', document.getElementById('studentName').value.trim());
    localStorage.setItem('className', document.getElementById('className').value.trim());
    localStorage.setItem('examId', select.value);
    localStorage.setItem('examTitle', select.options[select.selectedIndex]?.textContent || select.value);
    localStorage.setItem('startTime', new Date().toISOString());
    window.location.href='exam.html';
  });
});
