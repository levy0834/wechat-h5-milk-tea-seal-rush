(() => {
  "use strict";

  const GAME_SECONDS = 30;
  const STORAGE_KEY = "milkTeaSealRushBest";

  const LID_TYPES = {
    ice: { label: "冰饮盖", color: "#2a9df4" },
    milkfoam: { label: "奶盖盖", color: "#ff6f9c" },
    hot: { label: "热饮盖", color: "#ffbd3f" }
  };

  const GOOD_TAUNTS = [
    "老板：稳！这手速够你带一条街。",
    "老板：封得漂亮，继续压榨极限！",
    "老板：连击别断，今天奖金看你了。",
    "老板：这节奏像开了挂。"
  ];

  const BAD_TAUNTS = [
    "老板：翻车了！重开节奏！",
    "老板：看杯型！不要乱扣盖！",
    "老板：漏封一杯，差评警告！",
    "老板：手别抖，爆单还在后面。"
  ];

  const IDLE_TAUNTS = [
    "老板：爆单了！盯紧杯型，别封错！",
    "老板：先认颜色，再卡封口区时机。",
    "老板：杯子越来越快，准备上强度。",
    "老板：今天冲榜目标 300 分！"
  ];

  const FEEDBACK_GOOD = ["精准封口", "丝滑出杯", "完美卡点", "手速起飞", "封口大师"]; 
  const FEEDBACK_BAD = ["翻车", "封错了", "漏封扣分", "时机失误", "手抖警告"];

  const els = {
    score: document.getElementById("score"),
    combo: document.getElementById("combo"),
    best: document.getElementById("best"),
    timer: document.getElementById("timer"),
    feedback: document.getElementById("feedback"),
    managerTaunt: document.getElementById("managerTaunt"),
    belt: document.getElementById("belt"),
    sealZone: document.getElementById("sealZone"),
    cupsLayer: document.getElementById("cupsLayer"),
    fxLayer: document.getElementById("fxLayer"),
    gameShell: document.getElementById("gameShell"),
    startOverlay: document.getElementById("startOverlay"),
    resultOverlay: document.getElementById("resultOverlay"),
    startBtn: document.getElementById("startBtn"),
    restartBtn: document.getElementById("restartBtn"),
    finalScore: document.getElementById("finalScore"),
    resultTitle: document.getElementById("resultTitle"),
    resultDetail: document.getElementById("resultDetail"),
    shareText: document.getElementById("shareText"),
    copyBtn: document.getElementById("copyBtn"),
    lidButtons: Array.from(document.querySelectorAll(".lid-btn"))
  };

  const state = {
    running: false,
    cups: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    best: loadBest(),
    timeLeft: GAME_SECONDS,
    elapsed: 0,
    spawnCooldown: 0,
    nextCupId: 1,
    rafId: 0,
    lastTs: 0,
    tauntCooldown: 0
  };

  init();

  function init() {
    els.best.textContent = String(state.best);
    els.startBtn.addEventListener("click", startGame);
    els.restartBtn.addEventListener("click", startGame);
    els.copyBtn.addEventListener("click", copyShareText);

    for (const button of els.lidButtons) {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        handleLidTap(button.dataset.lid);
      });
    }

    updateHud();
  }

  function startGame() {
    state.running = true;
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.timeLeft = GAME_SECONDS;
    state.elapsed = 0;
    state.spawnCooldown = 0.2;
    state.tauntCooldown = 0;
    state.lastTs = 0;

    clearCups();
    showOverlay(els.startOverlay, false);
    showOverlay(els.resultOverlay, false);
    setFeedback("开工！看准颜色，卡进封口区", "");
    setTaunt(IDLE_TAUNTS[0]);
    updateHud();

    cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(gameLoop);
  }

  function gameLoop(ts) {
    if (!state.running) {
      return;
    }

    if (!state.lastTs) {
      state.lastTs = ts;
    }

    const dt = Math.min((ts - state.lastTs) / 1000, 0.05);
    state.lastTs = ts;

    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.elapsed += dt;
    state.spawnCooldown -= dt;
    state.tauntCooldown -= dt;

    if (state.spawnCooldown <= 0) {
      spawnCup();
      const interval = Math.max(0.42, 1.18 - state.elapsed * 0.022);
      state.spawnCooldown = interval + Math.random() * 0.22;
    }

    updateCups(dt);

    if (state.tauntCooldown <= 0) {
      setTaunt(randomPick(IDLE_TAUNTS));
      state.tauntCooldown = 4 + Math.random() * 2.5;
    }

    updateHud();

    if (state.timeLeft <= 0) {
      finishGame();
      return;
    }

    state.rafId = requestAnimationFrame(gameLoop);
  }

  function spawnCup() {
    const cup = document.createElement("div");
    cup.className = "cup";
    cup.dataset.type = randomPick(Object.keys(LID_TYPES));

    const laneX = randomPick([34, 50, 66]);
    cup.style.left = `${laneX}%`;

    cup.innerHTML = "<div class=\"cup-lid\"></div><div class=\"cup-body\"><div class=\"cup-badge\"></div></div>";

    const beltRect = els.belt.getBoundingClientRect();
    const size = clamp(beltRect.width * 0.23, 74, 94);
    const y = beltRect.height + size;
    cup.style.width = `${size}px`;
    cup.style.top = `${y}px`;

    const speed = 115 + state.elapsed * 3.4 + Math.random() * 36;

    const cupModel = {
      id: state.nextCupId++,
      type: cup.dataset.type,
      el: cup,
      y,
      speed,
      size,
      sealed: false
    };

    state.cups.push(cupModel);
    els.cupsLayer.appendChild(cup);
  }

  function updateCups(dt) {
    const zone = getZoneY();
    const removedIds = [];

    for (const cup of state.cups) {
      cup.y -= cup.speed * dt;
      cup.el.style.top = `${cup.y}px`;

      if (cup.y + cup.size * 0.5 < 0) {
        removedIds.push(cup.id);
        if (!cup.sealed) {
          applyPenalty("漏封翻车", null, true);
        }
      } else if (!cup.sealed && isCupInsideZone(cup, zone)) {
        cup.el.classList.add("in-zone");
      } else {
        cup.el.classList.remove("in-zone");
      }
    }

    if (removedIds.length > 0) {
      state.cups = state.cups.filter((cup) => {
        if (removedIds.includes(cup.id)) {
          cup.el.remove();
          return false;
        }
        return true;
      });
    }
  }

  function handleLidTap(lidType) {
    if (!state.running) {
      return;
    }

    const zone = getZoneY();
    const candidates = state.cups.filter((cup) => !cup.sealed && isCupInsideZone(cup, zone));

    if (candidates.length === 0) {
      applyPenalty("空拍翻车", lidType, false);
      return;
    }

    const zoneCenter = (zone.top + zone.bottom) / 2;
    candidates.sort((a, b) => {
      const centerA = a.y + a.size * 0.35;
      const centerB = b.y + b.size * 0.35;
      return Math.abs(centerA - zoneCenter) - Math.abs(centerB - zoneCenter);
    });

    const targetCup = candidates[0];

    if (targetCup.type === lidType) {
      applySuccess(targetCup);
    } else {
      applyPenalty("封错杯型", lidType, false, targetCup);
    }
  }

  function applySuccess(cup) {
    cup.sealed = true;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    const gain = 10 + Math.min(18, state.combo * 2);
    state.score += gain;

    cup.el.classList.add("success");
    burstParticles(cup, LID_TYPES[cup.type].color);

    setFeedback(`${randomPick(FEEDBACK_GOOD)} +${gain}（x${state.combo}）`, "good");

    if (state.combo > 0 && state.combo % 6 === 0) {
      setTaunt(`老板：${state.combo} 连击！你是封口机器！`);
    } else if (Math.random() > 0.62) {
      setTaunt(randomPick(GOOD_TAUNTS));
    }

    setTimeout(() => removeCup(cup.id), 190);
  }

  function applyPenalty(message, lidType, byMiss, cup) {
    state.combo = 0;
    state.score = Math.max(0, state.score - (byMiss ? 8 : 6));

    setFeedback(`${randomPick(FEEDBACK_BAD)} · ${message}`, "bad");
    setTaunt(randomPick(BAD_TAUNTS));
    shakeGame();

    if (cup) {
      cup.sealed = true;
      cup.el.classList.add("fail");
      if (lidType && LID_TYPES[lidType]) {
        burstParticles(cup, LID_TYPES[lidType].color);
      }
      setTimeout(() => removeCup(cup.id), 260);
    }
  }

  function finishGame() {
    state.running = false;
    cancelAnimationFrame(state.rafId);

    clearCups();

    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }

    updateHud();

    const title = getResultTitle(state.score);
    const share = buildShareText(state.score, state.maxCombo, title);

    els.finalScore.textContent = String(state.score);
    els.resultTitle.textContent = title;
    els.resultDetail.textContent = `最高连击 ${state.maxCombo}，历史最佳 ${state.best} 分。`;
    els.shareText.value = share;

    showOverlay(els.resultOverlay, true);
    setFeedback("本轮结束，复制文案去群里吹一波", "");
    setTaunt(`老板：${title}，这单量你顶住了。`);
  }

  function getZoneY() {
    const beltRect = els.belt.getBoundingClientRect();
    const zoneRect = els.sealZone.getBoundingClientRect();
    return {
      top: zoneRect.top - beltRect.top,
      bottom: zoneRect.bottom - beltRect.top
    };
  }

  function isCupInsideZone(cup, zone) {
    const targetY = cup.y + cup.size * 0.35;
    return targetY >= zone.top && targetY <= zone.bottom;
  }

  function removeCup(id) {
    const idx = state.cups.findIndex((cup) => cup.id === id);
    if (idx === -1) {
      return;
    }

    state.cups[idx].el.remove();
    state.cups.splice(idx, 1);
  }

  function clearCups() {
    for (const cup of state.cups) {
      cup.el.remove();
    }
    state.cups = [];
    els.fxLayer.innerHTML = "";
  }

  function setFeedback(text, type) {
    els.feedback.textContent = text;
    els.feedback.classList.remove("good", "bad");
    if (type) {
      els.feedback.classList.add(type);
    }
  }

  function setTaunt(text) {
    els.managerTaunt.textContent = text;
  }

  function shakeGame() {
    els.gameShell.classList.remove("shake");
    void els.gameShell.offsetWidth;
    els.gameShell.classList.add("shake");
    setTimeout(() => els.gameShell.classList.remove("shake"), 250);
  }

  function burstParticles(cup, color) {
    const burstCount = 10;
    const x = parseFloat(cup.el.style.left);
    const y = cup.y + cup.size * 0.32;

    for (let i = 0; i < burstCount; i += 1) {
      const p = document.createElement("span");
      p.className = "pop";
      p.style.background = color;
      p.style.left = `calc(${x}% - 4px)`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 58}px`);
      p.style.setProperty("--dy", `${-20 - Math.random() * 46}px`);
      els.fxLayer.appendChild(p);
      setTimeout(() => p.remove(), 390);
    }
  }

  function updateHud() {
    els.score.textContent = String(state.score);
    els.combo.textContent = String(state.combo);
    els.best.textContent = String(state.best);
    els.timer.textContent = state.timeLeft.toFixed(1);
  }

  function buildShareText(score, maxCombo, title) {
    return `我在《奶茶封口王》打出 ${score} 分，最高连击 ${maxCombo}，称号【${title}】！看准杯型再卡封口时机，你敢来抢榜吗？`; 
  }

  async function copyShareText() {
    const text = els.shareText.value;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        els.shareText.focus();
        els.shareText.select();
        document.execCommand("copy");
      }
      setFeedback("吹牛文案已复制，快发群聊", "good");
    } catch (_err) {
      setFeedback("复制失败，长按文本手动复制", "bad");
    }
  }

  function showOverlay(node, visible) {
    node.classList.toggle("hidden", !visible);
  }

  function getResultTitle(score) {
    if (score >= 360) {
      return "封口天花板";
    }
    if (score >= 250) {
      return "爆单镇店王";
    }
    if (score >= 170) {
      return "高峰期老手";
    }
    if (score >= 100) {
      return "稳步出杯员";
    }
    return "出杯新手";
  }

  function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    } catch (_err) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch (_err) {
      // Ignore storage failures in private mode or restricted environments.
    }
  }
})();
