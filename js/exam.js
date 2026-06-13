let examData = null;
let questions = [];
let durationSeconds = 90 * 60;
let timerHandle = null;

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
}

async function loadQuestions(){
  const res = await fetch('data/questions.json');
  examData = await res.json();
  questions = examData.questions || examData;
  return questions;
}

function studentLabel(){
  const sid = localStorage.getItem('studentId') || 'Chưa nhập mã';
  const name = localStorage.getItem('studentName') || '';
  const cls = localStorage.getItem('className') || 'Chưa nhập lớp';
  return `${sid}${name ? ' - ' + name : ''} - ${cls}`;
}

function renderLatex(text){
  return `<div class="latex-content">${text || ''}</div>`;
}

function visualBlock(q){
  if(q.image){
    return `<img class="question-image" src="${q.image}" alt="Hình câu ${q.id}">`;
  }
  if(q.hasTikz || q.hasImmini || q.hasTable){
    let flags=[];
    if(q.hasTikz) flags.push('TikZ');
    if(q.hasImmini) flags.push('immini');
    if(q.hasTable) flags.push('bảng');
    const raw = q.visualLatex ? `<details><summary>Xem mã LaTeX phần hình/bảng</summary><pre class="prebox">${escapeHtml(q.visualLatex)}</pre></details>` : '';
    return `<div class="visual-warning">Câu này có ${flags.join(', ')}. Bản V1 chưa tự xuất hình PNG, nên phần hình có thể chưa hiện như PDF.</div>${raw}`;
  }
  return '';
}

function renderChoice(q){
  const opts = q.options.map((opt, i) => `
    <label class="option">
      <input type="radio" name="q${q.id}" value="${i}">
      <span>${String.fromCharCode(65+i)}. ${opt}</span>
    </label>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${opts}`;
}

function renderTrueFalse(q){
  const rows = q.statements.map((st, i) => `
    <div class="tf-row">
      <div><strong>${String.fromCharCode(65+i)}.</strong> ${st.text}</div>
      <label><input type="radio" name="q${q.id}_${i}" value="true"> Đúng</label>
      <label><input type="radio" name="q${q.id}_${i}" value="false"> Sai</label>
    </div>`).join('');
  return `${renderLatex(q.question)}${visualBlock(q)}${rows}`;
}

function renderShort(q){
  return `${renderLatex(q.question)}${visualBlock(q)}<input class="short-input" id="q${q.id}" placeholder="Nhập đáp án">`;
}

function renderExam(){
  document.getElementById('studentBox').textContent = studentLabel();
  document.getElementById('examTitle').textContent = examData?.title || 'Đề thi trực tuyến';
  const box = document.getElementById('questions');
  box.innerHTML = questions.map(q => {
    let body = '';
    let typeText = '';
    if(q.type === 'choice'){ body = renderChoice(q); typeText = 'Trắc nghiệm'; }
    else if(q.type === 'truefalse'){ body = renderTrueFalse(q); typeText = 'Đúng/Sai'; }
    else if(q.type === 'short'){ body = renderShort(q); typeText = 'Trả lời ngắn'; }
    return `<article class="question-card" data-id="${q.id}">
      <div class="question-head"><h3>Câu ${q.id}</h3><span class="badge">${typeText}</span></div>
      ${body}
    </article>`;
  }).join('');
  if(window.MathJax) MathJax.typesetPromise?.();
}

function getAnswersAndScore(){
  let correct = 0;
  const detail = [];
  const answers = {};

  for(const q of questions){
    let isCorrect = false;
    let given = null;

    if(q.type === 'choice'){
      const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
      given = selected ? Number(selected.value) : null;
      answers[q.id] = given;
      isCorrect = given === q.answer;
    }

    if(q.type === 'truefalse'){
      given = [];
      let full = true;
      q.statements.forEach((st, i) => {
        const selected = document.querySelector(`input[name="q${q.id}_${i}"]:checked`);
        const val = selected ? selected.value === 'true' : null;
        given.push(val);
        if(val !== st.answer) full = false;
      });
      answers[q.id] = given;
      isCorrect = full;
    }

    if(q.type === 'short'){
      const input = document.getElementById(`q${q.id}`);
      given = (input?.value || '').trim();
      answers[q.id] = given;
      isCorrect = given === String(q.answer).trim();
    }

    if(isCorrect) correct++;
    detail.push({ id:q.id, type:q.type, given, correctAnswer:q.answer ?? q.statements?.map(s=>s.answer), isCorrect });
  }

  const total = questions.length;
  const score10 = total ? (correct / total * 10) : 0;
  return { correct, total, score10:Number(score10.toFixed(2)), answers, detail };
}

async function submitExam(){
  if(timerHandle) clearInterval(timerHandle);
  const result = getAnswersAndScore();
  const payload = {
    studentId: localStorage.getItem('studentId') || '',
    studentName: localStorage.getItem('studentName') || '',
    className: localStorage.getItem('className') || '',
    examId: localStorage.getItem('examId') || examData?.examId || 'DE_MAU',
    score: result.score10,
    correct: result.correct,
    total: result.total,
    answers: result.answers,
    detail: result.detail,
    startTime: localStorage.getItem('startTime') || '',
    submitTime: new Date().toISOString()
  };
  localStorage.setItem('lastResult', JSON.stringify(payload));
  saveResultLocal(payload);
  await saveResultOnline(payload);
  window.location.href = 'result.html';
}

function startTimer(){
  const timer = document.getElementById('timer');
  function tick(){
    const m = Math.floor(durationSeconds / 60);
    const s = durationSeconds % 60;
    timer.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if(durationSeconds <= 0){
      clearInterval(timerHandle);
      alert('Hết giờ. Hệ thống sẽ nộp bài.');
      submitExam();
      return;
    }
    durationSeconds--;
  }
  tick();
  timerHandle = setInterval(tick, 1000);
}

function shuffleArray(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

async function init(){
  if(!localStorage.getItem('studentId') || !localStorage.getItem('className')){
    // vẫn cho vào làm, nhưng nhắc nhập
    console.warn('Chưa có thông tin học sinh.');
  }
  await loadQuestions();
  renderExam();
  startTimer();
  document.getElementById('submitBtn').addEventListener('click', () => {
    if(confirm('Thầy/cô hoặc học sinh chắc chắn muốn nộp bài?')) submitExam();
  });
  document.getElementById('shuffleBtn').addEventListener('click', () => {
    shuffleArray(questions);
    renderExam();
  });
}

init();
