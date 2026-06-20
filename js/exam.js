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

function latexTextClientClean(s){
  s = String(s ?? '');
  // Dọn các môi trường văn bản còn sót trong JSON cũ.
  s = s.replace(/\\begin\s*\{\s*center\s*\}|\\begincenter\b/g, '<div class="centered">');
  s = s.replace(/\\end\s*\{\s*center\s*\}|\\endcenter\b/g, '</div>');
  s = s.replace(/\\begin\s*\{\s*(itemize|itimize|enumerate|itemchoice)\s*\}|\\begin(itemize|itimize|enumerate|itemchoice)\b/g, '<br>');
  s = s.replace(/\\end\s*\{\s*(itemize|itimize|enumerate|itemchoice)\s*\}|\\end(itemize|itimize|enumerate|itemchoice)\b/g, '<br>');
  s = s.replace(/\\item\s*(\[[^\]]*\])?/g, '<br>• ');
  // Các lệnh định dạng văn bản cơ bản.
  for(let k=0;k<6;k++){
    const old=s;
    s = s.replace(/\{\s*\\it\s*\{([^{}]*)\}\s*\}/g, '<em>$1</em>');
    s = s.replace(/\{\s*\\it\s+([^{}]+?)\s*\}/g, '<em>$1</em>');
    s = s.replace(/\\textit\s*\{([^{}]*)\}/g, '<em>$1</em>');
    s = s.replace(/\\emph\s*\{([^{}]*)\}/g, '<em>$1</em>');
    s = s.replace(/\\textbf\s*\{([^{}]*)\}/g, '<strong>$1</strong>');
    s = s.replace(/\\text\s*\{([^{}]*)\}/g, '$1');
    if(s===old) break;
  }
  s = s.replace(/\\(it|itshape|textit|emph|textbf|bf|bfseries)\b\s*/g, '');
  s = s.replace(/\\(begin|end)\s*\{[^{}]*\}/g, ' ');
  s = s.replace(/\\(begin|end)[A-Za-z]+\b/g, ' ');
  s = s.replace(/(?<=>)(?=\S)/g,' ').replace(/(?<=\S)(?=<)/g,' ');
  return s;
}

function renderLatex(text){return `<div class="latex-content">${latexTextClientClean(text || '')}</div>`;}
function visualBlock(q){
  if(q.image) return `<img class="question-image" src="${q.image}" alt="Hình câu ${q.id}">`;
  if(q.hasTikz || q.hasImmini || q.hasTable){
    let flags=[]; if(q.hasTikz) flags.push('TikZ'); if(q.hasImmini) flags.push('immini'); if(q.hasTable) flags.push('bảng');
    return `<div class="visual-warning">Câu này có ${flags.join(', ')}. Giáo viên cần chạy công cụ quản lý đề V9 để xuất hình.</div>`;
  }
  return '';
}
function renderChoice(q){
  const opts=(q.options||[]).map((opt,i)=>`<label class="option"><input type="radio" name="q${q.id}" value="${i}"><span>${String.fromCharCode(65+i)}. ${latexTextClientClean(opt)}</span></label>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${opts}`;
}
function renderTrueFalse(q){
  const rows=(q.statements||[]).map((st,i)=>`<div class="tf-row"><div><strong>${String.fromCharCode(65+i)}.</strong> ${latexTextClientClean(st.text)}</div><label><input type="radio" name="q${q.id}_${i}" value="true"> Đúng</label><label><input type="radio" name="q${q.id}_${i}" value="false"> Sai</label></div>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${rows}`;
}
function renderShort(q){return `${renderLatex(q.question)}${visualBlock(q)}<input class="short-input" id="q${q.id}" placeholder="Nhập đáp án">`;}
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
    return `<article class="question-card" data-id="${q.id}"><div class="question-head"><h3>Câu ${q.id}</h3><span class="badge">${typeText}</span></div>${body}</article>`;
  }).join('');
  if(window.MathJax) MathJax.typesetPromise?.();
}
function normalizeShortAnswer(value){return String(value ?? '').trim().replace(/^\$|\$$/g,'').replace(/\s+/g,'').replace(/,/g,'.').replace(/\{,\}/g,'.').toLowerCase();}
function typeLabel(type){return type==='choice'?'Trắc nghiệm':type==='truefalse'?'Đúng/Sai':type==='short'?'Trả lời ngắn':type;}
function getPerQuestionMax(type){
  const sc=settings.scoring || DEFAULT_SETTINGS.scoring;
  if(type==='choice') return Number(sc.choiceTotal || 0) / Math.max(1, Number(sc.choiceCount || questions.filter(q=>q.type==='choice').length || 1));
  if(type==='truefalse') return Number(sc.truefalseTotal || 0) / Math.max(1, Number(sc.truefalseCount || questions.filter(q=>q.type==='truefalse').length || 1));
  if(type==='short') return Number(sc.shortTotal || 0) / Math.max(1, Number(sc.shortCount || questions.filter(q=>q.type==='short').length || 1));
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
  const partScores={choice:0,truefalse:0,short:0}, maxScores={choice:0,truefalse:0,short:0}, counts={choice:0,truefalse:0,short:0};
  const detail=[], answers={};
  for(const q of questions){
    let isCorrect=false, given=null, point=0, correctItems=null;
    const maxPoint=getPerQuestionMax(q.type);
    if(q.type==='choice'){
      counts.choice++; const selected=document.querySelector(`input[name="q${q.id}"]:checked`); given=selected?Number(selected.value):null; answers[q.id]=given; isCorrect=given===q.answer; point=isCorrect?maxPoint:0; correctItems=isCorrect?1:0;
    }
    if(q.type==='truefalse'){
      counts.truefalse++; given=[]; correctItems=0; (q.statements||[]).forEach((st,i)=>{const selected=document.querySelector(`input[name="q${q.id}_${i}"]:checked`); const val=selected?selected.value==='true':null; given.push(val); if(val===st.answer) correctItems++;}); answers[q.id]=given; point=scoreTrueFalse(correctItems,maxPoint); isCorrect=correctItems===4;
    }
    if(q.type==='short'){
      counts.short++; const input=document.getElementById(`q${q.id}`); given=(input?.value||'').trim(); answers[q.id]=given; isCorrect=normalizeShortAnswer(given)===normalizeShortAnswer(q.answer); point=isCorrect?maxPoint:0; correctItems=isCorrect?1:0;
    }
    if(isCorrect) fullCorrect++; score+=point; if(partScores[q.type]!==undefined) partScores[q.type]+=point; if(maxScores[q.type]!==undefined) maxScores[q.type]+=maxPoint;
    detail.push({id:q.id,type:q.type,typeLabel:typeLabel(q.type),given,correctAnswer:q.answer ?? q.statements?.map(s=>s.answer),correctItems,isCorrect,point:Number(point.toFixed(2)),maxPoint:Number(maxPoint.toFixed(2))});
  }
  const maxScore=Number((maxScores.choice+maxScores.truefalse+maxScores.short).toFixed(2));
  return {correct:fullCorrect,total:questions.length,score10:Number(score.toFixed(2)),maxScore,partScores:{choice:Number(partScores.choice.toFixed(2)),truefalse:Number(partScores.truefalse.toFixed(2)),short:Number(partScores.short.toFixed(2))},maxScores:{choice:Number(maxScores.choice.toFixed(2)),truefalse:Number(maxScores.truefalse.toFixed(2)),short:Number(maxScores.short.toFixed(2))},counts,answers,detail};
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
