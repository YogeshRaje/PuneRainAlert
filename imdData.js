/**
 * IMD (India Meteorological Department) Data Module
 * Provides simulated real-time rainfall data for Pune district talukas
 * In production, replace with actual IMD API calls
 */

const PUNE_TALUKAS = [
  "Pune City", "Haveli", "Maval", "Mulshi", "Velhe",
  "Bhor", "Purandar", "Baramati", "Indapur", "Daund",
  "Shirur", "Khed", "Junnar", "Ambegaon", "Khed"
];

const IMD_STATIONS = [
  { id: "PNQ", name: "Pune (Shivajinagar)", lat: 18.5308, lon: 73.8475, taluka: "Pune City" },
  { id: "LHK", name: "Lohegaon Airport", lat: 18.5822, lon: 73.9197, taluka: "Haveli" },
  { id: "MVL", name: "Maval", lat: 18.7695, lon: 73.5736, taluka: "Maval" },
  { id: "MLS", name: "Mulshi Dam", lat: 18.5246, lon: 73.5270, taluka: "Mulshi" },
  { id: "VLH", name: "Velhe", lat: 18.2609, lon: 73.6547, taluka: "Velhe" },
  { id: "BHR", name: "Bhor", lat: 18.1518, lon: 73.8443, taluka: "Bhor" },
  { id: "PRD", name: "Purandar", lat: 18.2760, lon: 74.0373, taluka: "Purandar" },
  { id: "BRM", name: "Baramati", lat: 18.1518, lon: 74.5773, taluka: "Baramati" },
  { id: "IDP", name: "Indapur", lat: 18.1174, lon: 75.0143, taluka: "Indapur" },
  { id: "DND", name: "Daund", lat: 18.4638, lon: 74.5803, taluka: "Daund" },
  { id: "SHR", name: "Shirur", lat: 18.8265, lon: 74.3747, taluka: "Shirur" },
  { id: "KHD", name: "Khed (Rajgurunagar)", lat: 18.9853, lon: 73.9740, taluka: "Khed" },
  { id: "JNR", name: "Junnar", lat: 19.2020, lon: 73.8774, taluka: "Junnar" },
  { id: "AMB", name: "Ambegaon", lat: 19.1040, lon: 73.7530, taluka: "Ambegaon" }
];

// Alert levels based on IMD rainfall thresholds (mm/hour)
const ALERT_LEVELS = {
  NORMAL: { level: "NORMAL", color: "#22c55e", threshold: 7.5, label: "Normal Rain", icon: "🌧" },
  YELLOW: { level: "YELLOW", color: "#eab308", threshold: 35.5, label: "Yellow Alert - Heavy Rain", icon: "⚠️" },
  ORANGE: { level: "ORANGE", color: "#f97316", threshold: 64.4, label: "Orange Alert - Very Heavy Rain", icon: "🔶" },
  RED: { level: "RED", color: "#ef4444", threshold: 115.5, label: "Red Alert - Extremely Heavy Rain", icon: "🚨" }
};

function classifyRainfall(rainfall_mm_per_hour) {
  if (rainfall_mm_per_hour >= ALERT_LEVELS.RED.threshold) return ALERT_LEVELS.RED;
  if (rainfall_mm_per_hour >= ALERT_LEVELS.ORANGE.threshold) return ALERT_LEVELS.ORANGE;
  if (rainfall_mm_per_hour >= ALERT_LEVELS.YELLOW.threshold) return ALERT_LEVELS.YELLOW;
  return ALERT_LEVELS.NORMAL;
}

// Simulate live IMD data — replace with actual IMD API in production
function generateLiveIMDData() {
  const now = new Date();
  const hour = now.getHours();
  
  // Simulate monsoon patterns — higher rainfall during afternoon/evening hours
  const monsoonMultiplier = (hour >= 13 && hour <= 21) ? 1.8 : 1.0;
  
  return IMD_STATIONS.map(station => {
    // Simulate spatially correlated rainfall (western ghats get more rain)
    const westGhatsBonus = (station.lon < 73.8) ? 40 : 0;
    const baseRain = Math.random() * 80 + westGhatsBonus;
    const rainfall = parseFloat((baseRain * monsoonMultiplier).toFixed(1));
    const alertInfo = classifyRainfall(rainfall);
    
    return {
      stationId: station.id,
      stationName: station.name,
      taluka: station.taluka,
      lat: station.lat,
      lon: station.lon,
      rainfall_mm_hr: rainfall,
      rainfall_24hr: parseFloat((rainfall * 5.2 + Math.random() * 30).toFixed(1)),
      alertLevel: alertInfo.level,
      alertColor: alertInfo.color,
      alertLabel: alertInfo.label,
      alertIcon: alertInfo.icon,
      humidity: Math.floor(70 + Math.random() * 25),
      temperature: parseFloat((19 + Math.random() * 6).toFixed(1)),
      windSpeed: parseFloat((10 + Math.random() * 40).toFixed(1)),
      windDirection: ["N", "NE", "E", "SE", "SW", "W", "NW"][Math.floor(Math.random() * 7)],
      visibility: rainfall > 64.4 ? "Poor" : rainfall > 35.5 ? "Moderate" : "Good",
      timestamp: now.toISOString(),
      source: "IMD Pune Meteorological Centre"
    };
  });
}

function getDistrictSummary(stations) {
  const redAlerts = stations.filter(s => s.alertLevel === "RED");
  const orangeAlerts = stations.filter(s => s.alertLevel === "ORANGE");
  const yellowAlerts = stations.filter(s => s.alertLevel === "YELLOW");
  const avgRainfall = stations.reduce((sum, s) => sum + s.rainfall_mm_hr, 0) / stations.length;
  const maxRainfall = Math.max(...stations.map(s => s.rainfall_mm_hr));
  const maxStation = stations.find(s => s.rainfall_mm_hr === maxRainfall);

  let districtAlert = "NORMAL";
  if (redAlerts.length > 0) districtAlert = "RED";
  else if (orangeAlerts.length > 0) districtAlert = "ORANGE";
  else if (yellowAlerts.length > 0) districtAlert = "YELLOW";

  return {
    districtAlert,
    totalStations: stations.length,
    redAlertCount: redAlerts.length,
    orangeAlertCount: orangeAlerts.length,
    yellowAlertCount: yellowAlerts.length,
    normalCount: stations.filter(s => s.alertLevel === "NORMAL").length,
    avgRainfall: parseFloat(avgRainfall.toFixed(1)),
    maxRainfall,
    maxRainfallStation: maxStation ? maxStation.stationName : "N/A",
    maxRainfallTaluka: maxStation ? maxStation.taluka : "N/A",
    redAlertAreas: redAlerts.map(s => s.taluka),
    orangeAlertAreas: orangeAlerts.map(s => s.taluka),
    timestamp: new Date().toISOString()
  };
}

function getIMDWarningMessages(summary) {
  const messages = [];
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  messages.push(`📡 IMD Pune Meteorological Centre | Bulletin: ${now} IST`);
  messages.push(`🌏 Pune District Alert Status: ${summary.districtAlert}`);

  if (summary.districtAlert === "RED") {
    messages.push("🚨 RED ALERT ISSUED: Extremely Heavy Rainfall (≥115.5 mm/hr) expected in parts of Pune district.");
    messages.push("⚠️  Citizens advised to stay indoors. Avoid low-lying areas, riverbanks & flood-prone zones.");
    messages.push("🚒 NDRF/SDRF teams on standby. Emergency helpline: 1078 | MSDMA: 1800-120-1099");
  } else if (summary.districtAlert === "ORANGE") {
    messages.push("🔶 ORANGE ALERT: Very Heavy Rainfall (64.5–115.4 mm/hr) forecast for Pune district.");
    messages.push("⚠️  Restrict outdoor movements. Traffic disruptions possible on Pune-Mumbai Expressway & NH48.");
  } else if (summary.districtAlert === "YELLOW") {
    messages.push("⚠️  YELLOW ALERT: Heavy Rainfall (35.6–64.4 mm/hr) expected over Pune district.");
    messages.push("🌧  Stay updated with latest IMD bulletins. Farmers advised against field operations.");
  } else {
    messages.push("✅ Normal monsoon activity. No major warnings at this time.");
  }

  if (summary.redAlertAreas.length > 0) {
    messages.push(`🔴 Red Alert Talukas: ${[...new Set(summary.redAlertAreas)].join(", ")}`);
  }
  messages.push(`📊 Max Rainfall: ${summary.maxRainfall} mm/hr at ${summary.maxRainfallStation} (${summary.maxRainfallTaluka})`);
  messages.push(`📈 District Average: ${summary.avgRainfall} mm/hr | Monitoring ${summary.totalStations} IMD stations`);

  return messages;
}

module.exports = {
  generateLiveIMDData,
  getDistrictSummary,
  getIMDWarningMessages,
  ALERT_LEVELS,
  IMD_STATIONS,
  PUNE_TALUKAS
};
