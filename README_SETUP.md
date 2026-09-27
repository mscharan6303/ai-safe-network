# AI Safe Network - System Setup Guide

This project has been upgraded to a full real-time network security platform.
It consists of three parts:
1. **Backend Server** (Node.js + Socket.io) - The brain that runs analysis and alerts.
2. **Frontend Dashboard** (Vite + React) - The UI for monitoring and manual testing.
3. **ESP32 Firmware** - The network gateways code.

## 1. Setup Backend

The backend handles domain analysis, logging to Supabase, and real-time WebSocket events.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`.

## 2. Setup Frontend

The frontend now connects to the local backend for analysis and live monitoring.

1. Open a new terminal and navigate to the root:
   ```bash
   cd ..
   ```
2. Install new dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080` (or the port shown).

## 3. Setup ESP32

1. Open `firmware/esp32_dns_guard.ino` in Arduino IDE.
2. Install the **ArduinoJson** library via Library Manager.
3. Edit the following lines at the top of the file:
   - `ssid`: Your WiFi Name.
   - `password`: Your WiFi Password.
   - `backend_url`: Replace `192.168.1.X` with your computer's local IP address.
4. Upload to your ESP32.
5. Set your computer or phone's DNS to the ESP32's IP address (shown in Serial Monitor) to test blocking!

## Architecture Details

- **Real-time Engine**: Uses Socket.io to push analysis results instantly to the dashboard.
- **AI Analysis**: A heuristic engine runs in the backend to score domains based on keywords, entropy, and length.
- **Database**: Logs are asynchronously synced to Supabase for historical records.
- **Security**: Device IDs (MAC addresses) are hashed before sending to the backend to preserve privacy.
