document.getElementById('loadJsonBtn').addEventListener('click', async () => {
  const res = await fetch('data/questions.json');
  const data = await res.json();
  const questions = data.questions || data;
  const byType = questions.reduce((acc, q) => { acc[q.type]=(acc[q.type]||0)+1; return acc; }, {});
  document.getElementById('adminSummary').innerHTML = `
    <h2>Thống kê</h2>
    <p><strong>Mã đề:</strong> ${data.examId || ''}</p>
    <p><strong>Số câu:</strong> ${questions.length}</p>
    <p><strong>Trắc nghiệm:</strong> ${byType.choice || 0}</p>
    <p><strong>Đúng/Sai:</strong> ${byType.truefalse || 0}</p>
    <p><strong>Trả lời ngắn:</strong> ${byType.short || 0}</p>
    <p><strong>Số lỗi parser:</strong> ${(data.errors || []).length}</p>
  `;
  document.getElementById('jsonPreview').textContent = JSON.stringify(data, null, 2).slice(0, 12000);
});
