import { H, W } from "../state.js";
import { addEvent } from "../ui/log.js";
import { saveGame } from "../ui/save.js";
import { COSTS } from "../ui/hud.js";
import { addEggBatch, currentSize, makeBubble, makeCorpse, makeShrimp, rand, stageForAge } from "./spawning.js";

function clamp01(value) {
  return clamp(value, 0, 1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function environment(game) {
  const sPenalty = Math.abs(game.tank.salinity - 55) / 55;
  const tPenalty = Math.abs(game.tank.temperature - 52) / 52;
  const stability = clamp(1 - (sPenalty * 0.45 + tPenalty * 0.5 + game.tank.waste / 180 + (100 - game.tank.oxygen) / 210), 0, 1);
  game.tank.stability = stability;
  game.tank.clarity = clamp(1 - game.tank.waste / 120, 0.2, 1);
  return { stability };
}

function updateTank(game, dt) {
  const populationPressure = game.shrimp.length * 0.14 + game.eggs.length * 0.015;
  const aerationPower = game.tank.aeration / 100;
  const heatStress = Math.max(0, game.tank.temperature - 60) * 0.04;
  const filterBonus = (game.upgrades.filter ?? 0) * 0.5;
  const skimmerBonus = (game.upgrades.skimmer ?? 0) * 0.45;
  const bioBonus = (game.upgrades.bioMedia ?? 0) * 0.4;

  const autoFeederBonus = (game.upgrades.autoFeeder ?? 0) * 0.16;
  game.tank.foodLevel = clamp(game.tank.foodLevel - dt * (0.55 + game.shrimp.length * 0.022) + dt * autoFeederBonus, 0, 100);
  game.tank.waste = clamp(
    game.tank.waste + dt * (populationPressure * 0.085 + game.food.length * 0.02 + game.corpses.length * 0.24)
      - dt * (0.65 + aerationPower * 1.65 + filterBonus + bioBonus),
    0,
    100
  );
  game.tank.oxygen = clamp(
    game.tank.oxygen + dt * (1.1 + aerationPower * 4.4 + skimmerBonus)
      - dt * (populationPressure * 0.13 + game.tank.waste * 0.022 + heatStress),
    0,
    100
  );
}

function updateEggs(game, dt) {
  for (let i = game.eggs.length - 1; i >= 0; i -= 1) {
    const egg = game.eggs[i];
    egg.y += egg.sink * dt;
    if (egg.y > H - 35) egg.y = H - 35;

    const hatchRate = 0.45 + game.tank.stability * 0.7 + game.tank.oxygen / 240;
    egg.hatchTimer -= dt * hatchRate;
    egg.wobble += dt * 3.4;
    egg.flash = clamp01((7 - egg.hatchTimer) / 7);

    if (egg.hatchTimer <= 0) {
      const nurseryBonus = (game.upgrades.nursery ?? 0) * 0.06;
      const hatchChance = game.tank.stability * 0.7 + game.tank.oxygen / 200 - game.tank.waste / 180 + nurseryBonus;
      if (Math.random() < hatchChance) {
        game.shrimp.push(makeShrimp(game, egg.x + rand(-3, 3), egg.y + rand(-3, 3)));
        game.points += 2;
        addEvent(game, `Egg hatched near (${Math.round(egg.x)}, ${Math.round(egg.y)}). +2 points`);
        if (!game.milestones.firstHatch) {
          game.milestones.firstHatch = true;
          game.points += 5;
          addEvent(game, "First nauplii hatched. +5 milestone points");
        }
      } else {
        game.tank.waste = clamp(game.tank.waste + 0.8, 0, 100);
      }
      game.eggs.splice(i, 1);
    }
  }
}

function updateFood(game, dt) {
  for (let i = game.food.length - 1; i >= 0; i -= 1) {
    const f = game.food[i];
    f.y += 5 * dt;
    f.x += f.drift;
    f.amount -= dt * 1.1;
    if (f.amount <= 0 || f.y > H - 10) game.food.splice(i, 1);
  }
}

function maybeReproduce(game, shrimp, adults, dt) {
  if (shrimp.stage !== "adult") return;

  if (shrimp.matingTimer > 0) {
    shrimp.matingTimer -= dt;
    const mate = shrimp.mateId ? game.shrimp.find((s) => s.id === shrimp.mateId) : null;
    if (mate) {
      const cx = (shrimp.x + mate.x) * 0.5;
      const cy = (shrimp.y + mate.y) * 0.5;
      const phase = shrimp.id < mate.id ? 0 : Math.PI;
      const angle = game.elapsed * 10 + (shrimp.id + mate.id) * 0.17 + phase;
      const radius = 6 + Math.sin(game.elapsed * 6 + shrimp.id) * 1.4;
      shrimp.x = clamp(cx + Math.cos(angle) * radius, 14, W - 14);
      shrimp.y = clamp(cy + Math.sin(angle) * radius * 0.75, 24, H - 20);
      shrimp.vx = Math.cos(angle + Math.PI / 2) * 0.7;
      shrimp.vy = Math.sin(angle + Math.PI / 2) * 0.5;
      shrimp.swirlHeading = Math.atan2(shrimp.vy, shrimp.vx);
    }
    if (shrimp.matingTimer <= 0) {
      const clutch = Math.random() < 0.7 ? 1 : 2;
      const bodySize = currentSize(shrimp);
      addEggBatch(game, clutch, shrimp.x - bodySize * 1.2, shrimp.y + rand(-2, 2), bodySize * 1.4);
      shrimp.brood = 0.15;
      shrimp.energy *= 0.72;
      shrimp.broodCooldown = rand(16, 28);
      shrimp.mateId = null;
      addEvent(game, `Adult #${shrimp.id} finished mating and released ${clutch} egg${clutch === 1 ? "" : "s"}.`);
    }
    return;
  }

  shrimp.broodCooldown -= dt;
  if (shrimp.broodCooldown > 0) return;

  const densityPenalty = adults > 36 ? (adults - 36) * 0.015 : 0;
  const broodGain = clamp((shrimp.energy - 55) / 70 + game.tank.stability * 0.7 - densityPenalty, 0, 0.08) * shrimp.fertility;
  shrimp.brood = clamp(shrimp.brood + broodGain, 0, 1.25);

  if (shrimp.brood > 1 && game.tank.oxygen > 45 && game.tank.waste < 55 && Math.random() < 0.08) {
    const mate = game.shrimp.find((other) => (
      other !== shrimp
      && other.stage === "adult"
      && other.matingTimer <= 0
      && other.broodCooldown <= 0
      && Math.hypot(other.x - shrimp.x, other.y - shrimp.y) < 80
    ));

    if (mate) {
      const matingDuration = rand(1.2, 2.1);
      shrimp.matingTimer = matingDuration;
      mate.matingTimer = matingDuration;
      shrimp.mateId = mate.id;
      mate.mateId = shrimp.id;
      addEvent(game, `Adults #${shrimp.id} and #${mate.id} paired and began mating.`);
    }
  }
}

function updateShrimp(game, dt) {
  const adults = game.shrimp.filter((s) => s.stage === "adult").length;

  for (let i = game.shrimp.length - 1; i >= 0; i -= 1) {
    const shrimp = game.shrimp[i];
    shrimp.age += dt;
    shrimp.stage = stageForAge(shrimp.age);
    const bodySize = currentSize(shrimp);

    let tx = shrimp.x + shrimp.vx * 40;
    let ty = shrimp.y + shrimp.vy * 40;
    let nearestDist = Infinity;
    let targetFood = null;

    for (const food of game.food) {
      const dx = food.x - shrimp.x;
      const dy = food.y - shrimp.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist) {
        nearestDist = d2;
        targetFood = food;
      }
    }

    if (targetFood && nearestDist < 36000) {
      tx = targetFood.x;
      ty = targetFood.y;
    } else {
      const hoverTargetX = W * 0.52 + Math.sin((game.elapsed * 0.22) + shrimp.id * 0.7) * W * 0.14;
      const hoverTargetY = shrimp.hoverDepth + Math.sin((game.elapsed * 0.55) + shrimp.id * 0.31) * 16;
      tx = tx * (1 - shrimp.schoolingBias * 0.08) + hoverTargetX * (shrimp.schoolingBias * 0.08);
      ty = ty * (1 - shrimp.schoolingBias * 0.16) + hoverTargetY * (shrimp.schoolingBias * 0.16);

      let centerX = 0;
      let centerY = 0;
      let neighbors = 0;
      for (const other of game.shrimp) {
        if (other === shrimp || other.stage !== shrimp.stage) continue;
        const dx = other.x - shrimp.x;
        const dy = other.y - shrimp.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0 && d2 < 14000) {
          centerX += other.x;
          centerY += other.y;
          neighbors += 1;
        }
      }
      if (neighbors > 0) {
        centerX /= neighbors;
        centerY /= neighbors;
        tx = tx * (1 - shrimp.schoolingBias * 0.12) + centerX * (shrimp.schoolingBias * 0.12);
        ty = ty * (1 - shrimp.schoolingBias * 0.12) + centerY * (shrimp.schoolingBias * 0.12);
      }

      if (shrimp.stage !== "nauplius") {
        const airDrift = Math.max(0, 1 - Math.abs(shrimp.x - W * 0.76) / 220);
        ty -= airDrift * 6 * (0.3 + shrimp.schoolingBias * 0.7);
      }
    }

    const agility = shrimp.stage === "nauplius" ? 0.0032 : shrimp.stage === "juvenile" ? 0.0025 : 0.0018;
    shrimp.vx += (tx - shrimp.x) * agility + rand(-0.03, 0.03);
    shrimp.vy += (ty - shrimp.y) * agility + rand(-0.03, 0.03);

    const speed = Math.hypot(shrimp.vx, shrimp.vy);
    const maxSpeed = shrimp.stage === "nauplius" ? 1.5 : 1.8;
    if (speed > maxSpeed) {
      shrimp.vx = (shrimp.vx / speed) * maxSpeed;
      shrimp.vy = (shrimp.vy / speed) * maxSpeed;
    }

    shrimp.x = clamp(shrimp.x + shrimp.vx, 14, W - 14);
    shrimp.y = clamp(shrimp.y + shrimp.vy, 24, H - 20);
    if (shrimp.x < 15 || shrimp.x > W - 15) shrimp.vx *= -1;
    if (shrimp.y < 25 || shrimp.y > H - 21) shrimp.vy *= -1;

    const stageMetabolism = shrimp.stage === "nauplius" ? 0.88 : shrimp.stage === "juvenile" ? 0.72 : shrimp.stage === "adult" ? 0.58 : 0.54;
    shrimp.energy -= dt * (stageMetabolism + game.tank.waste * 0.009 + Math.max(0, 50 - game.tank.oxygen) * 0.008);

    if (game.tank.oxygen < 38 || game.tank.waste > 62) {
      shrimp.stress += dt * (0.8 + (38 - game.tank.oxygen) * 0.03 + Math.max(0, game.tank.waste - 62) * 0.025);
    } else {
      shrimp.stress = Math.max(0, shrimp.stress - dt * 0.9);
    }

    for (let j = game.food.length - 1; j >= 0; j -= 1) {
      const f = game.food[j];
      const dx = f.x - shrimp.x;
      const dy = f.y - shrimp.y;
      if (dx * dx + dy * dy < (bodySize + 7) ** 2 && f.amount > 0) {
        const eaten = Math.min((shrimp.stage === "nauplius" ? 10 : 15) * dt, f.amount);
        f.amount -= eaten;
        shrimp.energy += eaten * (shrimp.stage === "nauplius" ? 1.6 : 1.2);
        game.tank.foodLevel = clamp(game.tank.foodLevel + eaten * 0.04, 0, 100);
      }
      if (f.amount <= 0) game.food.splice(j, 1);
    }

    shrimp.energy = clamp(shrimp.energy, 0, 120);
    maybeReproduce(game, shrimp, adults, dt);

    const diesOfAge = shrimp.age > shrimp.lifespan;
    const diesOfStress = shrimp.stress > 16 || (shrimp.stage === "nauplius" && game.tank.foodLevel < 8 && shrimp.energy < 12);
    const diesOfConditions = game.tank.oxygen < 12 || game.tank.waste > 92;

    if (diesOfAge || diesOfStress || diesOfConditions || shrimp.energy <= 0) {
      game.corpses.push(makeCorpse(shrimp, bodySize));
      game.shrimp.splice(i, 1);
      game.tank.waste = clamp(game.tank.waste + 1.2, 0, 100);
    }
  }
}

function updateCorpses(game, dt) {
  for (let i = game.corpses.length - 1; i >= 0; i -= 1) {
    const c = game.corpses[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vx *= 0.992;
    const turn = normalizeAngle(c.targetHeading - c.heading);
    c.heading += turn * Math.min(1, dt * 1.8);

    if (c.y < c.settle) {
      c.vy = Math.min(c.vy + dt * 0.1, 0.42);
    } else {
      c.y = c.settle;
      c.vx *= 0.94;
      c.vy = 0;
      c.fade -= dt * 0.018;
    }

    c.x = clamp(c.x, 12, W - 12);
    if (c.fade <= 0) game.corpses.splice(i, 1);
  }
}

function updateBubbles(game) {
  const spawnChance = 0.08 + (game.tank.aeration / 100) * 0.35;
  if (Math.random() < spawnChance) game.bubbles.push(makeBubble());

  for (let i = game.bubbles.length - 1; i >= 0; i -= 1) {
    const b = game.bubbles[i];
    b.y -= b.v * (0.7 + game.tank.aeration / 120);
    b.x += b.drift + Math.sin(game.elapsed * 3 + b.sway) * 0.08;
    b.drift *= 0.996;
    if (b.y < -10) game.bubbles.splice(i, 1);
  }
}

function recordHistory(game) {
  game.historyTimer = (game.historyTimer ?? 0) + 1;
  if (game.historyTimer < 15) return;
  game.historyTimer = 0;
  game.statsHistory.push({
    t: game.elapsed,
    oxygen: game.tank.oxygen,
    waste: game.tank.waste,
    food: game.tank.foodLevel,
    population: game.shrimp.length
  });
  if (game.statsHistory.length > 90) game.statsHistory.shift();
}

function updatePoints(game, dt) {
  game.pointTimer = (game.pointTimer ?? 0) + dt;
  if (game.pointTimer < 8) return;

  const adults = game.shrimp.filter((s) => s.stage === "adult").length;
  const stableBonus = game.tank.stability > 0.72 && game.tank.oxygen > 60 && game.tank.waste < 35 ? 1 : 0;
  const colonyBonus = adults >= 3 ? 1 : 0;
  const gain = 1 + stableBonus + colonyBonus;

  game.pointTimer = 0;
  game.points += gain;
  game.lastPointAwardTime = game.elapsed;
  addEvent(game, `Earned ${gain} points from colony upkeep.`);
}

function updateMilestones(game) {
  const adults = game.shrimp.filter((s) => s.stage === "adult").length;
  const totalLive = game.shrimp.length + game.eggs.length;

  if (!game.milestones.tenAdults && adults >= 10) {
    game.milestones.tenAdults = true;
    game.points += 8;
    addEvent(game, "Milestone reached: 10 adults. +8 points");
  }
  if (!game.milestones.fiftyTotal && totalLive >= 50) {
    game.milestones.fiftyTotal = true;
    game.points += 10;
    addEvent(game, "Milestone reached: 50 live organisms in tank. +10 points");
  }
  if (!game.milestones.stableTank && game.elapsed > 60 && game.tank.stability > 0.78 && game.tank.oxygen > 65 && game.tank.waste < 25) {
    game.milestones.stableTank = true;
    game.points += 12;
    addEvent(game, "Milestone reached: Stable tank. +12 points");
  }
  if (!game.milestones.breeder && game.log.some((entry) => entry.text.includes("released a brood"))) {
    game.milestones.breeder = true;
    game.points += 9;
    addEvent(game, "Milestone reached: Breeder. +9 points");
  }
}

function maybeAmbientEvents(game) {
  if (Math.random() < 0.0008) {
    if (Math.random() < 0.5) {
      game.tank.oxygen = clamp(game.tank.oxygen - 8, 0, 100);
      addEvent(game, "Bacterial bloom: oxygen dipped suddenly.");
    } else {
      game.tank.foodLevel = clamp(game.tank.foodLevel + 10, 0, 100);
      addEvent(game, "Microalgae bloom: natural food increased.");
    }
  }
}

function normalizeAngle(angle) {
  let value = angle;
  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;
  return value;
}

let autosaveTimer = 0;
export function updateGame(game, dt) {
  if (dt <= 0) return;

  game.elapsed += dt;
  environment(game);
  updateTank(game, dt);
  updateEggs(game, dt);
  updateFood(game, dt);
  updateShrimp(game, dt);
  updateCorpses(game, dt);
  updateBubbles(game);
  maybeAmbientEvents(game);
  recordHistory(game);
  updatePoints(game, dt);
  updateMilestones(game);

  game.collapsed = game.colonyStarted && game.shrimp.length === 0 && game.eggs.length === 0;

  const overlay = game.elements.overlay;
  if (!game.colonyStarted) overlay.textContent = "Add eggs to begin";
  else if (game.collapsed) overlay.textContent = "Colony crashed - add eggs";
  else if (game.tank.oxygen < 25) overlay.textContent = "Oxygen critical";
  else if (game.tank.waste > 70) overlay.textContent = "Waste critical";
  else if (game.tank.stability < 0.35) overlay.textContent = "Tank unstable";
  else overlay.textContent = "";

  autosaveTimer += dt;
  if (autosaveTimer > 4) {
    saveGame(game);
    autosaveTimer = 0;
  }
}
