import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════════════════════════
// MASTER SYSTEM PROMPT v2.0 — ElectIQ Brain
// ══════════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are ElectIQ, a warm, intelligent, and strictly nonpartisan AI guide
that helps every citizen understand elections — from first-time voters
to civically engaged adults.

Your role: Teacher + Guide + Trusted Friend.
Your standard: Make elections understandable in 60 seconds or less.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠  INTELLIGENCE BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before every response, silently ask yourself:
  1. What is the user ACTUALLY asking? (Definition? Process? Clarification?)
  2. What is their confidence level? (Confused / Curious / Task-ready)
  3. What is the SIMPLEST path to understanding this topic?

Then adapt:
  • Definition questions  → clear 1-sentence answer + brief explanation
  • Process questions     → numbered steps, nothing skipped
  • Confused users        → use an analogy before any technical detail
  • Expert-sounding users → be efficient, skip basics, add depth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚  RESPONSE STRUCTURE (ALWAYS follow this order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Direct Answer        — 1–2 lines, plain language, no jargon
2. Simple Explanation   — short paragraph, beginner-friendly
3. Steps / Breakdown    — numbered list (only if the topic has steps)
4. Analogy or Example   — use a real-life comparison when helpful
5. Key takeaway         — one line beginning with "👉 Key takeaway:"
6. Follow-up            — one specific, topic-relevant follow-up question

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯  RESPONSE QUALITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Max 250 words per response (brevity is a feature, not a bug)
- Bullets and numbered lists > long paragraphs
- Bold only key terms on their FIRST appearance
- Never use acronyms without spelling them out first
- Never assume the user knows anything about elections
- Prefer one clear idea over three vague ones

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀  RESPONSE MODES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The system will pass the current mode as: [MODE: ___]

NORMAL  → Balanced explanation. Full structure. ~150–200 words.
SIMPLE  → Explain like the user is 12 years old. No jargon whatsoever.
          Use a single analogy. Max 100 words. Very short sentences.
GUIDE   → Structured learning walkthrough. Start with "Here's what we'll
          cover:" then teach section by section with a clear recap.
QUIZ    → Ask the user one question about the topic. Evaluate their answer.
          Give encouraging, specific feedback regardless of correctness.

If no mode is specified, use NORMAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖  KNOWLEDGE DOMAINS (your 10 core areas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Voter Registration      — eligibility, how to register, deadlines,
                             updating records, checking status
2. Election Timeline       — primary vs. general, presidential cycles,
                             midterms, key campaign dates
3. Election Day Process    — polling locations, ID rules, voting machines,
                             provisional ballots, what to do if problems arise
4. Alternative Voting      — mail-in ballots, absentee voting, early voting,
                             drop boxes, ballot tracking
5. Reading Your Ballot     — contest types, ballot measures, propositions,
                             write-ins, how to correct mistakes
6. Vote Counting           — chain of custody, when counting starts,
                             mail ballot processing, poll watchers
7. Certification Process   — why results take time, canvassing, county →
                             state → federal certification, recounts
8. Electoral College       — how electors work, winner-take-all vs.
                             proportional, faithless electors, January 6 role
9. Types of Elections      — presidential, midterm, local, special,
                             primary types (open/closed/jungle), runoffs
10. Election Security      — ballot security, audits, observer roles,
                             paper trails, post-election verification

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐  LANGUAGE RULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS respond in the SAME LANGUAGE the user writes in, or the
language specified in [LANG:xx]. Match the tone in that language too.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨  ABSOLUTE RULES (never violate, ever)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. NONPARTISAN LOCK
   Never express opinions on candidates, parties, or ballot measures.
   If pressed: "I explain how elections work — not who to vote for."

2. NO INVENTED FACTS
   If unsure of a deadline or state-specific rule, say:
   "Rules vary by state — check vote.gov or your county clerk to confirm."
   Never fabricate dates, laws, or deadlines.

3. NO LEGAL ADVICE
   Redirect legal questions: "For legal election questions, contact your
   state's Secretary of State office or an election law attorney."

4. STAY ON TOPIC
   If the user goes off-topic politically, redirect:
   "That's beyond what I cover — but I can explain how [related process]
   works if that helps!"

5. STATE VARIATION RULE
   Always flag when rules differ by state. Never imply federal uniformity
   unless the rule is genuinely federal law.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨  TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Warm, encouraging, never condescending.
Sound like a smart friend who happens to know a lot about elections.
Celebrate curiosity: "Great question — this one confuses a lot of people."`;

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
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Gemini AI initialized successfully');
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize Gemini AI:', err.message);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════
// INTENT ROUTER — Classify user input into a mode before Gemini
// ══════════════════════════════════════════════════════════════════
function classifyIntent(message, hasImage, explicitMode) {
  // Explicit mode from frontend takes priority
  if (explicitMode && ['simple', 'guide', 'image'].includes(explicitMode)) {
    return explicitMode;
  }
  // Image mode if an image is attached
  if (hasImage) return 'image';

  const lower = (message || '').toLowerCase();

  // Guide mode keywords
  const guideKeywords = ['step by step', 'step-by-step', 'how to', 'how do i', 'guide', 'walkthrough', 'process', 'checklist', 'explain the steps', 'first-time voter'];
  if (guideKeywords.some(k => lower.includes(k))) return 'guide';

  // Simple mode keywords
  const simpleKeywords = ['explain like', 'eli5', 'simple', 'simply', 'easy', 'beginner', 'like i\'m 10', 'like a kid', 'like a child', 'basic', 'dumb it down', 'asan', 'aasan', 'saral'];
  if (simpleKeywords.some(k => lower.includes(k))) return 'simple';

  return 'normal';
}

// ══════════════════════════════════════════════════════════════════
// PROMPT BUILDER — Lean message with mode tag (v2.0 system prompt
// handles all mode behavior internally)
// ══════════════════════════════════════════════════════════════════
function buildModePrompt(query, mode, userName, language) {
  const parts = [];

  // Context tags
  if (userName) parts.push(`[User: ${userName}]`);
  if (language !== 'en') parts.push(`[LANG:${language}]`);
  parts.push(`[MODE: ${mode.toUpperCase()}]`);

  // Image mode gets a framing hint since user may not specify what to analyze
  if (mode === 'image') {
    parts.push(query || 'Analyze this election-related image and explain what it shows.');
  } else {
    parts.push(query);
  }

  return parts.join(' ');
}

// ══════════════════════════════════════════════════════════════════
// RESPONSE CACHE — Avoid re-calling Gemini for repeated queries
// ══════════════════════════════════════════════════════════════════
const responseCache = new Map();
const CACHE_MAX = 100;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCacheKey(msg, mode, lang) {
  return `${mode}:${lang}:${(msg || '').trim().toLowerCase().slice(0, 200)}`;
}

function getCachedResponse(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { responseCache.delete(key); return null; }
  return entry.text;
}

function setCachedResponse(key, text) {
  if (responseCache.size >= CACHE_MAX) {
    const oldest = responseCache.keys().next().value;
    responseCache.delete(oldest);
  }
  responseCache.set(key, { text, ts: Date.now() });
}

// ── Chat endpoint (Streaming + Intent Router) ───────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], language = 'en', userName = '', image, mimeType, mode: explicitMode } = req.body;

    if ((!message || message.trim().length === 0) && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    if (!model) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(getFallbackResponse(language));
    }

    // ── Step 1: Intent Router ──
    const mode = classifyIntent(message, !!image, explicitMode);
    console.log(`[ElectIQ] Mode: ${mode} | Lang: ${language} | Query: ${(message || '').slice(0, 80)}`);

    // ── Step 2: Check Cache (skip for image mode) ──
    if (mode !== 'image') {
      const cacheKey = getCacheKey(message, mode, language);
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        console.log(`[ElectIQ] Cache HIT`);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end(cached);
      }
    }

    // ── Step 3: Build Mode-Specific Prompt ──
    const structuredPrompt = buildModePrompt(message, mode, userName, language);

    // ── Step 4: Build Gemini Chat Config ──
    const chatHistory = history.slice(-8).map(msg => {
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
      systemInstruction: { role: 'user', parts: [{ text: SYSTEM_PROMPT + `\n\n[ACTIVE MODE: ${mode.toUpperCase()}]` }] },
      generationConfig: {
        temperature: mode === 'simple' ? 0.6 : mode === 'guide' ? 0.5 : 0.8,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: mode === 'guide' ? 3000 : 2048,
      }
    };

    const models = [model];
    if (genAI) {
      try { models.push(genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })); } catch (_) {}
    }

    // ── Step 5: Stream from Gemini ──
    let streamSuccess = false;
    let fullResponse = '';

    for (const m of models) {
      try {
        const chat = m.startChat(chatConfig);
        
        let msgPayload = structuredPrompt;
        if (image) {
          const b64 = image.includes(',') ? image.split(',')[1] : image;
          msgPayload = [
            { inlineData: { data: b64, mimeType: mimeType } },
            { text: structuredPrompt }
          ];
        }

        const result = await chat.sendMessageStream(msgPayload);
        const stream = result.stream || result;
        
        for await (const chunk of stream) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');
          }
          const text = chunk.text();
          fullResponse += text;
          res.write(text);
        }
        res.end();
        streamSuccess = true;

        // ── Step 6: Cache the response (skip images) ──
        if (mode !== 'image' && fullResponse.length > 50) {
          const cacheKey = getCacheKey(message, mode, language);
          setCachedResponse(cacheKey, fullResponse);
        }

        break;
      } catch (err) {
        console.error(`Model error: ${err.message?.slice(0, 150)}`);
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
        ? 'यहाँ **मतदान** और चुनाव के बारे में कुछ ज़रूरी बातें हैं:\n\n### 🗳️ आपके वोट की ताकत\nवोट देना मतलब अपने नेता खुद चुनना! यह लोकतंत्र की नींव है।\n\n### 📋 पंजीकरण ज़रूरी है\nवोट देने से पहले आपका नाम वोटर लिस्ट में होना चाहिए।\n\n### 🔒 पूरी गोपनीयता\nआपका वोट 100% गुप्त है!\n\n**🎯 Key takeaway:** लोकतंत्र तभी मज़बूत होता है जब हर नागरिक वोट दे। ✊'
        : 'Here are some **quick facts about voting**:\n\n### 🗳️ The Power of Your Vote\nVoting gives citizens the direct power to choose their leaders.\n\n### 📋 Registration is Required\nBefore you can vote, you must be officially registered.\n\n### 🔒 Complete Secrecy\nYour vote is 100% confidential.\n\n**🎯 Key takeaway:** Democracy works best when everyone participates. Make your voice heard! ✊\n\nWant a simpler explanation or step-by-step guide?'
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

// ── Generate Voter Plan ──────────────────────────────────────────
app.post('/api/generate-plan', async (req, res) => {
  if (!model) {
    return res.status(503).json({ error: "AI not configured. Add GEMINI_API_KEY." });
  }

  const { language = 'en', userName = 'Voter' } = req.body;
  const langTag = language === 'hi' ? '[Respond in Hindi] ' : '';

  try {
    const prompt = `${langTag}You are ElectIQ, an AI Election Assistant. Create a highly structured, beautiful HTML "Personalized Voter Action Plan" for ${userName}.
    
    The HTML should include:
    1. A header with the title "Your Voter Action Plan"
    2. A checklist of 3 steps to register to vote.
    3. A checklist of 3 things to bring to the polling booth.
    4. A short inspirational quote about democracy.
    
    CRITICAL: Return ONLY valid, raw HTML. Do not wrap in markdown \`\`\`html tags. Do not include <html> or <body> tags, just the content (divs, h1, ul, li). Keep it clean and visually structured with inline CSS (use colors like #6c5ce7, #00cec9). Use a professional, clean design.`;

    const result = await model.generateContent(prompt);
    let html = result.response.text();
    
    // Clean up if the model wrapped it in markdown
    html = html.replace(/```html/gi, '').replace(/```/gi, '').trim();

    res.json({ html });
  } catch (err) {
    console.error('Plan generation error:', err.message);
    res.status(500).json({ error: "Failed to generate plan." });
  }
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
