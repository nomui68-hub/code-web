
(function(){
const log=[]; const now=()=>new Date().toISOString();
function add(type,detail=''){log.push({type,detail,time:now()});try{sessionStorage.setItem('examAuditLog',JSON.stringify(log.slice(-200)))}catch(e){}}
window.getExamAuditLog=()=>log.slice();
add('exam_page_open');
document.addEventListener('visibilitychange',()=>{if(document.hidden)add('leave_tab');else add('return_tab')});
document.addEventListener('copy',()=>add('copy'));document.addEventListener('paste',()=>add('paste'));document.addEventListener('contextmenu',()=>add('right_click'));
document.addEventListener('keydown',e=>{if(e.key==='F12'||(e.ctrlKey&&e.shiftKey&&['I','J','C'].includes(e.key.toUpperCase())))add('devtools_shortcut',e.key)});
const oldFetch=window.fetch;window.fetch=async function(input,init){try{if(init&&init.method==='POST'&&typeof init.body==='string'){const obj=JSON.parse(init.body);if(obj.action==='save'){obj.auditLog=window.getExamAuditLog();obj.browserId=localStorage.getItem('browserId')||(()=>{const v='B-'+crypto.getRandomValues(new Uint32Array(2)).join('-');localStorage.setItem('browserId',v);return v})();init={...init,body:JSON.stringify(obj)}}}}catch(e){}return oldFetch.call(this,input,init)};
})();
