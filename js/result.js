const box = document.getElementById('resultBox');
const result = JSON.parse(localStorage.getItem('lastResult') || 'null');
if(!result){
  box.innerHTML = '<p>Chưa có kết quả.</p>';
}else{
  box.innerHTML = `
    <p><strong>Mã HS:</strong> ${result.studentId || ''}</p>
    <p><strong>Họ tên:</strong> ${result.studentName || ''}</p>
    <p><strong>Lớp:</strong> ${result.className || ''}</p>
    <p><strong>Mã đề:</strong> ${result.examId || ''}</p>
    <div class="score">${result.score}/10</div>
    <p><strong>Số câu đúng:</strong> ${result.correct}/${result.total}</p>
    <p><strong>Thời gian nộp:</strong> ${new Date(result.submitTime).toLocaleString('vi-VN')}</p>
    <details>
      <summary>Xem toàn bộ bài làm</summary>
      <pre class="prebox">${JSON.stringify(result, null, 2)}</pre>
    </details>
  `;
}
