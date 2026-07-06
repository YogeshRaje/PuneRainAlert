/**
 * Pune Rain Red Alert System - Backend Server
 * Powered by IBM watsonx.ai (granite-3-8b-instruct)
 * Integrates with IMD data for real-time Pune district rain alerts
 * ngrok tunnel for public live URL sharing
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const ngrok = require("@ngrok/ngrok");
const { generateLiveIMDData, getDistrictSummary, getIMDWarningMessages } = require("./imdData");

const app = express();
const PORT = process.env.PORT || 3000;

// Store live ngrok URL for /api/status endpoint
let ngrokPublicUrl = null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ─── IBM watsonx.ai Token Management ───────────────────────────────────────
let watsonxToken = null;
let tokenExpiry = 0;

async function getWatsonxToken() {
  if (watsonxToken && Date.now() < tokenExpiry) return watsonxToken;

  try {
    const response = await axios.post(
      "https://iam.cloud.ibm.com/identity/token",
      new URLSearchParams({
        grant_type: "urn:ibm:params:oauth:grant-type:apikey",
        apikey: process.env.WATSONX_API_KEY
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    watsonxToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return watsonxToken;
  } catch (err) {
    console.error("❌ Failed to fetch watsonx IAM token:", err.message);
    throw new Error("Authentication failed with IBM watsonx.ai");
  }
}

// ─── watsonx.ai Rain Analysis ───────────────────────────────────────────────
async function analyzeRainWithWatsonx(summary, stations, imdMessages) {
  const token = await getWatsonxToken();

  const redStations = stations.filter(s => s.alertLevel === "RED")
    .map(s => `${s.stationName} (${s.taluka}): ${s.rainfall_mm_hr} mm/hr`).join(", ");
  const orangeStations = stations.filter(s => s.alertLevel === "ORANGE")
    .map(s => `${s.stationName} (${s.taluka}): ${s.rainfall_mm_hr} mm/hr`).join(", ");

  const prompt = `<|system|>
You are an expert meteorologist at IMD (India Meteorological Department) Pune. 
Provide concise, actionable rain alert analysis for Pune district citizens and emergency teams.
Always include specific safety recommendations and emergency contacts.
<|user|>
Current Pune District Rainfall Report:
- District Alert Level: ${summary.districtAlert}
- Total IMD Stations Monitored: ${summary.totalStations}
- Red Alert Stations (≥115.5 mm/hr): ${summary.redAlertCount} | Areas: ${redStations || "None"}
- Orange Alert Stations (64.5-115.4 mm/hr): ${summary.orangeAlertCount} | Areas: ${orangeStations || "None"}
- Yellow Alert Stations (35.6-64.4 mm/hr): ${summary.yellowAlertCount}
- Normal Stations: ${summary.normalCount}
- Maximum Rainfall: ${summary.maxRainfall} mm/hr at ${summary.maxRainfallStation}
- District Average Rainfall: ${summary.avgRainfall} mm/hr
- IMD Warning: ${imdMessages[2] || "Normal activity"}

Based on this data, provide:
1. A brief 2-sentence situation assessment for Pune district
2. Top 3 immediate safety actions for citizens
3. Risk areas to avoid (rivers, roads, regions)
4. Expected duration and trend (based on typical monsoon patterns)
Keep response under 200 words. Be specific to Pune geography.
<|assistant|>`;

  const payload = {
    model_id: process.env.WATSONX_MODEL_ID,
    project_id: process.env.WATSONX_PROJECT_ID,
    input: prompt,
    parameters: {
      decoding_method: "greedy",
      max_new_tokens: 400,
      min_new_tokens: 80,
      stop_sequences: ["<|user|>", "<|system|>"],
      repetition_penalty: 1.1,
      temperature: 0.3
    }
  };

  const response = await axios.post(
    `${process.env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );

  const generated = response.data.results?.[0]?.generated_text?.trim() || "Analysis unavailable.";
  return generated;
}

// ─── API Routes ─────────────────────────────────────────────────────────────

// GET /api/status — server health + live ngrok URL
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "online",
    localUrl: `http://localhost:${PORT}`,
    publicUrl: ngrokPublicUrl || "Tunnel not active",
    model: process.env.WATSONX_MODEL_ID,
    timestamp: new Date().toISOString()
  });
});

// GET /api/rain-data — live IMD station data
app.get("/api/rain-data", (req, res) => {
  try {
    const stations = generateLiveIMDData();
    const summary = getDistrictSummary(stations);
    const imdMessages = getIMDWarningMessages(summary);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      stations,
      imdMessages
    });
  } catch (err) {
    console.error("❌ Error generating IMD data:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai-analysis — watsonx.ai rainfall analysis
app.post("/api/ai-analysis", async (req, res) => {
  try {
    const stations = generateLiveIMDData();
    const summary = getDistrictSummary(stations);
    const imdMessages = getIMDWarningMessages(summary);

    console.log(`🤖 Requesting watsonx.ai analysis | Alert: ${summary.districtAlert}`);
    const analysis = await analyzeRainWithWatsonx(summary, stations, imdMessages);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      alertLevel: summary.districtAlert,
      analysis,
      model: process.env.WATSONX_MODEL_ID,
      summary,
      stations,
      imdMessages
    });
  } catch (err) {
    console.error("❌ watsonx.ai analysis error:", err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.errors?.[0]?.message || err.message,
      fallback: "AI analysis temporarily unavailable. Using IMD data only."
    });
  }
});

// GET /api/station/:id — single station data
app.get("/api/station/:id", (req, res) => {
  const stations = generateLiveIMDData();
  const station = stations.find(s => s.stationId === req.params.id.toUpperCase());
  if (!station) return res.status(404).json({ success: false, error: "Station not found" });
  res.json({ success: true, station });
});

// GET / — serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Start Server + ngrok Tunnel ────────────────────────────────────────────
const BORDER = "═".repeat(62);
const THIN   = "─".repeat(62);

app.listen(PORT, async () => {
  console.log(`\n${BORDER}`);
  console.log(`  🌧  PUNE RAIN RED ALERT SYSTEM`);
  console.log(`  India Meteorological Department + IBM watsonx.ai`);
  console.log(BORDER);
  console.log(`\n  ✅  Local URL  : http://localhost:${PORT}`);
  console.log(`  📡  Model      : ${process.env.WATSONX_MODEL_ID}`);
  console.log(`  🔑  Project ID : ${process.env.WATSONX_PROJECT_ID}`);
  console.log(`\n${THIN}`);
  console.log(`  🚇  Starting ngrok tunnel...`);
  console.log(THIN);

  try {
    const authToken = process.env.NGROK_AUTHTOKEN ||
                      "33Jqcou6HvfbAEgNa8h20QTpyWx_H4VDZ6RewUx96owPmgdC";

    const listener = await ngrok.forward({
      addr: PORT,
      authtoken: authToken,
    });

    ngrokPublicUrl = listener.url();

    console.log(`\n${"▓".repeat(62)}`);
    console.log(`  🌐  LIVE PUBLIC URL (share with anyone):`);
    console.log(`\n      👉  ${ngrokPublicUrl}`);
    console.log(`\n  📲  Anyone worldwide can access the dashboard at:`);
    console.log(`      ${ngrokPublicUrl}`);
    console.log(`\n  🔗  API Endpoints (public):`);
    console.log(`      ${ngrokPublicUrl}/api/rain-data`);
    console.log(`      ${ngrokPublicUrl}/api/status`);
    console.log(`${"▓".repeat(62)}\n`);
    console.log(`  ⚡  Press Ctrl+C to stop server & close tunnel\n`);

  } catch (err) {
    console.error(`\n  ⚠️  ngrok tunnel failed: ${err.message}`);
    console.log(`  ℹ️  App still runs locally at http://localhost:${PORT}`);
    console.log(`  ℹ️  Check NGROK_AUTHTOKEN in .env or ngrok config\n`);
  }
});

module.exports = app;
