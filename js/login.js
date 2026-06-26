async function loadExamList(){
  const select=document.getElementById('examSelect');
  const hidden=document.getElementById('examId');
  const status=document.getElementById('examLoadStatus');
  try{
    const res=await fetch('exams/index.json?_='+Date.now());
    const data=await res.json();
    // V14: học sinh chỉ thấy đề giáo viên tạo. Ẩn DE_MAU nếu còn tồn tại trong index.json.
    let exams=(data.exams||[]).filter(e=>e.active!==false && e.id!=='DE_MAU' && !e.sample);
    if(!exams.length) exams=(data.exams||[]).filter(e=>e.active!==false);
    if(!exams.length){
      select.innerHTML='<option value="">Chưa có đề nào được giao</option>';
      hidden.value='';
      status.textContent='Chưa có đề mới. Giáo viên cần tạo/giao đề trước.';
      return;
    }
    select.innerHTML=exams.map(e=>`<option value="${e.id}">${e.title||e.id}</option>`).join('');
    const def=(data.defaultExamId && exams.some(e=>e.id===data.defaultExamId)) ? data.defaultExamId : (exams[0]&&exams[0].id);
    select.value=def; hidden.value=select.value;
    localStorage.setItem('examTitle', select.options[select.selectedIndex]?.textContent || def);
    status.textContent=`Đã tải ${exams.length} đề mới.`;
  }catch(err){
    select.innerHTML='<option value="DE_MAU">Đề mẫu</option>'; hidden.value='DE_MAU'; status.textContent='Không tải được danh sách đề, dùng DE_MAU.';
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
    localStorage.setItem('studentId', document.getElementById('studentId').value.trim());
    localStorage.setItem('studentName', document.getElementById('studentName').value.trim());
    localStorage.setItem('className', document.getElementById('className').value.trim());
    localStorage.setItem('examId', select.value || 'DE_MAU');
    localStorage.setItem('examTitle', select.options[select.selectedIndex]?.textContent || select.value || 'DE_MAU');
    localStorage.setItem('startTime', new Date().toISOString());
    window.location.href='exam.html';
  });
});
