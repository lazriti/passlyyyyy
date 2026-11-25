// ================= ДАШБОРД, ПРОГНОЗ И ШТОРКА PRO =================
function renderDashboard() {
  const isLit = state.streakAwardedDate === TODAY;
  $("streakChip").className = "streak-chip " + (isLit ? "lit" : "cold");
  $("streakVal").textContent = state.streak;
  $("xpVal").textContent = state.xp;

  const proBtn = $("proHeaderBtn");
  proBtn.classList.toggle("active", state.isPro);
  proBtn.innerHTML = state.isPro ? `${ICONS.crown} PRO` : `PRO`;

  const shownDone = Math.min(state.dailyDone, DAILY_GOAL);
  $("dailyCount").textContent = shownDone;
  $("dailyBar").style.width = Math.min(100, Math.round((state.dailyDone / DAILY_GOAL) * 100)) + "%";
  $("dailyHint").textContent = isLit ? "Огонёк зажжён (+25 XP)" : `Ещё ${DAILY_GOAL - shownDone} до огонька`;

  const { idx, cur, next } = getRankInfo(state.xp);
  $("rankLevelLabel").textContent = `Ранг ${idx + 1} / ${RANKS.length}`;
  $("rankName").textContent = cur.name;
  const fc = computeForecast();
  $("forecastBadge").innerHTML = `${ICONS.chart} ${fc.score}/11`;
  if (next) {
    $("rankBar").style.width = Math.min(100, Math.round(((state.xp - cur.min) / (next.min - cur.min)) * 100)) + "%";
    $("rankHint").textContent = `${state.xp}/${next.min} XP • Карта ОГЭ`;
  } else {
    $("rankBar").style.width = "100%";
    $("rankHint").textContent = "Максимум • Карта ОГЭ";
  }

  const lim = $("freeLimitStrip");
  if (state.isPro) {
    lim.className = "limit-strip pro-strip";
    lim.innerHTML = `
      <span class="btn-ic">${ICONS.crown} Passly PRO активен: безлимит</span>
      <button class="limit-cta" id="openProFromStrip">Тариф</button>
    `;
  } else {
    const left = Math.max(0, FREE_DAILY_CARDS - state.dailyPracticeUsed);
    lim.className = "limit-strip";
    lim.innerHTML = `
      <span>Лимит Free: <b>${left} / ${FREE_DAILY_CARDS}</b> карт.</span>
      <button class="limit-cta" id="openProFromStrip">Снять лимит</button>
    `;
  }
  $("openProFromStrip").addEventListener("click", () =>
    openProModal(`Сними лимит ${FREE_DAILY_CARDS} карточек в день — попробуй PRO-неделю за 50 Stars.`)
  );

  const doneToday = state.dailyTrapDate === TODAY;
  $("dailyTrapBtn").classList.toggle("done", doneToday);
  $("dailyTrapTitle").innerHTML = doneToday
    ? `<span class="btn-ic">${ICONS.check} Ловушка дня пройдена</span>`
    : `<span class="btn-ic">${ICONS.clock} Ловушка дня (15 сек)</span>`;
  $("dailyTrapSub").textContent = doneToday
    ? `Новая через ${getTimeUntilMidnight()} • Нажми для разбора`
    : "Хард-вопрос на скорость • +15 XP";
  $("dailyTrapBadge").textContent = doneToday ? "РАЗБОР" : "СТАРТ";

  const validMistakes = state.mistakes.filter(id => allCards.some(c => c.id === id));
  if (validMistakes.length > 0) {
    $("mistakesBtn").classList.remove("hidden");
    $("mistakesCountBadge").textContent = `${validMistakes.length} шт.`;
  } else {
    $("mistakesBtn").classList.add("hidden");
  }
}

setInterval(() => {
  if (state.dailyTrapDate === TODAY) {
    $("dailyTrapSub").textContent = `Новая через ${getTimeUntilMidnight()} • Нажми для разбора`;
    if ($("reviewCountdown")) $("reviewCountdown").textContent = getTimeUntilMidnight();
  }
}, 1000);

function openForecastModal() {
  const fc = computeForecast();
  const m = $("forecastModal");
  m.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="task-tag">${ICONS.chart} Карта готовности ОГЭ-2027</span>
      <button class="back-btn" id="closeForecastBtn">${ICONS.x}</button>
    </div>
    <div class="forecast-hero">
      <div style="font-size:12px;opacity:0.85;font-weight:700;">Тестовая часть (№ 2–12)</div>
      <div class="forecast-score">${fc.score} / 11</div>
      <div class="forecast-grade">${fc.gradeText}</div>
    </div>
    <div style="font-size:12.5px;color:var(--muted);font-weight:700;">Нажми на любой номер, чтобы потренировать его:</div>
    <div class="heatmap-grid">
      ${fc.cells.map(c => `
        <button type="button" class="heat-cell ${c.cls}" data-heat="${c.num}">
          <span class="heat-num">№ ${c.num}</span>
          <span class="heat-pct">${c.pct === null ? "—" : c.pct + "%"}</span>
        </button>
      `).join("")}
    </div>
  `;
  $("forecastOverlay").classList.remove("hidden");
  $("closeForecastBtn").addEventListener("click", () => $("forecastOverlay").classList.add("hidden"));
  m.querySelectorAll("[data-heat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.heat);
      $("forecastOverlay").classList.add("hidden");
      const pool = allCards.filter(c => c.task_number === n);
      if (pool.length) {
        switchMainTab("practice");
        tryLaunchPractice(pool, selectedMode, `Точечная прокачка задания № ${n} (${TASK_NAMES[n]}).`, "think");
      }
    });
  });
}

let selectedProPlan = "week";

function openProModal(reasonText = "") {
  const m = $("proModal");
  m.innerHTML = `
    <div class="sheet-handle"></div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="task-tag" style="background:var(--gold-bg);color:var(--gold-text);">${ICONS.crown} Passly PRO • Telegram Stars</span>
      <button class="back-btn" id="closeProBtn">${ICONS.x}</button>
    </div>
    <div class="modal-avatar" style="width:76px;height:76px;border-color:var(--gold);">
      <img id="proMascotImg" src="" alt="Пасли PRO" />
    </div>
    <div style="text-align:center;">
      <div style="font-size:20px;font-weight:900;">${state.isPro ? "Passly PRO активен" : "Попробуй PRO без лимитов"}</div>
      <div style="font-size:13px;color:var(--muted);margin-top:4px;">Оплата в 2 тапа через Telegram Stars</div>
    </div>
    ${reasonText && !state.isPro ? `<div class="pro-reason">${reasonText}</div>` : ""}
    <div class="pro-perks">
      <div class="pro-perk">${ICONS.bolt}<span><b>Безлимит карточек</b> в Практике и вариантов ФИПИ</span></div>
      <div class="pro-perk">${ICONS.cards}<span><b>Все колоды Флеш-карт</b> и полный Рентген (№ 3, 5, 6 + микс)</span></div>
      <div class="pro-perk">${ICONS.flame}<span><b>Конструктор мини-вариантов</b> и 2 заморозки стрика в месяц</span></div>
    </div>
    <div class="plan-grid">
      <button type="button" class="plan-card ${selectedProPlan === "week" ? "selected" : ""}" data-plan="week">
        <span class="plan-tag">Старт</span>
        <span class="plan-name">7 дней</span>
        <span class="plan-price">${ICONS.starFill} 50 Stars</span>
        <span class="plan-sub">Попробовать перед пробником</span>
      </button>
      <button type="button" class="plan-card ${selectedProPlan === "month" ? "selected" : ""}" data-plan="month">
        <span class="plan-name">1 месяц</span>
        <span class="plan-price">${ICONS.starFill} 150 Stars</span>
        <span class="plan-sub">Выгоднее на дистанции</span>
      </button>
    </div>
    <button class="btn-primary" id="buyProBtn">
      ${state.isPro ? ICONS.check + " Подписка активна" : ICONS.starFill + (selectedProPlan === "week" ? " Попробовать неделю за 50 Stars" : " Подключить месяц за 150 Stars")}
    </button>
    <button class="demo-btn" id="toggleDemoProBtn">
      ${state.isPro ? "Режим теста: переключить на Free" : "Режим теста: включить демо PRO бесплатно"}
    </button>
  `;
  bindMascotImg($("proMascotImg"), "happy");
  $("proOverlay").classList.remove("hidden");

  $("closeProBtn").addEventListener("click", () => $("proOverlay").classList.add("hidden"));
  m.querySelectorAll("[data-plan]").forEach(btn => {
    btn.addEventListener("click", () => { selectedProPlan = btn.dataset.plan; openProModal(reasonText); });
  });
  $("buyProBtn").addEventListener("click", () => {
    if (!state.isPro) {
      state.isPro = true;
      saveState();
      launchConfetti(36);
      refreshAllViews();
      $("proOverlay").classList.add("hidden");
      setMascot("Демо-подписка Passly PRO активирована! Все лимиты сняты.", "ok", "happy");
    } else $("proOverlay").classList.add("hidden");
  });
  $("toggleDemoProBtn").addEventListener("click", () => {
    state.isPro = !state.isPro;
    saveState();
    refreshAllViews();
    $("proOverlay").classList.add("hidden");
    setMascot(
      state.isPro ? "Включён демо-режим PRO — все колоды, Рентген и варианты открыты." : `Переключено на Free — лимит ${FREE_DAILY_CARDS} карточек в день активен.`,
      state.isPro ? "ok" : "gold",
      state.isPro ? "happy" : "think"
    );
  });
}

function refreshAllViews() {
  renderSetup();
  renderExamSetup();
  if (activeTabName === "theory") switchTheorySub(theoryMode);
}

// ================= ВКЛАДКА 1: ПРАКТИКА, ФИЛЬТРЫ И НОВЫЕ РЕЖИМЫ =================
let selectedDiff = "all";
let selectedTrap = "all";
let selectedMode = "normal"; // normal | blind | lives
let taskCounts = {};

let deck = [];
let currentIndex = 0;
let roundScore = 0;
let roundCombo = 0;
let quizMode = "normal"; // normal | blind | lives | daily | mistakes
let dailyTimerId = null;

let livesLeft = 5;
let blindLog = [];
let roundTasksTouched = new Set();
let roundFixedMistakes = 0;
let roundNewlyMastered = 0;
let roundXpGained = 0;
let roundLimitReached = false;

function ensurePracticeControls() {
  if (!$("practiceFilters")) {
    const box = document.createElement("div");
    box.className = "practice-filters";
    box.id = "practiceFilters";
    const builder = $("builderSection");
    builder.parentNode.insertBefore(box, builder);
  }
  if (!$("livesBadge")) {
    const pill = document.createElement("span");
    pill.className = "lives-pill hidden";
    pill.id = "livesBadge";
    const combo = $("comboBadge");
    combo.parentNode.insertBefore(pill, combo);
  }
}

function getFilteredCards() {
  return allCards.filter(c => {
    const okDiff = selectedDiff === "all" || c.difficulty === selectedDiff;
    const okTrap = selectedTrap === "all" || getCardTrapCategory(c) === selectedTrap;
    return okDiff && okTrap;
  });
}

function renderPracticeFilters() {
  const box = $("practiceFilters");
  if (!box) return;
  const diffOpts = [
    { id: "all", label: "Все" },
    { id: "light", label: "Лайт" },
    { id: "oge", label: "Средний" },
    { id: "hard", label: "Хард" }
  ];

  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span class="filter-row-label">Сложность карточек</span>
      ${state.bestMarathon > 0 ? `<span class="filter-row-label" style="color:var(--red);">Рекорд 5 жизней: ${state.bestMarathon}</span>` : ""}
    </div>
    <div class="diff-pills">
      ${diffOpts.map(d => `<button type="button" class="diff-pill ${selectedDiff === d.id ? "active" : ""}" data-diff="${d.id}">${d.label}</button>`).join("")}
    </div>
    <span class="filter-row-label">Охота на ловушку</span>
    <div class="trap-pills">
      ${TRAP_FILTERS.map(t => `<button type="button" class="trap-pill ${selectedTrap === t.id ? "active" : ""}" data-trap="${t.id}">${t.label}</button>`).join("")}
    </div>
    <span class="filter-row-label">Режим раунда</span>
    <div class="mode-switch">
      <button type="button" class="mode-btn ${selectedMode === "normal" ? "active" : ""}" data-pmode="normal">${ICONS.bolt} Обычный</button>
      <button type="button" class="mode-btn ${selectedMode === "blind" ? "active" : ""}" data-pmode="blind">${ICONS.eyeOff} Слепой</button>
      <button type="button" class="mode-btn ${selectedMode === "lives" ? "active" : ""}" data-pmode="lives">${ICONS.heart} 5 жизней</button>
    </div>
  `;

  box.querySelectorAll("[data-diff]").forEach(btn => {
    btn.addEventListener("click", () => { selectedDiff = btn.dataset.diff; renderSetup(); });
  });
  box.querySelectorAll("[data-trap]").forEach(btn => {
    btn.addEventListener("click", () => { selectedTrap = btn.dataset.trap; renderSetup(); });
  });
  box.querySelectorAll("[data-pmode]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedMode = btn.dataset.pmode;
      const hints = {
        normal: "Обычный режим: разбор ловушки сразу после каждого ответа.",
        blind: "Слепая проверка: без подсказок до самого финала — как на реальном ОГЭ.",
        lives: `Режим «5 жизней»: продержись как можно дольше! Твой рекорд: ${state.bestMarathon}.`
      };
      setMascot(hints[selectedMode], "", selectedMode === "normal" ? "normal" : "think");
      renderSetup();
    });
  });
}

function renderSetup() {
  ensurePracticeControls();
  renderDashboard();
  renderPracticeFilters();

  const filtered = getFilteredCards();
  const list = $("taskList");
  const allGrouped = {};
  allCards.forEach(c => {
    if (!allGrouped[c.task_number]) allGrouped[c.task_number] = { num: c.task_number, topic: c.topic, all: [], avail: [] };
    allGrouped[c.task_number].all.push(c);
  });
  filtered.forEach(c => {
    if (allGrouped[c.task_number]) allGrouped[c.task_number].avail.push(c);
  });

  const tasks = Object.values(allGrouped).sort((a, b) => a.num - b.num);
  let totalSelected = 0;

  list.innerHTML = tasks.map(t => {
    const maxC = t.avail.length;
    if ((taskCounts[t.num] || 0) > maxC) taskCounts[t.num] = maxC;
    const curC = taskCounts[t.num] || 0;
    totalSelected += curC;
    const masteredCount = t.all.filter(c => state.masteredIds.includes(c.id)).length;
    const masteryPct = Math.round((masteredCount / t.all.length) * 100);
    const isMastered = masteryPct === 100;

    return `
      <div class="task-row ${curC > 0 ? "active" : ""} ${isMastered ? "mastered" : ""} ${maxC === 0 ? "empty-filter" : ""}">
        <div class="task-left" data-toggle="${t.num}">
          <div class="checkbox">${curC > 0 ? ICONS.check : ""}</div>
          <div class="task-info">
            <div class="task-num-line">
              <span class="task-num">Задание № ${t.num}</span>
              <span class="mastery-tag">${isMastered ? ICONS.crown + " 100%" : masteryPct + "%"}</span>
              <span class="mastery-tag">доступно: ${maxC}</span>
            </div>
            <div class="task-desc">${t.topic}</div>
            <div class="task-progress">
              <div class="mini-bar-fill ${isMastered ? "fill-gold" : "fill-green"}" style="width:${masteryPct}%"></div>
            </div>
          </div>
        </div>
        <div class="stepper">
          <button class="step-btn" data-dec="${t.num}" ${curC <= 0 ? "disabled" : ""}>−</button>
          <span class="step-val">${curC}</span>
          <button class="step-btn" data-inc="${t.num}" ${curC >= maxC ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-toggle]").forEach(el => {
    el.addEventListener("click", () => {
      const n = Number(el.dataset.toggle);
      const maxC = allGrouped[n].avail.length;
      if (maxC === 0) return;
      taskCounts[n] = (taskCounts[n] || 0) > 0 ? 0 : Math.min(2, maxC);
      renderSetup();
    });
  });
  list.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.inc);
      taskCounts[n] = Math.min(allGrouped[n].avail.length, (taskCounts[n] || 0) + 1);
      renderSetup();
    });
  });
  list.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.dec);
      taskCounts[n] = Math.max(0, (taskCounts[n] || 0) - 1);
      renderSetup();
    });
  });

  const modeTag = selectedMode === "blind" ? " • Слепой" : (selectedMode === "lives" ? " • 5 жизней" : "");
  $("startSelectedBtn").disabled = totalSelected === 0;
  $("startSelectedBtn").textContent = totalSelected > 0 ? `Начать раунд • ${totalSelected} карт.${modeTag}` : "Нет карточек под фильтр";
  $("toggleAllBtn").textContent = totalSelected > 0 ? "Сбросить все" : "Выбрать по 1";

  $("startShuffleBtn").disabled = filtered.length === 0;
  $("startShuffleBtn").innerHTML = filtered.length > 0
    ? `${ICONS.shuffle} Вперемешку • ${filtered.length} карт.${modeTag}`
    : `${ICONS.shuffle} По фильтрам 0 карточек`;
}

function stopDailyTimer() {
  if (dailyTimerId) { clearInterval(dailyTimerId); dailyTimerId = null; }
  $("timerBadge").classList.add("hidden");
}

function renderLivesPill() {
  const pill = $("livesBadge");
  if (!pill) return;
  if (quizMode !== "lives") {
    pill.classList.add("hidden");
    return;
  }
  pill.classList.remove("hidden");
  let html = "";
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < livesLeft ? "heart-on" : "heart-off"}">${ICONS.heart}</span>`;
  }
  pill.innerHTML = html;
}

function tryLaunchPractice(cardsArray, mode = "normal", titleText = "Погнали!", mood = "think") {
  if (!cardsArray.length) return;
  if (mode !== "daily" && !state.isPro && state.dailyPracticeUsed >= FREE_DAILY_CARDS) {
    openProModal(`Дневной лимит Free (${FREE_DAILY_CARDS} карточек) исчерпан. Открой безлимит за 50 Stars на неделю!`);
    return;
  }
  ensurePracticeControls();
  stopDailyTimer();
  quizMode = mode;
  deck = shuffle(cardsArray);
  currentIndex = 0;
  roundScore = 0;
  roundCombo = 0;
  livesLeft = 5;
  blindLog = [];
  roundTasksTouched = new Set();
  roundFixedMistakes = 0;
  roundNewlyMastered = 0;
  roundXpGained = 0;
  roundLimitReached = false;

  $("setupScreen").classList.add("hidden");
  $("quizScreen").classList.remove("hidden");
  setMascot(titleText, "", mood);
  renderCard();
}

const diffMap = {
  light: { text: "Лайт", cls: "diff-light" },
  oge: { text: "Средний", cls: "diff-oge" },
  hard: { text: "Хард", cls: "diff-hard" }
};

function buildMiniReportHtml(totalAnswered, isNewRecord) {
  const touchedArr = [...roundTasksTouched].sort((a, b) => a - b);
  const dailyLeft = Math.max(0, DAILY_GOAL - state.dailyDone);
  return `
    <div class="report-box">
      <div class="report-title">Мини-отчёт раунда</div>
      <div class="report-row"><span>Заработано опыта</span><b>+${roundXpGained} XP</b></div>
      <div class="report-row"><span>Выбито из «Завалов»</span><b>${roundFixedMistakes} шт.</b></div>
      <div class="report-row"><span>Новых карточек освоено</span><b>${roundNewlyMastered} шт.</b></div>
      <div class="report-row">
        <span>Цель дня (стрик)</span>
        <b style="color:${dailyLeft === 0 ? "var(--green)" : "var(--accent)"};">
          ${dailyLeft === 0 ? "Закрыта 10/10" : `Ещё ${dailyLeft} верных`}
        </b>
      </div>
      ${quizMode === "lives" ? `<div class="report-row"><span>Рекорд «5 жизней»</span><b style="color:var(--red);">${state.bestMarathon}${isNewRecord ? " (новый!)" : ""}</b></div>` : ""}
      ${touchedArr.length ? `
        <div style="margin-top:2px;">
          <div class="report-title" style="margin-bottom:5px;">Прокачанные номера</div>
          <div class="report-tags">${touchedArr.map(n => `<span class="report-tag">№ ${n}</span>`).join("")}</div>
        </div>
      ` : ""}
      ${roundLimitReached ? `<div style="font-size:12px;font-weight:800;color:var(--purple);margin-top:2px;">Лимит Free (${FREE_DAILY_CARDS} карточек в день) исчерпан — возвращайся завтра или открой PRO.</div>` : ""}
    </div>
  `;
}

function finalizeBlindRound() {
  let okCount = 0;
  blindLog.forEach(item => {
    const isOk = item.chosenIdx === item.card.correct_index;
    item.isOk = isOk;
    roundTasksTouched.add(item.card.task_number);
    recordTaskStat(item.card.task_number, isOk);
    if (!state.isPro) state.dailyPracticeUsed += 1;

    if (isOk) {
      okCount++;
      roundScore++;
      roundXpGained += 5;
      state.xp += 5;
      if (state.mistakes.includes(item.card.id)) roundFixedMistakes++;
      if (!state.masteredIds.includes(item.card.id)) {
        state.masteredIds.push(item.card.id);
        roundNewlyMastered++;
      }
      state.mistakes = state.mistakes.filter(id => id !== item.card.id);
    } else {
      if (!state.mistakes.includes(item.card.id)) state.mistakes.push(item.card.id);
    }
  });

  if (okCount > 0) addDailyProgress(okCount);
  else { saveState(); renderDashboard(); }
}

function renderRoundSummary() {
  const area = $("cardArea");
  const totalShown = quizMode === "lives" ? Math.max(1, currentIndex) : deck.length;
  const pct = Math.round((roundScore / totalShown) * 100);

  let isNewRecord = false;
  if (quizMode === "lives" && roundScore > state.bestMarathon) {
    state.bestMarathon = roundScore;
    isNewRecord = true;
    saveState();
  }

  if ((pct === 100 && quizMode !== "daily") || isNewRecord) launchConfetti(36);

  const livesOut = quizMode === "lives" && livesLeft <= 0;
  setMascot(
    quizMode === "daily"
      ? "Ловушка дня зафиксирована. Новая откроется после полуночи."
      : (livesOut
        ? `Жизни закончились! Ты взял ${roundScore} верных ответов${isNewRecord ? " — это новый рекорд!" : "."}`
        : (pct === 100 ? "100% без единого промаха — Пасли в восторге!" : `Раунд завершён: ${pct}%. Смотри мини-отчёт ниже.`)),
    pct >= 70 || isNewRecord ? "ok" : "gold",
    pct >= 70 || isNewRecord ? "happy" : "think"
  );

  const blindDetailsHtml = quizMode === "blind" && blindLog.length ? `
    <div class="blind-list">
      <div class="report-title">Разбор всех карточек</div>
      ${blindLog.map((it, i) => `
        <div class="blind-item ${it.isOk ? "ok" : "bad"}">
          <div style="font-weight:900;margin-bottom:3px;">${i + 1}. Задание № ${it.card.task_number} — ${it.isOk ? "Верно" : "Ошибка"}</div>
          <div style="margin-bottom:4px;">${it.card.prompt}</div>
          <div><b>Ответ:</b> ${it.card.options[it.card.correct_index]}${!it.isOk ? ` (твой: ${it.card.options[it.chosenIdx]})` : ""}</div>
          <div style="opacity:0.92;margin-top:3px;">${it.card.explanation}</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  area.innerHTML = `
    <div style="text-align:center;padding:8px 2px;display:flex;flex-direction:column;gap:12px;">
      <div class="modal-avatar" style="width:80px;height:80px;"><img id="resPasslyImg" src="" alt="Пасли" /></div>
      <div style="font-size:36px;font-weight:900;color:var(--accent);">${roundScore} / ${totalShown}</div>
      <div style="color:var(--muted);font-size:13.5px;font-weight:700;">Точность: ${pct}% • Опыт: ${state.xp} XP</div>
      ${buildMiniReportHtml(totalShown, isNewRecord)}
      ${blindDetailsHtml}
      ${quizMode !== "daily" ? `<button class="btn-primary" id="againBtn">${ICONS.refresh} Пройти ещё раз</button>` : ""}
      <button class="${quizMode === "daily" ? "btn-primary" : "btn-shuffle"}" id="toHomeBtn">На главный экран</button>
    </div>
  `;

  bindMascotImg($("resPasslyImg"), pct >= 70 || isNewRecord ? "happy" : "shock");
  $("againBtn")?.addEventListener("click", () => {
    const modeToUse = quizMode === "mistakes" ? "mistakes" : selectedMode;
    tryLaunchPractice(deck, modeToUse, "Повторяем раунд — без права на ошибку.", "think");
  });
  $("toHomeBtn").addEventListener("click", () => $("backToSetupBtn").click());
}

function renderCard() {
  stopDailyTimer();
  renderLivesPill();
  const area = $("cardArea");
  const comboEl = $("comboBadge");

  if (roundCombo >= 2 && quizMode !== "blind") {
    comboEl.classList.remove("hidden");
    comboEl.innerHTML = `<span class="btn-ic">${ICONS.flame} x${roundCombo}</span>`;
  } else {
    comboEl.classList.add("hidden");
  }

  if (currentIndex >= deck.length || (quizMode === "lives" && livesLeft <= 0)) {
    $("progressFill").style.width = "100%";
    $("counterText").textContent = `${Math.min(currentIndex, deck.length)}/${deck.length}`;
    if (quizMode === "blind") finalizeBlindRound();
    renderRoundSummary();
    return;
  }

  const card = deck[currentIndex];
  const diff = diffMap[card.difficulty] || diffMap.oge;
  $("progressFill").style.width = `${(currentIndex / deck.length) * 100}%`;
  $("counterText").textContent = `${currentIndex + 1}/${deck.length}`;

  area.classList.remove("shake");
  area.innerHTML = `
    <div class="card-meta">
      <span class="task-tag">Задание № ${card.task_number} • ${card.topic}</span>
      <span class="diff-badge ${diff.cls}">${diff.text}</span>
    </div>
    <div class="prompt">${card.prompt}</div>
    <div class="options">
      ${card.options.map((opt, idx) => `<button class="opt-btn" data-idx="${idx}">${opt}</button>`).join("")}
    </div>
    <div class="explain" id="explainBox">
      <div class="trap-stat"><span class="btn-ic">${ICONS.alert} На этой ловушке ошибаются ${card.wrong_rate}% учеников</span></div>
      <div>${card.explanation}</div>
    </div>
    <button class="btn-primary hidden" id="nextBtn">${currentIndex === deck.length - 1 ? "Итоги раунда" : "Дальше"} ${ICONS.arrowR}</button>
  `;

  const buttons = area.querySelectorAll(".opt-btn");
  buttons.forEach(btn => btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.idx);
    if (quizMode === "blind") {
      buttons.forEach(b => b.disabled = true);
      btn.classList.add("blind-picked");
      blindLog.push({ card, chosenIdx: idx });
      setTimeout(() => {
        currentIndex++;
        if (!state.isPro && state.dailyPracticeUsed + blindLog.length >= FREE_DAILY_CARDS && currentIndex < deck.length) {
          roundLimitReached = true;
          deck = deck.slice(0, currentIndex);
        }
        renderCard();
      }, 240);
      return;
    }
    handleAnswer(idx, card, buttons, false);
  }));

  $("nextBtn").addEventListener("click", () => {
    currentIndex++;
    if (quizMode === "lives" && livesLeft <= 0) {
      renderCard();
      return;
    }
    if (quizMode !== "daily" && !state.isPro && state.dailyPracticeUsed >= FREE_DAILY_CARDS && currentIndex < deck.length) {
      roundLimitReached = true;
      deck = deck.slice(0, currentIndex);
      renderCard();
      return;
    }
    setMascot("Изучаем следующую ловушку с лупой.", "", "think");
    renderCard();
  });

  if (quizMode === "daily") {
    let sec = 15;
    $("timerBadge").classList.remove("hidden");
    $("timerBadge").textContent = `${sec}с`;
    dailyTimerId = setInterval(() => {
      sec--;
      $("timerBadge").textContent = `${sec}с`;
      if (sec <= 0) { stopDailyTimer(); handleAnswer(-1, card, buttons, true); }
    }, 1000);
  }
}

function handleAnswer(chosenIdx, card, buttons, timedOut) {
  stopDailyTimer();
  buttons.forEach(b => b.disabled = true);
  const isCorrect = !timedOut && chosenIdx === card.correct_index;

  buttons[card.correct_index].classList.add("correct");
  roundTasksTouched.add(card.task_number);
  recordTaskStat(card.task_number, isCorrect);

  if (quizMode === "daily") {
    state.dailyTrapDate = TODAY;
    state.dailyTrapCardId = card.id;
    state.dailyTrapWon = isCorrect;
  } else if (!state.isPro) {
    state.dailyPracticeUsed += 1;
  }

  if (isCorrect) {
    roundScore++;
    roundCombo++;
    const gainedXp = quizMode === "daily" ? 15 : (roundCombo >= 3 ? 7 : 5);
    roundXpGained += gainedXp;
    state.xp += gainedXp;

    if (state.mistakes.includes(card.id)) roundFixedMistakes++;
    if (!state.masteredIds.includes(card.id)) {
      state.masteredIds.push(card.id);
      roundNewlyMastered++;
    }
    state.mistakes = state.mistakes.filter(id => id !== card.id);

    const msg = quizMode === "daily"
      ? `Успел! Ты обошёл ${card.wrong_rate}% девятиклассников • +15 XP`
      : (roundCombo >= 3 ? `Комбо x${roundCombo}! +${gainedXp} XP — составители ФИПИ в шоке.` : `Чётко в цель! +${gainedXp} XP`);
    setMascot(msg, "ok", "happy");
    if (roundCombo === 3 || quizMode === "daily") launchConfetti();
    tg?.HapticFeedback?.notificationOccurred("success");
    addDailyProgress(1);
  } else {
    if (chosenIdx >= 0 && buttons[chosenIdx]) buttons[chosenIdx].classList.add("wrong");
    roundCombo = 0;
    if (!state.mistakes.includes(card.id)) state.mistakes.push(card.id);

    if (quizMode === "lives") {
      livesLeft = Math.max(0, livesLeft - 1);
      renderLivesPill();
      if (livesLeft === 0) $("nextBtn").innerHTML = `Итоги марафона ${ICONS.arrowR}`;
    }

    $("cardArea").classList.add("shake");
    setMascot(
      timedOut ? "Время вышло. Карточка улетела в «Мои завалы»." : (quizMode === "lives" ? `Минус сердечко (осталось ${livesLeft}). Закинул в «Завалы».` : "Попался на подвох. Закинул в «Мои завалы» для реванша."),
      "fail",
      "shock"
    );
    tg?.HapticFeedback?.notificationOccurred("error");
    saveState();
    renderDashboard();
  }

  $("explainBox").classList.add("show");
  $("nextBtn").classList.remove("hidden");
}

// ================= КОНТЕКСТНЫЙ ТУР И КАЛИБРОВКА =================
let activeTourKey = null, tourStepIdx = 0;

function startContextTour(tabKey, force = false) {
  if (!TOURS[tabKey]) return;
  if (!force && state.toursDone[tabKey]) return;
  if (!force && !$("calibOverlay").classList.contains("hidden")) return;

  if (tabKey === "practice") { $("quizScreen").classList.add("hidden"); $("setupScreen").classList.remove("hidden"); }
  else if (tabKey === "exam") { $("examSolve").classList.add("hidden"); $("examSetup").classList.remove("hidden"); }

  activeTourKey = tabKey;
  tourStepIdx = 0;
  $("tourBackdrop").classList.remove("hidden");
  renderTourStep();
}

function getVisibleTarget(selector) {
  const nodes = [...document.querySelectorAll(selector)];
  return nodes.find(el => !el.classList.contains("hidden") && el.getBoundingClientRect().height > 0) || nodes[0] || null;
}

function renderTourStep() {
  const steps = TOURS[activeTourKey];
  if (!steps) return;
  const step = steps[tourStepIdx];
  const target = getVisibleTarget(step.selector);
  const ring = $("tourRing"), card = $("tourCard");

  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const r = target.getBoundingClientRect(), pad = 6;
      ring.style.top = Math.max(6, r.top - pad) + "px";
      ring.style.left = Math.max(6, r.left - pad) + "px";
      ring.style.width = (r.width + pad * 2) + "px";
      ring.style.height = Math.min(window.innerHeight - 180, r.height + pad * 2) + "px";
      if (window.innerHeight - r.bottom > 210) { card.style.top = (r.bottom + 14) + "px"; card.style.bottom = "auto"; }
      else { card.style.top = "auto"; card.style.bottom = Math.min(window.innerHeight - 210, Math.max(18, window.innerHeight - r.top + 14)) + "px"; }
    }, 180);
  }

  const isLast = tourStepIdx === steps.length - 1;
  card.innerHTML = `
    <div class="tour-top">
      <div class="tour-ava"><img id="tourAvaImg" src="" alt="Пасли" /></div>
      <div>
        <div style="font-size:11px;font-weight:900;color:var(--accent);text-transform:uppercase;">Обучение • Шаг ${tourStepIdx + 1} из ${steps.length}</div>
        <div style="font-size:15.5px;font-weight:900;margin-top:2px;">${step.title}</div>
      </div>
    </div>
    <div style="font-size:13.5px;line-height:1.45;color:var(--muted);">${step.text}</div>
    <div class="tour-actions">
      <button class="tour-skip" id="tourSkipBtn">Пропустить</button>
      <button class="btn-primary" id="tourNextBtn" style="width:auto;padding:10px 18px;font-size:14px;">
        ${isLast ? "Погнали " + ICONS.check : "Дальше " + ICONS.arrowR}
      </button>
    </div>
  `;
  bindMascotImg($("tourAvaImg"), isLast ? "happy" : "think");
  $("tourSkipBtn").addEventListener("click", closeTour);
  $("tourNextBtn").addEventListener("click", () => { if (isLast) closeTour(); else { tourStepIdx++; renderTourStep(); } });
}

function closeTour() {
  if (activeTourKey) { state.toursDone[activeTourKey] = true; saveState(); }
  activeTourKey = null;
  $("tourBackdrop").classList.add("hidden");
}

let calibStep = -1, calibHits = 0, calibWeak = [];

function openCalibration() {
  calibStep = -1; calibHits = 0; calibWeak = [];
  $("calibOverlay").classList.remove("hidden");
  renderCalib();
}

function renderCalib() {
  const m = $("calibModal");
  if (calibStep === -1) {
    m.innerHTML = `
      <div class="modal-avatar"><img id="calibImg" src="" alt="Passly" /></div>
      <div style="text-align:center;">
        <div style="font-size:21px;font-weight:900;">${state.calibXpClaimed ? "Повторная калибровка" : "Привет! Я Пасли"}</div>
        <div style="font-size:13.5px;color:var(--muted);margin-top:6px;line-height:1.45;">
          ${state.calibXpClaimed
            ? "Бонусный опыт за калибровку уже получен, но ты можешь ещё раз проверить себя на 3 базовых ловушках."
            : "Давай за 20 секунд проверим, на каких ловушках ОГЭ-2027 ты чаще всего палишься. Всего 3 вопроса."}
        </div>
      </div>
      <button class="btn-primary" id="calibStartBtn">${ICONS.bolt} Пройти калибровку</button>
      <button class="back-btn" id="calibSkipBtn" style="width:100%;">Закрыть</button>
    `;
    bindMascotImg($("calibImg"), "think");
    $("calibStartBtn").addEventListener("click", () => { calibStep = 0; renderCalib(); });
    $("calibSkipBtn").addEventListener("click", closeCalib);
    return;
  }

  if (calibStep >= calibQuestions.length) {
    const pct = Math.round((calibHits / calibQuestions.length) * 100);
    if (pct === 100) launchConfetti();

    const firstTime = !state.calibXpClaimed;
    const earnedXp = firstTime ? calibHits * 5 : 0;
    state.calibDone = true;
    if (firstTime) {
      state.calibXpClaimed = true;
      state.xp += earnedXp;
    }
    saveState();
    renderDashboard();

    m.innerHTML = `
      <div class="modal-avatar"><img id="calibResImg" src="" alt="Passly" /></div>
      <div style="text-align:center;">
        <div style="font-size:22px;font-weight:900;">Уровень: ${pct}%</div>
        <div style="font-size:13.5px;color:var(--muted);margin-top:6px;line-height:1.45;">
          ${calibWeak.length ? `Обрати внимание на: <b>${calibWeak.join(", ")}</b>.` : "Мощный результат — ни одной ошибки."}
          <br>${firstTime ? `Начислено +${earnedXp} XP.` : "Повторное прохождение — опыт начисляется только в первый раз."}
        </div>
      </div>
      <button class="btn-primary" id="calibDoneBtn">Ворваться в Passly</button>
    `;
    bindMascotImg($("calibResImg"), pct >= 66 ? "happy" : "shock");
    $("calibDoneBtn").addEventListener("click", closeCalib);
    return;
  }

  const item = calibQuestions[calibStep];
  m.innerHTML = `
    <div style="font-size:12px;font-weight:900;color:var(--purple);text-transform:uppercase;">
      Калибровка • ${calibStep + 1} из ${calibQuestions.length}
    </div>
    <div style="font-size:16.5px;font-weight:800;line-height:1.45;">${item.q}</div>
    <div class="options">
      ${item.opts.map((o, i) => `<button class="opt-btn" data-copt="${i}">${o}</button>`).join("")}
    </div>
  `;
  m.querySelectorAll("[data-copt]").forEach(btn => {
    btn.addEventListener("click", () => {
      const ok = Number(btn.dataset.copt) === item.correct;
      recordTaskStat(item.num, ok);
      if (ok) calibHits++;
      else calibWeak.push(item.topic);
      calibStep++;
      renderCalib();
    });
  });
}

function closeCalib() {
  state.calibDone = true;
  saveState();
  $("calibOverlay").classList.add("hidden");
  if (!state.toursDone.practice) setTimeout(() => startContextTour("practice"), 240);
}

// ================= НАВИГАЦИЯ И СТАРТ =================
const tabs = [
  { key: "practice", btn: "tabPractice", view: "practiceView" },
  { key: "theory",   btn: "tabTheory",   view: "theoryView" },
  { key: "exam",     btn: "tabExam",     view: "examView" }
];

function switchMainTab(key) {
  activeTabName = key;
  tabs.forEach(x => {
    $(x.btn).classList.toggle("active", x.key === key);
    $(x.view).classList.toggle("hidden", x.key !== key);
  });
  if (key === "theory") {
    switchTheorySub(theoryMode);
    setTimeout(() => startContextTour("theory"), 140);
  } else if (key === "exam") {
    setMascot("Собери полный вариант ФИПИ 2027 или накидай мини-вариант по нужным номерам.", "", "think");
    renderExamSetup();
    setTimeout(() => startContextTour("exam"), 140);
  } else {
    setMascot("Сделай 10 правильных ответов за день, чтобы зажечь огонёк стрика.", "", "normal");
    renderSetup();
    setTimeout(() => startContextTour("practice"), 140);
  }
}

initStaticIcons();
applyTheme();
bindMascotImg($("headerAvatarImg"), "normal");
bindMascotImg($("mascotFaceImg"), "normal", $("mascotFace"));
bindMascotImg($("streakMascotImg"), "happy");

tabs.forEach(t => $(t.btn).addEventListener("click", () => switchMainTab(t.key)));

$("themeToggleBtn").addEventListener("click", () => { state.theme = state.theme === "dark" ? "light" : "dark"; saveState(); applyTheme(); });
$("openTourBtn").addEventListener("click", () => startContextTour(activeTabName, true));
$("openCalibBtn").addEventListener("click", openCalibration);
$("proHeaderBtn").addEventListener("click", () => openProModal(""));
$("forecastTrigger").addEventListener("click", openForecastModal);
$("closeStreakOverlayBtn").addEventListener("click", () => $("streakOverlay").classList.add("hidden"));

["forecastOverlay", "proOverlay", "dailyReviewOverlay"].forEach(id => {
  $(id).addEventListener("click", e => { if (e.target === $(id)) $(id).classList.add("hidden"); });
});

$("toggleAllBtn").addEventListener("click", () => {
  const filtered = getFilteredCards();
  const total = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  [...new Set(allCards.map(c => c.task_number))].forEach(n => {
    const avail = filtered.filter(c => c.task_number === n).length;
    taskCounts[n] = total > 0 ? 0 : Math.min(1, avail);
  });
  renderSetup();
});

$("startSelectedBtn").addEventListener("click", () => {
  const filtered = getFilteredCards();
  const picked = [];
  Object.entries(taskCounts).forEach(([numStr, cnt]) => {
    if (cnt > 0) picked.push(...shuffle(filtered.filter(c => c.task_number === Number(numStr))).slice(0, cnt));
  });
  const intro = selectedMode === "blind"
    ? "Слепая проверка началась! Все ответы и разбор покажем в конце."
    : (selectedMode === "lives" ? "Марафон «5 жизней»! Не дай сердечкам закончиться." : "Твой набор собран. Включай детектор ловушек.");
  tryLaunchPractice(picked, selectedMode, intro, "think");
});

$("startShuffleBtn").addEventListener("click", () => {
  const filtered = getFilteredCards();
  const intro = selectedMode === "blind"
    ? "Слепая проверка вперемешку! Держи фокус до финала."
    : (selectedMode === "lives" ? "Марафон «5 жизней» по всем карточкам — побей свой рекорд!" : "Режим «Вперемешку» по выбранным фильтрам.");
  tryLaunchPractice(filtered, selectedMode, intro, "normal");
});

$("mistakesBtn").addEventListener("click", () =>
  tryLaunchPractice(allCards.filter(c => state.mistakes.includes(c.id)), "mistakes", "Реванш — добиваем твои завалы.", "think")
);

$("dailyTrapBtn").addEventListener("click", () => {
  const chosen = getTodayTrapCard();
  if (!chosen) return;
  if (state.dailyTrapDate === TODAY) {
    const m = $("dailyReviewModal");
    m.innerHTML = `
      <div class="modal-avatar" style="width:76px;height:76px;"><img id="dailyRevImg" src="" alt="Пасли" /></div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="task-tag">Ловушка дня • № ${chosen.task_number}</span>
        <span class="btn-ic" style="font-size:12px;font-weight:900;color:${state.dailyTrapWon ? "var(--green)" : "var(--red)"};">
          ${state.dailyTrapWon ? ICONS.check + " Взята" : ICONS.x + " Промах"}
        </span>
      </div>
      <div style="font-size:15px;font-weight:800;line-height:1.45;">${chosen.prompt}</div>
      <div class="vs-good"><b>Правильный ответ:</b> ${chosen.options[chosen.correct_index]}</div>
      <div style="font-size:13.5px;line-height:1.45;color:var(--muted);">${chosen.explanation}</div>
      <div style="text-align:center;background:var(--surface-soft);padding:10px;border-radius:12px;font-size:13px;font-weight:800;">
        Следующая через: <span id="reviewCountdown" style="color:var(--accent);">${getTimeUntilMidnight()}</span>
      </div>
      <button class="btn-primary" id="closeDailyRevBtn">Понял, закрыть</button>
    `;
    bindMascotImg($("dailyRevImg"), state.dailyTrapWon ? "happy" : "shock");
    $("dailyReviewOverlay").classList.remove("hidden");
    $("closeDailyRevBtn").addEventListener("click", () => $("dailyReviewOverlay").classList.add("hidden"));
    return;
  }
  tryLaunchPractice([chosen], "daily", "Ловушка дня! У тебя 15 секунд — не поведись.", "think");
});

$("backToSetupBtn").addEventListener("click", () => {
  stopDailyTimer();
  $("quizScreen").classList.add("hidden");
  $("setupScreen").classList.remove("hidden");
  setMascot("Настрой фильтры, режим или число карточек — и погнали.", "", "normal");
  renderSetup();
});

Promise.all([
  fetch("cards.json").then(r => { if (!r.ok) throw new Error("cards.json"); return r.json(); }),
  fetch("variants.json").then(r => { if (!r.ok) throw new Error("variants.json"); return r.json(); }),
  fetch("theory.json").then(r => { if (!r.ok) throw new Error("theory.json"); return r.json(); })
])
  .then(([cards, variants, theory]) => {
    allCards = cards;
    variantsData = variants;
    theoryData = theory;

    [...new Set(allCards.map(c => c.task_number))].forEach(n => taskCounts[n] = 1);
    [2,3,4,5,6,7,8,9,10,11,12].forEach(n => examCounts[n] = 0);

    renderSetup();
    renderExamSetup();

    if (!state.calibDone) openCalibration();
    else if (!state.toursDone.practice) startContextTour("practice");
  })
  .catch(err => {
    $("taskList").innerHTML = `
      <div style="background:var(--red-soft);color:var(--red-text);padding:14px;border-radius:14px;font-size:13px;line-height:1.45;">
        Не удалось загрузить <b>${err.message}</b>.<br>
        Проверь, что <b>cards.json</b>, <b>variants.json</b> и <b>theory.json</b> лежат рядом с <b>index.html</b>, а сервер запущен.
      </div>
    `;
  });