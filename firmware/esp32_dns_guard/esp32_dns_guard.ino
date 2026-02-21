#include <WiFi.h>
#include <WiFiUdp.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
const char* ssid = "RAMESH";
const char* password = "Ramesh1$";
// IMPORTANT: Replace with the IP address of the machine running the Node.js backend
// Do NOT use localhost. Use your computer's local LAN IP (e.g., 192.168.1.X)
const char* backend_url = "https://ai-safe-network-backend.onrender.com/api/analyze";

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
  
  // 1. Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("ESP32 IP address: ");
  Serial.println(WiFi.localIP());

  // 2. Start UDP Server for DNS Interception
  udpDNSServer.begin(DNS_PORT);
  Serial.println("DNS Server started on port 53");
  Serial.println("Set your device's DNS to: " + WiFi.localIP().toString());
  Serial.println("Backend URL: " + String(backend_url));
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
        Serial.println("-> BLOCKING: Sending NXDOMAIN...");
        sendNXDomainResponse(packetSize);
        Serial.println("-> Blocked!");
      }
    }
  }
}

// Forward DNS query to upstream DNS server and relay response
void forwardToUpstreamDNS(byte* queryPacket, int queryLen) {
  Serial.println("Forwarding to 8.8.8.8...");
  
  udpDNSClient.beginPacket(upstream_dns_ip, upstream_dns_port);
  udpDNSClient.write(queryPacket, queryLen);
  udpDNSClient.endPacket();
  
  // Wait for response from upstream DNS
  delay(200);
  
  int responseSize = udpDNSClient.parsePacket();
  if (responseSize > 0) {
    byte responseBuffer[MAX_PACKET_SIZE];
    udpDNSClient.read(responseBuffer, MAX_PACKET_SIZE);
    
    // Send response back to client
    udpDNSServer.beginPacket(clientIP, clientPort);
    udpDNSServer.write(responseBuffer, responseSize);
    udpDNSServer.endPacket();
    
    Serial.println("-> Response relayed to client");
  } else {
    Serial.println("-> No response from upstream DNS");
  }
}

// Send Blackhole Response (return 0.0.0.0 to prevent device from skipping to multiple DNS servers)
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

  // Copy exactly original query up to end of question section
  for (int i = 0; i < qdEnd && i < 512; i++) {
    response[i] = packetBuffer[i];
  }

  // Set Response Flags to NO ERROR (Success), so the device doesn't try a backup DNS
  response[2] = packetBuffer[2] | 0x80; // Set QR=1
  response[3] = (packetBuffer[3] & 0xF0) | 0x00; // Set RCODE=0 (Success)
  response[3] |= 0x80; // Ensure RA=1 (Recursion Available)
  
  // Force Answer Counts
  response[6] = 0x00;
  response[7] = 0x01; // 1 Answer
  response[8] = 0x00;
  response[9] = 0x00;
  response[10] = 0x00;
  response[11] = 0x00;
  
  int rLen = qdEnd;
  int qType = (packetBuffer[qdEnd-4] << 8) | packetBuffer[qdEnd-3];
  
  if (qType == 1 && rLen + 16 <= 512) { // A Record (IPv4)
      response[rLen++] = 0xC0; response[rLen++] = 0x0C; // Name pointer
      response[rLen++] = 0x00; response[rLen++] = 0x01; // Type A
      response[rLen++] = 0x00; response[rLen++] = 0x01; // Class IN
      response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x3C; // TTL (60s)
      response[rLen++] = 0x00; response[rLen++] = 0x04; // RDLENGTH 4
      response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; // RDATA (0.0.0.0)
  } else if (qType == 28 && rLen + 28 <= 512) { // AAAA Record (IPv6)
      response[rLen++] = 0xC0; response[rLen++] = 0x0C; // Name pointer
      response[rLen++] = 0x00; response[rLen++] = 0x1C; // Type AAAA
      response[rLen++] = 0x00; response[rLen++] = 0x01; // Class IN
      response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x3C; // TTL (60s)
      response[rLen++] = 0x00; response[rLen++] = 0x10; // RDLENGTH 16
      for(int j=0; j<16; j++) response[rLen++] = 0x00; // RDATA (::)
  } else {
      // For any other record type, return 0 answers to successfully ignore it
      response[7] = 0x00; 
  }
  
  // Send 0.0.0.0 success response
  udpDNSServer.beginPacket(clientIP, clientPort);
  udpDNSServer.write(response, rLen);
  udpDNSServer.endPacket();
  
  Serial.println("-> Blocked (A Record pointing to 0.0.0.0)");
}

#include <WiFiClientSecure.h>

String checkDomainWithAI(String domain) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    return "ALLOW";
  }
  
  WiFiClientSecure client;
  client.setInsecure(); // Required for Render/Cloud endpoints without certificate bundles
  
  HTTPClient http;
  http.begin(client, backend_url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  // Create JSON Payload
  // Includes Device Hash (using MAC address)
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  
  StaticJsonDocument<200> doc;
  doc["domain"] = domain;
  doc["source"] = "esp32";
  doc["deviceHash"] = mac;
  doc["deepScan"] = false; // MUST be false to avoid DNS client timeout
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  Serial.print("Sending to HTTPS backend: ");
  Serial.println(requestBody);
  
  // Send POST
  int httpResponseCode = http.POST(requestBody);
  
  String action = "ALLOW"; // Default to allow on error
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Backend response (HTTPS): ");
    Serial.println(response);
    
    // Parse response - look for "action" in JSON
    if (response.indexOf("HARD-BLOCK") >= 0) {
      action = "HARD-BLOCK";
    } else if (response.indexOf("SOFT-BLOCK") >= 0) {
      action = "SOFT-BLOCK";
    } else {
      action = "ALLOW";
    }
  } else {
    Serial.print("HTTPS Error: ");
    Serial.println(httpResponseCode);
    // On HTTP error, default to ALLOW for reliability during setup
    action = "ALLOW";
  }
  
  http.end();
  return action;
}
