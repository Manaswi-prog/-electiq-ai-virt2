import { msgInput, sendBtn, welcomeScreen, messagesBox, chatArea, sidebar } from './dom.js';
import { currentLang, userName } from './config.js';
import { speakText, stopSpeaking, setRobotState } from './speech.js';
import { escHtml } from './dom.js';

export let chatHistory = [];
export let isLoading = false;

export function clearChat() {
  chatHistory = [];
}

export async function sendMessage(text) {
  const msg = text || msgInput.value.trim();
  if (!msg || isLoading) return;

  msgInput.value = '';
  msgInput.style.height = 'auto';
  sendBtn.disabled = true;
  isLoading = true;
  stopSpeaking();

  welcomeScreen.style.display = 'none';
  messagesBox.style.display = 'flex';

  chatHistory.push({ role: 'user', content: msg });
  appendMessage('user', msg);

  const assistantDiv = createAssistantMessageDiv();
  messagesBox.appendChild(assistantDiv);
  const bubble = assistantDiv.querySelector('.msg-bubble');
  
  scrollToBottom();
  setRobotState('thinking');

  let fullReply = '';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        history: chatHistory.slice(0, -1),
        language: currentLang,
        userName: userName
      })
    });

    if (!res.ok) throw new Error('Network response was not ok');

    setRobotState('talking');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      fullReply += chunk;
      bubble.innerHTML = marked.parse(fullReply);
      scrollToBottom();
    }

    chatHistory.push({ role: 'assistant', content: fullReply });
    attachMessageActions(assistantDiv, fullReply);

    setRobotState('happy');
    setTimeout(() => setRobotState(''), 3000);

    speakText(fullReply);

  } catch (err) {
    bubble.innerHTML = '⚠️ Connection error. Please try again.';
    setRobotState('');
  }

  isLoading = false;
  scrollToBottom();
}

export function appendMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const avatar = role === 'assistant' ? '🗳️' : '👤';
  const rendered = role === 'assistant' ? marked.parse(content) : escHtml(content);

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div>
      <div class="msg-bubble">${rendered}</div>
    </div>`;

  messagesBox.appendChild(div);
  scrollToBottom();
  return div;
}

function createAssistantMessageDiv() {
  const div = document.createElement('div');
  div.className = `message assistant`;
  div.innerHTML = `
    <div class="msg-avatar">🗳️</div>
    <div>
      <div class="msg-bubble"><div class="typing-ind"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div></div>
    </div>`;
  return div;
}

function attachMessageActions(div, content) {
  const actionsHTML = `
    <div class="msg-actions">
      <button class="msg-action-btn read-btn" title="Read aloud">🔊 Read</button>
      <button class="msg-action-btn copy-btn" title="Copy text">📋 Copy</button>
      ${navigator.share ? `<button class="share-btn msg-action-btn" title="Share">↗️ Share</button>` : ''}
    </div>`;
  
  div.querySelector('div').insertAdjacentHTML('beforeend', actionsHTML);

  const readBtn = div.querySelector('.read-btn');
  if (readBtn) readBtn.addEventListener('click', () => speakText(content));

  const copyBtn = div.querySelector('.copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 1500);
      });
    });
  }

  const shareBtn = div.querySelector('.share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'ElectIQ Election Fact',
          text: content.replace(/\*\*/g, '').substring(0, 150) + '... (Read more on ElectIQ)',
          url: window.location.href
        });
      } catch (e) {}
    });
  }
}

export function scrollToBottom() {
  requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; });
}
