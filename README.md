# 🌧 Pune Rain Red Alert System

> **Live rainfall monitoring for all 14 IMD stations across Pune district — powered by IBM watsonx.ai (granite-3-8b-instruct) with public ngrok tunnel.**

---

## 🚀 Features

| Feature | Detail |
|---|---|
| 📡 **IMD Data** | 14 official stations — Shivajinagar, Lohegaon, Mulshi Dam, Velhe, Bhor, Baramati, Indapur & more |
| 🚨 **Alert Levels** | Red (≥115.5 mm/hr) · Orange (64.5–115.4) · Yellow (35.6–64.4) · Normal |
| 🤖 **IBM watsonx.ai** | granite-3-8b-instruct — situation assessment + safety recommendations |
| 🗺 **SVG Map** | Pulsing station markers with hover tooltips, geo-mapped to Pune district |
| 📈 **Canvas Chart** | Bar chart with IMD threshold reference lines |
| 🌐 **ngrok Tunnel** | One-command public URL — share with anyone worldwide |
| 🔄 **Auto-refresh** | Dashboard auto-refreshes IMD data every 2 minutes |
| 🆘 **Emergency Contacts** | NDRF 1078 · Police 100 · Ambulance 108 · MSDMA · IMD Pune |

---

## 🗂 Project Structure

```
PuneRainAlert/
├── .env                       # IBM watsonx.ai keys + ngrok token (not committed)
├── package.json               # Dependencies
├── server.js                  # Express API + IBM watsonx.ai + ngrok tunnel
├── imdData.js                 # IMD stations, thresholds, bulletin logic
├── start-pune-rain-alert.bat  # One-click Windows launcher
└── public/
    ├── index.html             # Dashboard UI
    ├── app.js                 # Frontend JS (map, chart, AI panel, auto-refresh)
    └── style.css              # Dark IMD theme
```

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/YogeshRaje/PuneRainAlert.git
cd PuneRainAlert
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
# IBM watsonx.ai
WATSONX_API_KEY=your_ibm_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-3-8b-instruct

# ngrok tunnel
NGROK_AUTHTOKEN=your_ngrok_authtoken

# Server
PORT=3000
```

### 4. Run
```bash
# Option A — double-click (Windows)
start-pune-rain-alert.bat

# Option B — terminal
npm start
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Live dashboard UI |
| GET | `/api/rain-data` | All 14 IMD station data + district summary |
| POST | `/api/ai-analysis` | IBM watsonx.ai rainfall analysis |
| GET | `/api/status` | Server health + live ngrok public URL |
| GET | `/api/station/:id` | Single station — e.g. `/api/station/PNQ` |

---

## 🚨 IMD Alert Thresholds

| Alert | Rainfall | Action |
|---|---|---|
| 🔴 **Red** | ≥ 115.5 mm/hr | Stay indoors. NDRF/SDRF on standby. Call 1078 |
| 🟠 **Orange** | 64.5 – 115.4 mm/hr | Avoid travel. Traffic disruptions possible |
| 🟡 **Yellow** | 35.6 – 64.4 mm/hr | Stay updated. Farmers avoid field operations |
| 🟢 **Normal** | < 35.5 mm/hr | Normal monsoon activity |

---

## 📡 IMD Monitoring Stations

| ID | Station | Taluka |
|---|---|---|
| PNQ | Pune (Shivajinagar) | Pune City |
| LHK | Lohegaon Airport | Haveli |
| MVL | Maval | Maval |
| MLS | Mulshi Dam | Mulshi |
| VLH | Velhe | Velhe |
| BHR | Bhor | Bhor |
| PRD | Purandar | Purandar |
| BRM | Baramati | Baramati |
| IDP | Indapur | Indapur |
| DND | Daund | Daund |
| SHR | Shirur | Shirur |
| KHD | Khed (Rajgurunagar) | Khed |
| JNR | Junnar | Junnar |
| AMB | Ambegaon | Ambegaon |

---

## 🆘 Emergency Contacts

| Service | Number |
|---|---|
| NDRF / SDRF | **1078** |
| Police | **100** |
| Fire Brigade | **101** |
| Ambulance | **108** |
| MSDMA | **1800-120-1099** |
| IMD Pune | **020-26123456** |

---

## 🛠 Tech Stack

- **Backend**: Node.js · Express.js · IBM watsonx.ai SDK
- **AI Model**: `ibm/granite-3-8b-instruct` via IBM watsonx.ai
- **Tunnel**: `@ngrok/ngrok` (programmatic ngrok v3)
- **Frontend**: Vanilla HTML · CSS · JavaScript (no frameworks)
- **Data**: IMD Pune Meteorological Centre (14 stations)

---<img width="1915" height="1129" alt="image" src="https://github.com/user-attachments/assets/7f6af801-8899-4e5f-bb06-6a2c0f4c611b" />

<img width="940" height="524" alt="image" src="https://github.com/user-attachments/assets/deabaa79-5208-421b-96e4-867e8a954617" />


<img width="940" height="491" alt="image" src="https://github.com/user-attachments/assets/be64f915-fe78-40cb-b302-a2ebf64c8191" />




## 📄 License

MIT — Maharashtra Rain Alert System
