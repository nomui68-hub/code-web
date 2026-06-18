// Mật khẩu giáo viên V10. Đổi tại đây nếu cần.
const TEACHER_PASSWORD = '123456';

function unlockTeacherPanel(){
  const loginBox = document.getElementById('loginBox');
  const panel = document.getElementById('teacherPanel');
  if(loginBox) loginBox.style.display = 'none';
  if(panel) panel.style.display = 'block';
}

document.addEventListener('DOMContentLoaded',()=>{
  const loginBox = document.getElementById('loginBox');
  const panel = document.getElementById('teacherPanel');
  if(!loginBox || !panel) return;

  if(sessionStorage.getItem('teacherOK') === '1') unlockTeacherPanel();

  const btn = document.getElementById('teacherLoginBtn');
  if(btn){
    btn.onclick = () => {
      const pass = document.getElementById('teacherPass')?.value || '';
      if(pass === TEACHER_PASSWORD){
        sessionStorage.setItem('teacherOK','1');
        unlockTeacherPanel();
      }else{
        const msg = document.getElementById('teacherMsg');
        if(msg) msg.textContent = 'Sai mật khẩu giáo viên.';
      }
    };
  }
});
