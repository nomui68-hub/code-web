const TEACHER_PASSWORD = '123456';
document.addEventListener('DOMContentLoaded',()=>{
  const ok = sessionStorage.getItem('teacherOK') === '1';
  const loginBox=document.getElementById('loginBox');
  const panel=document.getElementById('teacherPanel');
  function show(){loginBox.style.display='none'; panel.style.display='block';}
  if(ok) show();
  document.getElementById('teacherLoginBtn').onclick=()=>{
    const pass=document.getElementById('teacherPass').value;
    if(pass===TEACHER_PASSWORD){sessionStorage.setItem('teacherOK','1'); show();}
    else document.getElementById('teacherMsg').textContent='Sai mật khẩu giáo viên.';
  };
});
