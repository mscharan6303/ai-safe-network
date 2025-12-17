import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

const CodeSection = () => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const codeBlocks = {
    esp32: `#include <WiFi.h>
#include <DNSServer.h>
#include <HTTPClient.h>

const char* ssid = "AI_Safe_Network";
const char* password = "12345678";

DNSServer dnsServer;
const byte DNS_PORT = 53;

void setup() {
  Serial.begin(115200);
  WiFi.softAP(ssid, password);
  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());
  Serial.println("ESP32 DNS Filter Active");
}

String analyzeDomain(String domain) {
  HTTPClient http;
  http.begin("http://YOUR_SERVER_IP:8000/analyze");
  http.addHeader("Content-Type", "application/json");
  String payload = "{\\"domain\\":\\"" + domain + "\\"}";
  http.POST(payload);
  return http.getString();
}

void loop() {
  dnsServer.processNextRequest();
}`,
    fastapi: `from fastapi import FastAPI
import joblib

app = FastAPI()
model = joblib.load("model.pkl")

def extract_features(domain):
    return [
        len(domain),
        domain.count('-'),
        domain.count('.'),
        int("free" in domain),
        int("bet" in domain),
        int("win" in domain),
    ]

@app.post("/analyze")
def analyze(data: dict):
    domain = data["domain"]
    features = extract_features(domain)
    risk = model.predict_proba([features])[0][1] * 100

    return {
        "domain": domain,
        "risk_score": risk,
        "action": "BLOCK" if risk > 80 else "ALLOW"
    }`,
    train: `import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv("data.csv")

def extract(domain):
    return [
        len(domain),
        domain.count('-'),
        domain.count('.'),
        int("free" in domain),
        int("bet" in domain),
        int("win" in domain),
    ]

X = df["domain"].apply(extract).tolist()
y = df["label"]

model = RandomForestClassifier()
model.fit(X, y)
joblib.dump(model, "model.pkl")
print("Model trained & saved")`,
    dataset: `domain,label
google.com,0
facebook.com,0
github.com,0
stackoverflow.com,0
youtube.com,0
free-money-win.xyz,1
bet-now-casino.com,1
win-big-prize.net,1
crypto-invest-now.xyz,1
adult-content-free.com,1`,
  };

  const handleCopy = (tab: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Complete <span className="text-gradient-cyber">Source Code</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Production-ready code for ESP32 firmware, FastAPI backend, and ML model training
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="esp32" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary p-1 rounded-xl mb-4">
              <TabsTrigger value="esp32" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                ESP32
              </TabsTrigger>
              <TabsTrigger value="fastapi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                FastAPI
              </TabsTrigger>
              <TabsTrigger value="train" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                Training
              </TabsTrigger>
              <TabsTrigger value="dataset" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                Dataset
              </TabsTrigger>
            </TabsList>

            {Object.entries(codeBlocks).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <div className="relative card-cyber overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive/70" />
                      <div className="w-3 h-3 rounded-full bg-warning/70" />
                      <div className="w-3 h-3 rounded-full bg-success/70" />
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {key === "esp32" ? "esp32_dns.ino" :
                       key === "fastapi" ? "server.py" :
                       key === "train" ? "train.py" : "data.csv"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(key, code)}
                      className="h-8"
                    >
                      {copiedTab === key ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Code */}
                  <pre className="p-4 overflow-x-auto max-h-96">
                    <code className="text-sm font-mono text-secondary-foreground leading-relaxed">
                      {code}
                    </code>
                  </pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default CodeSection;
