import { autoReadToggle, speechRate, stopSpeakBtn, voiceBtn, msgInput, sendBtn, robot } from './dom.js';
import { langVoiceMap, currentLang } from './config.js';
import { sendMessage } from './chat.js';

export const synth = window.speechSynthesis;
export let currentUtterance = null;
export let recognition = null;
export let isListening = false;

export function setRobotState(state) {
  robot.className = 'robot' + (state ? ' ' + state : '');
}

export function speakText(text) {
  if (!autoReadToggle.checked || !synth) return;
  stopSpeaking();

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

export function stopSpeaking() {
  if (synth && synth.speaking) synth.cancel();
  stopSpeakBtn.classList.add('hidden');
  setRobotState('');
}

export function initSpeechRecognition() {
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
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';

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
  };
}
