const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'public', 'js');
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });

const code = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');

const langStart = code.indexOf('const langVoiceMap = {');
const uiTransEnd = code.indexOf('function updateUILocale()');
const configBlock = code.substring(langStart, uiTransEnd).replace(/const /g, 'export const ');

const configContent = `
export let currentLang = localStorage.getItem('electiq-lang') || 'en';
export function setCurrentLang(lang) { currentLang = lang; localStorage.setItem('electiq-lang', lang); }

${configBlock}
`;

fs.writeFileSync(path.join(jsDir, 'config.js'), configContent);
console.log('config.js built successfully.');
