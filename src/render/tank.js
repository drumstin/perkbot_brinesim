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
    const swimCycle = game.elapsed * 12 + s.x * 0.035 + s.y * 0.025;
    const wiggle = Math.sin(swimCycle);
    const pulse = Math.sin(swimCycle * 0.7);
    const energyFactor = Math.max(0.35, Math.min(1, s.energy / 100));
    const bodyLight = 42 + energyFactor * 24;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(heading + wiggle * 0.06);

    if (s.stage === "nauplius") {
      ctx.fillStyle = `hsla(${s.hue + 10} 82% ${58 + energyFactor * 18}% / 0.9)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.9 + size * 0.55, 0.7 + size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 230, 200, 0.7)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -0.2);
      ctx.quadraticCurveTo(size * 1.2, -1.4, size * 2.0, -1.6 + wiggle * 0.5);
      ctx.moveTo(size * 0.2, 0.2);
      ctx.quadraticCurveTo(size * 1.2, 1.4, size * 2.0, 1.6 - wiggle * 0.5);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const bodyAlpha = s.stage === "elder" ? 0.72 : 0.88;
    const tailWave = wiggle * size * 0.55;
    const abdomenSegments = s.stage === "juvenile" ? 5 : 8;

    ctx.strokeStyle = "rgba(255, 226, 190, 0.74)";
    ctx.lineWidth = Math.max(0.8, size * 0.18);
    ctx.beginPath();
    ctx.moveTo(size * 1.6, -0.4);
    ctx.quadraticCurveTo(size * 2.5, -2.2 - pulse * 0.8, size * 3.8, -4.4 - pulse * 1.2);
    ctx.moveTo(size * 1.6, 0.4);
    ctx.quadraticCurveTo(size * 2.5, 2.2 + pulse * 0.8, size * 3.8, 4.4 + pulse * 1.2);
    ctx.stroke();

    ctx.fillStyle = `hsla(${s.hue + 6} 78% ${bodyLight + 6}% / 0.95)`;
    ctx.beginPath();
    ctx.ellipse(size * 1.7, 0, size * 1.5, size * 1.02, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${s.hue + 2} 68% ${bodyLight - 2}% / ${bodyAlpha})`;
    for (let i = 0; i < abdomenSegments; i += 1) {
      const t = i / (abdomenSegments - 1);
      const x = size * 1.0 - t * size * 5.8;
      const segW = size * (1.45 - t * 0.72);
      const segH = size * (0.95 - t * 0.5);
      const bend = Math.sin(swimCycle - i * 0.72) * (0.28 + t * 0.95) + tailWave * t;
      ctx.beginPath();
      ctx.ellipse(x, bend, segW, segH, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 244, 224, ${0.12 + (1 - t) * 0.18})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - segW * 0.55, bend - segH * 0.85);
      ctx.lineTo(x - segW * 0.45, bend + segH * 0.85);
      ctx.stroke();
    }

    const legCount = s.stage === "juvenile" ? 4 : 6;
    ctx.strokeStyle = "rgba(255, 238, 210, 0.36)";
    ctx.lineWidth = 0.9;
    for (let i = 0; i < legCount; i += 1) {
      const t = i / Math.max(1, legCount - 1);
      const anchorX = size * 0.8 - t * size * 3.2;
      const flap = Math.sin(swimCycle * 1.6 + i * 0.9) * size * 0.9;
      ctx.beginPath();
      ctx.moveTo(anchorX, -0.2);
      ctx.quadraticCurveTo(anchorX - size * 0.35, -size * 1.1 - flap * 0.18, anchorX - size * 0.9, -size * 1.8 - flap * 0.35);
      ctx.moveTo(anchorX, 0.2);
      ctx.quadraticCurveTo(anchorX - size * 0.35, size * 1.1 + flap * 0.18, anchorX - size * 0.9, size * 1.8 + flap * 0.35);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 226, 190, 0.68)";
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(-size * 4.5, tailWave * 0.85);
    ctx.quadraticCurveTo(-size * 5.7, -size * 0.8 + tailWave, -size * 6.5, -size * 1.9 + tailWave * 1.1);
    ctx.moveTo(-size * 4.5, tailWave * 0.85);
    ctx.quadraticCurveTo(-size * 5.7, size * 0.8 + tailWave, -size * 6.5, size * 1.9 + tailWave * 1.1);
    ctx.stroke();

    ctx.fillStyle = "rgba(18, 30, 38, 0.95)";
    ctx.beginPath();
    ctx.arc(size * 2.25, -0.72, Math.max(0.5, size * 0.2), 0, Math.PI * 2);
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
