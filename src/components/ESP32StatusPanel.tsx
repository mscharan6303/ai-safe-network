import { Cpu, Wifi, WifiOff, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const ESP32StatusPanel = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const apiEndpoint = `https://wrkenecvxvepeqeblprk.supabase.co/functions/v1/analyze-domain`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const esp32Code = `#include <WiFi.h>
#include <HTTPClient.h>
#include <DNSServer.h>
#include <ArduinoJson.h>

const char* ssid = "AI_Safe_Network";
const char* password = "12345678";
const char* API_URL = "${apiEndpoint}";

DNSServer dnsServer;
const byte DNS_PORT = 53;

void setup() {
  Serial.begin(115200);
  WiFi.softAP(ssid, password);
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  Serial.println("ESP32 DNS Filter Started");
  Serial.println(WiFi.softAPIP());
}

String analyzeDomain(String domain) {
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\\"domain\\":\\"" + domain + "\\",\\"source\\":\\"esp32\\"}";
  int code = http.POST(payload);
  
  if (code == 200) {
    String response = http.getString();
    http.end();
    
    StaticJsonDocument<512> doc;
    deserializeJson(doc, response);
    return doc["action"].as<String>();
  }
  
  http.end();
  return "ALLOW"; // Default on error
}

void loop() {
  dnsServer.processNextRequest();
  // Add domain interception logic here
}`;

  return (
    <div className="card-cyber p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">ESP32 Integration</h3>
            <p className="text-sm text-muted-foreground">Hardware DNS filter setup</p>
          </div>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="mb-6">
        <label className="text-sm text-muted-foreground mb-2 block">API Endpoint</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-3 bg-secondary rounded-lg font-mono text-xs overflow-x-auto">
            {apiEndpoint}
          </code>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => copyToClipboard(apiEndpoint, 'API Endpoint')}
          >
            {copied === 'API Endpoint' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Request Format */}
      <div className="mb-6">
        <label className="text-sm text-muted-foreground mb-2 block">Request Format</label>
        <div className="bg-secondary/50 rounded-lg p-4 font-mono text-xs">
          <div className="text-muted-foreground mb-1">POST /analyze-domain</div>
          <pre className="text-foreground overflow-x-auto">{`{
  "domain": "example.com",
  "deviceId": "optional-device-id",
  "source": "esp32"
}`}</pre>
        </div>
      </div>

      {/* Response Format */}
      <div className="mb-6">
        <label className="text-sm text-muted-foreground mb-2 block">Response Format</label>
        <div className="bg-secondary/50 rounded-lg p-4 font-mono text-xs">
          <pre className="text-foreground overflow-x-auto">{`{
  "domain": "example.com",
  "riskScore": 25,
  "threatLevel": "low",
  "action": "ALLOW",
  "category": "general"
}`}</pre>
        </div>
      </div>

      {/* ESP32 Code */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            ESP32 Firmware Code
          </label>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => copyToClipboard(esp32Code, 'ESP32 Code')}
          >
            {copied === 'ESP32 Code' ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <div className="bg-[#0d1117] rounded-lg p-4 font-mono text-xs max-h-[300px] overflow-y-auto">
          <pre className="text-green-400 whitespace-pre-wrap">{esp32Code}</pre>
        </div>
      </div>
    </div>
  );
};

export default ESP32StatusPanel;
