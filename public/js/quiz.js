import { currentLang } from './config.js';
import { escHtml } from './dom.js';

const quizModal = document.getElementById('quizModal');
const quizBody = document.getElementById('quizBody');
const quizFooter = document.getElementById('quizFooter');
const quizScore = document.getElementById('quizScore');
const quizModeBtn = document.getElementById('quizModeBtn');
const quizClose = document.getElementById('quizClose');
const quizRetry = document.getElementById('quizRetry');

let quizData = [];
let quizAnswered = 0;
let quizCorrect = 0;

export function initQuiz(sidebar) {
  if (quizModeBtn) {
    quizModeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      openQuiz();
    });
  }
  if (quizClose) quizClose.addEventListener('click', closeQuiz);
  if (quizRetry) quizRetry.addEventListener('click', openQuiz);
  if (quizModal) {
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) closeQuiz();
    });
  }
}

export function closeQuiz() {
  quizModal.classList.add('hidden');
}

export async function openQuiz() {
  quizModal.classList.remove('hidden');
  quizFooter.style.display = 'none';
  quizBody.innerHTML = '<div class="quiz-loading"><div class="typing-ind"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div><p>Generating quiz with AI...</p></div>';
  quizData = [];
  quizAnswered = 0;
  quizCorrect = 0;

  try {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: currentLang })
    });
    const data = await res.json();
    
    if (Array.isArray(data)) {
      quizData = data;
      renderQuiz();
    } else {
      throw new Error('Invalid JSON structure');
    }
  } catch (err) {
    console.error("Quiz error:", err);
    quizBody.innerHTML = '<p style="color:red;text-align:center;">Failed to load quiz. Please try again.</p>';
  }
}

function renderQuiz() {
  const letters = ['A', 'B', 'C', 'D'];
  quizBody.innerHTML = quizData.map((q, qi) => `
    <div class="quiz-question" id="quizQ${qi}">
      <div class="quiz-question-num">Question ${qi + 1} of ${quizData.length}</div>
      <div class="quiz-question-text">${escHtml(q.q)}</div>
      <div class="quiz-options">
        ${q.options.map((opt, oi) => `
          <button class="quiz-option" data-qi="${qi}" data-oi="${oi}">
            <span class="quiz-option-letter">${letters[oi]}</span>
            <span>${escHtml(opt)}</span>
          </button>
        `).join('')}
      </div>
      <div class="quiz-explanation" id="quizExp${qi}" style="display:none;"></div>
    </div>
  `).join('');

  quizBody.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', handleQuizAnswer);
  });
}

function handleQuizAnswer(e) {
  const btn = e.currentTarget;
  const qi = parseInt(btn.dataset.qi);
  const oi = parseInt(btn.dataset.oi);
  const q = quizData[qi];
  const isCorrect = oi === q.answer;

  const questionEl = document.getElementById(`quizQ${qi}`);
  questionEl.querySelectorAll('.quiz-option').forEach((opt, i) => {
    opt.classList.add('selected');
    if (i === q.answer) opt.classList.add('correct');
    else if (i === oi && !isCorrect) opt.classList.add('wrong');
  });

  const expEl = document.getElementById(`quizExp${qi}`);
  expEl.style.display = 'block';
  expEl.textContent = (isCorrect ? '✅ Correct! ' : '❌ Incorrect. ') + (q.explanation || '');

  quizAnswered++;
  if (isCorrect) quizCorrect++;

  if (quizAnswered >= quizData.length) {
    quizFooter.style.display = 'flex';
    const pct = Math.round((quizCorrect / quizData.length) * 100);
    quizScore.innerHTML = `<span class="score-num">${quizCorrect}/${quizData.length}</span> (${pct}%) ${pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}`;
  }
}
