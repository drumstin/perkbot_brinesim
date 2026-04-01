import { createGame } from "./state.js";
import { updateGame } from "./sim/update.js";
import { renderGame } from "./render/tank.js";
import { updateHud, bindUi } from "./ui/hud.js";
import { clearSave } from "./ui/save.js";

const canvas = document.getElementById("tank");
const ctx = canvas.getContext("2d");

function resizeTankCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.round((width / 16) * 10);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

const elements = {
  canvas,
  ctx,
  overlay: document.getElementById("overlay"),
  tankStatusBar: document.getElementById("tank-status-bar"),
  observeToggle: document.getElementById("observe-toggle"),
  stats: document.getElementById("stats"),
  summary: document.getElementById("summary"),
  warnings: document.getElementById("warnings"),
  registry: document.getElementById("shrimp-registry"),
  milestones: document.getElementById("milestones"),
  shop: document.getElementById("shop"),
  historyGraph: document.getElementById("history-graph"),
  eventLog: document.getElementById("event-log"),
  salinity: document.getElementById("salinity"),
  temperature: document.getElementById("temperature"),
  aeration: document.getElementById("aeration"),
  addEggs: document.getElementById("add-eggs"),
  feedLight: document.getElementById("feed-light"),
  feedHeavy: document.getElementById("feed-heavy"),
  pause: document.getElementById("pause"),
  speed: document.getElementById("speed"),
  waterChange: document.getElementById("water-change"),
  restart: document.getElementById("restart"),
  hudPanel: document.getElementById("hud-panel"),
  hudToggle: document.getElementById("hud-toggle"),
  hudContent: document.getElementById("hud-content"),
  quickMenuToggle: document.getElementById("quick-menu-toggle"),
  tankActionMenu: document.getElementById("tank-action-menu"),
  eventLogToggle: document.getElementById("event-log-toggle"),
  quickAddEggs: document.getElementById("quick-add-eggs"),
  quickFeedLight: document.getElementById("quick-feed-light"),
  quickFeedHeavy: document.getElementById("quick-feed-heavy"),
  quickWaterChange: document.getElementById("quick-water-change"),
  quickOpenShop: document.getElementById("quick-open-shop"),
  quickSpeed: document.getElementById("quick-speed"),
  quickPause: document.getElementById("quick-pause")
};

clearSave();

async function requestFullscreenAtStartup() {
  const root = document.documentElement;
  try {
    if (!document.fullscreenElement && root.requestFullscreen) {
      await root.requestFullscreen();
    }
  } catch {
    // Mobile browsers often require a user gesture.
  }
}

function requestFullscreenOnFirstInteraction() {
  const root = document.documentElement;
  const tryFullscreen = async () => {
    try {
      if (!document.fullscreenElement && root.requestFullscreen) {
        await root.requestFullscreen();
      }
    } catch {
      // Ignore if blocked.
    }
    window.removeEventListener("pointerdown", tryFullscreen);
    window.removeEventListener("touchstart", tryFullscreen);
  };

  window.addEventListener("pointerdown", tryFullscreen, { once: true });
  window.addEventListener("touchstart", tryFullscreen, { once: true });
}

const game = createGame(elements);
bindUi(game, elements);
requestFullscreenAtStartup();
requestFullscreenOnFirstInteraction();
resizeTankCanvas();
window.addEventListener("resize", resizeTankCanvas);
window.addEventListener("orientationchange", resizeTankCanvas);

updateHud(game, elements);
renderGame(game, elements);

let last = performance.now();
function tick(now) {
  const rawDt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const dt = game.paused ? 0 : rawDt * game.timeScale;
  updateGame(game, dt);
  renderGame(game, elements);
  updateHud(game, elements);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
