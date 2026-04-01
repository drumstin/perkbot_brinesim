import { AIRSTONE_X, AIRSTONE_Y, H, W } from "../state.js";

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function growthFactor(age, stageProgress = 1) {
  const t = Math.max(0, Math.min(1, stageProgress ?? age / 38));
  return t * t * (3 - 2 * t);
}

export function stageForAge(age) {
  if (age < 18) return "nauplius";
  if (age < 70) return "juvenile";
  if (age < 220) return "adult";
  return "elder";
}

export function currentSize(shrimp) {
  const age = shrimp.age ?? 0;

  if (age < 18) {
    const t = growthFactor(age / 18);
    return 1.1 + (2.6 - 1.1) * t;
  }

  if (age < 70) {
    const t = growthFactor((age - 18) / (70 - 18));
    return 2.6 + (4.3 - 2.6) * t;
  }

  if (age < 180) {
    const t = growthFactor((age - 70) / (180 - 70));
    return 4.3 + (shrimp.adultSize - 4.3) * t;
  }

  if (age < 260) {
    return shrimp.adultSize;
  }

  const t = growthFactor(Math.min(1, (age - 260) / 120));
  return shrimp.adultSize * (1 - t * 0.05);
}

export function makeShrimp(game, x = rand(40, W - 40), y = rand(60, H - 40)) {
  return {
    id: game.nextShrimpId++,
    x,
    y,
    vx: rand(-0.8, 0.8),
    vy: rand(-0.5, 0.5),
    energy: rand(36, 58),
    age: 0,
    stress: 0,
    stage: "nauplius",
    lifespan: rand(240, 340),
    adultSize: rand(4.9, 6.9),
    hue: rand(20, 36),
    fertility: rand(0.85, 1.2),
    brood: rand(0, 1),
    broodCooldown: rand(8, 20),
    hoverDepth: rand(H * 0.22, H * 0.72),
    schoolingBias: rand(0.35, 1)
  };
}

export function makeCorpse(shrimp, size) {
  const heading = Math.atan2(shrimp.vy, shrimp.vx || 0.01);
  return {
    x: shrimp.x,
    y: shrimp.y,
    vx: shrimp.vx * 0.2,
    vy: Math.max(shrimp.vy, 0) + rand(0.12, 0.28),
    size,
    hue: shrimp.hue,
    settle: H - 17 - rand(0, 9),
    fade: 1,
    heading,
    targetHeading: heading + rand(0.7, 1.15)
  };
}

export function makeEgg(x = rand(35, W - 35), y = rand(16, 36)) {
  return {
    x,
    y,
    r: rand(1.5, 2.4),
    sink: rand(6, 14),
    hatchTimer: rand(18, 34),
    hue: rand(26, 38),
    wobble: rand(0, Math.PI * 2),
    flash: 0
  };
}

export function makeFood(x, y, richness = 1) {
  return {
    x,
    y,
    amount: rand(28, 44) * richness,
    drift: rand(-0.15, 0.15)
  };
}

export function makeBubble() {
  return {
    x: AIRSTONE_X + rand(-7, 7),
    y: AIRSTONE_Y + rand(-2, 2),
    r: rand(1, 4),
    v: rand(0.5, 1.5),
    drift: rand(-0.18, 0.18),
    sway: rand(0, Math.PI * 2)
  };
}

export function addEggBatch(game, count = 18, x, y, spread = 26) {
  for (let i = 0; i < count; i += 1) {
    const eggX = typeof x === "number" ? x + rand(-spread, spread) : undefined;
    const eggY = typeof y === "number" ? y + rand(-spread * 0.35, spread * 0.35) : undefined;
    game.eggs.push(makeEgg(eggX, eggY));
  }
  game.colonyStarted = true;
}

export function addFoodBurst(game, x = rand(80, W - 80), y = rand(45, 180), count = 7, richness = 1) {
  for (let i = 0; i < count; i += 1) {
    game.food.push(makeFood(x + rand(-45, 45), y + rand(-18, 18), richness));
  }
}
