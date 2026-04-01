import { loadSave, saveGame } from "./ui/save.js";
import { addEvent } from "./ui/log.js";
import { addEggBatch, makeBubble } from "./sim/spawning.js";

export const W = 960;
export const H = 600;
export const SUBSTRATE_HEIGHT = 28;
export const AIRSTONE_X = W * 0.82;
export const AIRSTONE_Y = H - SUBSTRATE_HEIGHT - 8;
export const AIRLINE_ENTRY_X = W - 18;
export const AIRLINE_ENTRY_Y = 26;

export function createGame(elements) {
  const save = loadSave();
  const game = {
    elements,
    shrimp: [],
    corpses: [],
    eggs: [],
    food: [],
    bubbles: Array.from({ length: 55 }, () => makeBubble()),
    elapsed: 0,
    colonyStarted: false,
    collapsed: false,
    paused: false,
    timeScale: 1,
    nextShrimpId: 1,
    eventSeq: 1,
    log: [],
    statsHistory: [],
    observeMode: save?.observeMode ?? false,
    points: save?.points ?? 30,
    pointTimer: 0,
    lastPointAwardTime: save?.lastPointAwardTime ?? 0,
    upgrades: {
      filter: save?.upgrades?.filter ?? 0,
      skimmer: save?.upgrades?.skimmer ?? 0,
      bioMedia: save?.upgrades?.bioMedia ?? 0,
      autoFeeder: save?.upgrades?.autoFeeder ?? 0,
      nursery: save?.upgrades?.nursery ?? 0
    },
    tank: {
      salinity: save?.tank?.salinity ?? 55,
      temperature: save?.tank?.temperature ?? 52,
      aeration: save?.tank?.aeration ?? 58,
      oxygen: save?.tank?.oxygen ?? 82,
      waste: save?.tank?.waste ?? 10,
      foodLevel: save?.tank?.foodLevel ?? 12,
      clarity: save?.tank?.clarity ?? 0.9,
      stability: 1,
      waterChangeCooldown: 0
    },
    milestones: {
      firstHatch: false,
      tenAdults: false,
      fiftyTotal: false,
      stableTank: false,
      breeder: false,
      ...save?.milestones
    }
  };

  syncInputs(game);

  if (save?.started) {
    restoreFromSave(game, save);
    addEvent(game, "Loaded saved colony.");
  } else {
    addEvent(game, "Tank initialized. Add eggs to begin.");
    saveGame(game);
  }

  return game;
}

export function syncInputs(game) {
  const { salinity, temperature, aeration } = game.elements;
  salinity.value = String(game.tank.salinity);
  temperature.value = String(game.tank.temperature);
  aeration.value = String(game.tank.aeration);
}

export function restartGame(game) {
  game.shrimp = [];
  game.corpses = [];
  game.eggs = [];
  game.food = [];
  game.bubbles = Array.from({ length: 55 }, () => makeBubble());
  game.elapsed = 0;
  game.colonyStarted = false;
  game.collapsed = false;
  game.paused = false;
  game.timeScale = 1;
  game.nextShrimpId = 1;
  game.eventSeq = 1;
  game.log = [];
  game.statsHistory = [];
  game.observeMode = false;
  game.points = 30;
  game.pointTimer = 0;
  game.lastPointAwardTime = 0;
  game.upgrades = {
    filter: 0,
    skimmer: 0,
    bioMedia: 0,
    autoFeeder: 0,
    nursery: 0
  };
  game.historyTimer = 0;
  game.milestones = {
    firstHatch: false,
    tenAdults: false,
    fiftyTotal: false,
    stableTank: false,
    breeder: false
  };
  game.tank.oxygen = 82;
  game.tank.waste = 10;
  game.tank.foodLevel = 12;
  game.tank.clarity = 0.9;
  game.tank.stability = 1;
  game.tank.waterChangeCooldown = 0;
  addEvent(game, "Tank reset.");
  saveGame(game);
}

function restoreFromSave(game, save) {
  game.elapsed = save.elapsed ?? 0;
  game.colonyStarted = Boolean(save.started);
  game.nextShrimpId = save.nextShrimpId ?? 1;
  game.shrimp = save.shrimp ?? [];
  game.eggs = save.eggs ?? [];
  game.food = save.food ?? [];
  game.corpses = save.corpses ?? [];
  game.log = save.log ?? [];
  game.statsHistory = save.statsHistory ?? [];
  if (game.bubbles.length < 30) {
    game.bubbles = Array.from({ length: 55 }, () => makeBubble());
  }
  if (!game.colonyStarted && game.shrimp.length === 0 && game.eggs.length === 0) {
    addEggBatch(game, 16);
    game.colonyStarted = false;
    game.eggs = [];
  }
}
