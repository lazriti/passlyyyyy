let examCounts = {};
let currentExamTasks = [];
let currentExamIsFull = true;
let examChecked = false;
let examSec = 0;
let examTimerInt = null;
let examAnswers = {};
let abvCursors = {};

function getExamPoolForNum(num) {
  if (!variantsData) return [];
  if (num === 2) return variantsData.blocks_a.map(b => ({ num: 2, textTitle: "Текст к заданиям № 2–3", text: b.text, ...b.task2 }));
  if (num === 3) return variantsData.blocks_a.map(b => ({ num: 3, textTitle: "Текст к заданиям № 2–3", text: b.text, ...b.task3 }));
  if (num === 10) return variantsData.blocks_b.map(b => ({ num: 10, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task10 }));
  if (num === 11) return variantsData.blocks_b.map(b => ({ num: 11, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task11 }));
  if (num === 12) return variantsData.blocks_b.map(b => ({ num: 12, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task12 }));
  return (variantsData.standalone[String(num)] || []).map(item => ({ num, text: null, ...item }));
}

function detectMaxDigit(prompt) {
  let maxD = 5;
  [...(prompt || "").matchAll(/\((\d)\)|(?:^|\n)\s*(\d)\)/g)].forEach(m => {
    const d = Number(m[1] || m[2]);
    if (d > maxD && d <= 9) maxD = d;
  });
  return maxD;
}

function renderExamSetup() {
  const leftExams = Math.max(0, FREE_WEEKLY_EXAMS - state.weeklyExamsDone);
  $("examLimitNote").textContent = state.isPro
    ? "Passly PRO активен: безлимитные полные варианты ФИПИ и конструктор мини-вариантов."
    : `На тарифе Free доступен ${leftExams} из ${FREE_WEEKLY_EXAMS} полных вариантов на этой неделе. Верные ответы идут в стрик.`;

  $("examCustomTitle").innerHTML = state.isPro
    ? `Конструктор мини-варианта (- / +)`
    : `Конструктор мини-варианта <span class="deck-badge pro-lock">${ICONS.lock} PRO</span>`;

  const list = $("examTaskList");
  if (!variantsData) {
    list.innerHTML = `<div style="color:var(--muted);font-size:13px;">Загружаю банк ФИПИ...</div>`;
    return;
  }

  const nums = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  let total = 0;

  list.innerHTML = nums.map(n => {
    const maxC = getExamPoolForNum(n).length;
    const curC = examCounts[n] || 0;
    total += curC;
    return `
      <div class="task-row ${curC > 0 ? "active" : ""}">
        <div class="task-left" data-etoggle="${n}">
          <div class="checkbox">${curC > 0 ? ICONS.check : ""}</div>
          <div class="task-info">
            <div class="task-num-line">
              <span class="task-num">Задание № ${n}</span>
              <span class="mastery-tag">в базе: ${maxC}</span>
            </div>
            <div class="task-desc">${TASK_NAMES[n]}</div>
          </div>
        </div>
        <div class="stepper">
          <button class="step-btn" data-edec="${n}" ${curC <= 0 ? "disabled" : ""}>−</button>
          <span class="step-val">${curC}</span>
          <button class="step-btn" data-einc="${n}" ${curC >= maxC ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-etoggle]").forEach(el => {
    el.addEventListener("click", () => {
      const n = Number(el.dataset.etoggle);
      examCounts[n] = (examCounts[n] || 0) > 0 ? 0 : Math.min(1, getExamPoolForNum(n).length);
      renderExamSetup();
    });
  });
  list.querySelectorAll("[data-einc]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.einc);
      examCounts[n] = Math.min(getExamPoolForNum(n).length, (examCounts[n] || 0) + 1);
      renderExamSetup();
    });
  });
  list.querySelectorAll("[data-edec]").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.dataset.edec);
      examCounts[n] = Math.max(0, (examCounts[n] || 0) - 1);
      renderExamSetup();
    });
  });

  $("startCustomExamBtn").disabled = total === 0;
  $("startCustomExamBtn").innerHTML = !state.isPro && total > 0
    ? `${ICONS.lock} Решать выбранные (${total} зад.) • PRO`
    : (total > 0 ? `Решать выбранные (${total} зад.)` : "Выбери задания плюсиками");
  $("toggleExamAllBtn").textContent = total > 0 ? "Сбросить все" : "Выбрать по 1";
}

function buildFullExam() {
  const a = variantsData.blocks_a[Math.floor(Math.random() * variantsData.blocks_a.length)];
  const b = variantsData.blocks_b[Math.floor(Math.random() * variantsData.blocks_b.length)];
  const tasks = [
    { num: 2, textTitle: "Текст к заданиям № 2–3", text: a.text, ...a.task2 },
    { num: 3, textTitle: "Текст к заданиям № 2–3", text: a.text, ...a.task3 }
  ];
  [4, 5, 6, 7, 8, 9].forEach(n => {
    const pool = getExamPoolForNum(n);
    tasks.push(pool[Math.floor(Math.random() * pool.length)]);
  });
  tasks.push(
    { num: 10, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task10 },
    { num: 11, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task11 },
    { num: 12, textTitle: "Текст к заданиям № 10–12", text: b.text, ...b.task12 }
  );
  return tasks;
}

function buildCustomExam() {
  const tasks = [];
  [2,3,4,5,6,7,8,9,10,11,12].forEach(n => {
    const cnt = examCounts[n] || 0;
    if (cnt > 0) tasks.push(...shuffle(getExamPoolForNum(n)).slice(0, cnt));
  });
  return tasks;
}

function stopExamTimer() {
  if (examTimerInt) { clearInterval(examTimerInt); examTimerInt = null; }
}

function updateAbvUI(idx) {
  const vals = examAnswers[idx];
  const cur = abvCursors[idx];
  for (let c = 0; c < 3; c++) {
    const cell = $(`abvCell_${idx}_${c}`);
    if (!cell) continue;
    cell.textContent = vals[c] || "—";
    cell.classList.toggle("cursor", !examChecked && cur === c);
  }
}

function startExamSession(tasks, isFull) {
  if (isFull && !state.isPro && state.weeklyExamsDone >= FREE_WEEKLY_EXAMS) {
    openProModal("Ты уже прошёл бесплатный полный вариант на этой неделе. Попробуй PRO-неделю за 50 Stars!");
    return;
  }
  if (!isFull && !state.isPro) {
    openProModal("Конструктор мини-вариантов открывается в Passly PRO — первая неделя всего 50 Stars.");
    return;
  }

  stopExamTimer();
  currentExamTasks = tasks;
  currentExamIsFull = isFull;
  examChecked = false;
  examSec = 0;
  examAnswers = {};
  abvCursors = {};

  $("examSetup").classList.add("hidden");
  $("examSolve").classList.remove("hidden");
  $("examSummary").classList.add("hidden");
  $("checkExamBtn").classList.remove("hidden");
  $("newExamBtn").classList.add("hidden");
  $("examModeLabel").textContent = isFull ? "Полный вариант ФИПИ" : `Мини-вариант (${tasks.length} зад.)`;
  $("examTimer").textContent = "00:00";

  examTimerInt = setInterval(() => {
    examSec++;
    const m = String(Math.floor(examSec / 60)).padStart(2, "0");
    const s = String(examSec % 60).padStart(2, "0");
    $("examTimer").textContent = `${m}:${s}`;
  }, 1000);

  let html = "";
  let prevText = null;

  tasks.forEach((t, idx) => {
    if (t.text && t.text !== prevText) {
      html += `<div class="exam-text-box"><b class="btn-ic">${ICONS.file} ${t.textTitle || "Текст к заданию"}</b><div style="margin-top:8px;">${t.text}</div></div>`;
      prevText = t.text;
    }

    let inputHtml = "";
    if (t.num === 4 || t.type === "exact") {
      examAnswers[idx] = ["", "", ""];
      abvCursors[idx] = 0;
      inputHtml = `
        <div class="abv-wrap">
          <div class="abv-table">
            ${["А", "Б", "В"].map((lettr, c) => `
              <div class="abv-col">
                <div class="abv-head">${lettr}</div>
                <button type="button" class="abv-cell ${c === 0 ? "cursor" : ""}" id="abvCell_${idx}_${c}" data-abvcell="${idx}_${c}">—</button>
              </div>
            `).join("")}
          </div>
          <div class="abv-keypad">
            ${[1,2,3,4,5].map(d => `<button type="button" class="abv-key" data-abvkey="${idx}_${d}">${d}</button>`).join("")}
            <button type="button" class="abv-key del" data-abvdel="${idx}">${ICONS.back}</button>
          </div>
        </div>
      `;
    } else if (t.type === "digits_unordered") {
      examAnswers[idx] = new Set();
      const maxD = detectMaxDigit(t.prompt);
      const tiles = [];
      for (let d = 1; d <= maxD; d++) tiles.push(`<button type="button" class="digit-tile" data-dtile="${idx}_${d}">${d}</button>`);
      inputHtml = `
        <div class="digit-picker-wrap">
          <div class="digit-tiles">${tiles.join("")}</div>
          <div class="digit-preview">В бланке: <b id="dPrev_${idx}">не выбрано</b></div>
        </div>
      `;
    } else {
      examAnswers[idx] = "";
      inputHtml = `<input class="blank-input" id="exInp_${idx}" placeholder="Впиши слово как в бланке № 1..." autocomplete="off" />`;
    }

    html += `
      <div class="exam-task-card" id="exCard_${idx}">
        <div class="card-meta">
          <span class="task-tag">Задание № ${t.num} • ${TASK_NAMES[t.num]}</span>
          <span style="font-size:11px;font-weight:700;color:var(--muted);">1 балл</span>
        </div>
        <div class="exam-q-body">${t.prompt}</div>
        ${inputHtml}
        <div class="exam-feedback hidden" id="exFb_${idx}"></div>
      </div>
    `;
  });

  const container = $("examQuestionsContainer");
  container.innerHTML = html;

  container.querySelectorAll("[data-abvcell]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (examChecked) return;
      const [idx, c] = btn.dataset.abvcell.split("_").map(Number);
      abvCursors[idx] = c;
      updateAbvUI(idx);
    });
  });
  container.querySelectorAll("[data-abvkey]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (examChecked) return;
      const [idx, d] = btn.dataset.abvkey.split("_").map(Number);
      const cur = abvCursors[idx];
      examAnswers[idx][cur] = String(d);
      if (cur < 2) abvCursors[idx] = cur + 1;
      updateAbvUI(idx);
    });
  });
  container.querySelectorAll("[data-abvdel]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (examChecked) return;
      const idx = Number(btn.dataset.abvdel);
      let cur = abvCursors[idx];
      if (!examAnswers[idx][cur] && cur > 0) cur--;
      examAnswers[idx][cur] = "";
      abvCursors[idx] = cur;
      updateAbvUI(idx);
    });
  });
  container.querySelectorAll("[data-dtile]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (examChecked) return;
      const [idx, d] = btn.dataset.dtile.split("_").map(Number);
      const set = examAnswers[idx];
      if (set.has(d)) { set.delete(d); btn.classList.remove("selected"); }
      else { set.add(d); btn.classList.add("selected"); }
      $(`dPrev_${idx}`).textContent = [...set].sort((a,b) => a - b).join("") || "не выбрано";
    });
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeAnswer(val, type) {
  const clean = (val || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9]/g, "");
  if (type === "digits_unordered") return clean.split("").sort().join("");
  return clean;
}

$("toggleExamAllBtn").addEventListener("click", () => {
  const total = Object.values(examCounts).reduce((a, b) => a + b, 0);
  [2,3,4,5,6,7,8,9,10,11,12].forEach(n => examCounts[n] = total > 0 ? 0 : 1);
  renderExamSetup();
});

$("startFullExamBtn").addEventListener("click", () => { if (variantsData) startExamSession(buildFullExam(), true); });
$("startCustomExamBtn").addEventListener("click", () => { if (variantsData) startExamSession(buildCustomExam(), false); });
$("backToExamSetupBtn").addEventListener("click", () => { stopExamTimer(); $("examSolve").classList.add("hidden"); $("examSetup").classList.remove("hidden"); renderExamSetup(); });
$("newExamBtn").addEventListener("click", () => { if (variantsData) startExamSession(currentExamIsFull ? buildFullExam() : buildCustomExam(), currentExamIsFull); });

$("checkExamBtn").addEventListener("click", () => {
  if (examChecked) return;
  examChecked = true;
  stopExamTimer();

  if (currentExamIsFull) state.weeklyExamsDone += 1;

  let okCount = 0;
  currentExamTasks.forEach((t, idx) => {
    let rawVal = "";
    if (t.num === 4 || t.type === "exact") {
      rawVal = examAnswers[idx].join("");
      updateAbvUI(idx);
    } else if (t.type === "digits_unordered") {
      rawVal = [...examAnswers[idx]].sort((a,b)=>a-b).join("");
    } else {
      const inp = $(`exInp_${idx}`);
      inp.disabled = true;
      rawVal = inp.value;
    }

    const card = $(`exCard_${idx}`);
    const fb = $(`exFb_${idx}`);
    const isOk = normalizeAnswer(rawVal, t.type).length > 0 && normalizeAnswer(rawVal, t.type) === normalizeAnswer(t.answer, t.type);
    recordTaskStat(t.num, isOk);

    card.classList.add(isOk ? "res-ok" : "res-bad");
    fb.classList.remove("hidden");
    if (isOk) {
      okCount++;
      fb.innerHTML = `<div class="lbl-row">${ICONS.check}<div><b>Верно (+5 XP).</b> ${t.explain}</div></div>`;
    } else {
      fb.innerHTML = `<div class="lbl-row">${ICONS.x}<div><b>Неверно.</b> Ответ: <b>${t.answer.toUpperCase()}</b><br>${t.explain}</div></div>`;
    }
  });

  const gained = okCount * 5;
  state.xp += gained;

  const sum = $("examSummary");
  sum.classList.remove("hidden");
  sum.innerHTML = `
    <div style="font-size:13px;font-weight:800;color:var(--muted);">Результат по бланку ФИПИ</div>
    <div style="font-size:36px;font-weight:900;color:var(--purple);margin:4px 0;">${okCount} / ${currentExamTasks.length}</div>
    <div style="font-size:13px;font-weight:700;">+${gained} XP • В цель дня засчитано: +${okCount}</div>
  `;

  $("checkExamBtn").classList.add("hidden");
  $("newExamBtn").classList.remove("hidden");

  if (okCount > 0) addDailyProgress(okCount);
  else { saveState(); renderDashboard(); }

  if (okCount === currentExamTasks.length) {
    setMascot("Вариант разнесён на 100%! Пасли гордится тобой.", "ok", "happy");
    launchConfetti();
  } else {
    setMascot(`Проверили бланк: ${okCount} из ${currentExamTasks.length}. Разбирай красные карточки.`, "gold", "think");
  }
  sum.scrollIntoView({ behavior: "smooth", block: "center" });
});