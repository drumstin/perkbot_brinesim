import { addEggBatch, addFoodBurst, currentSize } from "../sim/spawning.js";
import { restartGame } from "../state.js";
import { saveGame } from "./save.js";
import { addEvent } from "./log.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setPauseState(game, elements, paused) {
  game.paused = paused;
  elements.pause.textContent = game.paused ? "Resume" : "Pause";
  if (elements.quickPause) elements.quickPause.textContent = game.paused ? "▶️ Resume" : "⏸️ Pause";
}

function cycleSpeed(game, elements) {
  game.timeScale = game.timeScale === 1 ? 2 : game.timeScale === 2 ? 4 : 1;
  elements.speed.textContent = `Speed x${game.timeScale}`;
  if (elements.quickSpeed) elements.quickSpeed.textContent = game.timeScale === 1 ? "⏩ Speed x1" : game.timeScale === 2 ? "⏩ Speed x2" : "⏩ Speed x4";
}

function setQuickMenuOpen(elements, open) {
  if (!elements.tankActionMenu || !elements.quickMenuToggle) return;
  elements.tankActionMenu.hidden = !open;
  elements.quickMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function setHudOpen(elements, open) {
  if (!elements.hudPanel || !elements.hudToggle || !elements.hudContent) return;
  elements.hudPanel.classList.toggle("hud-collapsed", !open);
  elements.hudContent.hidden = !open;
  elements.hudToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function setEventLogOpen(elements, open) {
  if (!elements.eventLog || !elements.eventLogToggle) return;
  elements.eventLog.hidden = !open;
  elements.eventLogToggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function performWaterChange(game) {
  if (game.tank.waterChangeCooldown > 0) {
    addEvent(game, `Water change unavailable for ${Math.ceil(game.tank.waterChangeCooldown)}s.`);
    return;
  }

  game.tank.waste = clamp(game.tank.waste - 22, 0, 100);
  game.tank.oxygen = clamp(game.tank.oxygen + 10, 0, 100);
  game.tank.foodLevel = clamp(game.tank.foodLevel - 4, 0, 100);
  game.tank.clarity = clamp(game.tank.clarity + 0.12, 0.2, 1);
  game.tank.waterChangeCooldown = 18;
  addEvent(game, "Partial water change completed.");
  saveGame(game);
}

export function bindUi(game, elements) {
  elements.salinity.addEventListener("input", () => {
    game.tank.salinity = Number(elements.salinity.value);
    saveGame(game);
  });

  elements.temperature.addEventListener("input", () => {
    game.tank.temperature = Number(elements.temperature.value);
    saveGame(game);
  });

  elements.aeration.addEventListener("input", () => {
    game.tank.aeration = Number(elements.aeration.value);
    addEvent(game, `Aeration adjusted to ${game.tank.aeration}.`);
    saveGame(game);
  });

  const handleAddEggs = () => {
    addEggBatch(game, 16);
    addEvent(game, "Added a batch of eggs.");
    saveGame(game);
  };

  const handleFeedLight = () => {
    addFoodBurst(game, undefined, undefined, 5, 0.9);
    game.tank.foodLevel = Math.min(100, game.tank.foodLevel + 10);
    addEvent(game, "Light feeding added.");
    saveGame(game);
  };

  const handleFeedHeavy = () => {
    addFoodBurst(game, undefined, undefined, 10, 1.25);
    game.tank.foodLevel = Math.min(100, game.tank.foodLevel + 22);
    game.tank.waste = Math.min(100, game.tank.waste + 4);
    addEvent(game, "Heavy feeding added. Watch waste levels.");
    saveGame(game);
  };

  const handlePauseToggle = () => {
    setPauseState(game, elements, !game.paused);
  };

  const handleSpeedToggle = () => {
    cycleSpeed(game, elements);
  };

  const handleWaterChange = () => {
    performWaterChange(game);
  };

  elements.addEggs.addEventListener("click", handleAddEggs);
  elements.feedLight.addEventListener("click", handleFeedLight);
  elements.feedHeavy.addEventListener("click", handleFeedHeavy);
  elements.pause.addEventListener("click", handlePauseToggle);
  elements.speed.addEventListener("click", handleSpeedToggle);
  elements.waterChange.addEventListener("click", handleWaterChange);

  setHudOpen(elements, !window.matchMedia("(max-width: 640px)").matches);
  elements.hudToggle?.addEventListener("click", () => {
    const open = elements.hudContent ? elements.hudContent.hidden : false;
    setHudOpen(elements, open);
  });

  setQuickMenuOpen(elements, false);
  setEventLogOpen(elements, !window.matchMedia("(max-width: 640px)").matches);

  const bindPress = (node, handler) => {
    if (!node) return;
    node.addEventListener("pointerup", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    });
  };

  bindPress(elements.quickMenuToggle, () => {
    const isOpen = elements.tankActionMenu ? !elements.tankActionMenu.hidden : false;
    setQuickMenuOpen(elements, !isOpen);
  });

  bindPress(elements.eventLogToggle, () => {
    const isOpen = elements.eventLog ? !elements.eventLog.hidden : false;
    setEventLogOpen(elements, !isOpen);
  });

  bindPress(elements.quickAddEggs, () => {
    handleAddEggs();
    setQuickMenuOpen(elements, false);
  });
  bindPress(elements.quickFeedLight, () => {
    handleFeedLight();
    setQuickMenuOpen(elements, false);
  });
  bindPress(elements.quickFeedHeavy, () => {
    handleFeedHeavy();
    setQuickMenuOpen(elements, false);
  });
  bindPress(elements.quickPause, () => {
    handlePauseToggle();
    setQuickMenuOpen(elements, false);
  });
  bindPress(elements.quickSpeed, () => {
    handleSpeedToggle();
  });
  bindPress(elements.quickWaterChange, () => {
    handleWaterChange();
    setQuickMenuOpen(elements, false);
  });

  elements.restart.addEventListener("click", () => {
    restartGame(game);
    elements.pause.textContent = "Pause";
    elements.speed.textContent = "Speed x1";
  });

  elements.canvas.addEventListener("click", (e) => {
    const rect = elements.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * elements.canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * elements.canvas.height;
    addFoodBurst(game, x, y, 4, 1);
    game.tank.foodLevel = Math.min(100, game.tank.foodLevel + 6);
    addEvent(game, "Targeted feed dispersed in tank.");
    saveGame(game);
  });
}

export function updateHud(game, elements) {
  const stageCounts = { nauplius: 0, juvenile: 0, adult: 0, elder: 0 };
  for (const shrimp of game.shrimp) stageCounts[shrimp.stage] += 1;

  const avgEnergy = game.shrimp.length > 0
    ? game.shrimp.reduce((sum, s) => sum + s.energy, 0) / game.shrimp.length
    : 0;

  elements.summary.innerHTML = `
    <div class="summary-item">Colony status: <strong>${game.collapsed ? "Collapsed" : game.colonyStarted ? "Active" : "Waiting"}</strong></div>
    <div class="summary-item">Tank stability: <strong>${Math.round(game.tank.stability * 100)}%</strong></div>
    <div class="summary-item">Time: <strong>${game.elapsed.toFixed(1)}s</strong></div>
    <div class="summary-item">Water change: <strong>${game.tank.waterChangeCooldown > 0 ? `${Math.ceil(game.tank.waterChangeCooldown)}s cooldown` : "Ready"}</strong></div>
  `;

  const warnings = buildWarnings(game);
  elements.warnings.innerHTML = warnings.map((warning) => `<div class="warning-item ${warning.level}">${warning.text}</div>`).join("");

  if (elements.tankStatusBar) {
    elements.tankStatusBar.innerHTML = `
      <div class="status-chip">🦐 ${game.shrimp.length}</div>
      <div class="status-chip">🥚 ${game.eggs.length}</div>
      <div class="status-chip">O₂ ${Math.round(game.tank.oxygen)}%</div>
      <div class="status-chip">Waste ${Math.round(game.tank.waste)}%</div>
      <div class="status-chip">Food ${Math.round(game.tank.foodLevel)}%</div>
    `;
  }

  elements.stats.innerHTML = `
    <div class="stat-row">Eggs: <strong>${game.eggs.length}</strong></div>
    <div class="stat-row">Nauplii: <strong>${stageCounts.nauplius}</strong></div>
    <div class="stat-row">Juveniles: <strong>${stageCounts.juvenile}</strong></div>
    <div class="stat-row">Adults: <strong>${stageCounts.adult}</strong></div>
    <div class="stat-row">Elders: <strong>${stageCounts.elder}</strong></div>
    <div class="stat-row">Food availability: <strong>${Math.round(game.tank.foodLevel)}%</strong></div>
    <div class="stat-row">Oxygen: <strong>${Math.round(game.tank.oxygen)}%</strong></div>
    <div class="stat-row">Waste: <strong>${Math.round(game.tank.waste)}%</strong></div>
    <div class="stat-row">Avg energy: <strong>${avgEnergy.toFixed(1)}</strong></div>
  `;

  elements.milestones.innerHTML = [
    ["First hatch", game.milestones.firstHatch],
    ["10 adults", game.milestones.tenAdults],
    ["50 total shrimp hatched", game.milestones.fiftyTotal],
    ["Stable tank", game.milestones.stableTank],
    ["Breeder", game.milestones.breeder]
  ].map(([label, done]) => `<div class="milestone-item ${done ? "good" : "muted"}">${done ? "✓" : "○"} ${label}</div>`).join("");

  if (elements.quickPause) elements.quickPause.textContent = game.paused ? "▶️ Resume" : "⏸️ Pause";
  if (elements.quickSpeed) elements.quickSpeed.textContent = game.timeScale === 1 ? "⏩ Speed x1" : game.timeScale === 2 ? "⏩ Speed x2" : "⏩ Speed x4";
  if (elements.quickWaterChange) {
    elements.quickWaterChange.textContent = game.tank.waterChangeCooldown > 0 ? `💧 Cooldown ${Math.ceil(game.tank.waterChangeCooldown)}s` : "💧 Water Change";
    elements.quickWaterChange.disabled = game.tank.waterChangeCooldown > 0;
  }

  elements.registry.value = game.shrimp.length > 0
    ? game.shrimp.slice().sort((a, b) => a.id - b.id).map((s) => (
      `#${s.id} stage=${s.stage} age=${s.age.toFixed(1)} size=${currentSize(s).toFixed(2)} energy=${s.energy.toFixed(1)} stress=${s.stress.toFixed(1)} brood=${s.brood.toFixed(2)} life=${s.lifespan.toFixed(0)}`
    )).join("\n")
    : "No live shrimp";

  elements.eventLog.innerHTML = game.log.length > 0
    ? game.log.map((entry) => `<div class="event-item"><span class="muted">${entry.time.toFixed(1)}s</span> ${entry.text}</div>`).join("")
    : '<div class="event-item muted">No events yet.</div>';

  drawHistoryGraph(game, elements.historyGraph);
}

function drawHistoryGraph(game, canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(3, 14, 23, 0.8)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const points = game.statsHistory;
  if (points.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Trend graph fills as the colony runs.", 12, 22);
    return;
  }

  const maxPopulation = Math.max(10, ...points.map((p) => p.population));
  drawSeries(ctx, points, width, height, (p) => p.oxygen / 100, "#78d7ff");
  drawSeries(ctx, points, width, height, (p) => p.waste / 100, "#ff9a76");
  drawSeries(ctx, points, width, height, (p) => p.population / maxPopulation, "#8fe26f");

  ctx.fillStyle = "#78d7ff";
  ctx.fillText("O₂", 10, height - 12);
  ctx.fillStyle = "#ff9a76";
  ctx.fillText("Waste", 42, height - 12);
  ctx.fillStyle = "#8fe26f";
  ctx.fillText("Pop", 90, height - 12);
}

function drawSeries(ctx, points, width, height, getter, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = (index / (points.length - 1)) * (width - 16) + 8;
    const y = height - 12 - getter(point) * (height - 28);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function buildWarnings(game) {
  const warnings = [];
  if (!game.colonyStarted) warnings.push({ level: "ok", text: "Add eggs to begin." });
  if (game.tank.oxygen < 30) warnings.push({ level: "danger", text: "Oxygen critical. Raise aeration or reduce population pressure." });
  else if (game.tank.oxygen < 50) warnings.push({ level: "warn", text: "Oxygen low. Monitor aeration and feeding." });

  if (game.tank.waste > 70) warnings.push({ level: "danger", text: "Waste is dangerously high. Overfeeding may crash the tank." });
  else if (game.tank.waste > 45) warnings.push({ level: "warn", text: "Waste rising. Feed lightly until the tank clears." });

  if (game.tank.foodLevel < 15 && game.colonyStarted) warnings.push({ level: "warn", text: "Food is running low. Larvae may starve." });
  if (game.collapsed) warnings.push({ level: "danger", text: "Colony crashed. Restart or add eggs and recover." });

  return warnings.length > 0 ? warnings : [{ level: "ok", text: "Tank stable." }];
}
