import { msgInput, sendBtn, welcomeScreen, messagesBox, chatArea, sidebar } from './dom.js';
import { currentLang, userName } from './config.js';
import { speakText, stopSpeaking, setRobotState } from './speech.js';
import { escHtml } from './dom.js';

export let chatHistory = [];
export let isLoading = false;
export let currentImageBase64 = null;
export let currentImageMimeType = null;

export function clearChat() {
  chatHistory = [];
  clearImage();
}

export function setImage(base64, mimeType) {
  currentImageBase64 = base64;
  currentImageMimeType = mimeType;
}

export function clearImage() {
  currentImageBase64 = null;
  currentImageMimeType = null;
}

export async function sendMessage(text) {
  const msg = text || msgInput.value.trim();
  if (!msg && !currentImageBase64) return;
  if (isLoading) return;

  msgInput.value = '';
  msgInput.style.height = 'auto';
  sendBtn.disabled = true;
  isLoading = true;
  stopSpeaking();

  welcomeScreen.style.display = 'none';
  messagesBox.style.display = 'flex';

  const userPayload = { role: 'user', content: msg };
  if (currentImageBase64) {
    userPayload.image = currentImageBase64;
    userPayload.mimeType = currentImageMimeType;
  }
  
  chatHistory.push(userPayload);
  appendMessage('user', msg, currentImageBase64);

  const reqBody = {
    message: msg,
    history: chatHistory.slice(0, -1),
    language: currentLang,
    userName: userName
  };

  if (currentImageBase64) {
    reqBody.image = currentImageBase64;
    reqBody.mimeType = currentImageMimeType;
  }

  // Clear image immediately after sending
  clearImage();
  import('./dom.js').then(dom => {
    dom.imagePreviewContainer.classList.add('hidden');
    dom.imagePreview.src = '';
    dom.imageInput.value = '';
  });

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
      body: JSON.stringify(reqBody)
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

export function appendMessage(role, content, imageBase64 = null) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const avatar = role === 'assistant' ? '🗳️' : '👤';
  const rendered = role === 'assistant' ? marked.parse(content) : escHtml(content);

  let imageHtml = '';
  if (imageBase64) {
    imageHtml = `<img src="${imageBase64}" style="max-width:100%; border-radius:8px; margin-bottom:8px; border:1px solid var(--a1);">`;
  }

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div>
      <div class="msg-bubble">${imageHtml}${rendered}</div>
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
