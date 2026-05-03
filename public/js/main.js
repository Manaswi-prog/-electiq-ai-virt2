import { $, sidebar, sidebarToggle, sidebarClose, newChatBtn, topicsList, welcomeCards, welcomeScreen, messagesBox, msgInput, sendBtn, themeBtn, themeIcon, aiStatus, bgCanvas, langSelect, voiceBtn, stopSpeakBtn, robotSpeech, onboardingModal, onboardNameInput, onboardSubmitBtn, imageBtn, imageInput, imagePreviewContainer, imagePreview, removeImageBtn } from './dom.js';
import { currentLang, setCurrentLang, uiTranslations, robotGreetings, langVoiceMap, userName, setUserName } from './config.js';
import { initSpeechRecognition, stopSpeaking, synth, setRobotState, recognition, isListening } from './speech.js';
import { sendMessage, clearChat, chatHistory, setImage, clearImage } from './chat.js';
import { initQuiz } from './quiz.js';
import { esc } from './dom.js';

// ... 
function checkSendBtnState() {
  const hasText = msgInput.value.trim().length > 0;
  const hasImage = !imagePreviewContainer.classList.contains('hidden');
  sendBtn.disabled = !(hasText || hasImage);
}

msgInput.addEventListener('input', () => {
  checkSendBtnState();
  autoResize();
});

imageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    const mimeType = file.type;
    setImage(base64, mimeType);
    imagePreview.src = base64;
    imagePreviewContainer.classList.remove('hidden');
    checkSendBtnState();
  };
  reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
  clearImage();
  imagePreviewContainer.classList.add('hidden');
  imagePreview.src = '';
  imageInput.value = '';
  checkSendBtnState();
});

function updateUILocale() {
  const t = uiTranslations[currentLang] || uiTranslations.en;
  
  $('#newChatBtn').innerHTML = `<span>＋</span> ${t.newChat}`;
  const sectionLabels = document.querySelectorAll('.section-label');
  if (sectionLabels[0]) sectionLabels[0].textContent = t.langLabel;
  if (sectionLabels[1]) sectionLabels[1].textContent = t.voiceAsst;
  if (sectionLabels[2]) sectionLabels[2].textContent = t.quickTopics;
  
  const toggleRows = document.querySelectorAll('.toggle-row');
  if (toggleRows[0]) toggleRows[0].querySelector(':scope > span').textContent = t.autoRead;
  if (toggleRows[1]) toggleRows[1].querySelector(':scope > span').textContent = t.speed;
  
  $('.footer-badge').innerHTML = `<span class="badge-dot"></span> ${t.poweredBy}`;
  $('.footer-note').textContent = t.footerNote;
  $('.topbar-center h2').textContent = t.topTitle;
  if ($('.welcome-title')) $('.welcome-title').innerHTML = t.welcomeGuide;
  if ($('.welcome-sub')) $('.welcome-sub').textContent = t.welcomeSub;
  
  const feats = document.querySelectorAll('.feat span:nth-child(2)');
  if (feats.length === 4) {
    feats[0].textContent = t.feat1; feats[1].textContent = t.feat2;
    feats[2].textContent = t.feat3; feats[3].textContent = t.feat4;
  }
  
  msgInput.placeholder = t.placeholder;
  $('.input-hint').textContent = t.hint;
  
  const quizBtn = document.getElementById('quizModeBtn');
  const exportBtn = document.getElementById('exportChatBtn');
  if (quizBtn) quizBtn.innerHTML = t.quizBtn;
  if (exportBtn) exportBtn.innerHTML = t.exportBtn;
  
  const streakLabel = document.querySelector('.streak-label');
  if (streakLabel) streakLabel.textContent = t.streakLabel;

  updateRobotGreeting();

  loadTopics();
}

const savedTheme = localStorage.getItem('electiq-theme') || 'dark';
if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
updateThemeIcon();

themeBtn.addEventListener('click', () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  document.documentElement.setAttribute('data-theme', isLight ? '' : 'light');
  localStorage.setItem('electiq-theme', isLight ? 'dark' : 'light');
  updateThemeIcon();
});

function updateThemeIcon() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  themeIcon.textContent = isLight ? '☀️' : '🌙';
}

langSelect.value = currentLang;
langSelect.addEventListener('change', () => {
  setCurrentLang(langSelect.value);
  updateUILocale();
});

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarToggle.setAttribute('aria-expanded', sidebar.classList.contains('open'));
});
sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

newChatBtn.addEventListener('click', () => {
  clearChat();
  messagesBox.innerHTML = '';
  messagesBox.style.display = 'none';
  welcomeScreen.style.display = 'flex';
  sidebar.classList.remove('open');
  stopSpeaking();
  setRobotState('');
  updateRobotGreeting();
});

export function autoResize() {
  msgInput.style.height = 'auto';
  msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
}

msgInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

sendBtn.addEventListener('click', () => sendMessage());

const exportChatBtn = document.getElementById('exportChatBtn');
if (exportChatBtn) {
  exportChatBtn.addEventListener('click', () => {
    if (chatHistory.length === 0) {
      alert('No chat to export yet. Start a conversation first!');
      return;
    }
    let text = '🗳️ ElectIQ — Chat Export\n';
    text += '━'.repeat(40) + '\n';
    text += `Date: ${new Date().toLocaleString()}\n`;
    text += `Language: ${currentLang.toUpperCase()}\n`;
    text += '━'.repeat(40) + '\n\n';
    
    chatHistory.forEach(msg => {
      const label = msg.role === 'user' ? '👤 You' : '🗳️ ElectIQ';
      const clean = msg.content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/#{1,6}\s?/g, '');
      text += `${label}:\n${clean}\n\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `electiq-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    sidebar.classList.remove('open');
  });
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastVisit = localStorage.getItem('electiq-last-visit');
  let streak = parseInt(localStorage.getItem('electiq-streak') || '0', 10);
  
  if (lastVisit !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    streak = (lastVisit === yesterday) ? streak + 1 : 1;
    localStorage.setItem('electiq-streak', streak);
    localStorage.setItem('electiq-last-visit', today);
  }
  
  const countEl = document.getElementById('streakCount');
  if (countEl) countEl.textContent = streak;
}

async function loadTopics() {
  try {
    const res = await fetch('/api/topics');
    const data = await res.json();
    topicsList.innerHTML = data.topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<button class="topic-btn" data-prompt="${esc(prompt)}"><span>${t.icon}</span><span>${title}</span></button>`;
    }).join('');
    
    topicsList.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => { sendMessage(btn.dataset.prompt); sidebar.classList.remove('open'); });
    });

    welcomeCards.innerHTML = data.topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<div class="topic-card" data-prompt="${esc(prompt)}" style="--card-c:${t.color}"><span class="card-emoji">${t.emoji}</span><div class="card-title">${title}</div><div class="card-sub">${prompt.split('.')[0]}</div></div>`;
    }).join('');
    
    welcomeCards.querySelectorAll('.topic-card').forEach(card => {
      card.style.setProperty('--before-bg', card.style.getPropertyValue('--card-c'));
      card.addEventListener('click', () => sendMessage(card.dataset.prompt));
    });
  } catch (e) { console.error('Failed to load topics:', e); }
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const dot = aiStatus.querySelector('.dot');
    const txt = aiStatus.querySelector('.dot-text');
    if (data.ai) {
      dot.style.background = 'var(--a2)'; txt.textContent = 'AI Online';
    } else {
      dot.style.background = '#fdcb6e'; txt.textContent = 'Fallback Mode';
    }
  } catch { aiStatus.querySelector('.dot-text').textContent = 'Offline'; }
}

(function initParticles() {
  const ctx = bgCanvas.getContext('2d');
  let particles = [];
  const resize = () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);

  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      o: Math.random() * 0.35 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = bgCanvas.width;
      if (p.x > bgCanvas.width) p.x = 0;
      if (p.y < 0) p.y = bgCanvas.height;
      if (p.y > bgCanvas.height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108,92,231,${p.o})`; ctx.fill();
    });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(108,92,231,${0.05 * (1 - d / 110)})`;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

window.addEventListener('online', () => document.getElementById('offlineBanner')?.classList.remove('show'));
window.addEventListener('offline', () => document.getElementById('offlineBanner')?.classList.add('show'));
if (!navigator.onLine) document.getElementById('offlineBanner')?.classList.add('show');

if (synth) {
  synth.getVoices();
  synth.onvoiceschanged = () => synth.getVoices();
}

voiceBtn.addEventListener('click', () => {
  if (!recognition) {
    initSpeechRecognition();
    if (!recognition) return;
  }
  if (isListening) {
    recognition.stop();
  } else {
    recognition.lang = langVoiceMap[currentLang] || 'en-US';
    try { recognition.start(); } catch (e) { }
  }
});

stopSpeakBtn.addEventListener('click', stopSpeaking);

updateUILocale();
initQuiz(sidebar);
checkHealth();
updateStreak();
msgInput.focus();

function updateRobotGreeting() {
  const defaultGreeting = robotGreetings[currentLang] || robotGreetings.en;
  if (userName) {
     robotSpeech.innerHTML = `Hey <strong>${userName}</strong>! 👋<br/>` + defaultGreeting.replace(/Hi! I'm <strong>ElectIQ<\\/strong> 👋<br\\/>/, '').replace(/नमस्ते! मैं <strong>ElectIQ<\\/strong> हूं 👋<br\\/>/, '');
  } else {
     robotSpeech.innerHTML = defaultGreeting;
  }
}

function initOnboarding() {
  if (!userName) {
    onboardingModal.classList.remove('hidden');
    onboardNameInput.focus();
  } else {
    updateRobotGreeting();
  }
}

onboardSubmitBtn.addEventListener('click', () => {
  const name = onboardNameInput.value.trim();
  if (name) {
    setUserName(name);
    onboardingModal.classList.add('hidden');
    updateRobotGreeting();
    
    setTimeout(() => {
      sendMessage(`Hi, I'm ${name}! I'm using ElectIQ for the first time. Say hi to me in a fun, relatable Gen-Z way and tell me 1 cool thing you can do!`);
    }, 500);
  }
});

onboardNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onboardSubmitBtn.click();
});

initOnboarding();
