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

function drawUpgrades(game, ctx) {
  const filterLevel = game.upgrades?.filter ?? 0;
  const skimmerLevel = game.upgrades?.skimmer ?? 0;
  const bioLevel = game.upgrades?.bioMedia ?? 0;

  if (filterLevel > 0) {
    for (let i = 0; i < filterLevel; i += 1) {
      const x = 74 + i * 24;
      const y = H - SUBSTRATE_HEIGHT - 36;
      ctx.fillStyle = "rgba(140, 162, 174, 0.9)";
      ctx.fillRect(x, y, 14, 28);
      ctx.fillStyle = "rgba(82, 107, 120, 0.85)";
      ctx.fillRect(x + 2, y + 4, 10, 4);
      ctx.fillRect(x + 2, y + 12, 10, 4);
      ctx.fillRect(x + 2, y + 20, 10, 4);
    }
  }

  if (skimmerLevel > 0) {
    for (let i = 0; i < skimmerLevel; i += 1) {
      const x = W - 170 + i * 28;
      const y = 26 + i * 6;
      ctx.fillStyle = "rgba(189, 220, 235, 0.88)";
      ctx.fillRect(x, y, 18, 10);
      ctx.strokeStyle = "rgba(235, 248, 255, 0.55)";
      ctx.beginPath();
      ctx.moveTo(x, y + 10);
      ctx.lineTo(x + 18, y + 10);
      ctx.stroke();
    }
  }

  if (bioLevel > 0) {
    for (let i = 0; i < bioLevel; i += 1) {
      const x = 40 + i * 18;
      const y = H - SUBSTRATE_HEIGHT + 4;
      ctx.fillStyle = `rgba(120, ${148 + i * 18}, 90, 0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawEggs(game, ctx) {
  for (const e of game.eggs) {
    const hatchGlow = e.flash ? e.flash * (0.18 + 0.12 * Math.sin(e.wobble * 2)) : 0;
    const wobbleX = Math.sin(e.wobble) * 0.35;
    const wobbleY = Math.cos(e.wobble * 1.2) * 0.25;

    ctx.fillStyle = `hsla(${e.hue} 48% 34% / 0.96)`;
    ctx.beginPath();
    ctx.ellipse(e.x + wobbleX, e.y + wobbleY, e.r * 1.02, e.r * 0.92, e.wobble * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 214, 156, ${0.28 + hatchGlow})`;
    ctx.beginPath();
    ctx.arc(e.x - e.r * 0.25 + wobbleX, e.y - e.r * 0.35 + wobbleY, e.r * 0.42, 0, Math.PI * 2);
    ctx.fill();

    if (hatchGlow > 0.02) {
      ctx.strokeStyle = `rgba(255, 236, 180, ${hatchGlow})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (1.6 + hatchGlow * 1.8), 0, Math.PI * 2);
      ctx.stroke();
    }
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
      const glow = 0.16 + energyFactor * 0.12;
      ctx.fillStyle = `hsla(${s.hue + 16} 88% ${60 + energyFactor * 18}% / 0.82)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.95 + size * 0.58, 0.72 + size * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 248, 236, ${glow})`;
      ctx.beginPath();
      ctx.ellipse(size * 0.15, -0.12, size * 0.5, size * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 230, 200, 0.7)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, -0.2);
      ctx.quadraticCurveTo(size * 1.2, -1.4, size * 2.0, -1.6 + wiggle * 0.5);
      ctx.moveTo(size * 0.2, 0.2);
      ctx.quadraticCurveTo(size * 1.2, 1.4, size * 2.0, 1.6 - wiggle * 0.5);
      ctx.stroke();

      ctx.fillStyle = "rgba(18, 30, 38, 0.85)";
      ctx.beginPath();
      ctx.arc(size * 0.52, -0.2, Math.max(0.28, size * 0.12), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      continue;
    }

    const bodyAlpha = s.stage === "elder" ? 0.68 : 0.82;
    const shellAlpha = s.stage === "elder" ? 0.2 : 0.3;
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

    ctx.fillStyle = `hsla(${s.hue + 6} 78% ${bodyLight + 6}% / 0.88)`;
    ctx.beginPath();
    ctx.ellipse(size * 1.7, 0, size * 1.5, size * 1.02, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 247, 236, ${shellAlpha})`;
    ctx.beginPath();
    ctx.ellipse(size * 1.2, -0.1, size * 2.1, size * 1.04, 0, 0, Math.PI * 2);
    ctx.fill();

    if (s.stage === "adult" && s.brood > 0.55) {
      ctx.fillStyle = `rgba(210, 124, 82, ${0.18 + Math.min(0.22, s.brood * 0.18)})`;
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.72, size * 1.1, size * 0.52, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(size * 0.35, -size * 0.72, size * 1.1, size * 0.52, -0.18, 0, Math.PI * 2);
      ctx.fill();
    }

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

      ctx.strokeStyle = "rgba(255, 242, 220, 0.18)";
      ctx.lineWidth = 0.55;
      for (let fil = 0; fil < 3; fil += 1) {
        const offset = (fil - 1) * size * 0.18;
        ctx.beginPath();
        ctx.moveTo(anchorX - size * 0.35, offset);
        ctx.quadraticCurveTo(anchorX - size * 0.7, offset - size * 0.45 - flap * 0.08, anchorX - size * 1.05, offset - size * 0.75 - flap * 0.16);
        ctx.moveTo(anchorX - size * 0.35, -offset);
        ctx.quadraticCurveTo(anchorX - size * 0.7, -offset + size * 0.45 + flap * 0.08, anchorX - size * 1.05, -offset + size * 0.75 + flap * 0.16);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255, 238, 210, 0.36)";
      ctx.lineWidth = 0.9;
    }

    ctx.strokeStyle = "rgba(255, 226, 190, 0.68)";
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(-size * 4.4, tailWave * 0.75);
    ctx.quadraticCurveTo(-size * 5.2, -size * 0.55 + tailWave * 0.8, -size * 5.9, -size * 1.3 + tailWave * 0.95);
    ctx.quadraticCurveTo(-size * 6.4, -size * 1.9 + tailWave, -size * 6.9, -size * 2.4 + tailWave * 1.05);
    ctx.moveTo(-size * 4.4, tailWave * 0.75);
    ctx.quadraticCurveTo(-size * 5.2, size * 0.55 + tailWave * 0.8, -size * 5.9, size * 1.3 + tailWave * 0.95);
    ctx.quadraticCurveTo(-size * 6.4, size * 1.9 + tailWave, -size * 6.9, size * 2.4 + tailWave * 1.05);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 236, 208, 0.16)";
    ctx.beginPath();
    ctx.moveTo(-size * 4.4, tailWave * 0.72);
    ctx.quadraticCurveTo(-size * 5.7, -size * 0.4 + tailWave * 0.9, -size * 6.3, -size * 1.55 + tailWave);
    ctx.quadraticCurveTo(-size * 5.8, -size * 1.05 + tailWave * 0.8, -size * 4.9, tailWave * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 4.4, tailWave * 0.72);
    ctx.quadraticCurveTo(-size * 5.7, size * 0.4 + tailWave * 0.9, -size * 6.3, size * 1.55 + tailWave);
    ctx.quadraticCurveTo(-size * 5.8, size * 1.05 + tailWave * 0.8, -size * 4.9, tailWave * 0.58);
    ctx.closePath();
    ctx.fill();

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

function drawObservationOverlay(ctx) {
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.14, W * 0.5, H * 0.5, H * 0.7);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.34)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(220, 245, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(W * 0.18, H * 0.16, W * 0.64, H * 0.68);

  ctx.strokeStyle = "rgba(220, 245, 255, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.22);
  ctx.lineTo(W * 0.5, H * 0.78);
  ctx.moveTo(W * 0.24, H * 0.5);
  ctx.lineTo(W * 0.76, H * 0.5);
  ctx.stroke();

  ctx.fillStyle = "rgba(220, 245, 255, 0.75)";
  ctx.font = "12px sans-serif";
  ctx.fillText("Observation mode", 20, 24);
}

export function renderGame(game, elements) {
  const { ctx, canvas } = elements;
  ctx.save();
  if (game.observeMode) {
    ctx.translate(canvas.width * 0.12, canvas.height * 0.09);
    ctx.scale(1.32, 1.32);
  }
  drawTankBackground(game, ctx);
  drawBubbles(game, ctx);
  drawUpgrades(game, ctx);
  drawFood(game, ctx);
  drawEggs(game, ctx);
  drawCorpses(game, ctx);
  drawShrimp(game, ctx);
  ctx.restore();

  if (game.observeMode) {
    drawObservationOverlay(ctx);
  }
}
