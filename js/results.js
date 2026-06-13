let currentResults = [];

function fmtDate(s){
  if(!s) return '';
  try{ return new Date(s).toLocaleString('vi-VN'); }catch(e){ return s; }
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
}

async function loadResults(){
  const online = await loadOnlineResults();
  if(online.length){
    currentResults = online;
    document.getElementById('sourceNote').textContent = 'Đang hiển thị dữ liệu từ Google Sheets.';
  }else{
    currentResults = getLocalResults();
    document.getElementById('sourceNote').textContent = 'Đang hiển thị dữ liệu cục bộ trên trình duyệt này. Muốn xem mọi học sinh trên nhiều máy, hãy cấu hình Google Sheets trong js/api.js.';
  }
  renderTable();
}

function renderTable(){
  const tbody = document.querySelector('#resultTable tbody');
  if(!currentResults.length){
    tbody.innerHTML = '<tr><td colspan="9">Chưa có kết quả.</td></tr>';
    return;
  }
  tbody.innerHTML = currentResults.map((r, idx) => {
    const detail = JSON.stringify(r, null, 2);
    return `<tr>
      <td>${idx+1}</td>
      <td>${escapeHtml(r.studentId)}</td>
      <td>${escapeHtml(r.studentName || '')}</td>
      <td>${escapeHtml(r.className)}</td>
      <td>${escapeHtml(r.examId)}</td>
      <td><strong>${escapeHtml(r.score)}</strong></td>
      <td>${escapeHtml(r.correct)}/${escapeHtml(r.total)}</td>
      <td>${fmtDate(r.submitTime)}</td>
      <td><details><summary>Xem</summary><pre class="prebox small">${escapeHtml(detail)}</pre></details></td>
    </tr>`;
  }).join('');
}

function downloadCSV(){
  const header = ['STT','MaHS','HoTen','Lop','MaDe','Diem','SoCauDung','TongSoCau','ThoiGianNop','BaiLamJSON'];
  const rows = currentResults.map((r, i) => [
    i+1, r.studentId||'', r.studentName||'', r.className||'', r.examId||'', r.score??'', r.correct??'', r.total??'', fmtDate(r.submitTime), JSON.stringify(r)
  ]);
  const csv = [header, ...rows].map(row => row.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ket-qua-thi.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('reloadBtn').addEventListener('click', loadResults);
document.getElementById('csvBtn').addEventListener('click', downloadCSV);
document.getElementById('clearBtn').addEventListener('click', () => {
  if(confirm('Xóa toàn bộ kết quả lưu cục bộ trên trình duyệt này?')){
    clearLocalResults();
    loadResults();
  }
});

loadResults();
