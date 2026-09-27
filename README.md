# 🛡️ AI Safe Network - Cyber Threat & Hardware DNS Guard

A real-time, multi-layered cyber security platform designed to detect, block, and monitor network threats, phishing attacks, unauthorized banking domains, and malicious web traffic using an ESP32 hardware gateway, Node.js AI threat engine, Chrome extension, and React monitoring dashboard.

---

## 🌟 Key Features

- **Hardware DNS Gateway (ESP32)**: Intercepts UDP DNS requests on Port 53 and blocks dangerous domains at the network layer via NXDOMAIN.
- **AI Threat Analysis Engine**: Evaluates domain entropy, typosquatting (Levenshtein distance), suspicious TLDs, and rule-based keyword patterns.
- **Strict Banking Compliance**: Enforces `.bank.in` domain verification for all banking keywords.
- **Chromium Security Extension**: Provides browser-level link risk scanning and active page protection.
- **Security Operations Dashboard**: Real-time traffic visualization, system health status, and live alert feeds via Socket.io.
- **Cloud Logging & Storage**: Asynchronous threat logging to Supabase database.

---

## 🚀 System Architecture

```text
[ Connected Devices ] ──(UDP DNS: 53)──► [ ESP32 Gateway ]
                                                 │
                                           HTTP POST /api/dns-query
                                                 ▼
[ React Dashboard ] ◄──(Socket.io)───── [ Node.js AI Backend ]
[ Chrome Extension ] ◄──(REST API)──────         │
                                                 ▼
                                        [ Supabase Cloud DB ]
```

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Socket.io, Axios, Supabase Client
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Shadcn UI, Recharts, Lucide Icons
- **Firmware**: ESP32 Microcontroller (C++/Arduino framework), WiFiUDP, ArduinoJson
- **Browser Extension**: Manifest V3, Web Extensions API, JavaScript

---

## 💻 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### 2. Start Frontend Dashboard
```bash
npm install
npm run dev
```

### 3. Load Browser Extension
1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the project root folder.

### 4. Deploy to Render
The repository includes a `render.yaml` specification for 1-click Render web service deployment.

---

## 📄 License

Distributed under the MIT License.
