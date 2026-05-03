export const $ = s => document.querySelector(s);
export const sidebar = $('#sidebar');
export const sidebarToggle = $('#sidebarToggle');
export const sidebarClose = $('#sidebarClose');
export const newChatBtn = $('#newChatBtn');
export const topicsList = $('#topicsList');
export const welcomeScreen = $('#welcomeScreen');
export const welcomeCards = $('#welcomeCards');
export const messagesBox = $('#messagesContainer');
export const chatArea = $('#chatArea');
export const msgInput = $('#msgInput');
export const sendBtn = $('#sendBtn');
export const themeBtn = $('#themeBtn');
export const themeIcon = $('#themeIcon');
export const aiStatus = $('#aiStatus');
export const bgCanvas = $('#bgCanvas');
export const langSelect = $('#langSelect');
export const autoReadToggle = $('#autoReadToggle');
export const speechRate = $('#speechRate');
export const voiceBtn = $('#voiceBtn');
export const stopSpeakBtn = $('#stopSpeakBtn');
export const robot = $('#robot');
export const robotSpeech = $('#robotSpeech');
export const speechBubble = $('#speechBubble');

export const imageBtn = $('#imageBtn');
export const imageInput = $('#imageInput');
export const imagePreviewContainer = $('#imagePreviewContainer');
export const imagePreview = $('#imagePreview');
export const removeImageBtn = $('#removeImageBtn');

export const onboardingModal = $('#onboardingModal');
export const onboardNameInput = $('#onboardNameInput');
export const onboardSubmitBtn = $('#onboardSubmitBtn');

export function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
export function esc(s) { return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
