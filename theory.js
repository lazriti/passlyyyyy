let theoryMode = "stories";
let activeStoryGroupIdx = 0;
let activeStorySlideIdx = 0;
let onlyFavStories = false;
const solvedMiniStories = new Set();

let activeDeckId = null;
let flashQueue = [];
let flashFlipped = false;

let activeXrayCat = "2";
let activeXrayIdx = 0;
let xraySelectedSpot = null;
const xrayOpenedSpots = new Set();

function getWeakTaskNumbers() {
  const set = new Set();
  state.mistakes.forEach(id => {
    const found = allCards.find(c => c.id === id);
    if (found) set.add(found.task_number);
  });
  return set;
}

function getAllFlashCardsFlat() {
  return (theoryData.flashDecks || []).flatMap(d => d.cards || []);
}

function switchTheorySub(mode) {
  theoryMode = mode;
  $("subStories").classList.toggle("active", mode === "stories");
  $("subFlash").classList.toggle("active", mode === "flash");
  $("subXray").classList.toggle("active", mode === "xray");
  $("storiesPane").classList.toggle("hidden", mode !== "stories");
  $("flashPane").classList.toggle("hidden", mode !== "flash");
  $("xrayPane").classList.toggle("hidden", mode !== "xray");

  if (mode === "stories") {
    setMascot("Внутри каждого номера по 3 слайда с разными подтипами и проверкой.", "", "think");
    renderStories();
  } else if (mode === "flash") {
    setMascot("Выбери тематическую колоду и прогоняй исключения до автоматизма.", "", "think");
    if (activeDeckId) renderFlashPlay();
    else renderFlashDecks();
  } else {
    setMascot("Выбирай тип задания сверху (6 категорий + микс) и кликай по выделенным словам.", "", "think");
    renderXray();
  }
}

function renderStories() {
  const groups = theoryData.stories || [];
  const weakNums = getWeakTaskNumbers();
  const weakStrip = $("weakTheoryStrip");

  if (weakNums.size > 0) {
    weakStrip.classList.remove("hidden");
    weakStrip.innerHTML = `<span class="lbl-row">${ICONS.alert}<span>Твои слабые места по практике: № ${[...weakNums].sort((a,b)=>a-b).join(", ")}. Подсвечены красным.</span></span>`;
  } else {
    weakStrip.classList.add("hidden");
  }

  const pills = $("storyPills");
  let pillsHtml = `<button class="story-pill fav-filter ${onlyFavStories ? "active" : ""}" id="favFilterBtn">${ICONS.starFill} Избранное (${state.favStories.length})</button>`;
  pillsHtml += groups.map((g, idx) => {
    const isWeak = g.taskNums.some(n => weakNums.has(n));
    return `<button class="story-pill ${!onlyFavStories && idx === activeStoryGroupIdx ? "active" : ""} ${isWeak ? "weak" : ""}" data-gidx="${idx}">${g.num}</button>`;
  }).join("");
  pills.innerHTML = pillsHtml;

  $("favFilterBtn").addEventListener("click", () => {
    onlyFavStories = !onlyFavStories;
    activeStorySlideIdx = 0;
    renderStories();
  });

  pills.querySelectorAll("[data-gidx]").forEach(btn => {
    btn.addEventListener("click", () => {
      onlyFavStories = false;
      activeStoryGroupIdx = Number(btn.dataset.gidx);
      activeStorySlideIdx = 0;
      renderStories();
    });
  });

  const box = $("storyCard");
  let slidesList = [];
  if (onlyFavStories) {
    groups.forEach(g => {
      (g.slides || []).forEach(sl => {
        if (state.favStories.includes(sl.id)) slidesList.push({ ...sl, _num: g.fullNum, _name: g.name });
      });
    });
  } else {
    const g = groups[activeStoryGroupIdx];
    if (g) slidesList = (g.slides || []).map(sl => ({ ...sl, _num: g.fullNum, _name: g.name }));
  }

  if (!slidesList.length) {
    box.innerHTML = `
      <div style="text-align:center;padding:20px 10px;display:flex;flex-direction:column;align-items:center;gap:10px;">
        <div style="color:var(--gold);transform:scale(1.8);margin:6px 0;">${ICONS.star}</div>
        <div style="font-size:16px;font-weight:900;">В избранном пока пусто</div>
        <div style="font-size:13px;color:var(--muted);line-height:1.45;">Сохраняй сложные слайды, чтобы быстро пробежаться по ним за 5 минут до пробника.</div>
        <button class="btn-primary" id="showAllStoriesBtn">Показать все шпоры</button>
      </div>
    `;
    $("showAllStoriesBtn").addEventListener("click", () => { onlyFavStories = false; activeStorySlideIdx = 0; renderStories(); });
    return;
  }

  if (activeStorySlideIdx >= slidesList.length) activeStorySlideIdx = 0;
  const sl = slidesList[activeStorySlideIdx];
  const isFav = state.favStories.includes(sl.id);

  const barsHtml = slidesList.map((_, i) =>
    `<div class="story-bar ${i < activeStorySlideIdx ? "done" : (i === activeStorySlideIdx ? "now" : "")}" data-slbar="${i}"></div>`
  ).join("");

  box.innerHTML = `
    <div class="story-bars">${barsHtml}</div>
    <div class="story-head-row">
      <div>
        <div style="font-size:11.5px;font-weight:900;color:var(--accent);text-transform:uppercase;">
          ${sl._num} • Слайд ${activeStorySlideIdx + 1} из ${slidesList.length}
        </div>
        <div style="font-size:17.5px;font-weight:900;margin-top:2px;">${sl._name}</div>
        <div class="story-sub-tag">${sl.sub}</div>
      </div>
      <button class="fav-btn ${isFav ? "starred" : ""}" id="toggleFavStoryBtn">
        ${isFav ? ICONS.starFill + " Сохранено" : ICONS.star + " Сохранить"}
      </button>
    </div>
    <div class="vs-bad"><div class="lbl-row">${ICONS.x}<div><b>На чём ловят:</b> ${sl.bad}</div></div></div>
    <div class="vs-good"><div class="lbl-row">${ICONS.check}<div><b>Как правильно:</b> ${sl.good}</div></div></div>
    <div class="cheat-hack"><div class="lbl-row">${ICONS.bulb}<div><b>Чит-код:</b> ${sl.hack}</div></div></div>
    <div class="mini-quiz-box">
      <div class="mini-quiz-title"><span class="btn-ic">${ICONS.bolt} Быстрая проверка (+3 XP)</span></div>
      <div class="mini-quiz-q">${sl.miniQ}</div>
      <div class="mini-quiz-btns">
        ${sl.miniOpts.map((o, i) => `<button class="mini-opt" data-mopt="${i}">${o}</button>`).join("")}
      </div>
      <div id="miniQuizRes" style="font-size:12px;font-weight:800;display:none;"></div>
    </div>
    <div class="story-nav">
      <button class="back-btn" id="prevStoryBtn">${ICONS.arrowL} Назад</button>
      <button class="btn-primary" id="nextStoryBtn" style="padding:10px;font-size:13.5px;">
        ${activeStorySlideIdx < slidesList.length - 1 ? "След. слайд " + ICONS.arrowR : (onlyFavStories ? ICONS.refresh + " В начало" : "След. номер " + ICONS.arrowR)}
      </button>
    </div>
  `;

  box.querySelectorAll("[data-slbar]").forEach(bar => {
    bar.addEventListener("click", () => { activeStorySlideIdx = Number(bar.dataset.slbar); renderStories(); });
  });

  $("toggleFavStoryBtn").addEventListener("click", () => {
    if (state.favStories.includes(sl.id)) state.favStories = state.favStories.filter(x => x !== sl.id);
    else state.favStories.push(sl.id);
    saveState();
    renderStories();
  });

  const mBtns = box.querySelectorAll(".mini-opt");
  mBtns.forEach(b => {
    b.addEventListener("click", () => {
      mBtns.forEach(x => x.disabled = true);
      const pick = Number(b.dataset.mopt);
      const resEl = $("miniQuizRes");
      resEl.style.display = "block";
      if (pick === sl.miniCorrect) {
        b.classList.add("ok");
        resEl.style.color = "var(--green)";
        if (!solvedMiniStories.has(sl.id)) {
          solvedMiniStories.add(sl.id);
          state.xp += 3;
          saveState();
          renderDashboard();
          resEl.innerHTML = `<span class="btn-ic">${ICONS.check} В точку! +3 XP</span>`;
        } else {
          resEl.innerHTML = `<span class="btn-ic">${ICONS.check} В точку! Правило закреплено</span>`;
        }
      } else {
        b.classList.add("bad");
        mBtns[sl.miniCorrect].classList.add("ok");
        resEl.style.color = "var(--red)";
        resEl.innerHTML = `<span class="btn-ic">${ICONS.x} Мимо — перечитай чит-код выше</span>`;
      }
    });
  });

  $("prevStoryBtn").addEventListener("click", () => {
    if (activeStorySlideIdx > 0) activeStorySlideIdx--;
    else if (!onlyFavStories && activeStoryGroupIdx > 0) {
      activeStoryGroupIdx--;
      activeStorySlideIdx = (groups[activeStoryGroupIdx].slides || []).length - 1;
    }
    renderStories();
  });

  $("nextStoryBtn").addEventListener("click", () => {
    if (activeStorySlideIdx < slidesList.length - 1) activeStorySlideIdx++;
    else if (!onlyFavStories) {
      activeStoryGroupIdx = (activeStoryGroupIdx + 1) % groups.length;
      activeStorySlideIdx = 0;
    } else activeStorySlideIdx = 0;
    renderStories();
  });
}

function renderFlashDecks() {
  activeDeckId = null;
  $("flashDeckPicker").classList.remove("hidden");
  $("flashDeckPlay").classList.add("hidden");

  const decks = theoryData.flashDecks || [];
  const repeatCards = getAllFlashCardsFlat().filter(c => state.repeatFlash.includes(c.id));

  let html = `<div class="deck-grid">`;
  if (repeatCards.length > 0) {
    html += `
      <button type="button" class="deck-card review-deck" data-deck="repeat">
        <div class="deck-head">
          <span class="deck-title"><span class="btn-ic">${ICONS.refresh} На повтор</span></span>
          <span class="deck-badge" style="background:var(--red);color:#fff;">${repeatCards.length} шт.</span>
        </div>
        <div class="deck-sub">Карточки, на которых ты нажал «Повторить»</div>
      </button>
    `;
  }

  decks.forEach(d => {
    const locked = !d.free && !state.isPro;
    const total = d.cards.length;
    const learned = d.cards.filter(c => state.learnedFlash.includes(c.id)).length;
    const pct = total ? Math.round((learned / total) * 100) : 0;

    html += `
      <button type="button" class="deck-card ${locked ? "locked" : ""}" data-deck="${d.id}">
        <div class="deck-head">
          <span class="deck-title">${d.title}</span>
          ${locked
            ? `<span class="deck-badge pro-lock">${ICONS.lock} PRO</span>`
            : `<span class="deck-badge ${pct === 100 ? "done" : ""}">${learned} / ${total}</span>`}
        </div>
        <div class="deck-sub">${d.sub}</div>
        <div class="mini-bar"><div class="mini-bar-fill ${pct === 100 ? "fill-green" : "fill-purple"}" style="width:${pct}%"></div></div>
      </button>
    `;
  });

  html += `</div>`;
  $("flashDeckPicker").innerHTML = html;

  $("flashDeckPicker").querySelectorAll("[data-deck]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deck;
      if (id === "repeat") {
        activeDeckId = "repeat";
        flashQueue = shuffle(repeatCards);
        $("activeDeckTitle").textContent = "На повтор";
        flashFlipped = false;
        renderFlashPlay();
        return;
      }
      const d = decks.find(x => x.id === id);
      if (!d) return;
      if (!d.free && !state.isPro) {
        openProModal(`Колода «${d.title}» открывается в Passly PRO — попробуй первую неделю всего за 50 Stars.`);
        return;
      }
      activeDeckId = d.id;
      flashQueue = shuffle(d.cards);
      $("activeDeckTitle").textContent = d.title;
      flashFlipped = false;
      renderFlashPlay();
    });
  });
}

function renderFlashPlay() {
  $("flashDeckPicker").classList.add("hidden");
  $("flashDeckPlay").classList.remove("hidden");
  const stage = $("flashStage");

  if (!flashQueue.length) {
    $("flashProgressText").textContent = "Готово";
    stage.innerHTML = `
      <div class="story-card" style="text-align:center;padding:24px 16px;align-items:center;">
        <div class="modal-avatar" style="width:76px;height:76px;"><img id="flashDoneImg" src="" alt="Пасли" /></div>
        <div style="font-size:19px;font-weight:900;">Колода пройдена!</div>
        <div style="font-size:13.5px;color:var(--muted);">Все карточки из этой подборки отработаны.</div>
        <button class="btn-primary" id="backDecksDoneBtn">Вернуться к колодам</button>
      </div>
    `;
    bindMascotImg($("flashDoneImg"), "happy");
    $("backDecksDoneBtn").addEventListener("click", renderFlashDecks);
    return;
  }

  const card = flashQueue[0];
  $("flashProgressText").textContent = `Осталось: ${flashQueue.length}`;

  stage.innerHTML = `
    <div class="flash-scene ${flashFlipped ? "flipped" : ""}" id="flashScene">
      <div class="flash-inner">
        <div class="flash-face">
          <span class="task-tag">${card.tag}</span>
          <div class="flash-word">${card.front}</div>
          <div class="flash-hint">${card.hint}</div>
          <div style="font-size:12px;font-weight:800;color:var(--purple);margin-top:6px;">Нажми, чтобы перевернуть</div>
        </div>
        <div class="flash-face flash-back">
          <span class="task-tag">${card.tag}</span>
          <div class="flash-answer">${card.back}</div>
          <div class="flash-memo">${card.memo}</div>
        </div>
      </div>
    </div>
    <div class="flash-actions">
      <button class="btn-flash-bad" id="flashAgainBtn">${ICONS.refresh} Повторить</button>
      <button class="btn-flash-ok" id="flashKnowBtn">${ICONS.check} Знаю</button>
    </div>
  `;

  $("flashScene").addEventListener("click", () => {
    flashFlipped = !flashFlipped;
    $("flashScene").classList.toggle("flipped", flashFlipped);
  });

  $("flashAgainBtn").addEventListener("click", () => {
    const cur = flashQueue.shift();
    if (!state.repeatFlash.includes(cur.id)) state.repeatFlash.push(cur.id);
    saveState();
    flashQueue.push(cur);
    flashFlipped = false;
    renderFlashPlay();
  });

  $("flashKnowBtn").addEventListener("click", () => {
    const cur = flashQueue.shift();
    state.repeatFlash = state.repeatFlash.filter(x => x !== cur.id);
    if (!state.learnedFlash.includes(cur.id)) {
      state.learnedFlash.push(cur.id);
      state.xp += 2;
      renderDashboard();
    }
    saveState();
    flashFlipped = false;
    renderFlashPlay();
  });
}

function renderXray() {
  const curMeta = XRAY_CATS.find(x => x.id === activeXrayCat);
if (curMeta && !curMeta.free && !state.isPro) {
  activeXrayCat = "2";
  activeXrayIdx = 0;
  xraySelectedSpot = null;
}
  const allXray = theoryData.xray || [];
  const catsEl = $("xrayCats");

  catsEl.innerHTML = XRAY_CATS.map(c => {
    const locked = !c.free && !state.isPro;
    const cnt = c.id === "mix" ? allXray.length : allXray.filter(x => String(x.cat) === c.id).length;
    const isAct = c.id === activeXrayCat;
    return `
      <button type="button" class="xray-cat-btn ${c.id === "mix" ? "mix" : ""} ${isAct ? "active" : ""}" data-xcat="${c.id}">
        <span class="btn-ic">${c.id === "mix" ? ICONS.shuffle : ""} ${c.label}</span>
        <span class="xray-cat-cnt">${locked ? ICONS.lock : cnt + " шт."}</span>
      </button>
    `;
  }).join("");

  catsEl.querySelectorAll("[data-xcat]").forEach(btn => {
    btn.addEventListener("click", () => {
      const catId = btn.dataset.xcat;
      const meta = XRAY_CATS.find(x => x.id === catId);
      if (meta && !meta.free && !state.isPro) {
        openProModal(`Раздел Рентгена «${meta.label}» доступен в Passly PRO — пробная неделя всего 50 Stars.`);
        return;
      }
      activeXrayCat = catId;
      activeXrayIdx = catId === "mix" ? Math.floor(Math.random() * allXray.length) : 0;
      xraySelectedSpot = null;
      renderXray();
    });
  });

  const list = activeXrayCat === "mix" ? allXray : allXray.filter(x => String(x.cat) === activeXrayCat);
  const box = $("xrayCard");
  if (!list.length) {
    box.innerHTML = `<div style="color:var(--muted);font-size:13px;">Разборов в этой категории пока нет.</div>`;
    return;
  }

  if (activeXrayIdx >= list.length) activeXrayIdx = 0;
  const xr = list[activeXrayIdx];
  const catLabel = XRAY_CATS.find(c => c.id === String(xr.cat))?.label || "Рентген";

  const sentHtml = xr.parts.map(p => {
    if (typeof p === "string") return p;
    const key = `${xr.cat}_${xr.title}_${p.id}`;
    const opened = xrayOpenedSpots.has(key);
    const cls = [
      "xray-spot",
      xraySelectedSpot && xraySelectedSpot.id === p.id ? "active" : "",
      opened ? (p.yes ? "opened-yes" : "opened-no") : ""
    ].join(" ");
    return `<button type="button" class="${cls}" data-spot="${p.id}">${p.label}</button>`;
  }).join("");

  const inspHtml = xraySelectedSpot
    ? `<div class="xray-inspector ${xraySelectedSpot.yes ? "yes" : "no"}">
         <div class="lbl-row">
           ${xraySelectedSpot.yes ? ICONS.check : ICONS.x}
           <div><b>${xraySelectedSpot.verdict}</b><br>${xraySelectedSpot.reason}</div>
         </div>
       </div>`
    : `<div class="xray-inspector"><div class="lbl-row">${ICONS.scan}<span>${xr.hint}</span></div></div>`;

  box.innerHTML = `
    <div class="xray-nav-row">
      <span class="task-tag">${catLabel}</span>
      <div class="xray-controls">
        <button class="xray-ctrl-btn" id="xrayPrevBtn" ${activeXrayIdx === 0 ? "disabled" : ""}>${ICONS.arrowL}</button>
        <span class="xray-counter">${activeXrayIdx + 1} / ${list.length}</span>
        <button class="xray-ctrl-btn" id="xrayNextBtn" ${activeXrayIdx >= list.length - 1 ? "disabled" : ""}>${ICONS.arrowR}</button>
        <button class="xray-ctrl-btn" id="xrayRandBtn" title="Случайный">${ICONS.shuffle}</button>
      </div>
    </div>
    <div style="font-size:15px;font-weight:900;">${xr.title}</div>
    <div class="xray-sentence">${sentHtml}</div>
    ${inspHtml}
  `;

  box.querySelectorAll("[data-spot]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.spot);
      const spot = xr.parts.find(p => typeof p !== "string" && p.id === id);
      if (spot) {
        xraySelectedSpot = spot;
        xrayOpenedSpots.add(`${xr.cat}_${xr.title}_${id}`);
        renderXray();
      }
    });
  });

  $("xrayPrevBtn").addEventListener("click", () => { if (activeXrayIdx > 0) { activeXrayIdx--; xraySelectedSpot = null; renderXray(); } });
  $("xrayNextBtn").addEventListener("click", () => { if (activeXrayIdx < list.length - 1) { activeXrayIdx++; xraySelectedSpot = null; renderXray(); } });
  $("xrayRandBtn").addEventListener("click", () => {
    if (list.length <= 1) return;
    let next = activeXrayIdx;
    while (next === activeXrayIdx) next = Math.floor(Math.random() * list.length);
    activeXrayIdx = next;
    xraySelectedSpot = null;
    renderXray();
  });
}

$("subStories").addEventListener("click", () => switchTheorySub("stories"));
$("subFlash").addEventListener("click", () => { activeDeckId = null; switchTheorySub("flash"); });
$("subXray").addEventListener("click", () => switchTheorySub("xray"));
$("backToDecksBtn").addEventListener("click", renderFlashDecks);