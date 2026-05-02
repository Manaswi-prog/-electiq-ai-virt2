# 🗳️ ElectIQ: AI Election Process Education Assistant

**Live Demo (Cloud Run):** [https://electiq-ai-118489330595.us-central1.run.app](https://electiq-ai-118489330595.us-central1.run.app)

ElectIQ is a world-class, highly accessible AI assistant designed to educate citizens about the election process. Built specifically for the **Google Antigravity Hackathon**, it bridges the digital divide by catering to both Gen-Z digital natives and illiterate/uneducated users through voice interactions, a visual UI, and deep multilingual support.

## 🎯 Chosen Vertical
**Election Process Education**

## 🧠 Approach and Logic
Our logic is centered around **Accessibility First**. Traditional chatbots require reading and typing, which alienates illiterate citizens. We solved this by:
1. **Interactive Robot Mascot:** A visual, state-driven robot that provides non-verbal feedback (thinking, talking, happy).
2. **Native Voice STT & TTS:** Integrating the browser's Web Speech API so users can simply tap a microphone, speak their question, and have the answer read aloud to them.
3. **Engineered System Prompting:** The Gemini AI is strictly instructed to use simple analogies (e.g., "like choosing a class captain"), keep sentences under 10 words, and heavily utilize emojis for visual context.
4. **Quiz Mode:** AI-generated multiple-choice quizzes that test election knowledge, with instant feedback and explanations — turning passive learning into active engagement.
5. **Engagement Streak:** A daily streak tracker that gamifies learning and encourages repeated use.

## ⚙️ How the Solution Works
*   **Frontend:** Built with vanilla HTML/CSS/JS for maximum performance (no heavy frameworks). Features a modern Glassmorphism UI with particle effects.
*   **Backend:** A lightweight Node.js/Express server that acts as a secure bridge to the Gemini API.
*   **AI Integration:** Utilizes `gemini-2.0-flash` via the `@google/generative-ai` SDK. We implemented a robust multi-model fallback chain (`2.0-flash` → `2.0-flash-lite` → `1.5-flash-8b`) to gracefully handle rate limits and ensure 100% uptime.
*   **Multilingual Engine:** A custom mapping system intercepts the user's language selection (from 21 options) and injects a `[LANG:xx]` tag into the prompt, forcing the AI to respond in the correct language while matching the Text-to-Speech accent.
*   **Quiz Engine:** Uses Gemini to dynamically generate contextual quiz questions with a robust JSON parsing pipeline and a hardcoded fallback quiz for offline resilience.
*   **PWA Support:** Service Worker caching, offline banner detection, and a Web App Manifest for installability.

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
