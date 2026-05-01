/* ══════════════════════════════════════════════════════════════
   ElectIQ — Frontend App (Voice + Multi-Language + Robot)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── DOM ────────────────────────────────────────────────────────
  const $ = s => document.querySelector(s);
  const sidebar       = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  const sidebarClose  = $('#sidebarClose');
  const newChatBtn    = $('#newChatBtn');
  const topicsList    = $('#topicsList');
  const welcomeScreen = $('#welcomeScreen');
  const welcomeCards  = $('#welcomeCards');
  const messagesBox   = $('#messagesContainer');
  const chatArea      = $('#chatArea');
  const msgInput      = $('#msgInput');
  const sendBtn       = $('#sendBtn');
  const themeBtn      = $('#themeBtn');
  const themeIcon     = $('#themeIcon');
  const aiStatus      = $('#aiStatus');
  const bgCanvas      = $('#bgCanvas');
  const langSelect    = $('#langSelect');
  const autoReadToggle= $('#autoReadToggle');
  const speechRate    = $('#speechRate');
  const voiceBtn      = $('#voiceBtn');
  const stopSpeakBtn  = $('#stopSpeakBtn');
  const robot         = $('#robot');
  const robotSpeech   = $('#robotSpeech');
  const speechBubble  = $('#speechBubble');

  let chatHistory = [];
  let isLoading = false;
  let currentLang = localStorage.getItem('electiq-lang') || 'en';
  langSelect.value = currentLang;

  // ── Language Mapping for TTS ───────────────────────────────────
  const langVoiceMap = {
    en:'en-US',hi:'hi-IN',es:'es-ES',fr:'fr-FR',de:'de-DE',pt:'pt-BR',
    ar:'ar-SA',bn:'bn-IN',ta:'ta-IN',te:'te-IN',mr:'mr-IN',gu:'gu-IN',
    kn:'kn-IN',ml:'ml-IN',pa:'pa-IN',ur:'ur-PK',zh:'zh-CN',ja:'ja-JP',
    ko:'ko-KR',ru:'ru-RU',sw:'sw-KE'
  };

  // Robot welcome messages per language
  const robotGreetings = {
    en: 'Hi! I\'m <strong>ElectIQ</strong> 👋<br/>Ask me anything about elections!<br/>Tap the 🎤 mic to talk to me!',
    hi: 'नमस्ते! मैं <strong>ElectIQ</strong> हूं 👋<br/>चुनावों के बारे में कुछ भी पूछें!<br/>बोलने के लिए 🎤 दबाएं!',
    es: '¡Hola! Soy <strong>ElectIQ</strong> 👋<br/>¡Pregúntame sobre elecciones!<br/>¡Toca el 🎤 para hablar!',
    fr: 'Salut! Je suis <strong>ElectIQ</strong> 👋<br/>Posez-moi des questions sur les élections!<br/>Appuyez sur 🎤 pour parler!',
    de: 'Hallo! Ich bin <strong>ElectIQ</strong> 👋<br/>Frag mich alles über Wahlen!<br/>Tippe auf 🎤 zum Sprechen!',
    ar: 'مرحباً! أنا <strong>ElectIQ</strong> 👋<br/>اسألني أي شيء عن الانتخابات!<br/>اضغط على 🎤 للتحدث!',
  };

  // Full UI Translations
  const uiTranslations = {
    en: {
      newChat: "New Chat", voiceAsst: "🔊 Voice Assistant", autoRead: "Auto-read answers",
      speed: "Speed", quickTopics: "⚡ Quick Topics",
      poweredBy: "Powered by Gemini AI", footerNote: "Non-partisan • For Everyone • All Languages",
      topTitle: "Election Process Education",
      welcomeGuide: "Your <span class='grad-text'>Election Guide</span>",
      welcomeSub: "Tap a topic below or ask me anything 👇",
      feat1: "Voice Input", feat2: "Read Aloud", feat3: "21 Languages", feat4: "Mobile Ready",
      placeholder: "Type or tap 🎤 to ask...",
      hint: "ElectIQ is educational only • Always verify with official sources"
    },
    hi: {
      newChat: "नया चैट", voiceAsst: "🔊 वॉयस असिस्टेंट", autoRead: "स्वचालित पढ़ें",
      speed: "गति", quickTopics: "⚡ त्वरित विषय",
      poweredBy: "Gemini AI द्वारा संचालित", footerNote: "निष्पक्ष • सभी के लिए • सभी भाषाएं",
      topTitle: "चुनाव प्रक्रिया शिक्षा",
      welcomeGuide: "आपका <span class='grad-text'>चुनाव मार्गदर्शक</span>",
      welcomeSub: "नीचे दिए गए विषय पर टैप करें या कुछ भी पूछें 👇",
      feat1: "वॉयस इनपुट", feat2: "जोर से पढ़ें", feat3: "21 भाषाएं", feat4: "मोबाइल रेडी",
      placeholder: "पूछने के लिए टाइप करें या 🎤 टैप करें...",
      hint: "ElectIQ केवल शैक्षिक है • हमेशा आधिकारिक स्रोतों से सत्यापित करें"
    }
  };

  function updateUILocale() {
    const t = uiTranslations[currentLang] || uiTranslations.en;
    
    $('#newChatBtn').innerHTML = `<span>＋</span> ${t.newChat}`;
    document.querySelectorAll('.section-label')[1].textContent = t.voiceAsst;
    document.querySelectorAll('.toggle-row span')[0].textContent = t.autoRead;
    document.querySelectorAll('.toggle-row span')[1].textContent = t.speed;
    document.querySelectorAll('.section-label')[2].textContent = t.quickTopics;
    
    $('.footer-badge').innerHTML = `<span class="badge-dot"></span> ${t.poweredBy}`;
    $('.footer-note').textContent = t.footerNote;
    $('.topbar-center h2').textContent = t.topTitle;
    $('.welcome-title').innerHTML = t.welcomeGuide;
    $('.welcome-sub').textContent = t.welcomeSub;
    
    const feats = document.querySelectorAll('.feat span:nth-child(2)');
    if (feats.length === 4) {
      feats[0].textContent = t.feat1; feats[1].textContent = t.feat2;
      feats[2].textContent = t.feat3; feats[3].textContent = t.feat4;
    }
    
    $('#msgInput').placeholder = t.placeholder;
    $('.input-hint').textContent = t.hint;

    updateRobotGreeting();
    loadTopics(); // Re-render topics with new language
  }

  // ── Theme ──────────────────────────────────────────────────────
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

  // ── Language ───────────────────────────────────────────────────
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    localStorage.setItem('electiq-lang', currentLang);
    updateUILocale();
  });

  function updateRobotGreeting() {
    robotSpeech.innerHTML = robotGreetings[currentLang] || robotGreetings.en;
  }

  // ── Sidebar ────────────────────────────────────────────────────
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

  // ── Particles Background ───────────────────────────────────────
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

  // ── Load Topics ────────────────────────────────────────────────
  async function loadTopics() {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      renderSidebarTopics(data.topics);
      renderWelcomeCards(data.topics);
    } catch (e) { console.error('Failed to load topics:', e); }
  }

  function renderSidebarTopics(topics) {
    topicsList.innerHTML = topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<button class="topic-btn" data-prompt="${esc(prompt)}">
        <span>${t.icon}</span><span>${title}</span>
      </button>`;
    }).join('');
    topicsList.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.dataset.prompt);
        sidebar.classList.remove('open');
      });
    });
  }

  function renderWelcomeCards(topics) {
    welcomeCards.innerHTML = topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<div class="topic-card" data-prompt="${esc(prompt)}" style="--card-c:${t.color}">
        <span class="card-emoji">${t.emoji}</span>
        <div class="card-title">${title}</div>
        <div class="card-sub">${prompt.split('.')[0]}</div>
      </div>`;
    }).join('');
    welcomeCards.querySelectorAll('.topic-card').forEach(card => {
      card.style.setProperty('--before-bg', card.style.getPropertyValue('--card-c'));
      card.addEventListener('click', () => sendMessage(card.dataset.prompt));
    });
  }

  // ── Health Check ───────────────────────────────────────────────
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

  // ══════════════════════════════════════════════════════════════
  // VOICE ASSISTANT — Speech-to-Text (STT) + Text-to-Speech (TTS)
  // ══════════════════════════════════════════════════════════════

  // ── Text-to-Speech (Read Aloud) ────────────────────────────────
  const synth = window.speechSynthesis;
  let currentUtterance = null;

  function speakText(text) {
    if (!autoReadToggle.checked || !synth) return;
    stopSpeaking();

    // Strip markdown for cleaner speech
    const clean = text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .replace(/[🗳️📋📅✉️🏛️🔒⚖️🌍🤝⚡🎯✅❌⭐💡🎤🔊📱👆✍️⏰📬🛡️✊🗺️💪👋🤖📊📜🤝❤️]/gu, '')
      .trim();

    if (!clean) return;

    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = langVoiceMap[currentLang] || 'en-US';
    utter.rate = parseFloat(speechRate.value) || 1;
    utter.pitch = 1;

    // Try to find a matching voice
    const voices = synth.getVoices();
    const targetLang = utter.lang.split('-')[0];
    const match = voices.find(v => v.lang.startsWith(targetLang));
    if (match) utter.voice = match;

    utter.onstart = () => {
      stopSpeakBtn.classList.remove('hidden');
      setRobotState('talking');
    };
    utter.onend = () => {
      stopSpeakBtn.classList.add('hidden');
      setRobotState('happy');
      setTimeout(() => setRobotState(''), 2000);
    };
    utter.onerror = () => {
      stopSpeakBtn.classList.add('hidden');
      setRobotState('');
    };

    currentUtterance = utter;
    synth.speak(utter);
  }

  function stopSpeaking() {
    if (synth.speaking) synth.cancel();
    stopSpeakBtn.classList.add('hidden');
    setRobotState('');
  }

  stopSpeakBtn.addEventListener('click', stopSpeaking);

  // Pre-load voices
  if (synth) {
    synth.getVoices();
    synth.onvoiceschanged = () => synth.getVoices();
  }

  // ── Speech-to-Text (Voice Input) ──────────────────────────────
  let recognition = null;
  let isListening = false;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceBtn.title = 'Voice input not supported in this browser';
      voiceBtn.style.opacity = '0.4';
      voiceBtn.style.cursor = 'not-allowed';
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langVoiceMap[currentLang] || 'en-US';

    recognition.onstart = () => {
      isListening = true;
      voiceBtn.classList.add('listening');
      msgInput.placeholder = 'Listening... 🎤';
      setRobotState('thinking');
    };

    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      msgInput.value = transcript;
      sendBtn.disabled = !transcript.trim();
      autoResize();

      // If final result, auto-send
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(() => {
          if (msgInput.value.trim()) sendMessage();
        }, 400);
      }
    };

    recognition.onend = () => {
      isListening = false;
      voiceBtn.classList.remove('listening');
      msgInput.placeholder = 'Type or tap 🎤 to ask...';
      if (robot.className === 'robot thinking') setRobotState('');
    };

    recognition.onerror = (e) => {
      isListening = false;
      voiceBtn.classList.remove('listening');
      msgInput.placeholder = 'Type or tap 🎤 to ask...';
      setRobotState('');
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error);
      }
    };
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
      try { recognition.start(); } catch (e) { console.warn('Recognition start error:', e); }
    }
  });

  initSpeechRecognition();

  // ── Robot State ────────────────────────────────────────────────
  function setRobotState(state) {
    robot.className = 'robot' + (state ? ' ' + state : '');
  }

  // ── Send Message ───────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = text || msgInput.value.trim();
    if (!msg || isLoading) return;

    msgInput.value = '';
    msgInput.style.height = 'auto';
    sendBtn.disabled = true;
    isLoading = true;
    stopSpeaking();

    // Show messages view
    welcomeScreen.style.display = 'none';
    messagesBox.style.display = 'flex';

    chatHistory.push({ role: 'user', content: msg });
    appendMessage('user', msg);

    const typingEl = appendTyping();
    scrollToBottom();
    setRobotState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: chatHistory.slice(0, -1),
          language: currentLang
        })
      });
      const data = await res.json();
      const reply = data.reply || data.error || 'Sorry, something went wrong.';
      chatHistory.push({ role: 'assistant', content: reply });

      typingEl.remove();
      appendMessage('assistant', reply);
      setRobotState('happy');
      setTimeout(() => setRobotState(''), 3000);

      // Auto-read the response
      speakText(reply);
    } catch (err) {
      typingEl.remove();
      appendMessage('assistant', '⚠️ Connection error. Please try again.');
      setRobotState('');
    }

    isLoading = false;
    scrollToBottom();
  }

  // ── Render Messages ────────────────────────────────────────────
  function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    const avatar = role === 'assistant' ? '🗳️' : '👤';
    const rendered = role === 'assistant' ? marked.parse(content) : escHtml(content);

    let actionsHTML = '';
    if (role === 'assistant') {
      actionsHTML = `<div class="msg-actions">
        <button class="msg-action-btn read-btn" title="Read aloud">🔊 Read</button>
        <button class="msg-action-btn copy-btn" title="Copy text">📋 Copy</button>
      </div>`;
    }

    div.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div>
        <div class="msg-bubble">${rendered}</div>
        ${actionsHTML}
      </div>`;

    // Wire up action buttons
    const readBtn = div.querySelector('.read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        speakText(content);
      });
    }
    const copyBtn = div.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content).then(() => {
          copyBtn.textContent = '✅ Copied!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
        });
      });
    }

    messagesBox.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.innerHTML = `
      <div class="msg-avatar">🗳️</div>
      <div><div class="msg-bubble">
        <div class="typing-ind"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>
      </div></div>`;
    messagesBox.appendChild(div);
    return div;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; });
  }

  // ── New Chat ───────────────────────────────────────────────────
  newChatBtn.addEventListener('click', () => {
    chatHistory = [];
    messagesBox.innerHTML = '';
    messagesBox.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    sidebar.classList.remove('open');
    stopSpeaking();
    setRobotState('');
    updateRobotGreeting();
  });

  // ── Input ──────────────────────────────────────────────────────
  function autoResize() {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
  }
  msgInput.addEventListener('input', () => {
    sendBtn.disabled = !msgInput.value.trim();
    autoResize();
  });
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', () => sendMessage());

  // ── Utils ──────────────────────────────────────────────────────
  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function esc(s) { return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  // ── Init ───────────────────────────────────────────────────────
  loadTopics();
  checkHealth();
  updateRobotGreeting();
  msgInput.focus();
})();
