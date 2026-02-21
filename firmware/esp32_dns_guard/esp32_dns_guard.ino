#include <WiFi.h>
#include <WiFiUdp.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// --- CONFIGURATION ---
const char* ssid = "RAMESH";
const char* password = "Ramesh1$";

// Cloud Backend URL (Render uses HTTPS)
const char* backend_url = "https://ai-safe-network-backend.onrender.com/api/dns-query";

// Upstream DNS server (Google DNS)
const char* upstream_dns_ip = "8.8.8.8";
const int upstream_dns_port = 53;

WiFiUDP udpDNSClient;
WiFiUDP udpDNSServer;
const int DNS_PORT = 53;
const int MAX_PACKET_SIZE = 512;
byte packetBuffer[MAX_PACKET_SIZE];

IPAddress clientIP;
uint16_t clientPort;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- AI SAFE NETWORK ESP32 STARTING ---");
  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(1000);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[SUCCESS] WiFi Connected!");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[FAIL] WiFi Connection Failed. Please check SSID/Password.");
  }

  udpDNSServer.begin(DNS_PORT);
  Serial.println("DNS Interceptor running on Port 53");
  Serial.print("Target Backend: ");
  Serial.println(backend_url);
}

String extractDomain(byte* buffer, int len) {
  String domain = "";
  int i = 12;
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

String queryAI(String domain) {
  if (WiFi.status() != WL_CONNECTED) return "ALLOW";

  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate verification for Render
  
  HTTPClient http;
  http.begin(client, backend_url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<200> doc;
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  doc["domain"] = domain;
  doc["deviceHash"] = mac;
  
  String body;
  serializeJson(doc, body);
  
  Serial.print("Cloud Analysis: ");
  Serial.print(domain);
  
  int code = http.POST(body);
  String action = "ALLOW";
  
  if (code > 0) {
    String resp = http.getString();
    if (resp.indexOf("HARD-BLOCK") >= 0) action = "HARD-BLOCK";
    else if (resp.indexOf("SOFT-BLOCK") >= 0) action = "SOFT-BLOCK";
    Serial.print(" -> Response: ");
    Serial.println(action);
  } else {
    Serial.print(" -> HTTPS Error: ");
    Serial.println(code);
  }
  
  http.end();
  return action;
}

void forwardToUpstreamDNS(byte* query, int len) {
  udpDNSClient.beginPacket(upstream_dns_ip, upstream_dns_port);
  udpDNSClient.write(query, len);
  udpDNSClient.endPacket();
  
  unsigned long start = millis();
  while (millis() - start < 500) {
    int size = udpDNSClient.parsePacket();
    if (size > 0) {
      byte resp[MAX_PACKET_SIZE];
      udpDNSClient.read(resp, MAX_PACKET_SIZE);
      udpDNSServer.beginPacket(clientIP, clientPort);
      udpDNSServer.write(resp, size);
      udpDNSServer.endPacket();
      return;
    }
  }
}

void sendNXDomainResponse(int packetSize) {
  byte response[512];
  int qdEnd = 12;
  while (qdEnd < packetSize) {
    if (packetBuffer[qdEnd] == 0) { qdEnd += 5; break; }
    qdEnd += packetBuffer[qdEnd] + 1;
  }
  if (qdEnd > packetSize) qdEnd = packetSize;
  for (int i = 0; i < qdEnd && i < 512; i++) response[i] = packetBuffer[i];

  response[2] = packetBuffer[2] | 0x80;
  response[3] = (packetBuffer[3] & 0xF0) | 0x80; // RA=1
  response[6] = 0x00; response[7] = 0x01; // 1 Answer
  
  int rLen = qdEnd;
  int qType = (packetBuffer[qdEnd-4] << 8) | packetBuffer[qdEnd-3];
  if (qType == 1 && rLen + 16 <= 512) {
      response[rLen++] = 0xC0; response[rLen++] = 0x0C;
      response[rLen++] = 0x00; response[rLen++] = 0x01;
      response[rLen++] = 0x00; response[rLen++] = 0x01;
      response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x3C;
      response[rLen++] = 0x00; response[rLen++] = 0x04;
      response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00; response[rLen++] = 0x00;
  } else {
      response[7] = 0x00;
  }
  
  udpDNSServer.beginPacket(clientIP, clientPort);
  udpDNSServer.write(response, rLen);
  udpDNSServer.endPacket();
}

void loop() {
  int size = udpDNSServer.parsePacket();
  if (size > 0) {
    clientIP = udpDNSServer.remoteIP();
    clientPort = udpDNSServer.remotePort();
    udpDNSServer.read(packetBuffer, MAX_PACKET_SIZE);
    
    String domain = extractDomain(packetBuffer, size);
    if (domain.length() > 0) {
      String action = queryAI(domain);
      if (action == "ALLOW") {
        forwardToUpstreamDNS(packetBuffer, size);
      } else {
        Serial.println(" !!! BLOCKED !!!");
        sendNXDomainResponse(size);
      }
    }
  }
}
