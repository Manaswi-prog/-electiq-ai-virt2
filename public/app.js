/* ══════════════════════════════════════════════════════════════
   ElectIQ — Frontend App (Voice + Multi-Language + Robot)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── DOM ────────────────────────────────────────────────────────
  const $ = s => document.querySelector(s);
  const sidebar       = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  const sidebarClose  = $('#sidebarClose');
  const newChatBtn    = $('#newChatBtn');
  const topicsList    = $('#topicsList');
  const welcomeScreen = $('#welcomeScreen');
  const welcomeCards  = $('#welcomeCards');
  const messagesBox   = $('#messagesContainer');
  const chatArea      = $('#chatArea');
  const msgInput      = $('#msgInput');
  const sendBtn       = $('#sendBtn');
  const themeBtn      = $('#themeBtn');
  const themeIcon     = $('#themeIcon');
  const aiStatus      = $('#aiStatus');
  const bgCanvas      = $('#bgCanvas');
  const langSelect    = $('#langSelect');
  const autoReadToggle= $('#autoReadToggle');
  const speechRate    = $('#speechRate');
  const voiceBtn      = $('#voiceBtn');
  const stopSpeakBtn  = $('#stopSpeakBtn');
  const robot         = $('#robot');
  const robotSpeech   = $('#robotSpeech');
  const speechBubble  = $('#speechBubble');

  let chatHistory = [];
  let isLoading = false;
  let currentLang = localStorage.getItem('electiq-lang') || 'en';
  langSelect.value = currentLang;

  // ── Language Mapping for TTS ───────────────────────────────────
  const langVoiceMap = {
    en:'en-US',hi:'hi-IN',es:'es-ES',fr:'fr-FR',de:'de-DE',pt:'pt-BR',
    ar:'ar-SA',bn:'bn-IN',ta:'ta-IN',te:'te-IN',mr:'mr-IN',gu:'gu-IN',
    kn:'kn-IN',ml:'ml-IN',pa:'pa-IN',ur:'ur-PK',zh:'zh-CN',ja:'ja-JP',
    ko:'ko-KR',ru:'ru-RU',sw:'sw-KE'
  };

  // Robot welcome messages per language
  const robotGreetings = {
    en: 'Hi! I\'m <strong>ElectIQ</strong> 👋<br/>Ask me anything about elections!<br/>Tap the 🎤 mic to talk to me!',
    hi: 'नमस्ते! मैं <strong>ElectIQ</strong> हूं 👋<br/>चुनावों के बारे में कुछ भी पूछें!<br/>बोलने के लिए 🎤 दबाएं!',
    es: '¡Hola! Soy <strong>ElectIQ</strong> 👋<br/>¡Pregúntame sobre elecciones!<br/>¡Toca el 🎤 para hablar!',
    fr: 'Salut! Je suis <strong>ElectIQ</strong> 👋<br/>Posez-moi des questions sur les élections!<br/>Appuyez sur 🎤 pour parler!',
    de: 'Hallo! Ich bin <strong>ElectIQ</strong> 👋<br/>Frag mich alles über Wahlen!<br/>Tippe auf 🎤 zum Sprechen!',
    ar: 'مرحباً! أنا <strong>ElectIQ</strong> 👋<br/>اسألني أي شيء عن الانتخابات!<br/>اضغط على 🎤 للتحدث!',
  };

  // Full UI Translations — all 21 languages
  const T = {
    newChat:"New Chat", voiceAsst:"🔊 Voice Assistant", autoRead:"Auto-read answers",
    speed:"Speed", quickTopics:"⚡ Quick Topics", poweredBy:"Powered by Gemini AI",
    footerNote:"Non-partisan • For Everyone • All Languages", topTitle:"Election Process Education",
    welcomeGuide:"Your <span class='grad-text'>Election Guide</span>",
    welcomeSub:"Tap a topic below or ask me anything 👇",
    feat1:"Voice Input", feat2:"Read Aloud", feat3:"21 Languages", feat4:"Quiz Mode",
    placeholder:"Type or tap 🎤 to ask...", hint:"ElectIQ is educational only • Always verify with official sources",
    langLabel:"🌐 Language", quizBtn:"🧠 Quiz Mode", exportBtn:"📥 Export Chat", streakLabel:"day streak"
  };
  const uiTranslations = {
    en: {...T},
    hi: { newChat:"नई बातचीत", voiceAsst:"🔊 आवाज़ सहायक", autoRead:"जवाब पढ़कर सुनाएं", speed:"गति", quickTopics:"⚡ जल्दी सीखें", poweredBy:"Gemini AI से चलता है", footerNote:"निष्पक्ष • सबके लिए • सभी भाषाएं", topTitle:"चुनाव प्रक्रिया सीखें", welcomeGuide:"आपका <span class='grad-text'>चुनाव गाइड</span>", welcomeSub:"नीचे किसी विषय पर टैप करें या कुछ भी पूछें 👇", feat1:"बोलकर पूछें", feat2:"सुनकर सीखें", feat3:"21 भाषाएं", feat4:"क्विज़ खेलें", placeholder:"टाइप करें या 🎤 दबाकर बोलें...", hint:"ElectIQ सिर्फ पढ़ाई के लिए है • सरकारी वेबसाइट से जाँचें", langLabel:"🌐 भाषा चुनें", quizBtn:"🧠 क्विज़ खेलें", exportBtn:"📥 बातचीत डाउनलोड", streakLabel:"दिन की स्ट्रीक" },
    es: { newChat:"Nuevo Chat", voiceAsst:"🔊 Asistente de Voz", autoRead:"Leer respuestas", speed:"Velocidad", quickTopics:"⚡ Temas Rápidos", poweredBy:"Con Gemini AI", footerNote:"Imparcial • Para Todos • Todos los Idiomas", topTitle:"Educación Electoral", welcomeGuide:"Tu <span class='grad-text'>Guía Electoral</span>", welcomeSub:"Toca un tema o pregúntame lo que quieras 👇", feat1:"Voz", feat2:"Leer", feat3:"21 Idiomas", feat4:"Quiz", placeholder:"Escribe o toca 🎤 para preguntar...", hint:"ElectIQ es solo educativo • Verifica con fuentes oficiales", langLabel:"🌐 Idioma", quizBtn:"🧠 Quiz", exportBtn:"📥 Exportar Chat", streakLabel:"días de racha" },
    fr: { newChat:"Nouveau Chat", voiceAsst:"🔊 Assistant Vocal", autoRead:"Lire les réponses", speed:"Vitesse", quickTopics:"⚡ Sujets Rapides", poweredBy:"Propulsé par Gemini AI", footerNote:"Non-partisan • Pour Tous • Toutes Langues", topTitle:"Éducation Électorale", welcomeGuide:"Votre <span class='grad-text'>Guide Électoral</span>", welcomeSub:"Touchez un sujet ou posez une question 👇", feat1:"Voix", feat2:"Lire", feat3:"21 Langues", feat4:"Quiz", placeholder:"Tapez ou touchez 🎤...", hint:"ElectIQ est éducatif uniquement • Vérifiez avec les sources officielles", langLabel:"🌐 Langue", quizBtn:"🧠 Quiz", exportBtn:"📥 Exporter", streakLabel:"jours de suite" },
    de: { newChat:"Neuer Chat", voiceAsst:"🔊 Sprachassistent", autoRead:"Antworten vorlesen", speed:"Geschwindigkeit", quickTopics:"⚡ Schnellthemen", poweredBy:"Mit Gemini AI", footerNote:"Unparteiisch • Für Alle • Alle Sprachen", topTitle:"Wahlbildung", welcomeGuide:"Ihr <span class='grad-text'>Wahl-Guide</span>", welcomeSub:"Tippen Sie auf ein Thema oder fragen Sie 👇", feat1:"Sprache", feat2:"Vorlesen", feat3:"21 Sprachen", feat4:"Quiz", placeholder:"Tippen oder 🎤 drücken...", hint:"ElectIQ ist nur zur Bildung • Offizielle Quellen prüfen", langLabel:"🌐 Sprache", quizBtn:"🧠 Quiz", exportBtn:"📥 Export", streakLabel:"Tage Serie" },
    pt: { newChat:"Novo Chat", voiceAsst:"🔊 Assistente de Voz", autoRead:"Ler respostas", speed:"Velocidade", quickTopics:"⚡ Tópicos Rápidos", poweredBy:"Com Gemini AI", footerNote:"Imparcial • Para Todos • Todas Línguas", topTitle:"Educação Eleitoral", welcomeGuide:"Seu <span class='grad-text'>Guia Eleitoral</span>", welcomeSub:"Toque em um tópico ou pergunte 👇", feat1:"Voz", feat2:"Ler", feat3:"21 Línguas", feat4:"Quiz", placeholder:"Digite ou toque 🎤...", hint:"ElectIQ é apenas educativo • Verifique fontes oficiais", langLabel:"🌐 Idioma", quizBtn:"🧠 Quiz", exportBtn:"📥 Exportar", streakLabel:"dias seguidos" },
    ar: { newChat:"محادثة جديدة", voiceAsst:"🔊 مساعد صوتي", autoRead:"قراءة الإجابات", speed:"السرعة", quickTopics:"⚡ مواضيع سريعة", poweredBy:"مدعوم بـ Gemini AI", footerNote:"محايد • للجميع • كل اللغات", topTitle:"التعليم الانتخابي", welcomeGuide:"دليلك <span class='grad-text'>الانتخابي</span>", welcomeSub:"اضغط على موضوع أو اسأل أي سؤال 👇", feat1:"صوت", feat2:"اقرأ", feat3:"21 لغة", feat4:"اختبار", placeholder:"اكتب أو اضغط 🎤...", hint:"ElectIQ تعليمي فقط • تحقق من المصادر الرسمية", langLabel:"🌐 اللغة", quizBtn:"🧠 اختبار", exportBtn:"📥 تصدير", streakLabel:"أيام متتالية" },
    bn: { newChat:"নতুন চ্যাট", voiceAsst:"🔊 ভয়েস সহায়ক", autoRead:"উত্তর পড়ুন", speed:"গতি", quickTopics:"⚡ দ্রুত বিষয়", poweredBy:"Gemini AI দ্বারা", footerNote:"নিরপেক্ষ • সকলের জন্য", topTitle:"নির্বাচন শিক্ষা", welcomeGuide:"আপনার <span class='grad-text'>নির্বাচন গাইড</span>", welcomeSub:"একটি বিষয়ে ট্যাপ করুন বা কিছু জিজ্ঞাসা করুন 👇", feat1:"ভয়েস", feat2:"পড়ুন", feat3:"21 ভাষা", feat4:"কুইজ", placeholder:"টাইপ করুন বা 🎤 ট্যাপ করুন...", hint:"ElectIQ শুধু শিক্ষামূলক", langLabel:"🌐 ভাষা", quizBtn:"🧠 কুইজ", exportBtn:"📥 রপ্তানি", streakLabel:"দিনের স্ট্রিক" },
    ta: { newChat:"புதிய அரட்டை", voiceAsst:"🔊 குரல் உதவி", autoRead:"பதில்களைப் படிக்க", speed:"வேகம்", quickTopics:"⚡ விரைவு தலைப்புகள்", poweredBy:"Gemini AI மூலம்", footerNote:"நடுநிலை • அனைவருக்கும்", topTitle:"தேர்தல் கல்வி", welcomeGuide:"உங்கள் <span class='grad-text'>தேர்தல் வழிகாட்டி</span>", welcomeSub:"ஒரு தலைப்பைத் தட்டவும் அல்லது கேளுங்கள் 👇", feat1:"குரல்", feat2:"படிக்க", feat3:"21 மொழிகள்", feat4:"வினாடி வினா", placeholder:"தட்டச்சு செய்யுங்கள் அல்லது 🎤...", hint:"ElectIQ கல்வி மட்டுமே", langLabel:"🌐 மொழி", quizBtn:"🧠 வினாடி வினா", exportBtn:"📥 ஏற்றுமதி", streakLabel:"நாள் தொடர்" },
    te: { newChat:"కొత్త చాట్", voiceAsst:"🔊 వాయిస్ సహాయకం", autoRead:"సమాధానాలు చదవండి", speed:"వేగం", quickTopics:"⚡ త్వరిత అంశాలు", poweredBy:"Gemini AI ద్వారా", footerNote:"నిష్పక్షపాతం • అందరికీ", topTitle:"ఎన్నికల విద్య", welcomeGuide:"మీ <span class='grad-text'>ఎన్నికల గైడ్</span>", welcomeSub:"ఒక అంశాన్ని ట్యాప్ చేయండి లేదా అడగండి 👇", feat1:"వాయిస్", feat2:"చదవండి", feat3:"21 భాషలు", feat4:"క్విజ్", placeholder:"టైప్ చేయండి లేదా 🎤...", hint:"ElectIQ విద్యా మాత్రమే", langLabel:"🌐 భాష", quizBtn:"🧠 క్విజ్", exportBtn:"📥 ఎగుమతి", streakLabel:"రోజుల స్ట్రీక్" },
    mr: { newChat:"नवीन चॅट", voiceAsst:"🔊 आवाज सहाय्यक", autoRead:"उत्तरे वाचा", speed:"गती", quickTopics:"⚡ जलद विषय", poweredBy:"Gemini AI द्वारे", footerNote:"निष्पक्ष • सर्वांसाठी", topTitle:"निवडणूक शिक्षण", welcomeGuide:"तुमचा <span class='grad-text'>निवडणूक मार्गदर्शक</span>", welcomeSub:"एखाद्या विषयावर टॅप करा किंवा विचारा 👇", feat1:"आवाज", feat2:"वाचा", feat3:"21 भाषा", feat4:"क्विझ", placeholder:"टाइप करा किंवा 🎤 दाबा...", hint:"ElectIQ फक्त शैक्षणिक आहे", langLabel:"🌐 भाषा", quizBtn:"🧠 क्विझ", exportBtn:"📥 निर्यात", streakLabel:"दिवसांची मालिका" },
    gu: { newChat:"નવી ચેટ", voiceAsst:"🔊 વૉઇસ સહાયક", autoRead:"જવાબો વાંચો", speed:"ઝડપ", quickTopics:"⚡ ઝડપી વિષયો", poweredBy:"Gemini AI દ્વારા", footerNote:"નિષ્પક્ષ • બધા માટે", topTitle:"ચૂંટણી શિક્ષણ", welcomeGuide:"તમારું <span class='grad-text'>ચૂંટણી માર્ગદર્શિકા</span>", welcomeSub:"કોઈ વિષય પર ટેપ કરો અથવા પૂછો 👇", feat1:"અવાજ", feat2:"વાંચો", feat3:"21 ભાષાઓ", feat4:"ક્વિઝ", placeholder:"ટાઇપ કરો અથવા 🎤...", hint:"ElectIQ ફક્ત શૈક્ષણિક છે", langLabel:"🌐 ભાષા", quizBtn:"🧠 ક્વિઝ", exportBtn:"📥 નિકાસ", streakLabel:"દિવસની સ્ટ્રીક" },
    kn: { newChat:"ಹೊಸ ಚಾಟ್", voiceAsst:"🔊 ಧ್ವನಿ ಸಹಾಯಕ", autoRead:"ಉತ್ತರಗಳನ್ನು ಓದಿ", speed:"ವೇಗ", quickTopics:"⚡ ತ್ವರಿತ ವಿಷಯಗಳು", poweredBy:"Gemini AI ಮೂಲಕ", footerNote:"ನಿಷ್ಪಕ್ಷಪಾತ • ಎಲ್ಲರಿಗಾಗಿ", topTitle:"ಚುನಾವಣಾ ಶಿಕ್ಷಣ", welcomeGuide:"ನಿಮ್ಮ <span class='grad-text'>ಚುನಾವಣಾ ಮಾರ್ಗದರ್ಶಿ</span>", welcomeSub:"ವಿಷಯವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ ಅಥವಾ ಕೇಳಿ 👇", feat1:"ಧ್ವನಿ", feat2:"ಓದಿ", feat3:"21 ಭಾಷೆಗಳು", feat4:"ಕ್ವಿಜ್", placeholder:"ಟೈಪ್ ಮಾಡಿ ಅಥವಾ 🎤...", hint:"ElectIQ ಶೈಕ್ಷಣಿಕ ಮಾತ್ರ", langLabel:"🌐 ಭಾಷೆ", quizBtn:"🧠 ಕ್ವಿಜ್", exportBtn:"📥 ರಫ್ತು", streakLabel:"ದಿನಗಳ ಸ್ಟ್ರೀಕ್" },
    ml: { newChat:"പുതിയ ചാറ്റ്", voiceAsst:"🔊 വോയ്സ് സഹായി", autoRead:"ഉത്തരങ്ങൾ വായിക്കുക", speed:"വേഗത", quickTopics:"⚡ ദ്രുത വിഷയങ്ങൾ", poweredBy:"Gemini AI വഴി", footerNote:"നിഷ്പക്ഷം • എല്ലാവർക്കും", topTitle:"തിരഞ്ഞെടുപ്പ് വിദ്യാഭ്യാസം", welcomeGuide:"നിങ്ങളുടെ <span class='grad-text'>തിരഞ്ഞെടുപ്പ് ഗൈഡ്</span>", welcomeSub:"ഒരു വിഷയം ടാപ്പ് ചെയ്യുക അല്ലെങ്കിൽ ചോദിക്കുക 👇", feat1:"ശബ്ദം", feat2:"വായിക്കുക", feat3:"21 ഭാഷകൾ", feat4:"ക്വിസ്", placeholder:"ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ 🎤...", hint:"ElectIQ വിദ്യാഭ്യാസ മാത്രം", langLabel:"🌐 ഭാഷ", quizBtn:"🧠 ക്വിസ്", exportBtn:"📥 കയറ്റുമതി", streakLabel:"ദിവസ സ്ട്രീക്ക്" },
    pa: { newChat:"ਨਵੀਂ ਚੈਟ", voiceAsst:"🔊 ਆਵਾਜ਼ ਸਹਾਇਕ", autoRead:"ਜਵਾਬ ਪੜ੍ਹੋ", speed:"ਗਤੀ", quickTopics:"⚡ ਤੇਜ਼ ਵਿਸ਼ੇ", poweredBy:"Gemini AI ਦੁਆਰਾ", footerNote:"ਨਿਰਪੱਖ • ਸਭ ਲਈ", topTitle:"ਚੋਣ ਸਿੱਖਿਆ", welcomeGuide:"ਤੁਹਾਡਾ <span class='grad-text'>ਚੋਣ ਗਾਈਡ</span>", welcomeSub:"ਕੋਈ ਵਿਸ਼ਾ ਟੈਪ ਕਰੋ ਜਾਂ ਪੁੱਛੋ 👇", feat1:"ਆਵਾਜ਼", feat2:"ਪੜ੍ਹੋ", feat3:"21 ਭਾਸ਼ਾਵਾਂ", feat4:"ਕੁਇਜ਼", placeholder:"ਟਾਈਪ ਕਰੋ ਜਾਂ 🎤...", hint:"ElectIQ ਸਿਰਫ਼ ਵਿੱਦਿਅਕ ਹੈ", langLabel:"🌐 ਭਾਸ਼ਾ", quizBtn:"🧠 ਕੁਇਜ਼", exportBtn:"📥 ਡਾਊਨਲੋਡ", streakLabel:"ਦਿਨਾਂ ਦੀ ਲੜੀ" },
    ur: { newChat:"نئی چیٹ", voiceAsst:"🔊 آواز معاون", autoRead:"جوابات پڑھیں", speed:"رفتار", quickTopics:"⚡ فوری موضوعات", poweredBy:"Gemini AI سے", footerNote:"غیر جانبدار • سب کے لیے", topTitle:"انتخابی تعلیم", welcomeGuide:"آپ کا <span class='grad-text'>انتخابی رہنما</span>", welcomeSub:"کسی موضوع پر ٹیپ کریں یا پوچھیں 👇", feat1:"آواز", feat2:"پڑھیں", feat3:"21 زبانیں", feat4:"کوئز", placeholder:"ٹائپ کریں یا 🎤...", hint:"ElectIQ صرف تعلیمی ہے", langLabel:"🌐 زبان", quizBtn:"🧠 کوئز", exportBtn:"📥 ڈاؤنلوڈ", streakLabel:"دن کا سلسلہ" },
    zh: { newChat:"新对话", voiceAsst:"🔊 语音助手", autoRead:"自动朗读", speed:"速度", quickTopics:"⚡ 快速主题", poweredBy:"由 Gemini AI 驱动", footerNote:"中立 • 面向所有人 • 所有语言", topTitle:"选举教育", welcomeGuide:"您的<span class='grad-text'>选举指南</span>", welcomeSub:"点击主题或提问 👇", feat1:"语音", feat2:"朗读", feat3:"21种语言", feat4:"测验", placeholder:"输入或点击🎤提问...", hint:"ElectIQ 仅供教育用途 • 请核实官方来源", langLabel:"🌐 语言", quizBtn:"🧠 测验", exportBtn:"📥 导出", streakLabel:"天连续" },
    ja: { newChat:"新しいチャット", voiceAsst:"🔊 音声アシスタント", autoRead:"回答を読む", speed:"速度", quickTopics:"⚡ クイックトピック", poweredBy:"Gemini AI搭載", footerNote:"中立 • すべての人へ", topTitle:"選挙教育", welcomeGuide:"あなたの<span class='grad-text'>選挙ガイド</span>", welcomeSub:"トピックをタップするか質問してください 👇", feat1:"音声", feat2:"読む", feat3:"21言語", feat4:"クイズ", placeholder:"入力または🎤をタップ...", hint:"ElectIQは教育目的のみ", langLabel:"🌐 言語", quizBtn:"🧠 クイズ", exportBtn:"📥 エクスポート", streakLabel:"日連続" },
    ko: { newChat:"새 채팅", voiceAsst:"🔊 음성 도우미", autoRead:"답변 읽기", speed:"속도", quickTopics:"⚡ 빠른 주제", poweredBy:"Gemini AI 기반", footerNote:"중립 • 모두를 위해", topTitle:"선거 교육", welcomeGuide:"당신의 <span class='grad-text'>선거 가이드</span>", welcomeSub:"주제를 탭하거나 질문하세요 👇", feat1:"음성", feat2:"읽기", feat3:"21개 언어", feat4:"퀴즈", placeholder:"입력 또는 🎤 탭...", hint:"ElectIQ는 교육 목적만", langLabel:"🌐 언어", quizBtn:"🧠 퀴즈", exportBtn:"📥 내보내기", streakLabel:"일 연속" },
    ru: { newChat:"Новый чат", voiceAsst:"🔊 Голосовой помощник", autoRead:"Читать ответы", speed:"Скорость", quickTopics:"⚡ Быстрые темы", poweredBy:"На базе Gemini AI", footerNote:"Нейтрально • Для всех", topTitle:"Избирательное образование", welcomeGuide:"Ваш <span class='grad-text'>гид по выборам</span>", welcomeSub:"Нажмите тему или задайте вопрос 👇", feat1:"Голос", feat2:"Чтение", feat3:"21 язык", feat4:"Викторина", placeholder:"Введите или нажмите 🎤...", hint:"ElectIQ только для образования", langLabel:"🌐 Язык", quizBtn:"🧠 Викторина", exportBtn:"📥 Экспорт", streakLabel:"дней подряд" },
    sw: { newChat:"Gumzo Mpya", voiceAsst:"🔊 Msaidizi wa Sauti", autoRead:"Soma majibu", speed:"Kasi", quickTopics:"⚡ Mada za Haraka", poweredBy:"Kwa Gemini AI", footerNote:"Bila upendeleo • Kwa wote", topTitle:"Elimu ya Uchaguzi", welcomeGuide:"Mwongozo wako wa <span class='grad-text'>Uchaguzi</span>", welcomeSub:"Gusa mada au uliza chochote 👇", feat1:"Sauti", feat2:"Soma", feat3:"Lugha 21", feat4:"Maswali", placeholder:"Andika au gusa 🎤...", hint:"ElectIQ ni ya elimu tu", langLabel:"🌐 Lugha", quizBtn:"🧠 Maswali", exportBtn:"📥 Hamisha", streakLabel:"siku mfululizo" }
  };


  function updateUILocale() {
    const t = uiTranslations[currentLang] || uiTranslations.en;
    
    $('#newChatBtn').innerHTML = `<span>＋</span> ${t.newChat}`;
    const sectionLabels = document.querySelectorAll('.section-label');
    if (sectionLabels[0]) sectionLabels[0].textContent = t.langLabel;
    if (sectionLabels[1]) sectionLabels[1].textContent = t.voiceAsst;
    if (sectionLabels[2]) sectionLabels[2].textContent = t.quickTopics;
    
    // Use direct child selector to avoid hitting .toggle-slider span
    const toggleRows = document.querySelectorAll('.toggle-row');
    if (toggleRows[0]) toggleRows[0].querySelector(':scope > span').textContent = t.autoRead;
    if (toggleRows[1]) toggleRows[1].querySelector(':scope > span').textContent = t.speed;
    
    $('.footer-badge').innerHTML = `<span class="badge-dot"></span> ${t.poweredBy}`;
    $('.footer-note').textContent = t.footerNote;
    $('.topbar-center h2').textContent = t.topTitle;
    if ($('.welcome-title')) $('.welcome-title').innerHTML = t.welcomeGuide;
    if ($('.welcome-sub')) $('.welcome-sub').textContent = t.welcomeSub;
    
    const feats = document.querySelectorAll('.feat span:nth-child(2)');
    if (feats.length === 4) {
      feats[0].textContent = t.feat1; feats[1].textContent = t.feat2;
      feats[2].textContent = t.feat3; feats[3].textContent = t.feat4;
    }
    
    $('#msgInput').placeholder = t.placeholder;
    $('.input-hint').textContent = t.hint;
    
    // Sidebar action buttons
    const quizBtn = document.getElementById('quizModeBtn');
    const exportBtn = document.getElementById('exportChatBtn');
    if (quizBtn) quizBtn.innerHTML = t.quizBtn;
    if (exportBtn) exportBtn.innerHTML = t.exportBtn;
    
    // Streak label
    const streakLabel = document.querySelector('.streak-label');
    if (streakLabel) streakLabel.textContent = t.streakLabel;

    updateRobotGreeting();

    loadTopics(); // Re-render topics with new language
  }

  // ── Theme ──────────────────────────────────────────────────────
  const savedTheme = localStorage.getItem('electiq-theme') || 'dark';
  if (savedTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  updateThemeIcon();

  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? '' : 'light');
    localStorage.setItem('electiq-theme', isLight ? 'dark' : 'light');
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeIcon.textContent = isLight ? '☀️' : '🌙';
  }

  // ── Language ───────────────────────────────────────────────────
  langSelect.addEventListener('change', () => {
    currentLang = langSelect.value;
    localStorage.setItem('electiq-lang', currentLang);
    updateUILocale();
  });

  function updateRobotGreeting() {
    robotSpeech.innerHTML = robotGreetings[currentLang] || robotGreetings.en;
  }

  // ── Sidebar ────────────────────────────────────────────────────
  sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

  // ── Particles Background ───────────────────────────────────────
  (function initParticles() {
    const ctx = bgCanvas.getContext('2d');
    let particles = [];
    const resize = () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
        o: Math.random() * 0.35 + 0.1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = bgCanvas.width;
        if (p.x > bgCanvas.width) p.x = 0;
        if (p.y < 0) p.y = bgCanvas.height;
        if (p.y > bgCanvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108,92,231,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(108,92,231,${0.05 * (1 - d / 110)})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  })();

  // ── Load Topics ────────────────────────────────────────────────
  async function loadTopics() {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      renderSidebarTopics(data.topics);
      renderWelcomeCards(data.topics);
    } catch (e) { console.error('Failed to load topics:', e); }
  }

  function renderSidebarTopics(topics) {
    topicsList.innerHTML = topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<button class="topic-btn" data-prompt="${esc(prompt)}">
        <span>${t.icon}</span><span>${title}</span>
      </button>`;
    }).join('');
    topicsList.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sendMessage(btn.dataset.prompt);
        sidebar.classList.remove('open');
      });
    });
  }

  function renderWelcomeCards(topics) {
    welcomeCards.innerHTML = topics.map(t => {
      const title = currentLang === 'hi' && t.titleHi ? t.titleHi : t.title;
      const prompt = currentLang === 'hi' && t.promptHi ? t.promptHi : t.prompt;
      return `<div class="topic-card" data-prompt="${esc(prompt)}" style="--card-c:${t.color}">
        <span class="card-emoji">${t.emoji}</span>
        <div class="card-title">${title}</div>
        <div class="card-sub">${prompt.split('.')[0]}</div>
      </div>`;
    }).join('');
    welcomeCards.querySelectorAll('.topic-card').forEach(card => {
      card.style.setProperty('--before-bg', card.style.getPropertyValue('--card-c'));
      card.addEventListener('click', () => sendMessage(card.dataset.prompt));
    });
  }

  // ── Health Check ───────────────────────────────────────────────
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const dot = aiStatus.querySelector('.dot');
      const txt = aiStatus.querySelector('.dot-text');
      if (data.ai) {
        dot.style.background = 'var(--a2)'; txt.textContent = 'AI Online';
      } else {
        dot.style.background = '#fdcb6e'; txt.textContent = 'Fallback Mode';
      }
    } catch { aiStatus.querySelector('.dot-text').textContent = 'Offline'; }
  }

  // ══════════════════════════════════════════════════════════════
  // VOICE ASSISTANT — Speech-to-Text (STT) + Text-to-Speech (TTS)
  // ══════════════════════════════════════════════════════════════

  // ── Text-to-Speech (Read Aloud) ────────────────────────────────
  const synth = window.speechSynthesis;
  let currentUtterance = null;

  function speakText(text) {
    if (!autoReadToggle.checked || !synth) return;
    stopSpeaking();

    // Strip markdown for cleaner speech
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

    // Try to find a matching voice
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

  function stopSpeaking() {
    if (synth.speaking) synth.cancel();
    stopSpeakBtn.classList.add('hidden');
    setRobotState('');
  }

  stopSpeakBtn.addEventListener('click', stopSpeaking);

  // Pre-load voices
  if (synth) {
    synth.getVoices();
    synth.onvoiceschanged = () => synth.getVoices();
  }

  // ── Speech-to-Text (Voice Input) ──────────────────────────────
  let recognition = null;
  let isListening = false;

  function initSpeechRecognition() {
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
      autoResize();

      // If final result, auto-send
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
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error);
      }
    };
  }

  voiceBtn.addEventListener('click', () => {
    if (!recognition) {
      initSpeechRecognition();
      if (!recognition) return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = langVoiceMap[currentLang] || 'en-US';
      try { recognition.start(); } catch (e) { console.warn('Recognition start error:', e); }
    }
  });

  initSpeechRecognition();

  // ── Robot State ────────────────────────────────────────────────
  function setRobotState(state) {
    robot.className = 'robot' + (state ? ' ' + state : '');
  }

  // ── Send Message ───────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = text || msgInput.value.trim();
    if (!msg || isLoading) return;

    msgInput.value = '';
    msgInput.style.height = 'auto';
    sendBtn.disabled = true;
    isLoading = true;
    stopSpeaking();

    // Show messages view
    welcomeScreen.style.display = 'none';
    messagesBox.style.display = 'flex';

    chatHistory.push({ role: 'user', content: msg });
    appendMessage('user', msg);

    const typingEl = appendTyping();
    scrollToBottom();
    setRobotState('thinking');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: chatHistory.slice(0, -1),
          language: currentLang
        })
      });
      const data = await res.json();
      const reply = data.reply || data.error || 'Sorry, something went wrong.';
      chatHistory.push({ role: 'assistant', content: reply });

      typingEl.remove();
      appendMessage('assistant', reply);
      setRobotState('happy');
      setTimeout(() => setRobotState(''), 3000);

      // Auto-read the response
      speakText(reply);
    } catch (err) {
      typingEl.remove();
      appendMessage('assistant', '⚠️ Connection error. Please try again.');
      setRobotState('');
    }

    isLoading = false;
    scrollToBottom();
  }

  // ── Render Messages ────────────────────────────────────────────
  function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    const avatar = role === 'assistant' ? '🗳️' : '👤';
    const rendered = role === 'assistant' ? marked.parse(content) : escHtml(content);

    let actionsHTML = '';
    if (role === 'assistant') {
      const shareBtnHTML = navigator.share ? `<button class="share-btn msg-action-btn" title="Share">↗️ Share</button>` : '';
      actionsHTML = `<div class="msg-actions">
        <button class="msg-action-btn read-btn" title="Read aloud">🔊 Read</button>
        <button class="msg-action-btn copy-btn" title="Copy text">📋 Copy</button>
        ${shareBtnHTML}
      </div>`;
    }

    div.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div>
        <div class="msg-bubble">${rendered}</div>
        ${actionsHTML}
      </div>`;

    // Wire up action buttons
    const readBtn = div.querySelector('.read-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        speakText(content);
      });
    }
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
        } catch (e) { console.log('Share canceled or failed'); }
      });
    }

    messagesBox.appendChild(div);
    scrollToBottom();
    return div;
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'message assistant';
    div.innerHTML = `
      <div class="msg-avatar">🗳️</div>
      <div><div class="msg-bubble">
        <div class="typing-ind"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>
      </div></div>`;
    messagesBox.appendChild(div);
    return div;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => { chatArea.scrollTop = chatArea.scrollHeight; });
  }

  // ── Offline / Online Detection ──────────────────────────────────
  window.addEventListener('online', () => document.getElementById('offlineBanner')?.classList.remove('show'));
  window.addEventListener('offline', () => document.getElementById('offlineBanner')?.classList.add('show'));
  if (!navigator.onLine) document.getElementById('offlineBanner')?.classList.add('show');

  // ── New Chat ───────────────────────────────────────────────────
  newChatBtn.addEventListener('click', () => {
    chatHistory = [];
    messagesBox.innerHTML = '';
    messagesBox.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    sidebar.classList.remove('open');
    stopSpeaking();
    setRobotState('');
    updateRobotGreeting();
  });

  // ── Input ──────────────────────────────────────────────────────
  function autoResize() {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
  }
  msgInput.addEventListener('input', () => {
    sendBtn.disabled = !msgInput.value.trim();
    autoResize();
  });
  msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', () => sendMessage());

  // ── Utils ──────────────────────────────────────────────────────
  function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function esc(s) { return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  // ══════════════════════════════════════════════════════════════
  // STREAK TRACKER — Daily engagement tracking
  // ══════════════════════════════════════════════════════════════
  function updateStreak() {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('electiq-last-visit');
    let streak = parseInt(localStorage.getItem('electiq-streak') || '0', 10);
    
    if (lastVisit === today) {
      // Already visited today
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = (lastVisit === yesterday) ? streak + 1 : 1;
      localStorage.setItem('electiq-streak', streak);
      localStorage.setItem('electiq-last-visit', today);
    }
    
    const countEl = document.getElementById('streakCount');
    const labelEl = document.querySelector('.streak-label');
    if (countEl) countEl.textContent = streak;
    if (labelEl) labelEl.textContent = streak === 1 ? 'day streak' : 'day streak';
  }

  // ══════════════════════════════════════════════════════════════
  // CHAT EXPORT — Download conversation as text
  // ══════════════════════════════════════════════════════════════
  const exportChatBtn = document.getElementById('exportChatBtn');
  if (exportChatBtn) {
    exportChatBtn.addEventListener('click', () => {
      if (chatHistory.length === 0) {
        alert('No chat to export yet. Start a conversation first!');
        return;
      }
      let text = '🗳️ ElectIQ — Chat Export\n';
      text += '━'.repeat(40) + '\n';
      text += `Date: ${new Date().toLocaleString()}\n`;
      text += `Language: ${currentLang.toUpperCase()}\n`;
      text += '━'.repeat(40) + '\n\n';
      
      chatHistory.forEach(msg => {
        const label = msg.role === 'user' ? '👤 You' : '🗳️ ElectIQ';
        // Strip markdown for clean export
        const clean = msg.content.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/#{1,6}\s?/g, '');
        text += `${label}:\n${clean}\n\n`;
      });
      
      text += '━'.repeat(40) + '\n';
      text += 'Exported from ElectIQ — AI Election Education Assistant\n';
      
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `electiq-chat-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
      
      sidebar.classList.remove('open');
    });
  }

  // ══════════════════════════════════════════════════════════════
  // QUIZ MODE — AI-generated election knowledge quizzes
  // ══════════════════════════════════════════════════════════════
  const quizModal = document.getElementById('quizModal');
  const quizBody = document.getElementById('quizBody');
  const quizFooter = document.getElementById('quizFooter');
  const quizScore = document.getElementById('quizScore');
  const quizModeBtn = document.getElementById('quizModeBtn');
  const quizClose = document.getElementById('quizClose');
  const quizRetry = document.getElementById('quizRetry');

  let quizData = [];
  let quizAnswered = 0;
  let quizCorrect = 0;

  if (quizModeBtn) {
    quizModeBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      openQuiz();
    });
  }
  if (quizClose) quizClose.addEventListener('click', closeQuiz);
  if (quizRetry) quizRetry.addEventListener('click', openQuiz);
  if (quizModal) {
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) closeQuiz();
    });
  }

  function closeQuiz() {
    quizModal.classList.add('hidden');
  }

  async function openQuiz() {
    quizModal.classList.remove('hidden');
    quizFooter.style.display = 'none';
    quizBody.innerHTML = '<div class="quiz-loading"><div class="typing-ind"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div><p>Generating quiz with AI...</p></div>';
    quizData = [];
    quizAnswered = 0;
    quizCorrect = 0;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate exactly 5 multiple-choice quiz questions about elections and voting. Return ONLY valid JSON array, no markdown. Format: [{"q":"question","options":["A","B","C","D"],"answer":0,"explanation":"why"}] where answer is the 0-based index of correct option.',
          history: [],
          language: currentLang
        })
      });
      const data = await res.json();
      const reply = data.reply || '';
      
      // Extract JSON from response
      const jsonMatch = reply.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
        renderQuiz();
      } else {
        throw new Error('No valid JSON found');
      }
    } catch (err) {
      // Fallback quiz
      quizData = [
        { q: "What is the minimum voting age in most democracies?", options: ["16 years", "18 years", "21 years", "25 years"], answer: 1, explanation: "Most countries set the voting age at 18, though some allow 16-year-olds to vote." },
        { q: "What does EVM stand for in Indian elections?", options: ["Electronic Voting Machine", "Election Verification Method", "Electronic Vote Manager", "Election Voting Module"], answer: 0, explanation: "EVMs are Electronic Voting Machines used by the Election Commission of India." },
        { q: "Which body conducts elections in India?", options: ["Supreme Court", "Parliament", "Election Commission", "President"], answer: 2, explanation: "The Election Commission of India is an autonomous body responsible for conducting elections." },
        { q: "What is a ballot?", options: ["A campaign speech", "A paper/device used to cast votes", "A voter ID card", "An election result"], answer: 1, explanation: "A ballot is the means by which voters indicate their choice — paper or electronic." },
        { q: "What does 'universal suffrage' mean?", options: ["Only educated can vote", "Everyone can vote", "Only men can vote", "Only taxpayers can vote"], answer: 1, explanation: "Universal suffrage means all adult citizens have the right to vote regardless of gender, race, or wealth." }
      ];
      renderQuiz();
    }
  }

  function renderQuiz() {
    const letters = ['A', 'B', 'C', 'D'];
    quizBody.innerHTML = quizData.map((q, qi) => `
      <div class="quiz-question" id="quizQ${qi}">
        <div class="quiz-question-num">Question ${qi + 1} of ${quizData.length}</div>
        <div class="quiz-question-text">${escHtml(q.q)}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => `
            <button class="quiz-option" data-qi="${qi}" data-oi="${oi}">
              <span class="quiz-option-letter">${letters[oi]}</span>
              <span>${escHtml(opt)}</span>
            </button>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="quizExp${qi}" style="display:none;"></div>
      </div>
    `).join('');

    quizBody.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', handleQuizAnswer);
    });
  }

  function handleQuizAnswer(e) {
    const btn = e.currentTarget;
    const qi = parseInt(btn.dataset.qi);
    const oi = parseInt(btn.dataset.oi);
    const q = quizData[qi];
    const isCorrect = oi === q.answer;

    // Mark all options in this question
    const questionEl = document.getElementById(`quizQ${qi}`);
    questionEl.querySelectorAll('.quiz-option').forEach((opt, i) => {
      opt.classList.add('selected');
      if (i === q.answer) opt.classList.add('correct');
      else if (i === oi && !isCorrect) opt.classList.add('wrong');
    });

    // Show explanation
    const expEl = document.getElementById(`quizExp${qi}`);
    expEl.style.display = 'block';
    expEl.textContent = (isCorrect ? '✅ Correct! ' : '❌ Incorrect. ') + (q.explanation || '');

    quizAnswered++;
    if (isCorrect) quizCorrect++;

    // Check if all answered
    if (quizAnswered >= quizData.length) {
      quizFooter.style.display = 'flex';
      const pct = Math.round((quizCorrect / quizData.length) * 100);
      quizScore.innerHTML = `<span class="score-num">${quizCorrect}/${quizData.length}</span> (${pct}%) ${pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}`;
    }
  }

  // ── ARIA: Sidebar toggle state ─────────────────────────────────
  sidebarToggle.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    sidebarToggle.setAttribute('aria-expanded', isOpen);
  });

  // ── Init ───────────────────────────────────────────────────────
  loadTopics();
  checkHealth();
  updateRobotGreeting();
  updateStreak();
  msgInput.focus();
})();
