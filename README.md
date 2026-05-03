# 🗳️ ElectIQ: AI Election Process Education Assistant

**Live Demo (Cloud Run):** [https://electiq-ai-118489330595.us-central1.run.app](https://electiq-ai-118489330595.us-central1.run.app)

ElectIQ is a world-class, highly accessible AI assistant designed to educate citizens about the election process. Built specifically for the **Google Antigravity Hackathon**, it bridges the digital divide by catering to both Gen-Z digital natives and illiterate/uneducated users through voice interactions, a visual UI, and deep multilingual support.

## 🎯 Chosen Vertical
**Election Process Education**

## 🧠 Approach and Logic
Our logic is centered around **Accessibility First** and **Controlled Intelligence**. Traditional chatbots require reading and typing, which alienates illiterate citizens, and they lack structured guidance. We solved this by:
1. **Intent Router & Prompt Chaining:** Instead of passing raw queries to the AI, an Intent Router intercepts inputs (or button clicks) and assigns a mode (`NORMAL`, `SIMPLE`, `GUIDE`, `IMAGE`). This ensures the AI provides structured, context-aware answers (e.g., step-by-step guides vs. ELI5 analogies) instead of a wall of text.
2. **Interactive Robot Mascot:** A visual, state-driven robot provides non-verbal feedback (thinking, talking, happy).
3. **Native Voice STT & TTS:** Integrating the browser's Web Speech API so users can tap a microphone, speak their question, and have the answer read aloud to them.
4. **Engineered v2.0 System Prompt:** The Gemini AI is strictly instructed to follow 10 explicit knowledge domains, absolute nonpartisan rules, and format responses with a "Key takeaway".
5. **Guided Demo Flows:** One-click "Try Demo", "Explain Like I'm 10", and "First-Time Voter" modes to instantly show value without requiring user typing.

## ⚙️ How the Solution Works
*   **Frontend:** Built with vanilla HTML/CSS/JS for maximum performance (no heavy frameworks). Features a modern Glassmorphism UI, a guided demo overlay, and particle effects.
*   **Backend:** A lightweight Node.js/Express server that acts as a secure bridge, housing the Intent Router and caching layer.
*   **AI Integration:** Utilizes `gemini-2.5-flash` via the `@google/generative-ai` SDK. Includes a robust multi-model fallback chain (`2.5-flash` → `2.5-flash-lite`) to gracefully handle rate limits and ensure uptime.
*   **Response Enhancer & Cache:** Repeated queries are cached (LRU) to save latency and API costs.
*   **Multilingual Engine:** Intercepts the user's language selection and injects a `[LANG:xx]` tag into the prompt, forcing the AI to respond in the correct language while matching the Text-to-Speech accent.

## 📝 Assumptions Made
*   Users have access to a modern browser that supports the Web Speech API (for voice features).
*   The application operates under the assumption of a non-partisan environment; the AI is hard-coded via system prompts to strictly refuse endorsing any political candidate or spreading misinformation.

## 🏆 Evaluation Focus Areas Addressed

### 1. Code Quality
*   Clean, modular code separated strictly into logic (`app.js`), styling (`styles.css`), and server routing (`server.js`).
*   Zero unnecessary dependencies.
*   Proper error handling with graceful fallbacks at every layer.

### 2. Security
*   **Prompt Injection Protection:** The `SYSTEM_PROMPT` is enforced on the server-side, preventing users from overriding the non-partisan safety rules.
*   **API Key Protection:** The Gemini API key is securely stored in `.env` and injected at runtime in Cloud Run. The frontend never sees the API key.
*   **Input Validation:** Server-side message length and type checking prevents malformed requests.

### 3. Efficiency
*   The entire frontend bundle is under 50KB.
*   Implemented a local rate-limit handler that catches `429 Too Many Requests` errors and returns a formatted, friendly fallback message without crashing the server.
*   Particle canvas uses `requestAnimationFrame` for GPU-optimized rendering.

### 4. Testing & Reliability
*   Tested across multiple models. If the primary model fails, the server cascades through fallback models automatically.
*   Quiz Mode has a complete fallback question bank for offline scenarios.
*   Service Worker provides cache-first strategy for static assets.

### 5. Accessibility (A11y)
*   **Skip-to-content link** for keyboard navigation.
*   **ARIA live regions** (`role="log"`, `aria-live="polite"`) for screen reader announcements.
*   **ARIA labels** on all interactive elements (buttons, inputs, modals).
*   High-contrast Light/Dark mode toggle.
*   "Read Aloud" voice capabilities for visually impaired or uneducated users.
*   Large, emoji-first touch targets for easy mobile navigation.
*   Proper `role="dialog"` and `aria-modal` on quiz modal.

### 6. Google Services Integration
*   **Google Gemini 2.0 Flash API:** Powers the core intelligence, content generation, quiz generation, and translation.
*   **Google Cloud Run:** Fully containerized and deployed as a serverless application for scalable, global access.

## 🚀 Key Features
| Feature | Description |
|---------|------------|
| 🤖 Robot Mascot | Visual feedback with thinking/talking/happy states |
| 🎤 Voice Input | Native Web Speech API — tap and speak |
| 🔊 Read Aloud | Auto-reads AI responses with adjustable speed |
| 🌐 21 Languages | Full multilingual support including 10+ Indian languages |
| 🧠 Quiz Mode | AI-generated election knowledge quizzes |
| 📥 Chat Export | Download conversations as text files |
| 🔥 Streak Tracker | Daily engagement gamification |
| 📱 PWA Ready | Installable, offline-capable progressive web app |
| ↗️ Share | Native Web Share API for WhatsApp/social sharing |
| 🌙 Dark/Light | High-contrast theme toggle |
