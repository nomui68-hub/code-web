const box = document.getElementById('resultBox');
const result = JSON.parse(localStorage.getItem('lastResult') || 'null');
function fmt(n){const x=Number(n||0); return Number.isInteger(x)?String(x):x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');}
function saveBadge(r){
  const st = r?.onlineStatus;
  if(st?.success) return '<p class="ok"><strong>Bài làm đã được ghi nhận.</strong></p>';
  if(st?.localOnly) return '<p class="muted"><strong>Bài làm đã lưu trên thiết bị này.</strong></p>';
  if(st?.error) return `<p class="bad"><strong>Bài đã nộp, nhưng chưa lưu online:</strong> ${st.error}</p>`;
  return '<p class="muted">Bài làm đã được ghi nhận.</p>';
}
if(!result){
  box.innerHTML='<p>Chưa có kết quả.</p>';
}else{
  box.innerHTML=`
    ${saveBadge(result)}
    <p><strong>Mã HS:</strong> ${result.studentId||''}</p>
    <p><strong>Họ tên:</strong> ${result.studentName||''}</p>
    <p><strong>Lớp:</strong> ${result.className||''}</p>
    <p><strong>Mã đề:</strong> ${result.examId||''}</p>
    <div class="score">Tổng điểm: ${fmt(result.score)}/${fmt(result.maxScore||10)}</div>
    <p><strong>Thời gian nộp:</strong> ${new Date(result.submitTime).toLocaleString('vi-VN')}</p>
    <p class="muted">Học sinh chỉ xem tổng điểm. Chi tiết bài làm và danh sách lớp chỉ hiển thị ở trang quản lý giáo viên.</p>
    <a class="btn" href="index.html">Về trang chủ</a>`;
}
