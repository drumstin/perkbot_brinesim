import { AIRSTONE_X, AIRSTONE_Y, AIRLINE_ENTRY_X, AIRLINE_ENTRY_Y, H, SUBSTRATE_HEIGHT, W } from "../state.js";
import { currentSize } from "../sim/spawning.js";

function drawTankBackground(game, ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0d4664");
  grad.addColorStop(0.35, "#0a3653");
  grad.addColorStop(1, "#07273d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const warmTint = Math.max(0, game.tank.temperature - 52) / 70;
  const coolTint = Math.max(0, 52 - game.tank.temperature) / 70;
  ctx.fillStyle = `rgba(${40 + warmTint * 100}, ${70 + coolTint * 30}, ${90 - warmTint * 25}, ${0.08 + warmTint * 0.08})`;
  ctx.fillRect(0, 0, W, H);

  const light = ctx.createRadialGradient(W * 0.15, 10, 20, W * 0.2, 10, 500);
  light.addColorStop(0, "rgba(184, 243, 255, 0.25)");
  light.addColorStop(1, "rgba(184, 243, 255, 0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  const murk = Math.min(0.65, game.tank.waste / 100);
  ctx.fillStyle = `rgba(58, 89, 34, ${murk})`;
  ctx.fillRect(0, 0, W, H);

  const lowOxygen = Math.max(0, (45 - game.tank.oxygen) / 45);
  if (lowOxygen > 0) {
    ctx.fillStyle = `rgba(92, 44, 32, ${lowOxygen * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }

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
}

function drawFood(game, ctx) {
  for (const f of game.food) {
    const alpha = Math.min(1, f.amount / 35);
    ctx.fillStyle = `rgba(114, 230, 122, ${0.18 + alpha * 0.45})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 3 + f.amount * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEggs(game, ctx) {
  for (const e of game.eggs) {
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

function drawBubbles(game, ctx) {
  for (const b of game.bubbles) {
    ctx.strokeStyle = "rgba(201, 245, 255, 0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShrimp(game, ctx) {
  for (const s of game.shrimp) {
    const size = currentSize(s);
    const heading = Math.atan2(s.vy, s.vx);
    const wiggle = Math.sin((game.elapsed * 10) + s.x * 0.04 + s.y * 0.03);
    const energyFactor = Math.max(0.35, Math.min(1, s.energy / 100));
    const bodyLight = 42 + energyFactor * 26;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(heading + wiggle * 0.08);

    if (s.stage === "nauplius") {
      ctx.fillStyle = `hsla(${s.hue + 8} 76% ${56 + energyFactor * 20}% / 0.9)`;
      ctx.beginPath();
      ctx.arc(0, 0, 0.8 + size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    if (s.stage === "juvenile") {
      ctx.fillStyle = `hsla(${s.hue + 4} 74% ${54 + energyFactor * 16}% / 0.88)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.4, size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 220, 185, 0.65)";
      ctx.beginPath();
      ctx.moveTo(size * 0.8, -0.5);
      ctx.quadraticCurveTo(size * 1.6, -1.8, size * 2.8, -2.9);
      ctx.moveTo(size * 0.8, 0.5);
      ctx.quadraticCurveTo(size * 1.6, 1.8, size * 2.8, 2.9);
      ctx.stroke();
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
      const bend = Math.sin((game.elapsed * 11) + i * 0.65 + s.x * 0.03) * (0.7 + t);
      const faded = s.stage === "elder" ? -8 : 0;
      ctx.fillStyle = `hsla(${s.hue + i * 0.9} 72% ${bodyLight + faded - i * 2.2}% / ${0.82 - t * 0.18})`;
      ctx.beginPath();
      ctx.ellipse(x, bend, segW, segH, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `hsla(${s.hue + 4} 78% ${bodyLight + (s.stage === "elder" ? -4 : 4)}% / 0.96)`;
    ctx.beginPath();
    ctx.ellipse(size * 1.8, 0, size * 1.15, size * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(17, 28, 36, 0.95)";
    ctx.beginPath();
    ctx.arc(size * 2.2, -0.9, Math.max(0.55, size * 0.22), 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

function drawCorpses(game, ctx) {
  for (const c of game.corpses) {
    const size = c.size;
    const alpha = Math.max(0, c.fade) * 0.6;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.heading);
    ctx.fillStyle = `rgba(141, 117, 95, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.5, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderGame(game, elements) {
  const { ctx } = elements;
  drawTankBackground(game, ctx);
  drawBubbles(game, ctx);
  drawFood(game, ctx);
  drawEggs(game, ctx);
  drawCorpses(game, ctx);
  drawShrimp(game, ctx);
}
