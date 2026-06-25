let examData = null;
let questions = [];
let settings = {};
let durationSeconds = 90 * 60;
let minSubmitSeconds = 0;
let elapsedSeconds = 0;
let timerHandle = null;
let examLocked = false;

const DEFAULT_SETTINGS = {
  durationMinutes: 90,
  submitAfterMinutes: 0,
  maxAttempts: 1,
  scoring: {
    choiceTotal: 3,
    choiceCount: 12,
    truefalseTotal: 4,
    truefalseCount: 4,
    shortTotal: 3,
    shortCount: 6,
    essayTotal: 0,
    essayCount: 0,
    essayPoints: [],
    truefalseMode: 'progressive'
  }
};

function deepMerge(a,b){
  const out = JSON.parse(JSON.stringify(a));
  for(const k in (b||{})){
    if(b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) out[k] = deepMerge(out[k]||{}, b[k]);
    else out[k] = b[k];
  }
  return out;
}
function escapeHtml(str){return String(str ?? '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));}



function splitMathSegmentsJS(text){
  const s = String(text ?? '');
  const parts = [];
  let i = 0, start = 0;
  while(i < s.length){
    if(s.startsWith('$$', i)){
      if(i > start) parts.push({math:false, text:s.slice(start,i)});
      const j = s.indexOf('$$', i+2);
      if(j >= 0){parts.push({math:true, text:s.slice(i,j+2)}); i = j+2; start = i; continue;}
    }
    if(s[i] === '$'){
      if(i > start) parts.push({math:false, text:s.slice(start,i)});
      let j = i+1;
      while(j < s.length){ if(s[j] === '$' && s[j-1] !== '\\') break; j++; }
      if(j < s.length){parts.push({math:true, text:s.slice(i,j+1)}); i = j+1; start = i; continue;}
    }
    if(s.startsWith('\\[', i)){
      if(i > start) parts.push({math:false, text:s.slice(start,i)});
      const j = s.indexOf('\\]', i+2);
      if(j >= 0){parts.push({math:true, text:s.slice(i,j+2)}); i = j+2; start = i; continue;}
    }
    if(s.startsWith('\\(', i)){
      if(i > start) parts.push({math:false, text:s.slice(start,i)});
      const j = s.indexOf('\\)', i+2);
      if(j >= 0){parts.push({math:true, text:s.slice(i,j+2)}); i = j+2; start = i; continue;}
    }
    i++;
  }
  if(start < s.length) parts.push({math:false, text:s.slice(start)});
  return parts;
}
function applyOutsideMathJS(text, fn){
  return splitMathSegmentsJS(text).map(p => p.math ? p.text : fn(p.text)).join('');
}

function convertHevaHoacInText(t){
  function findBraceEnd(str, open){
    let level=0;
    for(let i=open;i<str.length;i++){
      if(str[i]==='{') level++;
      else if(str[i]==='}'){
        level--;
        if(level===0) return i;
      }
    }
    return -1;
  }
  function cleanSystemBody(b){
    const raw = String(b||'').trim().replace(/\s*\\\\\s*/g, '§BR§');
    return raw.split('§BR§').map(row => row
      .trim()
      .replace(/^\s*&+/g, '')
      .replace(/&+/g, ' ')
      .replace(/[ \t\r\n]+/g, ' ')
      .trim()
    ).filter(Boolean).join('\\\\');
  }

  let out='', i=0;
  while(i<t.length){
    if(t.startsWith('\\heva', i) || t.startsWith('\\hoac', i)){
      const isHeva=t.startsWith('\\heva', i);
      let j=i+(isHeva?5:5);
      while(j<t.length && /\s/.test(t[j])) j++;
      if(t[j]==='{'){
        const end=findBraceEnd(t,j);
        if(end>j){
          const body=cleanSystemBody(t.slice(j+1,end));
          out += `\\begin{cases}${body}\\end{cases}`;
          i=end+1; continue;
        }
      }
    }
    out+=t[i++];
  }
  return out;
}


function escapeAnglesInsideMathJS(text){
  return splitMathSegmentsJS(String(text ?? '')).map(p => {
    if(!p.math) return p.text;
    return p.text
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }).join('');
}

function normalizeLatexResidue(str){
  let t = convertHevaHoacInText(String(str ?? ''));
  // Dọn lệnh môi trường văn bản còn sót
  t = t.replace(/\\begin\s*\{\s*(center|flushleft|flushright)\s*\}/g, '<br>')
       .replace(/\\end\s*\{\s*(center|flushleft|flushright)\s*\}/g, '<br>')
       .replace(/\\begin\s*\{\s*(itemize|enumerate|itimize|itemchoice)\s*\}/g, '<br>')
       .replace(/\\end\s*\{\s*(itemize|enumerate|itimize|itemchoice)\s*\}/g, '<br>')
       .replace(/\\begin(center|itemize|enumerate|itimize|itemchoice)/g, '<br>')
       .replace(/\\end(center|itemize|enumerate|itimize|itemchoice)/g, '<br>');
  // Dọn lệnh định dạng chữ ngoài math
  for(let k=0;k<8;k++){
    const old=t;
    t = t.replace(/\{\s*\\it\s*\{([^{}]*)\}\s*\}/g, '<em>$1</em>')
         .replace(/\\textbf\s*\{([^{}]*)\}/g, '<strong>$1</strong>')
         .replace(/\\(?:textit|emph)\s*\{([^{}]*)\}/g, '<em>$1</em>')
         .replace(/\\(?:it|itshape)\s*\{([^{}]*)\}/g, '<em>$1</em>')
         .replace(/\{\s*\\(?:it|itshape)\s+([^{}]+?)\s*\}/g, '<em>$1</em>')
         .replace(/\\text\s*\{([^{}]*)\}/g, '$1');
    if(t===old) break;
  }
  // Sửa các escape thường gặp trong văn bản
  t = applyOutsideMathJS(t, u => u.replace(/\\(?:break|newline|linebreak)\b\s*/g,' ').replace(/\\#/g,'#').replace(/\\%/g,'%').replace(/\\&/g,'&').replace(/\\_/g,'_').replace(/\\\{/g,'{').replace(/\\\}/g,'}'));
  // Sửa lỗi parser cũ biến \parallel thành <br>allel
  t = t.replace(/<br>\s*allel/g, '\\parallel');
  // Nếu còn cặp $...$ chỉ chứa chữ/số rất đơn giản trong văn bản nốt nhạc, bỏ $ để khỏi hiện E$4$ khi MathJax chưa chạy.
  t = t.replace(/\$([A-Za-zÀ-ỹ0-9]{1,4})\$/g, '$1');
  t = escapeAnglesInsideMathJS(t);
  return t;
}
function attemptKey(){return `attempts_${localStorage.getItem('examId') || 'DE_MAU'}_${localStorage.getItem('studentId') || 'NOID'}`;}
function getAttemptCount(){return Number(localStorage.getItem(attemptKey()) || '0');}
function addAttempt(){localStorage.setItem(attemptKey(), String(getAttemptCount()+1));}

async function loadQuestions(){
  const examId = localStorage.getItem('examId') || 'DE_MAU';
  const url = `exams/${examId}/questions.json?_=${Date.now()}`;
  let res = await fetch(url);
  if(!res.ok) res = await fetch('data/questions.json?_=' + Date.now());
  examData = await res.json();
  questions = examData.questions || examData;
  settings = deepMerge(DEFAULT_SETTINGS, examData.settings || {});
  durationSeconds = Math.max(1, Number(settings.durationMinutes || 90)) * 60;
  minSubmitSeconds = Math.max(0, Number(settings.submitAfterMinutes || 0)) * 60;
  localStorage.setItem('examTitle', examData.title || localStorage.getItem('examTitle') || examId);
  return questions;
}
function studentLabel(){
  const sid = localStorage.getItem('studentId') || 'Chưa nhập mã';
  const name = localStorage.getItem('studentName') || '';
  const cls = localStorage.getItem('className') || 'Chưa nhập lớp';
  return `${sid}${name ? ' - ' + name : ''} - ${cls}`;
}
function renderLatex(text){return `<div class="latex-content">${normalizeLatexResidue(text || '')}</div>`;}
function visualBlock(q){
  if(q.image) return `<img class="question-image" src="${q.image}" alt="Hình câu ${q.id}">`;
  if(q.hasTikz || q.hasImmini || q.hasTable){
    let flags=[]; if(q.hasTikz) flags.push('TikZ'); if(q.hasImmini) flags.push('immini'); if(q.hasTable) flags.push('bảng');
    return `<div class="visual-warning"><b>Hình chưa hiển thị.</b> Câu này có ${flags.join(', ')}. Giáo viên có thể mở trang quản lý V12 và dùng mục <b>Sửa hình nhanh</b> để tải ảnh cho câu ${q.id}.</div>`;
  }
  return '';
}
function renderChoice(q){
  const opts=(q.options||[]).map((opt,i)=>`<label class="option"><input type="radio" name="q${q.id}" value="${i}"><span>${String.fromCharCode(65+i)}. ${normalizeLatexResidue(opt)}</span></label>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${opts}`;
}
function renderTrueFalse(q){
  const rows=(q.statements||[]).map((st,i)=>`<div class="tf-row"><div><strong>${String.fromCharCode(65+i)}.</strong> ${normalizeLatexResidue(st.text)}</div><label><input type="radio" name="q${q.id}_${i}" value="true"> Đúng</label><label><input type="radio" name="q${q.id}_${i}" value="false"> Sai</label></div>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${rows}`;
}
function renderShort(q){return `${renderLatex(q.question)}${visualBlock(q)}<input class="short-input" id="q${q.id}" placeholder="Nhập đáp án">`;}
function renderEssay(q){return `${renderLatex(q.question)}${visualBlock(q)}<textarea class="short-input essay-input" id="q${q.id}" rows=4 placeholder="Nhập bài làm tự luận"></textarea>`;}
function renderExam(){
  document.getElementById('studentBox').textContent = studentLabel();
  document.getElementById('examTitle').textContent = examData?.title || localStorage.getItem('examTitle') || 'Đề thi trực tuyến';
  const info=document.getElementById('examInfo');
  if(info){
    info.innerHTML = `Thời gian: <b>${settings.durationMinutes}</b> phút. ${settings.submitAfterMinutes?`Chỉ được nộp sau <b>${settings.submitAfterMinutes}</b> phút. `:''}Số lần được làm: <b>${settings.maxAttempts}</b>.`;
  }
  const box=document.getElementById('questions');
  box.innerHTML=questions.map(q=>{
    let body='', typeText='';
    if(q.type==='choice'){body=renderChoice(q); typeText='Trắc nghiệm';}
    else if(q.type==='truefalse'){body=renderTrueFalse(q); typeText='Đúng/Sai';}
    else if(q.type==='short'){body=renderShort(q); typeText='Trả lời ngắn';}
    else if(q.type==='essay'){body=renderEssay(q); typeText='Tự luận';}
    return `<article class="question-card" data-id="${q.id}"><div class="question-head"><h3>Câu ${q.id}</h3><span class="badge">${typeText}</span></div>${body}</article>`;
  }).join('');
  if(window.MathJax) MathJax.typesetPromise?.();
}
function normalizeShortAnswer(value){return String(value ?? '').trim().replace(/^\$|\$$/g,'').replace(/\s+/g,'').replace(/,/g,'.').replace(/\{,\}/g,'.').toLowerCase();}
function typeLabel(type){return type==='choice'?'Trắc nghiệm':type==='truefalse'?'Đúng/Sai':type==='short'?'Trả lời ngắn':type==='essay'?'Tự luận':type;}
function getEssayPointByOrder(order){
  const sc=settings.scoring || DEFAULT_SETTINGS.scoring;
  const pts=Array.isArray(sc.essayPoints)?sc.essayPoints:[];
  if(pts[order-1]!==undefined && !isNaN(Number(pts[order-1]))) return Number(pts[order-1]);
  return Number(sc.essayTotal || 0) / Math.max(1, Number(sc.essayCount || questions.filter(q=>q.type==='essay').length || 1));
}
function getPerQuestionMax(type, essayOrder=1){
  const sc=settings.scoring || DEFAULT_SETTINGS.scoring;
  if(type==='choice') return Number(sc.choiceTotal || 0) / Math.max(1, Number(sc.choiceCount || questions.filter(q=>q.type==='choice').length || 1));
  if(type==='truefalse') return Number(sc.truefalseTotal || 0) / Math.max(1, Number(sc.truefalseCount || questions.filter(q=>q.type==='truefalse').length || 1));
  if(type==='short') return Number(sc.shortTotal || 0) / Math.max(1, Number(sc.shortCount || questions.filter(q=>q.type==='short').length || 1));
  if(type==='essay') return getEssayPointByOrder(essayOrder);
  return 0;
}
function scoreTrueFalse(correctItems, maxPoint){
  const mode=(settings.scoring?.truefalseMode || 'progressive');
  if(mode==='equal') return maxPoint * correctItems / 4;
  const pct={0:0,1:0.10,2:0.25,3:0.50,4:1};
  return maxPoint * (pct[correctItems] ?? 0);
}
function getAnswersAndScore(){
  let fullCorrect=0, score=0;
  const partScores={choice:0,truefalse:0,short:0,essay:0}, maxScores={choice:0,truefalse:0,short:0,essay:0}, counts={choice:0,truefalse:0,short:0,essay:0};
  const detail=[], answers={};
  for(const q of questions){
    let isCorrect=false, given=null, point=0, correctItems=null;
    const maxPoint=getPerQuestionMax(q.type, counts.essay + (q.type==='essay'?1:0));
    if(q.type==='choice'){
      counts.choice++; const selected=document.querySelector(`input[name="q${q.id}"]:checked`); given=selected?Number(selected.value):null; answers[q.id]=given; isCorrect=given===q.answer; point=isCorrect?maxPoint:0; correctItems=isCorrect?1:0;
    }
    if(q.type==='truefalse'){
      counts.truefalse++; given=[]; correctItems=0; (q.statements||[]).forEach((st,i)=>{const selected=document.querySelector(`input[name="q${q.id}_${i}"]:checked`); const val=selected?selected.value==='true':null; given.push(val); if(val===st.answer) correctItems++;}); answers[q.id]=given; point=scoreTrueFalse(correctItems,maxPoint); isCorrect=correctItems===4;
    }
    if(q.type==='short'){
      counts.short++; const input=document.getElementById(`q${q.id}`); given=(input?.value||'').trim(); answers[q.id]=given; isCorrect=normalizeShortAnswer(given)===normalizeShortAnswer(q.answer); point=isCorrect?maxPoint:0; correctItems=isCorrect?1:0;
    }
    if(q.type==='essay'){
      counts.essay++; const input=document.getElementById(`q${q.id}`); given=(input?.value||'').trim(); answers[q.id]=given;
      const key=String(q.answer||'').trim();
      if(key){ const keys=key.split('|').map(normalizeShortAnswer); isCorrect=keys.includes(normalizeShortAnswer(given)); point=isCorrect?maxPoint:0; correctItems=isCorrect?1:0; }
      else { isCorrect=false; point=0; correctItems=0; }
    }
    if(isCorrect) fullCorrect++; score+=point; if(partScores[q.type]!==undefined) partScores[q.type]+=point; if(maxScores[q.type]!==undefined) maxScores[q.type]+=maxPoint;
    detail.push({id:q.id,type:q.type,typeLabel:typeLabel(q.type),given,correctAnswer:q.answer ?? q.statements?.map(s=>s.answer),correctItems,isCorrect,point:Number(point.toFixed(2)),maxPoint:Number(maxPoint.toFixed(2))});
  }
  const maxScore=Number((maxScores.choice+maxScores.truefalse+maxScores.short+maxScores.essay).toFixed(2));
  return {correct:fullCorrect,total:questions.length,score10:Number(score.toFixed(2)),maxScore,partScores:{choice:Number(partScores.choice.toFixed(2)),truefalse:Number(partScores.truefalse.toFixed(2)),short:Number(partScores.short.toFixed(2)),essay:Number(partScores.essay.toFixed(2))},maxScores:{choice:Number(maxScores.choice.toFixed(2)),truefalse:Number(maxScores.truefalse.toFixed(2)),short:Number(maxScores.short.toFixed(2)),essay:Number(maxScores.essay.toFixed(2))},counts,answers,detail};
}
async function submitExam(auto=false){
  if(examLocked) return;
  if(!auto && elapsedSeconds < minSubmitSeconds){alert(`Chưa được nộp bài. Em chỉ được nộp sau ${settings.submitAfterMinutes} phút.`); return;}
  examLocked=true; if(timerHandle) clearInterval(timerHandle);
  const result=getAnswersAndScore(); addAttempt();
  const payload={studentId:localStorage.getItem('studentId')||'',studentName:localStorage.getItem('studentName')||'',className:localStorage.getItem('className')||'',examId:localStorage.getItem('examId')||examData?.examId||'DE_MAU',examTitle:examData?.title||localStorage.getItem('examTitle')||'',score:result.score10,maxScore:result.maxScore,correct:result.correct,total:result.total,partScores:result.partScores,maxScores:result.maxScores,counts:result.counts,answers:result.answers,detail:result.detail,startTime:localStorage.getItem('startTime')||'',submitTime:new Date().toISOString(),scoringRule:JSON.stringify(settings.scoring||{})};
  saveResultLocal(payload); const onlineStatus=await saveResultOnline(payload); payload.onlineStatus=onlineStatus; localStorage.setItem('lastResult',JSON.stringify(payload)); window.location.href='result.html';
}
function updateSubmitButton(){
  const btn=document.getElementById('submitBtn'); if(!btn) return;
  if(elapsedSeconds < minSubmitSeconds){const left=Math.ceil((minSubmitSeconds-elapsedSeconds)/60); btn.disabled=true; btn.textContent=`Nộp sau ${left} phút`;}
  else{btn.disabled=false; btn.textContent='Nộp bài';}
}
function startTimer(){
  const timer=document.getElementById('timer');
  function tick(){
    const m=Math.floor(durationSeconds/60), s=durationSeconds%60; timer.textContent=`${m}:${String(s).padStart(2,'0')}`; updateSubmitButton();
    if(durationSeconds<=0){clearInterval(timerHandle); alert('Hết giờ. Hệ thống sẽ nộp bài.'); submitExam(true); return;}
    durationSeconds--; elapsedSeconds++;
  }
  tick(); timerHandle=setInterval(tick,1000);
}
function shuffleArray(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}}
async function init(){
  if(!localStorage.getItem('studentId') || !localStorage.getItem('className')) console.warn('Chưa có thông tin học sinh.');
  await loadQuestions();
  const maxAttempts=Number(settings.maxAttempts || 1);
  if(getAttemptCount() >= maxAttempts){document.getElementById('questions').innerHTML=`<section class="card"><h2>Đã hết số lần làm bài</h2><p>Em đã làm đủ ${maxAttempts} lần cho đề này trên thiết bị này.</p><a class="btn" href="index.html">Về trang chủ</a></section>`; document.getElementById('submitBtn').disabled=true; return;}
  renderExam(); startTimer();
  document.getElementById('submitBtn').addEventListener('click',()=>{if(confirm('Em chắc chắn muốn nộp bài?')) submitExam(false);});
  document.getElementById('shuffleBtn').addEventListener('click',()=>{shuffleArray(questions); renderExam();});
}
init();
