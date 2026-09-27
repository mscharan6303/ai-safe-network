#include <WiFi.h>
#include <WiFiUdp.h>
#include <HTTPClient.h>
#include "esp_netif.h" // Required for Network Address Port Translation

// --- CONFIGURATION ---
// Router (STA) to get internet access (Keep it connected to your home router)
const char* ssid = "Vagdevi";
const char* password = "Mahendra2005";

// ESP32 Access Point (AP) for devices to connect to directly
const char* ap_ssid = "AI_Safe_Network";
const char* ap_password = "password123";

// IMPORTANT: Replace with the IP address of the machine running the Node.js backend
// Do NOT use localhost. Use your computer's local LAN IP (e.g., 192.168.1.X)
const char* backend_url = "http://192.168.0.101:3000/api/dns-query";

// Upstream DNS server (Google DNS)
const char* upstream_dns_ip = "8.8.8.8";
const int upstream_dns_port = 53;

WiFiUDP udpDNSClient;  // For forwarding to upstream DNS
WiFiUDP udpDNSServer;  // For receiving DNS queries from devices
const int DNS_PORT = 53;
const int MAX_PACKET_SIZE = 512;
byte packetBuffer[MAX_PACKET_SIZE];

// Client IP address (to send response back)
IPAddress clientIP;
uint16_t clientPort;

void setup() {
  Serial.begin(115200);
  
  // 1. Connect to WiFi Router (STA Mode) for Internet
  Serial.print("Connecting to WiFi Router");
  WiFi.mode(WIFI_AP_STA);
  // Clear any previously saved configuration that might cause self-connection loops
  WiFi.disconnect(true);
  delay(100);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected to Router!");
  Serial.print("ESP32 STA IP address: ");
  Serial.println(WiFi.localIP());

  // 1b. Start Access Point (AP Mode) for Devices to connect
  Serial.print("Starting AP Network: ");
  Serial.println(ap_ssid);
  WiFi.softAP(ap_ssid, ap_password);
  Serial.print("AP IP address (DNS Server): ");
  Serial.println(WiFi.softAPIP());

  // 1c. Enable NAT (Network Address Port Translation) to route internet traffic
  // This forwards TCP/UDP traffic from connected AP devices out through the STA router connection
  esp_netif_t *netif = esp_netif_get_handle_from_ifkey("WIFI_AP_DEF");
  if (netif) {
    esp_netif_napt_enable(netif);
    Serial.println("NAT enabled safely. Devices will have internet access.");
  } else {
    Serial.println("NAT enable failed! Devices may not have internet.");
  }

  // 2. Start UDP Server for DNS Interception
  udpDNSServer.begin(DNS_PORT);
  Serial.println("DNS Server started on port 53");
  Serial.println("Devices connecting to '" + String(ap_ssid) + "' will automatically use this DNS.");
  
  // 3. Disable WiFi Power Management for Low Latency
  WiFi.setSleep(false);
  Serial.println("Low Latency mode enabled");
}

// Helper to extract domain name from DNS query packet
String extractDomain(byte* buffer, int len) {
  String domain = "";
  int i = 12; // Skip 12-byte DNS header
  while (i < len) {
    int labelLen = buffer[i];
    if (labelLen == 0) break;
    if (domain.length() > 0) domain += ".";
    for (int j = 0; j < labelLen; j++) {
      i++;
      if (i < len) domain += (char)buffer[i];
    }
    i++;
  }
  return domain;
}

void loop() {
  // Check for DNS packets from devices
  int packetSize = udpDNSServer.parsePacket();
  if (packetSize > 0) {
    // Store client info for response
    clientIP = udpDNSServer.remoteIP();
    clientPort = udpDNSServer.remotePort();
    
    udpDNSServer.read(packetBuffer, MAX_PACKET_SIZE);
    
    // Extract Domain
    String domain = extractDomain(packetBuffer, packetSize);
    
    if (domain.length() > 0) {
      Serial.println("=================");
      Serial.print("DNS Query for: ");
      Serial.println(domain);
      Serial.print("From: ");
      Serial.print(clientIP);
      Serial.print(":");
      Serial.println(clientPort);

      // Ask Backend AI for Decision
      String action = checkDomainWithAI(domain);
      
      Serial.print("AI Decision: [");
      Serial.print(action);
      Serial.println("]");
      
      if (action == "ALLOW") {
        // Forward to upstream DNS (8.8.8.8) and relay response
        Serial.println("-> ALLOW: Forwarding to upstream DNS...");
        forwardToUpstreamDNS(packetBuffer, packetSize);
      } else {
        // Block: Send NXDOMAIN response
        Serial.println("-> BLOCKING (" + action + "): Sending NXDOMAIN...");
        sendNXDomainResponse(packetSize);
        Serial.println("-> Blocked successfully!");
      }
    }
  }
}

// Forward DNS query to upstream DNS server and relay response
void forwardToUpstreamDNS(byte* queryPacket, int queryLen) {
  udpDNSClient.beginPacket(upstream_dns_ip, upstream_dns_port);
  udpDNSClient.write(queryPacket, queryLen);
  udpDNSClient.endPacket();
  
  // Wait for response from upstream DNS with high-resolution polling
  unsigned long start = millis();
  int responseSize = 0;
  
  // Poll for up to 500ms (standard DNS timeout)
  while (millis() - start < 500) {
    responseSize = udpDNSClient.parsePacket();
    if (responseSize > 0) break;
    delay(10); // Small poll interval
  }
  
  if (responseSize > 0) {
    byte responseBuffer[MAX_PACKET_SIZE];
    int readLen = udpDNSClient.read(responseBuffer, MAX_PACKET_SIZE);
    
    // Send response back to client
    udpDNSServer.beginPacket(clientIP, clientPort);
    udpDNSServer.write(responseBuffer, readLen);
    udpDNSServer.endPacket();
    
    Serial.println("-> Response relayed (" + String(millis() - start) + "ms)");
  } else {
    Serial.println("-> Upstream Timeout (No response from 8.8.8.8)");
  }
}

// Send a proper NXDOMAIN (Non-Existent Domain) response
void sendNXDomainResponse(int packetSize) {
  byte response[512];
  
  // Find the end of the question section in the original query
  int qdEnd = 12;
  while (qdEnd < packetSize) {
    if (packetBuffer[qdEnd] == 0) {
      qdEnd += 5; // 1 byte for null label + 2 bytes QTYPE + 2 bytes QCLASS
      break;
    }
    qdEnd += packetBuffer[qdEnd] + 1; // jump to next label
  }
  if (qdEnd > packetSize) qdEnd = packetSize;

  // Copy exactly original query header and question
  for (int i = 0; i < qdEnd && i < 512; i++) {
    response[i] = packetBuffer[i];
  }

  // Set Response Flags
  response[2] = packetBuffer[2] | 0x80; // Set QR=1 (Response)
  
  // Set RCODE=3 (NXDOMAIN) - This is the standard "Domain does not exist" error
  // This is better than 0.0.0.0 as it tells the device the domain is invalid.
  response[3] = (packetBuffer[3] & 0xF0) | 0x03; 
  response[3] |= 0x80; // RA=1 (Recursion Available)
  
  // Ensure Answer Counts are 0 for NXDOMAIN
  response[6] = 0x00;
  response[7] = 0x00; // 0 Answers
  response[8] = 0x00;
  response[9] = 0x00;
  response[10] = 0x00;
  response[11] = 0x00;
  
  // Send the NXDOMAIN response
  udpDNSServer.beginPacket(clientIP, clientPort);
  udpDNSServer.write(response, qdEnd);
  udpDNSServer.endPacket();
  
  Serial.println("-> Blocked (Sent NXDOMAIN Error)");
}

String checkDomainWithAI(String domain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return "ALLOW";
  }
  
  HTTPClient http;
  http.begin(backend_url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(800); // CRITICAL: DNS clients time out fast. AI must respond < 1s.
  
  // Create JSON Payload manually without ArduinoJson
  // Includes Device Hash (using MAC address)
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  
  String requestBody = "{\"domain\":\"" + domain + "\",\"source\":\"esp32\",\"deviceHash\":\"" + mac + "\",\"deepScan\":false}";
  
  Serial.print("Sending to backend: ");
  Serial.println(requestBody);
  
  // Send POST
  int httpResponseCode = http.POST(requestBody);
  
  String action = "ALLOW"; // Default to allow on error
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Backend raw response: ");
    Serial.println(response);
    
    // Parse response - extract numeric aiScore from JSON directly
    int aiScore = 0;
    int scoreIndex = response.indexOf("\"aiScore\"");
    if (scoreIndex >= 0) {
      int colonIndex = response.indexOf(':', scoreIndex);
      if (colonIndex >= 0) {
        int endIndex = response.indexOf(',', colonIndex);
        if (endIndex < 0) endIndex = response.indexOf('}', colonIndex);
        if (endIndex >= 0) {
           String scoreStr = response.substring(colonIndex + 1, endIndex);
           scoreStr.trim();
           aiScore = scoreStr.toInt();
        }
      }
    }
    
    Serial.print("AI Score Received: ");
    Serial.println(aiScore);

    // Decide locally based on AI Score (Block if score >= 50)
    if (aiScore >= 50) {
      action = "BLOCK";
    } else {
      action = "ALLOW";
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
    // On connection error, default to ALLOW so the internet doesn't break
    action = "ALLOW"; 
  }
  
  http.end();
  return action;
}
