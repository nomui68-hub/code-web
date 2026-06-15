async function loadExamIndex(){
  const res = await fetch('exams/index.json?_=' + Date.now());
  const data = await res.json();
  const exams = data.exams || [];
  document.getElementById('adminSummary').innerHTML = `
    <h3>Thống kê đề</h3>
    <p><strong>Số đề:</strong> ${exams.length}</p>
    <p><strong>Đề mặc định:</strong> ${data.defaultExamId || ''}</p>
    <ul>${exams.map(e=>`<li><strong>${e.id}</strong> - ${e.title || e.id} (${e.questionCount || '?'} câu)</li>`).join('')}</ul>
  `;
  document.getElementById('jsonPreview').textContent = JSON.stringify(data, null, 2);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loadJsonBtn')?.addEventListener('click', loadExamIndex);
  const input = document.getElementById('apiUrlInput');
  const status = document.getElementById('apiStatus');
  if(input) input.value = localStorage.getItem('EXAM_API_URL') || (window.EXAM_API_URL || '');

  document.getElementById('saveApiBtn')?.addEventListener('click', () => {
    const url = input.value.trim();
    localStorage.setItem('EXAM_API_URL', url);
    status.innerHTML = url ? '<span class="ok">Đã lưu URL trên trình duyệt này.</span>' : '<span class="bad">URL đang trống.</span>';
  });

  document.getElementById('clearApiBtn')?.addEventListener('click', () => {
    localStorage.removeItem('EXAM_API_URL');
    input.value = window.EXAM_API_URL || '';
    status.textContent = 'Đã xóa URL thử trên trình duyệt này.';
  });

  document.getElementById('testApiBtn')?.addEventListener('click', async () => {
    localStorage.setItem('EXAM_API_URL', input.value.trim());
    status.textContent = 'Đang kiểm tra...';
    const r = await pingOnline();
    status.innerHTML = r.success ? `<span class="ok">Kết nối OK: ${r.message || ''}</span>` : `<span class="bad">Chưa kết nối được: ${r.message || ''}</span>`;
  });
});
