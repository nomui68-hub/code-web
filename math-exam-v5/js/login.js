document.getElementById('loginForm').addEventListener('submit', function(e){
  e.preventDefault();
  localStorage.setItem('studentId', document.getElementById('studentId').value.trim());
  localStorage.setItem('studentName', document.getElementById('studentName').value.trim());
  localStorage.setItem('className', document.getElementById('className').value.trim());
  localStorage.setItem('examId', document.getElementById('examId').value.trim() || 'DE_MAU');
  localStorage.setItem('startTime', new Date().toISOString());
  window.location.href = 'exam.html';
});
