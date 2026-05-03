import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are "ElectIQ", an incredibly smart, highly conversational, and Gen-Z friendly AI assistant built for Election Process Education. You talk EXACTLY like ChatGPT—human-like, relatable, witty, and engaging, but strictly within the domain of elections and voting. No robotic "I am an AI assistant" vibes. Talk like a super smart, relatable friend who knows everything about elections.

## CORE PERSONALITY & TONE:
1. **Human & Relatable:** Sound like a real person. Use modern slang, casual phrasing, and a bit of witty banter when appropriate (Gen-Z style).
2. **Personalized:** Always use the user's name if provided. If they are new, welcome them warmly. Treat them like a friend.
3. **No Robotic Cliches:** Never say "As an AI..." or "How can I assist you today?". Instead say things like "Hey [Name], what's on your mind?" or "Let's dive into it!"
4. **Adaptive:** If they ask a simple question, give a punchy, easy-to-understand answer. If they want deep details, break it down like you're explaining it to a friend over coffee.
5. **Language Matching:** ALWAYS respond in the SAME LANGUAGE the user writes in, or the language specified in [LANG:xx]. Match the vibe and slang in that language too!

## YOUR DOMAIN EXPERTISE:
You know everything about:
🗳️ Voter Registration, 📅 Election Timelines, 🏛️ Types of Elections, ✉️ Voting Methods, ⚖️ Electoral Systems, 📜 Ballots, 🔒 Election Security, 📊 Results, and 🌍 Global Elections (India, USA, UK, EU, etc.).

## FORMATTING RULES:
1. Use emojis naturally, not excessively.
2. Keep paragraphs short and scannable.
3. Use bullet points or numbered lists if explaining a process, but keep it conversational.

## STRICT SAFETY RULES:
- BE NON-PARTISAN. Never endorse a political party, candidate, or ideology.
- Don't roast their political beliefs. Keep it fun and educational.
- If they ask off-topic questions, creatively steer it back to elections with a witty remark.`;

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

// ── Chat endpoint (Streaming) ────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en', userName = '', image, mimeType } = req.body;

    if ((!message || message.trim().length === 0) && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!model) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(getFallbackResponse(language));
    }

    const nameContext = userName ? `[SYSTEM: The user's name is ${userName}. Talk directly to them.] ` : '';
    const langTag = language !== 'en' ? `[LANG:${language}] ` : '';
    
    const chatHistory = history.slice(-12).map(msg => {
      let parts = [];
      if (msg.image && msg.mimeType) {
        const b64 = msg.image.includes(',') ? msg.image.split(',')[1] : msg.image;
        parts.push({ inlineData: { data: b64, mimeType: msg.mimeType } });
      }
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const chatConfig = {
      history: chatHistory,
      systemInstruction: { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.8,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    const models = [model];
    if (genAI) {
      const fallbacks = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];
      for (const fb of fallbacks) {
        try { models.push(genAI.getGenerativeModel({ model: fb })); } catch (_) {}
      }
    }

    let streamSuccess = false;
    for (const m of models) {
      try {
        const chat = m.startChat(chatConfig);
        
        let msgPayload = nameContext + langTag + (message || 'What is in this image regarding elections?');
        if (image) {
          const b64 = image.includes(',') ? image.split(',')[1] : image;
          msgPayload = [
            { inlineData: { data: b64, mimeType: mimeType } },
            { text: msgPayload }
          ];
        }

        const resultStream = await chat.sendMessageStream(msgPayload);
        
        for await (const chunk of resultStream) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
          }
          res.write(chunk.text());
        }
        res.end();
        streamSuccess = true;
        break;
      } catch (err) {
        console.error(`Model error: ${err.message?.slice(0, 150)}`);
        // If headers were already sent, we cannot fallback cleanly. End the response.
        if (res.headersSent) {
          res.end('\n\n⚠️ Connection to AI interrupted. Please try again.');
          return;
        }
        continue; 
      }
    }

    if (!streamSuccess && !res.headersSent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(language === 'hi' 
        ? 'यहाँ **मतदान** और चुनाव के बारे में कुछ ज़रूरी बातें हैं:\n\n### 🗳️ आपके वोट की ताकत\nवोट देना मतलब अपने नेता खुद चुनना! यह लोकतंत्र की नींव है।\n\n### 📋 पंजीकरण ज़रूरी है\nवोट देने से पहले आपका नाम वोटर लिस्ट में होना चाहिए।\n\n### 🔒 पूरी गोपनीयता\nआपका वोट 100% गुप्त है! कोई भी नहीं जान सकता कि आपने किसे वोट दिया।\n\nलोकतंत्र तभी मज़बूत होता है जब हर नागरिक वोट दे। आपका वोट, आपकी आवाज़! ✊'
        : 'Here are some **quick facts about voting** and global election systems:\n\n### 🗳️ The Power of Your Vote\nVoting gives citizens the direct power to choose their leaders and shape the future of their country.\n\n### 📋 Registration is Required\nBefore you can vote, you must be officially registered.\n\n### 🔒 Complete Secrecy\nYour vote is 100% confidential. The system is designed so that absolutely no one can find out who you voted for.\n\nDemocracy works best when everyone participates. Make your voice heard! ✊'
      );
    }
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('⚠️ I encountered an issue. Please try again in a moment.');
    } else {
      res.end('\n\n⚠️ Error during generation.');
    }
  }
});

// ── Quiz endpoint (Structured JSON Output) ───────────────────────
app.post('/api/quiz', async (req, res) => {
  try {
    const { language = 'en' } = req.body;
    if (!model) {
      return res.json([
        { q: "What is the minimum voting age in most democracies?", options: ["16 years", "18 years", "21 years", "25 years"], answer: 1, explanation: "Most countries set the voting age at 18, though some allow 16-year-olds to vote." },
        { q: "What does EVM stand for in Indian elections?", options: ["Electronic Voting Machine", "Election Verification Method", "Electronic Vote Manager", "Election Voting Module"], answer: 0, explanation: "EVMs are Electronic Voting Machines used by the Election Commission of India." },
        { q: "Which body conducts elections in India?", options: ["Supreme Court", "Parliament", "Election Commission", "President"], answer: 2, explanation: "The Election Commission of India is an autonomous body responsible for conducting elections." },
        { q: "What is a ballot?", options: ["A campaign speech", "A paper/device used to cast votes", "A voter ID card", "An election result"], answer: 1, explanation: "A ballot is the means by which voters indicate their choice — paper or electronic." },
        { q: "What does 'universal suffrage' mean?", options: ["Only educated can vote", "Everyone can vote", "Only men can vote", "Only taxpayers can vote"], answer: 1, explanation: "Universal suffrage means all adult citizens have the right to vote regardless of gender, race, or wealth." }
      ]);
    }

    const langTag = language !== 'en' ? `[LANG:${language}] ` : '';
    
    const quizSchema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          q: { type: SchemaType.STRING, description: "The quiz question" },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Exactly 4 possible answers" },
          answer: { type: SchemaType.INTEGER, description: "0-based index of the correct answer (0 to 3)" },
          explanation: { type: SchemaType.STRING, description: "Short explanation of why the answer is correct" }
        },
        required: ["q", "options", "answer", "explanation"]
      }
    };

    const quizConfig = {
      systemInstruction: { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      }
    };

    const models = [model];
    if (genAI) {
      const fallbacks = ['gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];
      for (const fb of fallbacks) {
        try { models.push(genAI.getGenerativeModel({ model: fb })); } catch (_) {}
      }
    }

    for (const m of models) {
      try {
        const chat = m.startChat(quizConfig);
        const result = await chat.sendMessage(langTag + "Generate exactly 5 multiple-choice quiz questions about elections and voting.");
        return res.json(JSON.parse(result.response.text()));
      } catch (err) {
        console.error(`Quiz Model error: ${err.message}`);
        continue;
      }
    }
    
    // Fallback if all models fail
    return res.json([
      { q: "What is the minimum voting age in most democracies?", options: ["16 years", "18 years", "21 years", "25 years"], answer: 1, explanation: "Most countries set the voting age at 18, though some allow 16-year-olds to vote." },
      { q: "What does EVM stand for in Indian elections?", options: ["Electronic Voting Machine", "Election Verification Method", "Electronic Vote Manager", "Election Voting Module"], answer: 0, explanation: "EVMs are Electronic Voting Machines used by the Election Commission of India." },
      { q: "Which body conducts elections in India?", options: ["Supreme Court", "Parliament", "Election Commission", "President"], answer: 2, explanation: "The Election Commission of India is an autonomous body responsible for conducting elections." },
      { q: "What is a ballot?", options: ["A campaign speech", "A paper/device used to cast votes", "A voter ID card", "An election result"], answer: 1, explanation: "A ballot is the means by which voters indicate their choice — paper or electronic." },
      { q: "What does 'universal suffrage' mean?", options: ["Only educated can vote", "Everyone can vote", "Only men can vote", "Only taxpayers can vote"], answer: 1, explanation: "Universal suffrage means all adult citizens have the right to vote regardless of gender, race, or wealth." }
    ]);

  } catch (err) {
    console.error('Quiz error:', err.message);
    res.status(500).json({ error: "Failed to generate quiz" });
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
