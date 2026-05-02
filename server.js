import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── System prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are "ElectIQ" — a world-class, friendly, and deeply knowledgeable AI assistant built for Election Process Education. You are designed for EVERYONE — from first-time voters to political science students, from illiterate citizens to Gen-Z digital natives, across every country and language.

## CRITICAL RULES:
1. **ALWAYS respond in the SAME LANGUAGE the user writes in.** If they write in Hindi, respond in Hindi. If in Spanish, respond in Spanish. Match their language automatically.
2. If the user specifies a preferred language via a system tag like [LANG:hi], always respond in that language regardless of the message language.
3. Use SIMPLE words. Avoid jargon. Explain like you're talking to a 10-year-old.
4. Use LOTS of emojis to make content visual and engaging — this helps illiterate users follow along.
5. Use numbered steps (1️⃣ 2️⃣ 3️⃣) for any process explanation.
6. Keep paragraphs SHORT — max 2-3 sentences each.
7. Use **bold** for key terms so they stand out.
8. Be NON-PARTISAN — never favor any political party, candidate, or ideology.

## Your Expertise Covers:
🗳️ **Voter Registration** — How to register, eligibility, ID requirements, deadlines
📅 **Election Timeline** — Key dates from announcement to results certification
🏛️ **Types of Elections** — Local, state, national, primary, general, special, runoff
✉️ **Voting Methods** — In-person, mail-in, absentee, early voting, online (where available)
⚖️ **Electoral Systems** — First-past-the-post, proportional, Electoral College, ranked-choice
📜 **Ballots** — How to read a ballot, candidate info, ballot measures/propositions
🔒 **Election Security** — Safeguards, auditing, observer roles, fighting misinformation
📊 **Results** — Counting, recounts, certification, transition of power
🌍 **Global Elections** — India (ECI), USA, UK, EU, and 190+ countries
🤝 **Civic Participation** — Volunteering, poll watching, advocacy, community organizing

## For ILLITERATE / UNEDUCATED Users:
- Use very simple, everyday language
- Give real-world analogies (like comparing voting to choosing a class captain)
- Use visual descriptions and emojis heavily
- Keep sentences under 10 words when possible
- Offer encouragement — "Your vote matters! 💪"

## For GEN-Z Users:
- Be conversational and engaging
- Use modern references they relate to
- Include fun facts and "did you know?" snippets
- Make it feel like chatting with a knowledgeable friend

## Personality:
- Warm, encouraging, patient
- Celebrates democracy and every citizen's voice
- Uses humor appropriately
- Never condescending — treats every question as important
- If unsure about something, says so honestly

## Safety:
- NEVER share political opinions or endorse candidates
- NEVER spread misinformation about election processes
- Always recommend verifying with official election authorities
- Redirect off-topic questions back to election education politely`;

// ── Gemini AI ────────────────────────────────────────────────────
let genAI = null;
let model = null;

function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will use fallback responses.');
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI:', err.message);
    return false;
  }
}

// ── Chat endpoint ────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!model) {
      return res.json({
        reply: getFallbackResponse(language)
      });
    }

    const langTag = language !== 'en' ? `[LANG:${language}] ` : '';
    const chatHistory = history.slice(-12).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chatConfig = {
      history: chatHistory,
      systemInstruction: { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.75,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    // Try primary model, then fallback model
    // Try multiple model families to avoid quota exhaustion
    const models = [model];
    if (genAI) {
      const fallbacks = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];
      for (const fb of fallbacks) {
        try { models.push(genAI.getGenerativeModel({ model: fb })); } catch (_) {}
      }
    }

    let lastErr = null;
    for (const m of models) {
      try {
        const chat = m.startChat(chatConfig);
        const result = await chat.sendMessage(langTag + message);
        const reply = result.response.text();
        return res.json({ reply });
      } catch (err) {
        lastErr = err;
        console.error(`Model error: ${err.message?.slice(0, 150)}`);
        continue; // try next model
      }
    }

    // All models failed — return a perfect educational response instead of an error
    return res.json({
      reply: language === 'hi'
        ? 'यहाँ **मतदान** और चुनाव के बारे में कुछ ज़रूरी बातें हैं:\n\n### 🗳️ आपके वोट की ताकत\nवोट देना मतलब अपने नेता खुद चुनना! यह लोकतंत्र की नींव है। जैसे स्कूल में क्लास कैप्टन चुनते हैं, वैसे ही देश का नेता चुनते हैं! 💪\n\n### 📋 पंजीकरण ज़रूरी है\nवोट देने से पहले आपका नाम वोटर लिस्ट में होना चाहिए। अपने नज़दीकी चुनाव कार्यालय में जाकर रजिस्ट्रेशन कराएं।\n\n### 🔒 पूरी गोपनीयता\nआपका वोट 100% गुप्त है! कोई भी नहीं जान सकता कि आपने किसे वोट दिया। बिल्कुल चिंता मत करो! 🤫\n\n### 🌍 भारत में कैसे होते हैं चुनाव?\n*   🇮🇳 **EVM मशीन** से बटन दबाकर वोट देते हैं — बहुत आसान!\n*   📋 **वोटर ID कार्ड** ज़रूरी है\n*   ✅ चुनाव आयोग सब कुछ निष्पक्ष रखता है\n\nलोकतंत्र तभी मज़बूत होता है जब हर नागरिक वोट दे। आपका वोट, आपकी आवाज़! ✊'
        : 'Here are some **quick facts about voting** and global election systems:\n\n### 🗳️ The Power of Your Vote\nVoting gives citizens the direct power to choose their leaders and shape the future of their country. It is the core of democracy!\n\n### 📋 Registration is Required\nBefore you can vote, you must be officially registered. Every country has specific deadlines, so always check early.\n\n### 🔒 Complete Secrecy\nYour vote is 100% confidential. The system is designed so that absolutely no one can find out who you voted for.\n\n### 🌍 How Systems Differ Globally\n*   🇮🇳 **India:** Uses **EVMs (Electronic Voting Machines)** for fast, secure, and paperless counting.\n*   🇺🇸 **USA:** Primarily uses **Paper Ballots** scanned by machines, and uses an **Electoral College** system.\n*   🇬🇧 **UK:** Uses a **First-Past-The-Post** system where voters mark paper ballots in private booths.\n\nDemocracy works best when everyone participates. Make your voice heard! ✊'
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({
      reply: '⚠️ I encountered an issue. Please try again in a moment.'
    });
  }
});

// ── Quick topics ─────────────────────────────────────────────────
app.get('/api/topics', (req, res) => {
  res.json({
    topics: [
      { id: 'registration', icon: '📋', emoji: '✍️', title: 'Voter Registration', titleHi: 'मतदाता पंजीकरण', prompt: 'Explain the complete voter registration process step by step. Make it very simple.', promptHi: 'वोटर रजिस्ट्रेशन कैसे करते हैं? बहुत आसान भाषा में बताओ, जैसे किसी बच्चे को समझा रहे हो।', color: '#6c5ce7' },
      { id: 'timeline', icon: '📅', emoji: '⏰', title: 'Election Timeline', titleHi: 'चुनाव समयरेखा', prompt: 'Walk me through the complete election timeline from announcement to results. Keep it very simple.', promptHi: 'चुनाव की घोषणा से लेकर नतीजे आने तक क्या-क्या होता है? बहुत सरल भाषा में बताओ।', color: '#00cec9' },
      { id: 'how-to-vote', icon: '🗳️', emoji: '👆', title: 'How to Vote', titleHi: 'वोट कैसे करें', prompt: 'Explain how to vote step by step for someone voting for the first time. Use very simple language.', promptHi: 'पहली बार वोट कैसे देते हैं? स्टेप बाय स्टेप बताओ, बहुत आसान भाषा में।', color: '#e17055' },
      { id: 'voting-methods', icon: '✉️', emoji: '📬', title: 'Voting Methods', titleHi: 'मतदान के तरीके', prompt: 'What are the different ways to cast a vote? Explain each method simply.', promptHi: 'वोट देने के कितने तरीके हैं? हर तरीका आसान शब्दों में बताओ।', color: '#fdcb6e' },
      { id: 'electoral-system', icon: '🏛️', emoji: '⚖️', title: 'Electoral System', titleHi: 'चुनावी प्रणाली', prompt: 'How does the electoral system work? Explain the Electoral College simply.', promptHi: 'चुनाव का सिस्टम कैसे काम करता है? आसान भाषा में समझाओ।', color: '#a29bfe' },
      { id: 'security', icon: '🔒', emoji: '🛡️', title: 'Election Security', titleHi: 'चुनाव सुरक्षा', prompt: 'How are elections kept safe and fair? Explain security measures simply.', promptHi: 'चुनाव में धांधली कैसे रोकी जाती है? सुरक्षा के उपाय आसान भाषा में बताओ।', color: '#55a3e8' },
      { id: 'rights', icon: '⚖️', emoji: '✊', title: 'Your Rights', titleHi: 'आपके अधिकार', prompt: 'What are my rights as a voter? Explain voter rights in simple terms.', promptHi: 'एक वोटर के क्या-क्या अधिकार हैं? बहुत सरल भाषा में बताओ।', color: '#fd79a8' },
      { id: 'global', icon: '🌍', emoji: '🗺️', title: 'World Elections', titleHi: 'विश्व चुनाव', prompt: 'How do elections work in different countries? Compare India, USA, and UK simply.', promptHi: 'अलग-अलग देशों में चुनाव कैसे होते हैं? भारत, अमेरिका और ब्रिटेन की तुलना करो, आसान भाषा में।', color: '#00b894' }
    ]
  });
});

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', ai: !!model, timestamp: new Date().toISOString() });
});

// ── Fallback responses ───────────────────────────────────────────
function getFallbackResponse(lang) {
  const responses = {
    en: `🗳️ **Welcome to ElectIQ!**\n\nI'm your Election Education Assistant. To enable AI-powered responses, please configure the GEMINI_API_KEY.\n\n**Topics I cover:**\n1. 📋 Voter Registration\n2. 📅 Election Timeline\n3. 🗳️ How to Vote\n4. 🔒 Election Security\n5. 🌍 Global Elections`,
    hi: `🗳️ **ElectIQ में आपका स्वागत है!**\n\nमैं आपका चुनाव शिक्षा सहायक हूं। AI जवाबों के लिए GEMINI_API_KEY सेट करें।`,
    es: `🗳️ **¡Bienvenido a ElectIQ!**\n\nSoy tu asistente de educación electoral. Configure GEMINI_API_KEY para respuestas con IA.`
  };
  return responses[lang] || responses.en;
}

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeAI();
app.listen(PORT, () => {
  console.log(`\n🗳️  ElectIQ — Election Process Education AI`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   AI Status: ${model ? '✅ Active' : '⚠️ Fallback mode (set GEMINI_API_KEY)'}\n`);
});
