/**
 * Pune Rain Alert System — Frontend Application
 * Connects to backend API, renders IMD data, watsonx.ai analysis
 */

// ── State ──────────────────────────────────────────────────────────────────
let currentData   = null;
let activeFilter  = "ALL";
let refreshTimer  = null;
const REFRESH_MS  = 120000; // 2 minutes

// Approximate SVG coordinates for each IMD station (lon→x, lat→y mapping)
// Pune district: lon 73.5–75.1, lat 18.1–19.3
function geoToSVG(lat, lon) {
  const x = ((lon - 73.45) / (75.15 - 73.45)) * 570 + 15;
  const y = ((19.35 - lat) / (19.35 - 18.0))  * 460 + 20;
  return { x: Math.round(x), y: Math.round(y) };
}

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  fetchRainData();
  refreshTimer = setInterval(fetchRainData, REFRESH_MS);
});

// ── Fetch IMD data ─────────────────────────────────────────────────────────
async function fetchRainData() {
  setLiveDotState("loading");
  try {
    const res  = await fetch("/api/rain-data");
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "API error");

    currentData = json;
    renderAll(json);
    setLiveDotState("live");
    document.getElementById("lastUpdateTime").textContent =
      "Updated " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (err) {
    console.error("Fetch error:", err);
    setLiveDotState("stale");
    document.getElementById("lastUpdateTime").textContent = "Connection error";
  }
}

// ── Master render ──────────────────────────────────────────────────────────
function renderAll(data) {
  const { summary, stations, imdMessages } = data;

  updateHeader(summary);
  updateTicker(imdMessages, summary.districtAlert);
  updateAlertBanner(summary);
  updateStatCards(summary);
  renderMap(stations);
  renderStationTable(stations, activeFilter);
  renderAlertsList(stations);
  renderBulletin(imdMessages);
  renderChart(stations);
}

// ── Header ─────────────────────────────────────────────────────────────────
function updateHeader(summary) {
  const header = document.getElementById("mainHeader");
  const badge  = document.getElementById("districtBadge");
  const level  = summary.districtAlert;

  header.className = `header alert-${level.toLowerCase()}`;
  badge.className  = `district-badge level-${level}`;

  const icons = { RED: "🚨", ORANGE: "🔶", YELLOW: "⚠️", NORMAL: "🌧" };
  document.getElementById("badgeIcon").textContent  = icons[level] || "🌧";
  document.getElementById("badgeLevel").textContent = level + " ALERT";
}

// ── Ticker ─────────────────────────────────────────────────────────────────
function updateTicker(messages, level) {
  const ticker    = document.getElementById("tickerContainer");
  const tickerEl  = document.getElementById("tickerText");
  ticker.className = `ticker-container alert-${level.toLowerCase()}`;
  tickerEl.textContent = messages.join("   •   ");
}

// ── Alert Banner ───────────────────────────────────────────────────────────
function updateAlertBanner(summary) {
  const banner = document.getElementById("alertBanner");
  const level  = summary.districtAlert;

  if (level === "NORMAL") { banner.style.display = "none"; return; }
  banner.style.display = "flex";
  banner.className     = `alert-banner level-${level.toLowerCase()}`;

  const titles = { RED: "🚨 RED ALERT ISSUED", ORANGE: "🔶 ORANGE ALERT ISSUED", YELLOW: "⚠️ YELLOW ALERT ISSUED" };
  const descs  = {
    RED:    `Extremely Heavy Rainfall ≥115.5 mm/hr in ${summary.redAlertCount} station(s). Stay indoors!`,
    ORANGE: `Very Heavy Rainfall 64.5–115.4 mm/hr in ${summary.orangeAlertCount} station(s). Avoid travel.`,
    YELLOW: `Heavy Rainfall 35.6–64.4 mm/hr in ${summary.yellowAlertCount} station(s). Stay updated.`
  };
  document.getElementById("alertBannerIcon").textContent   = titles[level].split(" ")[0];
  document.getElementById("alertBannerTitle").textContent  = titles[level];
  document.getElementById("alertBannerDesc").textContent   = descs[level];
}

function dismissBanner() {
  document.getElementById("alertBanner").style.display = "none";
}

// ── Stat Cards ─────────────────────────────────────────────────────────────
function updateStatCards(summary) {
  document.getElementById("redCount").textContent    = summary.redAlertCount;
  document.getElementById("orangeCount").textContent = summary.orangeAlertCount;
  document.getElementById("yellowCount").textContent = summary.yellowAlertCount;
  document.getElementById("maxRainfall").textContent = summary.maxRainfall;
  document.getElementById("avgRainfall").textContent = summary.avgRainfall;
  document.getElementById("maxStation").textContent  =
    `${summary.maxRainfallStation} · ${summary.maxRainfallTaluka}`;
}

// ── SVG Map ────────────────────────────────────────────────────────────────
function renderMap(stations) {
  const g       = document.getElementById("mapStations");
  const tooltip = document.getElementById("mapTooltip");
  g.innerHTML   = "";

  stations.forEach(st => {
    const { x, y } = geoToSVG(st.lat, st.lon);
    const color = alertColor(st.alertLevel);
    const isRed = st.alertLevel === "RED";

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "map-station");
    group.setAttribute("transform", `translate(${x},${y})`);

    // Pulse ring for red/orange
    if (isRed || st.alertLevel === "ORANGE") {
      const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulse.setAttribute("r", "12");
      pulse.setAttribute("fill", "none");
      pulse.setAttribute("stroke", color);
      pulse.setAttribute("stroke-width", "1.5");
      pulse.setAttribute("opacity", "0.4");
      const anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      anim.setAttribute("attributeName", "r");
      anim.setAttribute("values", "8;16;8");
      anim.setAttribute("dur", isRed ? "1.5s" : "2.5s");
      anim.setAttribute("repeatCount", "indefinite");
      pulse.appendChild(anim);
      group.appendChild(pulse);
    }

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "7");
    circle.setAttribute("fill", color);
    circle.setAttribute("stroke", "#0d1117");
    circle.setAttribute("stroke-width", "1.5");
    group.appendChild(circle);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("y", "18");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#8b9bb4");
    label.setAttribute("font-size", "9");
    label.setAttribute("font-family", "sans-serif");
    label.textContent = st.stationId;
    group.appendChild(label);

    // Tooltip
    group.addEventListener("mouseenter", (e) => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `
        <strong style="color:#e6edf3">${st.stationName}</strong><br/>
        Taluka: ${st.taluka}<br/>
        Rainfall: <strong style="color:${color}">${st.rainfall_mm_hr} mm/hr</strong><br/>
        24hr: ${st.rainfall_24hr} mm<br/>
        Alert: <strong style="color:${color}">${st.alertLevel}</strong><br/>
        Humidity: ${st.humidity}% | Wind: ${st.windSpeed} km/h ${st.windDirection}
      `;
    });
    group.addEventListener("mousemove", (e) => {
      const rect = document.querySelector(".map-container").getBoundingClientRect();
      tooltip.style.left = (e.clientX - rect.left + 12) + "px";
      tooltip.style.top  = (e.clientY - rect.top  - 20) + "px";
    });
    group.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    g.appendChild(group);
  });

  document.getElementById("stationCount").textContent = `${stations.length} Stations`;
}

// ── Station Table ──────────────────────────────────────────────────────────
function filterStations(level) {
  activeFilter = level;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  event.target.classList.add("active");
  if (currentData) renderStationTable(currentData.stations, level);
}

function renderStationTable(stations, filter = "ALL") {
  const tbody = document.getElementById("stationTableBody");
  const list  = filter === "ALL" ? stations : stations.filter(s => s.alertLevel === filter);

  // Sort: Red first, then Orange, Yellow, Normal
  const order = { RED: 0, ORANGE: 1, YELLOW: 2, NORMAL: 3 };
  list.sort((a, b) => (order[a.alertLevel] ?? 9) - (order[b.alertLevel] ?? 9) || b.rainfall_mm_hr - a.rainfall_mm_hr);

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No stations at this alert level</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(st => `
    <tr class="row-${st.alertLevel.toLowerCase()}">
      <td><strong>${st.stationName}</strong><br/><span style="color:var(--text-muted);font-size:10px">${st.stationId}</span></td>
      <td>${st.taluka}</td>
      <td><strong style="color:${alertColor(st.alertLevel)}">${st.rainfall_mm_hr}</strong></td>
      <td>${st.rainfall_24hr}</td>
      <td><span class="alert-badge badge-${st.alertLevel}">${st.alertIcon} ${st.alertLevel}</span></td>
      <td>${st.humidity}%</td>
      <td>${st.windSpeed} ${st.windDirection}</td>
    </tr>
  `).join("");
}

// ── Alerts List ────────────────────────────────────────────────────────────
function renderAlertsList(stations) {
  const list   = document.getElementById("alertsList");
  const alerted = stations.filter(s => s.alertLevel !== "NORMAL")
    .sort((a, b) => {
      const o = { RED: 0, ORANGE: 1, YELLOW: 2 };
      return o[a.alertLevel] - o[b.alertLevel] || b.rainfall_mm_hr - a.rainfall_mm_hr;
    });

  if (alerted.length === 0) {
    list.innerHTML = `<div class="alert-item level-NORMAL">
      <div class="alert-item-icon">✅</div>
      <div><div class="alert-item-name">All Clear</div>
      <div class="alert-item-sub">No active alerts for Pune district</div></div>
    </div>`;
    return;
  }

  list.innerHTML = alerted.map(st => `
    <div class="alert-item level-${st.alertLevel}">
      <div class="alert-item-icon">${st.alertIcon}</div>
      <div>
        <div class="alert-item-name">${st.stationName}</div>
        <div class="alert-item-sub">${st.taluka} — ${st.rainfall_mm_hr} mm/hr · ${st.alertLabel}</div>
      </div>
    </div>
  `).join("");
}

// ── IMD Bulletin ───────────────────────────────────────────────────────────
function renderBulletin(messages) {
  const list = document.getElementById("bulletinList");
  list.innerHTML = messages.map(msg => `
    <div class="bulletin-item">${escapeHtml(msg)}</div>
  `).join("");
}

// ── Rainfall Bar Chart (pure canvas) ──────────────────────────────────────
function renderChart(stations) {
  const canvas = document.getElementById("rainfallChart");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const pad = { top: 20, right: 10, bottom: 50, left: 44 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top  - pad.bottom;

  // Sort and take top 12 stations
  const sorted = [...stations].sort((a, b) => b.rainfall_mm_hr - a.rainfall_mm_hr).slice(0, 12);
  const maxVal = Math.max(...sorted.map(s => s.rainfall_mm_hr), 120);

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, W, H);

  // Grid lines + Y labels
  ctx.strokeStyle = "#1e2936";
  ctx.lineWidth   = 0.5;
  ctx.fillStyle   = "#57606a";
  ctx.font        = "9px monospace";
  ctx.textAlign   = "right";

  const gridLines = [0, 35.5, 64.4, 115.5, maxVal];
  gridLines.forEach(val => {
    const y = pad.top + chartH - (val / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(Math.round(val), pad.left - 4, y + 3);
  });

  // Reference lines (IMD thresholds)
  const thresholds = [
    { val: 35.5,  color: "#eab308", label: "YELLOW" },
    { val: 64.4,  color: "#f97316", label: "ORANGE" },
    { val: 115.5, color: "#ef4444", label: "RED" }
  ];
  thresholds.forEach(t => {
    const y = pad.top + chartH - (t.val / maxVal) * chartH;
    ctx.strokeStyle = t.color + "66";
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle   = t.color;
    ctx.textAlign   = "left";
    ctx.font        = "8px sans-serif";
    ctx.fillText(t.label, pad.left + chartW - 34, y - 2);
  });

  // Bars
  const barW = (chartW / sorted.length) * 0.65;
  const gap  = chartW / sorted.length;

  sorted.forEach((st, i) => {
    const barH = (st.rainfall_mm_hr / maxVal) * chartH;
    const x    = pad.left + i * gap + (gap - barW) / 2;
    const y    = pad.top + chartH - barH;
    const col  = alertColor(st.alertLevel);

    ctx.fillStyle = col + "bb";
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();

    // Value label
    ctx.fillStyle  = col;
    ctx.font       = "8px monospace";
    ctx.textAlign  = "center";
    if (barH > 14) ctx.fillText(st.rainfall_mm_hr, x + barW / 2, y - 2);

    // Station label (rotated)
    ctx.save();
    ctx.translate(x + barW / 2, pad.top + chartH + 6);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle  = "#57606a";
    ctx.font       = "8px sans-serif";
    ctx.textAlign  = "right";
    ctx.fillText(st.stationId, 0, 0);
    ctx.restore();
  });

  // Y-axis
  ctx.strokeStyle = "#21282f";
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.stroke();

  // Y-axis title
  ctx.save();
  ctx.translate(10, pad.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle  = "#57606a";
  ctx.font       = "9px sans-serif";
  ctx.textAlign  = "center";
  ctx.fillText("mm/hr", 0, 0);
  ctx.restore();
}

// ── watsonx.ai Analysis ────────────────────────────────────────────────────
async function runAIAnalysis() {
  const btn   = document.getElementById("analyzeBtn");
  const panel = document.getElementById("aiPanel");
  const meta  = document.getElementById("aiMeta");

  btn.disabled    = true;
  btn.textContent = "⏳ Analyzing...";
  panel.innerHTML = `
    <div class="ai-thinking">
      <div class="dots-loader"><span></span><span></span><span></span></div>
      IBM watsonx.ai (granite-3-8b-instruct) analyzing Pune rainfall data...
    </div>`;
  meta.style.display = "none";

  try {
    const res  = await fetch("/api/ai-analysis", { method: "POST" });
    const json = await res.json();

    if (!json.success) throw new Error(json.fallback || json.error || "Analysis failed");

    // Re-render with fresh data too
    currentData = json;
    renderAll(json);

    panel.innerHTML = `<div class="ai-response">${escapeHtml(json.analysis)}</div>`;

    meta.style.display = "flex";
    document.getElementById("aiTimestamp").textContent =
      "Analyzed at " + new Date(json.timestamp).toLocaleTimeString("en-IN");

  } catch (err) {
    panel.innerHTML = `
      <div class="ai-thinking" style="color:#fca5a5; background: rgba(239,68,68,0.08);">
        ⚠️ ${escapeHtml(err.message || "Analysis failed. Check server logs.")}
      </div>`;
  } finally {
    btn.disabled    = false;
    btn.textContent = "🔍 Analyze with watsonx.ai";
  }
}

// ── Refresh ────────────────────────────────────────────────────────────────
function refreshData() {
  clearInterval(refreshTimer);
  fetchRainData();
  refreshTimer = setInterval(fetchRainData, REFRESH_MS);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function alertColor(level) {
  const colors = { RED: "#ef4444", ORANGE: "#f97316", YELLOW: "#eab308", NORMAL: "#22c55e" };
  return colors[level] || "#57606a";
}

function setLiveDotState(state) {
  const dot = document.getElementById("liveDot");
  if (state === "live")    { dot.className = "dot-pulse"; dot.style.background = "#22c55e"; }
  if (state === "loading") { dot.className = "dot-pulse"; dot.style.background = "#eab308"; }
  if (state === "stale")   { dot.className = "dot-pulse stale"; dot.style.background = "#57606a"; }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
