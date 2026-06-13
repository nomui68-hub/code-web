const box = document.getElementById('resultBox');
const result = JSON.parse(localStorage.getItem('lastResult') || 'null');

function fmt(n){
  const x = Number(n || 0);
  return Number.isInteger(x) ? String(x) : x.toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
}

if(!result){
  box.innerHTML = '<p>Chưa có kết quả.</p>';
}else{
  const ps = result.partScores || {};
  const ms = result.maxScores || {};
  box.innerHTML = `
    <p><strong>Mã HS:</strong> ${result.studentId || ''}</p>
    <p><strong>Họ tên:</strong> ${result.studentName || ''}</p>
    <p><strong>Lớp:</strong> ${result.className || ''}</p>
    <p><strong>Mã đề:</strong> ${result.examId || ''}</p>
    <div class="score">${fmt(result.score)}/${fmt(result.maxScore || 10)}</div>
    <p><strong>Quy tắc điểm:</strong> Trắc nghiệm 0,25 điểm/câu; Đúng/Sai: 1 ý 0,10; 2 ý 0,25; 3 ý 0,50; 4 ý 1,00; Trả lời ngắn 0,50 điểm/câu.</p>
    <ul>
      <li><strong>Trắc nghiệm:</strong> ${fmt(ps.choice)}/${fmt(ms.choice || 3)} điểm</li>
      <li><strong>Đúng/Sai:</strong> ${fmt(ps.truefalse)}/${fmt(ms.truefalse || 4)} điểm</li>
      <li><strong>Trả lời ngắn:</strong> ${fmt(ps.short)}/${fmt(ms.short || 3)} điểm</li>
    </ul>
    <p><strong>Số câu đúng hoàn toàn:</strong> ${result.correct}/${result.total}</p>
    <p><strong>Thời gian nộp:</strong> ${new Date(result.submitTime).toLocaleString('vi-VN')}</p>
    <details>
      <summary>Xem toàn bộ bài làm</summary>
      <pre class="prebox">${JSON.stringify(result, null, 2)}</pre>
    </details>
  `;
}
