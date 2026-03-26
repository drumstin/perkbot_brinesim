const canvas = document.getElementById("tank");
const ctx = canvas.getContext("2d");
const statsEl = document.getElementById("stats");
const registryEl = document.getElementById("shrimp-registry");
const overlayEl = document.getElementById("overlay");
const salinityEl = document.getElementById("salinity");
const tempEl = document.getElementById("temperature");
const restartEl = document.getElementById("restart");
const addEggsEl = document.getElementById("add-eggs");
const addFoodEl = document.getElementById("add-food");

const W = canvas.width;
const H = canvas.height;
const SUBSTRATE_HEIGHT = 28;
const AIRSTONE_X = W * 0.82;
const AIRSTONE_Y = H - SUBSTRATE_HEIGHT - 8;
const AIRLINE_ENTRY_X = W - 18;
const AIRLINE_ENTRY_Y = 26;

let shrimp = [];
let corpses = [];
let eggs = [];
let food = [];
let bubbles = [];
let nutrientLoad = 8;
let elapsed = 0;
let colonyStarted = false;
let collapsed = false;
let waterQuality = 1;
let baseQuality = 1;
let nextShrimpId = 1;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function makeShrimp(x = rand(40, W - 40), y = rand(60, H - 40)) {
  return {
    id: nextShrimpId++,
    x,
    y,
    vx: rand(-0.8, 0.8),
    vy: rand(-0.5, 0.5),
    energy: rand(28, 44),
    age: 0,
    stress: 0,
    lifespan: rand(780, 960),
    adultSize: rand(4.7, 6.7),
    hue: rand(20, 36)
  };
}

function normalizeAngle(angle) {
  let value = angle;
  while (value <= -Math.PI) value += Math.PI * 2;
  while (value > Math.PI) value -= Math.PI * 2;
  return value;
}

function makeCorpse(s, size) {
  const heading = Math.atan2(s.vy, s.vx || 0.01);
  return {
    x: s.x,
    y: s.y,
    vx: s.vx * 0.2,
    vy: Math.max(s.vy, 0) + rand(0.12, 0.28),
    size,
    hue: s.hue,
    settle: H - 17 - rand(0, 9),
    fade: 1,
    heading,
    targetHeading: heading + rand(0.7, 1.15)
  };
}

function makeEgg(x = rand(35, W - 35), y = rand(16, 36)) {
  return {
    x,
    y,
    r: rand(1.5, 2.4),
    sink: rand(6, 14),
    hatchTimer: rand(12, 26)
  };
}

function makeFood(x, y) {
  return {
    x,
    y,
    amount: rand(35, 60),
    drift: rand(-0.15, 0.15)
  };
}

function makeBubble() {
  return {
    x: AIRSTONE_X + rand(-7, 7),
    y: AIRSTONE_Y + rand(-2, 2),
    r: rand(1, 4),
    v: rand(0.5, 1.5),
    drift: rand(-0.18, 0.18),
    sway: rand(0, Math.PI * 2)
  };
}

function environmentQuality() {
  const salinity = Number(salinityEl.value);
  const temp = Number(tempEl.value);
  const sPenalty = Math.abs(salinity - 55) / 55;
  const tPenalty = Math.abs(temp - 52) / 52;
  baseQuality = Math.max(0, 1 - (sPenalty * 0.55 + tPenalty * 0.6));
  waterQuality = Math.max(0, Math.min(1, baseQuality - nutrientLoad / 140));
  return { salinity, temp, baseQuality, waterQuality };
}

function growthFactor(age) {
  const t = Math.max(0, Math.min(1, age / 38));
  return t * t * (3 - 2 * t);
}

function currentSize(s) {
  const larvalSize = 0.55;
  return larvalSize + (s.adultSize - larvalSize) * growthFactor(s.age);
}

function addEggBatch(count = 18) {
  for (let i = 0; i < count; i += 1) {
    eggs.push(makeEgg());
  }
  colonyStarted = true;
}

function addFoodBurst(x = rand(80, W - 80), y = rand(45, 180), count = 7) {
  for (let i = 0; i < count; i += 1) {
    food.push(makeFood(x + rand(-45, 45), y + rand(-18, 18)));
  }
  nutrientLoad += count * 0.9;
}

function reset() {
  shrimp = [];
  corpses = [];
  eggs = [];
  food = [];
  bubbles = Array.from({ length: 55 }, () => makeBubble());
  nutrientLoad = 8;
  elapsed = 0;
  colonyStarted = false;
  collapsed = false;
  nextShrimpId = 1;
  overlayEl.textContent = "Add eggs to begin";
  registryEl.value = "";
}

function update(dt) {
  elapsed += dt;

  const totalFoodAmount = food.reduce((n, f) => n + f.amount, 0);
  nutrientLoad += dt * (shrimp.length * 0.045 + totalFoodAmount * 0.012 + eggs.length * 0.003);
  nutrientLoad -= dt * (0.95 + baseQuality * 0.75);
  nutrientLoad = Math.max(0, Math.min(180, nutrientLoad));

  const env = environmentQuality();

  for (let i = eggs.length - 1; i >= 0; i -= 1) {
    const e = eggs[i];
    e.y += e.sink * dt;
    if (e.y > H - 35) {
      e.y = H - 35;
    }

    const hatchRate = 0.55 + env.waterQuality * 0.8;
    e.hatchTimer -= dt * hatchRate;

    if (e.hatchTimer <= 0) {
      if (env.waterQuality > 0.15 || Math.random() < env.waterQuality + 0.1) {
        shrimp.push(makeShrimp(e.x + rand(-3, 3), e.y + rand(-3, 3)));
      } else {
        nutrientLoad += 1.2;
      }
      eggs.splice(i, 1);
    }
  }

  for (let i = food.length - 1; i >= 0; i -= 1) {
    const f = food[i];
    f.y += 5 * dt;
    f.x += f.drift;
    f.amount -= dt * 1.2;
    if (f.amount <= 0 || f.y > H - 10) {
      food.splice(i, 1);
    }
  }

  for (let i = shrimp.length - 1; i >= 0; i -= 1) {
    const s = shrimp[i];
    s.age += dt;
    const bodySize = currentSize(s);

    let tx = s.x + s.vx * 40;
    let ty = s.y + s.vy * 40;
    let nearestDist = Infinity;
    let targetFood = null;

    for (let j = 0; j < food.length; j += 1) {
      const f = food[j];
      const dx = f.x - s.x;
      const dy = f.y - s.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist) {
        nearestDist = d2;
        targetFood = f;
      }
    }

    if (targetFood && nearestDist < 36000) {
      tx = targetFood.x;
      ty = targetFood.y;
    }

    const ax = (tx - s.x) * 0.002;
    const ay = (ty - s.y) * 0.002;

    s.vx += ax + rand(-0.03, 0.03);
    s.vy += ay + rand(-0.03, 0.03);

    const speed = Math.hypot(s.vx, s.vy);
    const maxSpeed = 1.7;
    if (speed > maxSpeed) {
      s.vx = (s.vx / speed) * maxSpeed;
      s.vy = (s.vy / speed) * maxSpeed;
    }

    s.x += s.vx;
    s.y += s.vy;

    if (s.x < 14 || s.x > W - 14) s.vx *= -1;
    if (s.y < 24 || s.y > H - 20) s.vy *= -1;
    s.x = Math.max(14, Math.min(W - 14, s.x));
    s.y = Math.max(24, Math.min(H - 20, s.y));

    const metabolism = 0.55 + (1 - env.waterQuality) * 0.65;
    s.energy -= dt * metabolism;

    if (env.waterQuality < 0.24) {
      s.stress += dt * (0.65 + (0.24 - env.waterQuality) * 5.5);
      s.energy -= dt * (0.5 + (0.24 - env.waterQuality) * 2.4);
    } else {
      s.stress = Math.max(0, s.stress - dt * 0.9);
    }

    for (let j = food.length - 1; j >= 0; j -= 1) {
      const f = food[j];
      const dx = f.x - s.x;
      const dy = f.y - s.y;
      if (dx * dx + dy * dy < (bodySize + 7) ** 2 && f.amount > 0) {
        const eaten = Math.min(15 * dt, f.amount);
        f.amount -= eaten;
        s.energy += eaten * 1.2;
      }
      if (f.amount <= 0) food.splice(j, 1);
    }

    s.energy = Math.max(10, Math.min(120, s.energy));

    if (
      growthFactor(s.age) > 0.82 &&
      s.energy > 95 &&
      shrimp.length < 140 &&
      env.waterQuality > 0.42 &&
      Math.random() < 0.0024
    ) {
      s.energy *= 0.58;
      shrimp.push(makeShrimp(s.x + rand(-8, 8), s.y + rand(-8, 8)));
    }

    const diesOfAge = s.age > s.lifespan;
    const diesOfWater = env.waterQuality < 0.12 && s.stress > 10;

    if (diesOfAge || diesOfWater) {
      corpses.push(makeCorpse(s, bodySize));
      shrimp.splice(i, 1);
    }
  }

  for (let i = corpses.length - 1; i >= 0; i -= 1) {
    const c = corpses[i];
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
      c.heading += normalizeAngle(c.targetHeading - c.heading) * Math.min(1, dt * 3.4);
      c.fade -= dt * 0.018;
    }

    c.x = Math.max(12, Math.min(W - 12, c.x));

    if (c.fade <= 0) {
      corpses.splice(i, 1);
    }
  }

  if (Math.random() < 0.2) {
    bubbles.push(makeBubble());
  }

  for (let i = bubbles.length - 1; i >= 0; i -= 1) {
    const b = bubbles[i];
    b.y -= b.v;
    b.x += b.drift + Math.sin(elapsed * 3 + b.sway) * 0.08;
    b.drift *= 0.996;
    if (b.y < -10) bubbles.splice(i, 1);
  }

  collapsed = colonyStarted && shrimp.length === 0 && eggs.length === 0;
  if (!colonyStarted) {
    overlayEl.textContent = "Add eggs to begin";
  } else if (collapsed) {
    overlayEl.textContent = "Colony crashed - add eggs";
  } else if (env.waterQuality < 0.2) {
    overlayEl.textContent = "Water quality critical";
  } else if (env.waterQuality < 0.35) {
    overlayEl.textContent = "Water quality poor";
  } else {
    overlayEl.textContent = "";
  }

  render();
  updateStats(env);
}

function drawTankBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0d4664");
  grad.addColorStop(0.35, "#0a3653");
  grad.addColorStop(1, "#07273d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const light = ctx.createRadialGradient(W * 0.15, 10, 20, W * 0.2, 10, 500);
  light.addColorStop(0, "rgba(184, 243, 255, 0.25)");
  light.addColorStop(1, "rgba(184, 243, 255, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  const murk = Math.min(0.55, nutrientLoad / 180);
  ctx.fillStyle = `rgba(58, 89, 34, ${murk})`;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(196, 224, 232, 0.78)";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(AIRLINE_ENTRY_X, AIRLINE_ENTRY_Y);
  ctx.bezierCurveTo(W - 24, H * 0.34, W - 28, H * 0.62, AIRSTONE_X + 12, AIRSTONE_Y - 6);
  ctx.stroke();

  ctx.strokeStyle = "rgba(102, 131, 144, 0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(AIRLINE_ENTRY_X, AIRLINE_ENTRY_Y);
  ctx.bezierCurveTo(W - 25, H * 0.34, W - 29, H * 0.62, AIRSTONE_X + 12, AIRSTONE_Y - 6);
  ctx.stroke();

  ctx.fillStyle = "#2f4a38";
  ctx.fillRect(0, H - SUBSTRATE_HEIGHT, W, SUBSTRATE_HEIGHT);

  ctx.fillStyle = "#6f7c84";
  ctx.beginPath();
  ctx.ellipse(AIRSTONE_X, AIRSTONE_Y + 1, 19, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(184, 208, 214, 0.45)";
  ctx.beginPath();
  ctx.ellipse(AIRSTONE_X, AIRSTONE_Y - 1, 14, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(33, 47, 54, 0.55)";
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.arc(AIRSTONE_X + i, AIRSTONE_Y + ((i % 12) === 0 ? 0.4 : -0.3), 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFood() {
  for (const f of food) {
    const alpha = Math.min(1, f.amount / 35);
    ctx.fillStyle = `rgba(114, 230, 122, ${0.18 + alpha * 0.45})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 3 + f.amount * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEggs() {
  for (const e of eggs) {
    ctx.fillStyle = "rgba(123, 79, 40, 0.95)";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(196, 147, 90, 0.45)";
    ctx.beginPath();
    ctx.arc(e.x - e.r * 0.25, e.y - e.r * 0.35, e.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubbles() {
  for (const b of bubbles) {
    ctx.strokeStyle = "rgba(201, 245, 255, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShrimp() {
  for (const s of shrimp) {
    const g = growthFactor(s.age);
    const size = currentSize(s);
    const heading = Math.atan2(s.vy, s.vx);
    const wiggle = Math.sin((elapsed * 10) + s.x * 0.04 + s.y * 0.03);
    const energyFactor = Math.max(0.4, Math.min(1, s.energy / 100));
    const bodyLight = 42 + energyFactor * 26;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(heading + wiggle * 0.08);

    if (g < 0.2) {
      ctx.fillStyle = `hsla(${s.hue + 6} 72% ${52 + energyFactor * 22}% / 0.85)`;
      ctx.beginPath();
      ctx.arc(0, 0, 0.45 + size * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    ctx.strokeStyle = "rgba(255, 231, 195, 0.82)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size * 2.4, -1.2);
    ctx.quadraticCurveTo(size * 3.5, -3.8 + wiggle * 1.6, size * 5, -6.4 + wiggle * 2.2);
    ctx.moveTo(size * 2.4, 1.2);
    ctx.quadraticCurveTo(size * 3.5, 3.8 - wiggle * 1.6, size * 5, 6.4 - wiggle * 2.2);
    ctx.stroke();

    const segments = 8;
    for (let i = 0; i < segments; i += 1) {
      const t = i / (segments - 1);
      const x = size * 1.4 - t * size * 4.8;
      const segH = size * (0.98 - t * 0.56);
      const segW = size * (1.22 - t * 0.62);
      const bend = Math.sin((elapsed * 11) + i * 0.65 + s.x * 0.03) * (0.7 + t);
      ctx.fillStyle = `hsla(${s.hue + i * 0.9} 72% ${bodyLight - i * 2.2}% / ${0.82 - t * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(x, bend, segW, segH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255, 204, 152, 0.65)";
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 6; i += 1) {
      const lx = size * (1.1 - i * 0.62);
      const sweep = Math.sin(elapsed * 18 + i * 0.85 + s.x * 0.05) * 1.7;
      ctx.beginPath();
      ctx.moveTo(lx, 0.3);
      ctx.quadraticCurveTo(lx - 1.3, 2.2 + sweep * 0.4, lx - 2.4, 3.7 + sweep);
      ctx.stroke();
    }

    ctx.fillStyle = `hsla(${s.hue + 4} 78% ${bodyLight + 4}% / 0.96)`;
    ctx.beginPath();
    ctx.ellipse(size * 1.8, 0, size * 1.15, size * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 219, 180, 0.9)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-size * 3.5, -0.4);
    ctx.quadraticCurveTo(-size * 4.8, -2.8 + wiggle, -size * 6.1, -4.8 + wiggle * 1.4);
    ctx.moveTo(-size * 3.5, 0.4);
    ctx.quadraticCurveTo(-size * 4.8, 2.8 - wiggle, -size * 6.1, 4.8 - wiggle * 1.4);
    ctx.stroke();

    ctx.fillStyle = "rgba(17, 28, 36, 0.95)";
    ctx.beginPath();
    ctx.arc(size * 2.2, -0.9, Math.max(0.55, size * 0.22), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawCorpses() {
  for (const c of corpses) {
    const size = c.size;
    const alpha = Math.max(0, c.fade) * 0.6;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.heading);

    ctx.strokeStyle = `rgba(128, 111, 92, ${alpha * 0.55})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(size * 1.8, -0.8);
    ctx.quadraticCurveTo(size * 2.8, -2.2, size * 4.1, -3.2);
    ctx.moveTo(size * 1.8, 0.8);
    ctx.quadraticCurveTo(size * 2.8, 2.2, size * 4.1, 3.2);
    ctx.moveTo(-size * 2.8, -0.2);
    ctx.quadraticCurveTo(-size * 3.7, -1.5, -size * 4.8, -2.8);
    ctx.moveTo(-size * 2.8, 0.2);
    ctx.quadraticCurveTo(-size * 3.7, 1.5, -size * 4.8, 2.8);
    ctx.stroke();

    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const x = size * 1.1 - t * size * 3.9;
      const segH = size * (0.82 - t * 0.34);
      const segW = size * (1 - t * 0.5);
      ctx.fillStyle = `rgba(141, 117, 95, ${alpha * (0.7 - t * 0.22)})`;
      ctx.beginPath();
      ctx.ellipse(x, Math.sin(i * 0.6) * 0.35, segW, segH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(164, 141, 118, ${alpha * 0.9})`;
    ctx.beginPath();
    ctx.ellipse(size * 1.5, 0, size * 0.95, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(36, 32, 28, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(size * 1.8, -0.7, Math.max(0.45, size * 0.18), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function render() {
  drawTankBackground();
  drawBubbles();
  drawFood();
  drawEggs();
  drawCorpses();
  drawShrimp();
}

function updateStats(env) {
  const avgEnergy = shrimp.length > 0 ? (shrimp.reduce((n, s) => n + s.energy, 0) / shrimp.length) : 0;
  statsEl.innerHTML = `
    <div>Shrimp: <strong>${shrimp.length}</strong></div>
    <div>Eggs: <strong>${eggs.length}</strong></div>
    <div>Food Particles: <strong>${food.length}</strong></div>
    <div>Avg Energy: <strong>${avgEnergy.toFixed(1)}</strong></div>
    <div>Nutrient Load: <strong>${nutrientLoad.toFixed(1)}</strong></div>
    <div>Water Quality: <strong>${Math.round(env.waterQuality * 100)}%</strong></div>
    <div>Time: <strong>${elapsed.toFixed(1)}s</strong></div>
  `;

  registryEl.value = shrimp.length > 0
    ? shrimp
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((s) => {
        const size = currentSize(s);
        return `#${s.id} age=${s.age.toFixed(1)} size=${size.toFixed(2)} energy=${s.energy.toFixed(1)} stress=${s.stress.toFixed(1)} x=${s.x.toFixed(1)} y=${s.y.toFixed(1)} life=${s.lifespan.toFixed(0)}`;
      })
      .join("\n")
    : "No live shrimp";
}

let last = performance.now();
function tick(t) {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;
  update(dt);
  requestAnimationFrame(tick);
}

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * W;
  const y = ((e.clientY - rect.top) / rect.height) * H;
  addFoodBurst(x, y, 4);
});

addEggsEl.addEventListener("click", () => {
  addEggBatch(16);
});

addFoodEl.addEventListener("click", () => {
  addFoodBurst();
});

restartEl.addEventListener("click", () => {
  reset();
  render();
});

reset();
render();
requestAnimationFrame(tick);
