const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const STORAGE_KEY = "passly_oge2027_v8";
const PREV_KEYS = ["passly_oge2027_v7", "passly_oge2027_v6", "passly_oge2027_v5"];
const DAILY_GOAL = 10;
const FREE_DAILY_CARDS = 20;
const FREE_WEEKLY_EXAMS = 1;
const TODAY = new Date().toISOString().slice(0, 10);

function getWeekKey() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}
const THIS_WEEK = getWeekKey();

const MASCOT_IMAGES = {
  normal: "passly.jpg",
  happy: "passly_happy.jpg",
  shock: "passly_shock.jpg",
  think: "passly_think.jpg"
};

const ICONS = {
  flame: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.7 3.2-1.8 5.2-1.8 7.8 0 1.4 1 2.4 2.3 2.4 1.6 0 2.7-1.4 2.5-3.4 2.5 1.8 4 4.6 4 7.7A7 7 0 0 1 5 16.5c0-4 2.6-6.9 4.7-9.6C10.9 5.3 11.7 3.7 12 2z"/></svg>`,
  bolt: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z"/></svg>`,
  heart: `<svg class="ic-sm" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  eyeOff: `<svg class="ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17.94 17.94A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/></svg>`,
  moon: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>`,
  target: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  help: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2-2.3 3.7"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>`,
  book: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  file: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>`,
  cards: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="2.5"/><path d="M7 6V4.5A2.5 2.5 0 0 1 9.5 2h9A2.5 2.5 0 0 1 21 4.5v9A2.5 2.5 0 0 1 18.5 16H17"/></svg>`,
  scan: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M20 7V5a1 1 0 0 0-1-1h-2M4 17v2a1 1 0 0 0 1 1h2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10"/></svg>`,
  shuffle: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
  clock: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  star: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>`,
  starFill: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"/></svg>`,
  check: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  x: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  alert: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/></svg>`,
  bulb: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg>`,
  crown: `<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v2H3v-2zm0-2L5 7l4.5 4L12 5l2.5 6L19 7l2 9H3z"/></svg>`,
  lock: `<svg class="ic-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  refresh: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></svg>`,
  arrowL: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
  arrowR: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  back: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM18 9l-6 6M12 9l6 6"/></svg>`,
  chart: `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`
};

const RANKS = [
  { min: 0,    name: "Недопуск" },
  { min: 60,   name: "Жертва ФИПИ" },
  { min: 140,  name: "Надежда на удачу" },
  { min: 250,  name: "Троечник-выживший" },
  { min: 400,  name: "Искатель подвохов" },
  { min: 600,  name: "Гроза запятых" },
  { min: 850,  name: "Охотник на ловушки" },
  { min: 1150, name: "Уверенная четвёрка" },
  { min: 1550, name: "Сын Цыбулько" },
  { min: 2050, name: "Страх эксперта" },
  { min: 2700, name: "Машина ОГЭ" },
  { min: 3500, name: "33/33 на изи" }
];

const TASK_NAMES = {
  2: "Грамматическая основа",
  3: "Синтаксический анализ",
  4: "Пунктуационный анализ",
  5: "Знаки препинания",
  6: "Орфографический анализ",
  7: "Орфография (пропуски)",
  8: "Морфологические нормы",
  9: "Словосочетание (замена)",
  10: "Анализ содержания текста",
  11: "Средства выразительности",
  12: "Лексический анализ"
};

const TRAP_FILTERS = [
  { id: "all",       label: "Все ловушки" },
  { id: "exception", label: "Исключения" },
  { id: "sub",       label: "Подмены ФИПИ" },
  { id: "syntax",    label: "Основа и запятые" },
  { id: "norms",     label: "Нормы и текст" }
];

function getCardTrapCategory(card) {
  if (card.trap_type) return card.trap_type;
  const txt = `${card.prompt || ""} ${card.explanation || ""}`.toLowerCase();
  if (/исключен|росток|отрасл|неизменяем|стеклянн|фразеологизм|её|его|их/.test(txt)) return "exception";
  if (/подмен|чуж|искажен|ложн|не относятся|не относится|не соответствует|неверн/.test(txt)) return "sub";
  if ([2, 3, 4, 5].includes(card.task_number)) return "syntax";
  return "norms";
}

const XRAY_CATS = [
  { id: "mix", label: "Случайный микс", free: false },
  { id: "2",   label: "Основа № 2",     free: true  },
  { id: "3",   label: "Синтаксис № 3",  free: false },
  { id: "5",   label: "Знаки № 5",      free: false },
  { id: "6",   label: "Подмены № 6",    free: false },
  { id: "7",   label: "Буква № 7",      free: true  },
  { id: "11",  label: "Тропы № 11",     free: true  }
];

const TOURS = {
  practice: [
    { selector: "#bentoGrid", title: "Цель дня и карта прогноза", text: "10 верных ответов в день зажигают огонёк стрика (+25 XP). По клику на карточку ранга откроется твой прогноз оценки и тепловая карта." },
    { selector: "#dailyTrapBtn", title: "Ловушка дня на 15 секунд", text: "Раз в сутки тут ждёт хард-вопрос ФИПИ на скорость — всегда бесплатно и даёт +15 XP." },
    { selector: "#builderSection", title: "Фильтры, режимы и конструктор", text: "Выбирай сложность (Лайт / Средний / Хард), тип ловушки и режим (Обычный, Слепая проверка или 5 жизней)." }
  ],
  theory: [
    { selector: "#theoryView .sub-tabs-3", title: "Три формата вместо скучной теории", text: "Сторис с несколькими слайдами, тематические колоды Флеш-карт и Рентген по 6 типам заданий ОГЭ." },
    { selector: "#storiesPane, #flashPane, #xrayPane", title: "Интерактив внутри каждой темы", text: "Листай подтипы правил внутри каждого номера, сохраняй сложные в Избранное и просвечивай ловушки прямо в тексте." }
  ],
  exam: [
    { selector: "#examSetup .exam-hero", title: "Полный вариант ФИПИ 2027", text: "Генерирует случайный пробник № 2–12 с таймером, табличкой А Б В и плитками цифр без лишней клавиатуры." },
    { selector: "#examTaskList", title: "Конструктор мини-варианта", text: "Позволяет собрать бланк только из нужных номеров. Все верные ответы засчитываются в Цель дня и прогноз оценки." }
  ]
};

const calibQuestions = [
  { q: "Предложение: «Однако к вечеру дождь стих». Нужна запятая после «Однако»?", opts: ["Да, это вводное", "Нет, это союз (= Но)"], correct: 1, topic: "Пунктуация (№ 5)", num: 5 },
  { q: "Основа в «Учёные продолжают изучать космос» — только «Учёные продолжают»?", opts: ["Да, верно", "Нет, это ловушка"], correct: 1, topic: "Основа (№ 2)", num: 2 },
  { q: "Как правильно написать слово «р..сток»?", opts: ["расток", "росток (исключение)"], correct: 1, topic: "Орфография (№ 7)", num: 7 }
];

const $ = id => document.getElementById(id);

let allCards = [];
let variantsData = null;
let theoryData = { stories: [], flashDecks: [], xray: [] };
let activeTabName = "practice";

function loadState() {
  const def = {
    xp: 0,
    streak: 0,
    bestMarathon: 0,
    dailyDate: TODAY,
    dailyDone: 0,
    dailyPracticeUsed: 0,
    streakAwardedDate: "",
    weekKey: THIS_WEEK,
    weeklyExamsDone: 0,
    dailyTrapDate: "",
    dailyTrapCardId: "",
    dailyTrapWon: false,
    mistakes: [],
    masteredIds: [],
    favStories: [],
    learnedFlash: [],
    repeatFlash: [],
    taskStats: {},
    calibDone: false,
    calibXpClaimed: false,
    toursDone: { practice: false, theory: false, exam: false },
    theme: "light",
    isPro: false
  };
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const k of PREV_KEYS) {
        const prev = localStorage.getItem(k);
        if (prev) { raw = prev; break; }
      }
    }
    if (!raw) return def;
    const p = { ...def, ...JSON.parse(raw) };
    p.toursDone = {
      practice: Boolean(p.toursDone?.practice ?? p.tourDone),
      theory: Boolean(p.toursDone?.theory),
      exam: Boolean(p.toursDone?.exam)
    };
    p.taskStats = p.taskStats || {};
    p.repeatFlash = Array.isArray(p.repeatFlash) ? p.repeatFlash : [];
    p.bestMarathon = Number(p.bestMarathon || 0);
    p.calibXpClaimed = Boolean(p.calibXpClaimed ?? p.calibDone);
    if (p.dailyDate !== TODAY) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (p.streakAwardedDate && p.streakAwardedDate !== yesterday && p.streakAwardedDate !== TODAY) p.streak = 0;
      p.dailyDate = TODAY;
      p.dailyDone = 0;
      p.dailyPracticeUsed = 0;
    }
    if (p.weekKey !== THIS_WEEK) {
      p.weekKey = THIS_WEEK;
      p.weeklyExamsDone = 0;
    }
    return p;
  } catch {
    return def;
  }
}

let state = loadState();
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function recordTaskStat(taskNum, isOk) {
  const k = String(taskNum);
  if (!state.taskStats[k]) state.taskStats[k] = { ok: 0, total: 0 };
  state.taskStats[k].total += 1;
  if (isOk) state.taskStats[k].ok += 1;
}

function initStaticIcons() {
  $("statsPill").innerHTML = `
    <span class="streak-chip cold" id="streakChip" title="Закрой цель дня (10/10), чтобы зажечь огонёк">
      ${ICONS.flame} <span id="streakVal">0</span>
    </span>
    <span class="btn-ic">${ICONS.bolt} <span id="xpVal">0</span></span>
  `;
  $("openTourBtn").innerHTML = ICONS.help;
  $("openCalibBtn").innerHTML = ICONS.target;
  $("tabPractice").innerHTML = `${ICONS.bolt}<span>Практика</span>`;
  $("tabTheory").innerHTML = `${ICONS.book}<span>Шпоры</span>`;
  $("tabExam").innerHTML = `${ICONS.file}<span>Вариант</span>`;
  $("subStories").innerHTML = `${ICONS.book}<span>Сторис</span>`;
  $("subFlash").innerHTML = `${ICONS.cards}<span>Флеш</span>`;
  $("subXray").innerHTML = `${ICONS.scan}<span>Рентген</span>`;
  $("startShuffleBtn").innerHTML = `${ICONS.shuffle} Вперемешку (по фильтрам)`;
  $("startFullExamBtn").innerHTML = `${ICONS.file} Собрать полный вариант (№ 2–12)`;
  $("checkExamBtn").innerHTML = `${ICONS.check} Проверить бланк`;
  $("newExamBtn").innerHTML = `${ICONS.refresh} Собрать новый вариант`;
  $("backToSetupBtn").innerHTML = `${ICONS.arrowL} Назад`;
  $("backToExamSetupBtn").innerHTML = `${ICONS.arrowL} Варианты`;
  $("backToDecksBtn").innerHTML = `${ICONS.arrowL} Колоды`;
  $("closeStreakOverlayBtn").innerHTML = `${ICONS.flame} Продолжить`;
  $("mistakesTitle").innerHTML = `<span class="btn-ic">${ICONS.alert} Мои завалы</span>`;
  $("streakFlameBig").innerHTML = ICONS.flame.replace('class="ic"', 'class="ic-lg"');
}

function bindMascotImg(imgEl, mood = "normal", containerEl = null) {
  if (!imgEl) return;
  const targetSrc = MASCOT_IMAGES[mood] || MASCOT_IMAGES.normal;
  const parent = containerEl || imgEl.parentElement;
  if (parent) {
    const oldFb = parent.querySelector(".svg-fb");
    if (oldFb) oldFb.remove();
  }
  imgEl.dataset.fallbackStage = "0";
  imgEl.onerror = () => {
    if (imgEl.dataset.fallbackStage === "0" && targetSrc !== MASCOT_IMAGES.normal) {
      imgEl.dataset.fallbackStage = "1";
      imgEl.src = MASCOT_IMAGES.normal;
    } else {
      imgEl.style.display = "none";
      if (parent && !parent.querySelector(".svg-fb")) {
        const sp = document.createElement("span");
        sp.className = "svg-fb";
        sp.style.color = "#fff";
        sp.innerHTML = mood === "happy" ? ICONS.crown : (mood === "shock" ? ICONS.alert : ICONS.target);
        parent.appendChild(sp);
      }
    }
  };
  imgEl.style.display = "block";
  imgEl.src = targetSrc;
}

function applyTheme() {
  const isDark = state.theme === "dark";
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  $("themeToggleBtn").innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

function pluralDays(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} ДЕНЬ`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} ДНЯ`;
  return `${n} ДНЕЙ`;
}

function getTimeUntilMidnight() {
  const now = new Date();
  const tom = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diff = Math.max(0, Math.floor((tom - now) / 1000));
  const h = String(Math.floor(diff / 3600)).padStart(2, "0");
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
  const s = String(diff % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function launchConfetti(amount = 26) {
  const colors = ["#ff6b2c", "#fde047", "#635bff", "#22c55e", "#ec4899", "#ffffff"];
  for (let i = 0; i < amount; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = Math.random() * 100 + "vw";
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = (Math.random() * 0.45) + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }
}

function setMascot(text, stateCls = "", mood = "normal") {
  const box = $("mascotBox");
  box.className = "mascot-box" + (stateCls ? " " + stateCls : "");
  bindMascotImg($("mascotFaceImg"), mood, $("mascotFace"));
  $("mascotMsg").textContent = text;
}

function addDailyProgress(count = 1) {
  const wasLit = state.streakAwardedDate === TODAY;
  state.dailyDone += count;
  if (!wasLit && state.dailyDone >= DAILY_GOAL) {
    state.streakAwardedDate = TODAY;
    state.streak += 1;
    state.xp += 25;
    saveState();
    renderDashboard();
    $("streakBigTitle").textContent = `СТРИК: ${pluralDays(state.streak)}!`;
    bindMascotImg($("streakMascotImg"), "happy");
    $("streakOverlay").classList.remove("hidden");
    launchConfetti(50);
    tg?.HapticFeedback?.notificationOccurred("success");
  } else {
    saveState();
    renderDashboard();
  }
}

function getRankInfo(xp) {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].min) idx = i;
  return { idx, cur: RANKS[idx], next: RANKS[idx + 1] || null };
}

function getTodayTrapCard() {
  const hardPool = allCards.filter(c => c.difficulty === "hard" || c.wrong_rate >= 60);
  const pool = hardPool.length ? hardPool : allCards;
  if (!pool.length) return null;
  return pool[Number(TODAY.replace(/-/g, "")) % pool.length];
}

function computeForecast() {
  const nums = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let predicted = 0, tracked = 0;
  const cells = nums.map(n => {
    const st = state.taskStats[String(n)];
    const cardsOfNum = allCards.filter(c => c.task_number === n);
    const mast = cardsOfNum.filter(c => state.masteredIds.includes(c.id)).length;
    const hasMistake = cardsOfNum.some(c => state.mistakes.includes(c.id));

    let pct = null;
    if (st && st.total > 0) { pct = Math.round((st.ok / st.total) * 100); tracked++; }
    else if (mast > 0 && cardsOfNum.length) { pct = Math.round((mast / cardsOfNum.length) * 100); tracked++; }

    if (pct !== null) {
      if (pct >= 75 && !hasMistake) predicted += 1;
      else if (pct >= 50) predicted += 0.6;
    }

    let cls = "";
    if (pct !== null) {
      if (pct >= 75 && !hasMistake) cls = "h-green";
      else if (pct >= 45) cls = "h-yellow";
      else cls = "h-red";
    }
    return { num: n, pct, cls };
  });

  const score = Math.min(11, Math.round(predicted));
  let gradeText = "Пройди пару раундов для расчёта";
  if (tracked >= 2) {
    if (score >= 10) gradeText = "Прогноз: твёрдая 5 на тестовой части";
    else if (score >= 7) gradeText = "Прогноз: уверенная 4 (чуть-чуть до 5)";
    else if (score >= 5) gradeText = "Прогноз: проходная 3 — пора добить красные номера";
    else gradeText = "Зона риска — качаем базовые ловушки";
  }
  return { score, tracked, gradeText, cells };
}