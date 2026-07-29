// Canvas chart renderers and progress timeline history for CineSkills
import { currentState } from './state.js';

export function logProgressHistory(pct) {
  if (!currentState.selectedStudent) return;
  const historyKey = `cineskills_history_${currentState.selectedStudent}`;
  let history = [];
  try {
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      history = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading progress history", e);
  }

  const today = new Date().toISOString().split('T')[0];
  const existingIdx = history.findIndex(item => item.date === today);
  if (existingIdx !== -1) {
    history[existingIdx].pct = pct;
  } else {
    history.push({ date: today, pct: pct });
  }

  if (history.length > 30) {
    history = history.slice(history.length - 30);
  }

  localStorage.setItem(historyKey, JSON.stringify(history));
}

export function drawRadarChart(categoryStats) {
  const canvas = document.getElementById("radar-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) / 2 * 0.55;
  
  const categories = CINESKILLS_DATABASE.categories;
  const numAxes = categories.length;
  const angleStep = (Math.PI * 2) / numAxes;
  
  const isLightOrRetro = document.body.classList.contains("light-theme") || document.body.classList.contains("retro-theme");
  const bodyStyles = getComputedStyle(document.body);
  const accentBlue = bodyStyles.getPropertyValue('--accent-blue').trim() || "hsl(195, 90%, 60%)";
  const accentBlueGlow = bodyStyles.getPropertyValue('--accent-blue-glow').trim() || "rgba(56, 189, 248, 0.15)";
  const textColor = bodyStyles.getPropertyValue('--text-secondary').trim() || "hsl(240, 10%, 70%)";
  const gridColor = isLightOrRetro ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.05)";
  const axisColor = isLightOrRetro ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.08)";
  
  for (let level = 1; level <= 4; level++) {
    const r = radius * (level / 4);
    ctx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    if (level % 2 === 0) {
      ctx.fillStyle = isLightOrRetro ? "rgba(0, 0, 0, 0.015)" : "rgba(255, 255, 255, 0.003)";
      ctx.fill();
    }
  }
  
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = axisColor;
    ctx.stroke();
    
    const labelRadius = radius + 15;
    const lx = cx + Math.cos(angle) * labelRadius;
    const ly = cy + Math.sin(angle) * labelRadius;
    
    ctx.fillStyle = textColor;
    ctx.font = "bold 12px 'Outfit', 'Inter', sans-serif";
    ctx.textBaseline = "middle";
    
    if (Math.abs(Math.cos(angle)) < 0.1) {
      ctx.textAlign = "center";
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = "left";
    } else {
      ctx.textAlign = "right";
    }
    
    const cat = categories[i];
    ctx.fillText(`${cat.emoji} ${cat.name}`, lx, ly);
  }
  
  const dataPoints = [];
  categories.forEach(cat => {
    const stats = categoryStats[cat.id] || { totalXp: 0, earnedXp: 0 };
    const pct = stats.totalXp > 0 ? stats.earnedXp / stats.totalXp : 0;
    dataPoints.push(pct);
  });
  
  ctx.beginPath();
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = radius * dataPoints[i];
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  
  ctx.fillStyle = accentBlueGlow;
  ctx.fill();
  
  ctx.strokeStyle = accentBlue;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  const completedColor = bodyStyles.getPropertyValue('--color-completed').trim() || "hsl(142, 70%, 50%)";
  for (let i = 0; i < numAxes; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const r = radius * dataPoints[i];
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = completedColor;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawTimelineChart(currentPct) {
  const canvas = document.getElementById("timeline-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isLightOrRetro = document.body.classList.contains("light-theme") || document.body.classList.contains("retro-theme");
  
  const historyKey = `cineskills_history_${currentState.selectedStudent}`;
  let history = [];
  try {
    const saved = localStorage.getItem(historyKey);
    if (saved) {
      history = JSON.parse(saved);
    }
  } catch (e) {}

  if (history.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    history = [{ date: today, pct: currentPct }];
  }

  let chartData = [...history];
  if (chartData.length === 1) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateStr = oneWeekAgo.toISOString().split('T')[0];
    chartData = [{ date: dateStr, pct: 0 }, ...chartData];
  }

  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 30;
  const graphWidth = canvas.width - padLeft - padRight;
  const graphHeight = canvas.height - padTop - padBottom;

  const bodyStyles = getComputedStyle(document.body);
  const accentBlue = bodyStyles.getPropertyValue('--accent-blue').trim() || "hsl(195, 90%, 60%)";
  const accentBlueGlow = bodyStyles.getPropertyValue('--accent-blue-glow').trim() || "rgba(56, 189, 248, 0.15)";
  const textColor = bodyStyles.getPropertyValue('--text-secondary').trim() || "hsl(240, 10%, 60%)";
  const gridColor = isLightOrRetro ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.04)";
  const axisColor = isLightOrRetro ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.08)";
  
  const yTicks = [0, 25, 50, 75, 100];
  ctx.lineWidth = 1;
  ctx.font = "9px 'Inter', sans-serif";
  ctx.fillStyle = textColor;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  yTicks.forEach(tick => {
    const y = padTop + graphHeight * (1 - tick / 100);
    
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + graphWidth, y);
    ctx.strokeStyle = gridColor;
    ctx.stroke();
    
    ctx.fillText(`${tick}%`, padLeft - 8, y);
  });

  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + graphHeight);
  ctx.lineTo(padLeft + graphWidth, padTop + graphHeight);
  ctx.strokeStyle = axisColor;
  ctx.stroke();

  const fillGrad = ctx.createLinearGradient(0, padTop, 0, padTop + graphHeight);
  fillGrad.addColorStop(0, accentBlueGlow);
  fillGrad.addColorStop(1, "rgba(0, 0, 0, 0.0)");

  ctx.beginPath();
  ctx.moveTo(padLeft, padTop + graphHeight);
  chartData.forEach((item, idx) => {
    const x = padLeft + (idx / (chartData.length - 1)) * graphWidth;
    const y = padTop + graphHeight * (1 - item.pct / 100);
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padLeft + graphWidth, padTop + graphHeight);
  ctx.closePath();
  ctx.fillStyle = fillGrad;
  ctx.fill();

  ctx.beginPath();
  chartData.forEach((item, idx) => {
    const x = padLeft + (idx / (chartData.length - 1)) * graphWidth;
    const y = padTop + graphHeight * (1 - item.pct / 100);
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = accentBlue;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "8px 'Inter', sans-serif";

  function formatDateLabel(dateStr) {
    if (dateStr === "Start") return "Start";
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const day = parts[2];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${day} ${months[monthIdx] || ""}`;
  }

  const labelStep = Math.max(1, Math.ceil(chartData.length / 5));

  chartData.forEach((item, idx) => {
    const x = padLeft + (idx / (chartData.length - 1)) * graphWidth;
    const y = padTop + graphHeight * (1 - item.pct / 100);

    const completedColor = bodyStyles.getPropertyValue('--color-completed').trim() || "hsl(142, 70%, 50%)";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = completedColor;
    ctx.fill();
    ctx.strokeStyle = isLightTheme ? "#ffffff" : "hsl(245, 30%, 8%)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (idx === 0 || idx === chartData.length - 1 || idx % labelStep === 0) {
      ctx.fillStyle = textColor;
      ctx.fillText(formatDateLabel(item.date), x, padTop + graphHeight + 6);
    }
  });
}
