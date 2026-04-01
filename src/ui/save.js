const KEY = "brinesim-v2-save";

export function saveGame(game) {
  const payload = {
    started: game.colonyStarted,
    elapsed: game.elapsed,
    nextShrimpId: game.nextShrimpId,
    observeMode: game.observeMode,
    points: game.points,
    lastPointAwardTime: game.lastPointAwardTime,
    upgrades: game.upgrades,
    tank: game.tank,
    milestones: game.milestones,
    shrimp: game.shrimp,
    eggs: game.eggs,
    food: game.food,
    corpses: game.corpses,
    log: game.log,
    statsHistory: game.statsHistory.slice(-120)
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
