let examData = null;
let questions = [];
let durationSeconds = 90 * 60;
let timerHandle = null;

// Quy tắc điểm theo cấu trúc đề tốt nghiệp THPT hiện hành:
// - 12 câu trắc nghiệm đầu: 0.25 điểm/câu.
// - 4 câu Đúng/Sai: đúng 1 ý = 0.10; đúng 2 ý = 0.25; đúng 3 ý = 0.50; đúng 4 ý = 1.00.
// - 6 câu trả lời ngắn: 0.50 điểm/câu.
const SCORE_RULES = {
  choice: 0.25,
  short: 0.50,
  truefalse: {
    0: 0,
    1: 0.10,
    2: 0.25,
    3: 0.50,
    4: 1.00
  }
};

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]));
}

async function loadQuestions(){
  const examId = localStorage.getItem('examId') || 'DE_MAU';
  const url = `exams/${examId}/questions.json?_=${Date.now()}`;
  let res = await fetch(url);
  if(!res.ok){
    res = await fetch('data/questions.json?_=' + Date.now());
  }
  examData = await res.json();
  questions = examData.questions || examData;
  localStorage.setItem('examTitle', examData.title || localStorage.getItem('examTitle') || examId);
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
    return `<div class="visual-warning">Câu này có ${flags.join(', ')}. Nếu chưa thấy hình, hãy chạy render_visuals_v2.py để xuất ảnh.</div>${raw}`;
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
  document.getElementById('examTitle').textContent = examData?.title || localStorage.getItem('examTitle') || 'Đề thi trực tuyến';
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

function normalizeShortAnswer(value){
  return String(value ?? '')
    .trim()
    .replace(/^\$|\$$/g, '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/\{,\}/g, '.')
    .toLowerCase();
}

function typeLabel(type){
  if(type === 'choice') return 'Trắc nghiệm';
  if(type === 'truefalse') return 'Đúng/Sai';
  if(type === 'short') return 'Trả lời ngắn';
  return type;
}

function getAnswersAndScore(){
  let fullCorrect = 0;
  let score = 0;
  const partScores = { choice: 0, truefalse: 0, short: 0 };
  const maxScores = { choice: 0, truefalse: 0, short: 0 };
  const counts = { choice: 0, truefalse: 0, short: 0 };
  const detail = [];
  const answers = {};

  for(const q of questions){
    let isCorrect = false;
    let given = null;
    let point = 0;
    let maxPoint = 0;
    let correctItems = null;

    if(q.type === 'choice'){
      counts.choice++;
      maxPoint = SCORE_RULES.choice;
      const selected = document.querySelector(`input[name="q${q.id}"]:checked`);
      given = selected ? Number(selected.value) : null;
      answers[q.id] = given;
      isCorrect = given === q.answer;
      point = isCorrect ? SCORE_RULES.choice : 0;
      correctItems = isCorrect ? 1 : 0;
    }

    if(q.type === 'truefalse'){
      counts.truefalse++;
      maxPoint = SCORE_RULES.truefalse[4];
      given = [];
      correctItems = 0;
      q.statements.forEach((st, i) => {
        const selected = document.querySelector(`input[name="q${q.id}_${i}"]:checked`);
        const val = selected ? selected.value === 'true' : null;
        given.push(val);
        if(val === st.answer) correctItems++;
      });
      answers[q.id] = given;
      point = SCORE_RULES.truefalse[correctItems] ?? 0;
      isCorrect = correctItems === 4;
    }

    if(q.type === 'short'){
      counts.short++;
      maxPoint = SCORE_RULES.short;
      const input = document.getElementById(`q${q.id}`);
      given = (input?.value || '').trim();
      answers[q.id] = given;
      isCorrect = normalizeShortAnswer(given) === normalizeShortAnswer(q.answer);
      point = isCorrect ? SCORE_RULES.short : 0;
      correctItems = isCorrect ? 1 : 0;
    }

    if(isCorrect) fullCorrect++;
    score += point;
    if(partScores[q.type] !== undefined) partScores[q.type] += point;
    if(maxScores[q.type] !== undefined) maxScores[q.type] += maxPoint;

    detail.push({
      id: q.id,
      type: q.type,
      typeLabel: typeLabel(q.type),
      given,
      correctAnswer: q.answer ?? q.statements?.map(s=>s.answer),
      correctItems,
      isCorrect,
      point: Number(point.toFixed(2)),
      maxPoint: Number(maxPoint.toFixed(2))
    });
  }

  const total = questions.length;
  const maxScore = Number((maxScores.choice + maxScores.truefalse + maxScores.short).toFixed(2));
  const score10 = Number(score.toFixed(2));

  return {
    correct: fullCorrect,
    total,
    score10,
    maxScore,
    partScores: {
      choice: Number(partScores.choice.toFixed(2)),
      truefalse: Number(partScores.truefalse.toFixed(2)),
      short: Number(partScores.short.toFixed(2))
    },
    maxScores: {
      choice: Number(maxScores.choice.toFixed(2)),
      truefalse: Number(maxScores.truefalse.toFixed(2)),
      short: Number(maxScores.short.toFixed(2))
    },
    counts,
    answers,
    detail
  };
}

async function submitExam(){
  if(timerHandle) clearInterval(timerHandle);
  const result = getAnswersAndScore();
  const payload = {
    studentId: localStorage.getItem('studentId') || '',
    studentName: localStorage.getItem('studentName') || '',
    className: localStorage.getItem('className') || '',
    examId: localStorage.getItem('examId') || examData?.examId || 'DE_MAU',
    examTitle: examData?.title || localStorage.getItem('examTitle') || '',
    score: result.score10,
    maxScore: result.maxScore,
    correct: result.correct,
    total: result.total,
    partScores: result.partScores,
    maxScores: result.maxScores,
    counts: result.counts,
    answers: result.answers,
    detail: result.detail,
    startTime: localStorage.getItem('startTime') || '',
    submitTime: new Date().toISOString(),
    scoringRule: 'TN: 0.25/câu; ĐS: 1 ý=0.10, 2 ý=0.25, 3 ý=0.50, 4 ý=1.00; TLN: 0.50/câu'
  };
  saveResultLocal(payload);
  const onlineStatus = await saveResultOnline(payload);
  payload.onlineStatus = onlineStatus;
  localStorage.setItem('lastResult', JSON.stringify(payload));
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
