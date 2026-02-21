# ESP32 DNS Guard - How to Test

## Step 1: Upload New Firmware to ESP32

1. Open Arduino IDE
2. Open the folder: `firmware/esp32_dns_guard/` (the .ino file inside)
3. Connect your ESP32 via USB (COM4)
4. Click Upload button (→)

## Step 2: Configure Device to Use ESP32 as DNS

On your phone or laptop:

**For Android:**
- Settings → WiFi → Long press your network → Modify network
- Set IP settings to "Static"
- Primary DNS: `192.168.1.8`
- Secondary DNS: `8.8.8.8`

**For Windows:**
- Control Panel → Network and Internet → Network Connections
- Right-click WiFi → Properties → Internet Protocol Version 4
- Use the following DNS:
  - Preferred: `192.168.1.8`
  - Alternate: `8.8.8.8`

**For iOS:**
- Settings → WiFi → Click (i) next to your network
- Configure DNS → Manual
- Add DNS: `192.168.1.8`

## Step 3: Test Blocking

1. Make sure your device uses ESP32 as DNS (192.168.1.8)
2. Open a web browser
3. Visit a malicious website like: `fake-bank-alert.com` or `free-bitcoin-doubler.xyz`

**Expected Result:**
- The website should NOT load (blocked!)
- In Arduino Serial Monitor, you should see:
  - "DNS Query for: fake-bank-alert.com"
  - "AI Decision: [HARD-BLOCK]"
  - "-> BLOCKING: Sending NXDOMAIN..."

## Troubleshooting

If blocking doesn't work, check:
1. ESP32 is connected to WiFi (SSID: RAMESH)
2. ESP32 IP is 192.168.1.8
3. Backend is running on your computer
4. Check Arduino Serial Monitor for debug messages
