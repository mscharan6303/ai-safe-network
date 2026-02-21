import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import notifier from 'node-notifier';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Global State
let isProtectionActive = true;
const domainCache = new Map<string, any>();

// Initialize Supabase
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Helper: Typosquatting distance
function levenshtein(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

// Helper: Entropy
function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

const KEYWORD_RULES = {
  gambling: ["bet", "betting", "casino", "slot", "slots", "poker", "roulette", "jackpot", "lottery", "lotto", "spinwin", "winmoney", "fastwin"],
  scam: ["earnmoney", "quickmoney", "freecash", "makemoneyfast", "getrich", "workfromhome", "onlinejob", "dailyincome", "easyincome", "doublemoney", "scam", "fraud", "fake", "phishing", "trap", "clickbait"],
  phishing: ["login", "verify", "secure", "account", "suspended", "password", "reset", "confirm", "update", "billing", "signin", "urgent", "immediate", "verify-now", "login-now", "secure-verify", "account-verify", "password-reset", "verify-identity", "verify-account", "update-payment", "verify-payment"],
  fake_apps: ["mod", "modapk", "cracked", "hacktool", "premium-unlocked", "free-premium", "apk-download", "patched", "license-bypass"],
  malware: ["malware", "virus", "trojan", "spyware", "keylogger", "rat", "payload", "backdoor", "rootkit", "exe", "dmg", "zip"],
  adult: ["porn", "xxx", "adult", "sex", "nude", "camgirl", "escort", "erotic"],
  social_scam: ["giveaway", "claim-now", "free-offer", "limited-offer", "click-now", "bonus", "reward", "survey-win", "free-gift", "winner", "congratulations"],
  fraud: ["upi-refund", "bank-alert", "kyc-update", "loan-approval", "creditcard-offer", "instant-loan", "verify-upi", "bank-alert", "account-alert", "suspicious-activity"],
  crypto_scam: ["crypto", "bitcoin", "doubler", "forex", "mining", "ethereum", "btc", "cryptocurrency", "bitcoin-doubler", "free-bitcoin", "crypto-mining", "invest-crypto", "guaranteed-returns", "airdrop"],
  medium_risk: ["free", "bonus", "offer", "deal", "cheap", "unlock", "trial", "unlimited", "download-now"]
};

const BRAND_WATCHLIST = ["google", "facebook", "amazon", "apple", "microsoft", "netflix", "paypal", "instagram", "whatsapp", "twitter", "linkedin", "youtube", "gmail", "outlook", "office"];
const WHITELIST_DOMAINS = [
  "google.com", "github.com", "microsoft.com", "openai.com", "amazon.com", "amazon.in", 
  "wikipedia.org", "stackoverflow.com", "gov.in", "nic.in", "youtube.com", "apple.com",
  "facebook.com", "instagram.com", "twitter.com", "linkedin.com", "whatsapp.com",
  "netflix.com", "spotify.com", "gmail.com", "outlook.com", "office.com", "zoom.us",
  "slack.com", "discord.com", "reddit.com", "medium.com", "quora.com", "canvas",
  "instructure.com", "blackboard.com", "ucla.edu", "mit.edu", "stanford.edu",
  "bitly.com", "t.co", "tinyurl.com", "dropbox.com", "drive.google.com", "adobe.com",
  "vercel.app", "onrender.com", "supabase.co"
];

function analyzeUrlLogic(urlStr: string, isBackgroundData: boolean = false) {
  let domain = "";
  let fullPath = "";
  
  try {
    if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
    const u = new URL(urlStr);
    domain = u.hostname.toLowerCase();
    fullPath = (u.pathname + u.search).toLowerCase();
  } catch (e) {
    domain = urlStr.toLowerCase();
  }
  
  // 0. Master Project Bypass
  if (domain.includes('vercel.app') || domain.includes('onrender.com') || domain.includes('supabase.co')) {
    return {
        domain,
        fullUrl: urlStr,
        riskScore: 0,
        threatLevel: "safe",
        action: "ALLOW",
        category: "internal_system",
        features: { isWhitelisted: true }
      };
  }

  // 1. Whitelist Check
  const isWhitelisted = WHITELIST_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
  if (isWhitelisted) {
    return {
      domain,
      fullUrl: urlStr,
      riskScore: 0,
      threatLevel: "safe",
      action: "ALLOW",
      category: "trusted",
      features: { isWhitelisted: true }
    };
  }
  
  const domainParts = domain.split('.');
  const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domain;
  const currentTLD = domainParts.slice(-1)[0];
  const HIGH_TRUST_TLDS = ["gov", "edu", "mil", "org", "int", "gov.in"];

  // 2. Banking Policy
  const BANKING_KEYWORDS = ["bank", "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "bob", "canara", "unionbank", "rbi", "chase", "boa", "citi", "amex", "wellsfargo", "hsbc", "paytm", "phonepe"];
  for (const bankWord of BANKING_KEYWORDS) {
    if (mainName.includes(bankWord)) {
      if (domain.endsWith('.bank.in') || HIGH_TRUST_TLDS.includes(currentTLD)) {
        return { domain, fullUrl: urlStr, riskScore: 0, threatLevel: "safe", action: "ALLOW", category: "verified_authority", features: { compliance: "authorized" } };
      } else if (mainName === bankWord || mainName.startsWith(bankWord + "-") || mainName.endsWith("-" + bankWord)) {
        return { domain, fullUrl: urlStr, riskScore: 95, threatLevel: "critical", action: "HARD-BLOCK", category: "unauthorized_banking", features: { matchedBankKeyword: bankWord } };
      }
    }
  }

  // 3. TLD Analysis
  const suspiciousTLDs = ['.xyz', '.top', '.club', '.info', '.live', '.loan', '.gq', '.cf', '.tk', '.ml', '.ga', '.cn', '.ru'];
  const trustedTLDs = ['.com', '.net', '.org', '.gov', '.edu', '.in', '.io', '.co', '.me', '.app', '.dev'];

  const features: any = {
    entropy: calculateEntropy(domain),
    matchedKeywords: [] as string[],
    isTyposquat: false,
    suspiciousTLD: false
  };

  let riskScore = 0;
  let detectedCategories = new Set<string>();

  if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      riskScore += 20;
      features.suspiciousTLD = true;
  } else if (trustedTLDs.some(tld => domain.endsWith(tld))) {
      riskScore -= 10;
  }

  // 4. Typosquat Check
  for (const brand of BRAND_WATCHLIST) {
      if (mainName !== brand) {
          const dist = levenshtein(mainName, brand);
          if (dist === 1 || (dist === 2 && mainName.length > 6)) {
              riskScore += 90;
              features.isTyposquat = true;
              detectedCategories.add("phishing_impersonation");
          }
      }
  }

  // 5. Keyword Scan
  const checkKeywords = (text: string, list: string[], catName: string, weight: number, isPath: boolean) => {
    let foundCount = 0;
    for (const word of list) {
        if (text.includes(word)) {
            foundCount++;
            features.matchedKeywords.push(word);
        }
    }
    if (foundCount > 0) {
        detectedCategories.add(catName);
        const finalWeight = isPath ? (weight / 3) : weight;
        riskScore += finalWeight + (Math.min(foundCount - 1, 3) * 5);
    }
  };

  const domainLower = domain.toLowerCase();
  const pathLower = fullPath.toLowerCase();

  const categories = [
    { list: KEYWORD_RULES.gambling, name: "gambling", weight: 35 },
    { list: KEYWORD_RULES.scam, name: "scam", weight: 40 },
    { list: KEYWORD_RULES.phishing, name: "phishing", weight: 45 },
    { list: KEYWORD_RULES.fake_apps, name: "piracy", weight: 30 },
    { list: KEYWORD_RULES.malware, name: "malware", weight: 70 },
    { list: KEYWORD_RULES.adult, name: "adult", weight: 40 },
    { list: KEYWORD_RULES.social_scam, name: "social_scam", weight: 30 },
    { list: KEYWORD_RULES.fraud, name: "fraud", weight: 60 },
    { list: KEYWORD_RULES.crypto_scam, name: "crypto", weight: 40 }
  ];

  for (const cat of categories) {
    checkKeywords(domainLower, cat.list, cat.name, cat.weight, false);
    checkKeywords(pathLower, cat.list, cat.name, cat.weight, true);
  }

  // Final Heuristics
  const hasRiskFlags = detectedCategories.size > 0 || features.suspiciousTLD || features.isTyposquat;
  if (features.entropy > 4.8 && hasRiskFlags) riskScore += 20;
  if (domain.length > 70 && hasRiskFlags) riskScore += 15;
  const dotCount = (domain.match(/\./g) || []).length;
  if (dotCount > 4) riskScore += 30;

  riskScore = Math.max(0, Math.min(riskScore, 100));
  let category = detectedCategories.size > 0 ? Array.from(detectedCategories).join(", ") : "general";

  let threatLevel = "low";
  let action = "ALLOW";
  if (riskScore >= 90) { threatLevel = "critical"; action = "HARD-BLOCK"; }
  else if (riskScore >= 65) { threatLevel = "high"; action = "SOFT-BLOCK"; }
  else if (riskScore >= 40) { threatLevel = "medium"; action = "ALLOW"; }
  else if (riskScore > 15) { threatLevel = "suspicious"; }

  return { domain, fullUrl: urlStr, riskScore, threatLevel, action, category, features };
}

async function performContentScan(url: string, currentScore: number) {
  try {
    const response = await axios.get(url, { timeout: 2500, maxContentLength: 500000, validateStatus: () => true });
    const bodyText = typeof response.data === 'string' ? response.data.toLowerCase() : '';
    if (!bodyText) return { score: 0, detected: [] };

    let scanScore = 0;
    const detected = [];
    const check = (list: string[], name: string, weight: number) => {
      let c = 0;
      for (const w of list) if (bodyText.includes(w)) c++;
      if (c >= 2) { scanScore += weight; detected.push(name); }
    };
    check(KEYWORD_RULES.gambling, "gambling_content", 80);
    check(KEYWORD_RULES.scam, "scam_content", 80);
    check(KEYWORD_RULES.phishing, "phishing_content", 100);
    check(KEYWORD_RULES.malware, "malware_content", 100);
    check(KEYWORD_RULES.adult, "adult_content", 90);
    
    if (currentScore < 50 && scanScore >= 80) scanScore += 20;
    return { score: Math.min(scanScore, 100), detected };
  } catch (e) {
    return { score: 0, detected: [] };
  }
}

async function logToSupabase(logData: any) {
  if (!supabase) return;
  try {
    await supabase.from('domain_logs').insert([{
      domain: logData.domain, risk_score: logData.riskScore, threat_level: logData.threatLevel,
      action: logData.action, features: logData.features, source: logData.source || 'unknown',
      device_hash: logData.deviceHash || null
    }]);
  } catch (e) {}
}

// Routes
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.send('🛡️ AI Safe Network Backend is Running'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', active: isProtectionActive, time: new Date().toISOString() }));
app.get('/api/status', (req, res) => res.json({ active: isProtectionActive }));

app.post('/api/analyze', async (req, res) => {
  const { domain, source, deepScan, isBackgroundData } = req.body;
  if (!domain) return res.status(400).json({ error: "No domain" });
  
  let result = analyzeUrlLogic(domain, isBackgroundData);
  if (deepScan && result.riskScore < 80) {
    const content = await performContentScan(result.fullUrl, result.riskScore);
    if (content.score > result.riskScore) {
      result.riskScore = content.score;
      if (result.riskScore >= 90) { result.action = "HARD-BLOCK"; result.threatLevel = "critical"; }
      else if (result.riskScore >= 65) { result.action = "SOFT-BLOCK"; result.threatLevel = "high"; }
    }
  }
  
  const logEntry = { ...result, source: source || 'manual', timestamp: new Date().toISOString() };
  io.emit('new_analysis', logEntry);
  logToSupabase(logEntry);
  res.json(result);
});

app.post('/api/dns-query', async (req, res) => {
  const { domain, deviceHash } = req.body;
  if (!domain || !isProtectionActive) return res.json({ action: "ALLOW" });
  
  const result = analyzeUrlLogic(domain);
  res.json({ action: result.action });
  
  const logEntry = { ...result, source: 'esp32', deviceHash, timestamp: new Date().toISOString() };
  io.emit('new_analysis', logEntry);
  logToSupabase(logEntry);
});

app.post('/api/toggle-protection', (req, res) => {
  isProtectionActive = req.body.active;
  io.emit('status_update', { active: isProtectionActive });
  res.json({ active: isProtectionActive });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"], credentials: true },
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  socket.emit('status', { status: 'online', clients: io.engine.clientsCount });
});

server.listen(PORT, () => console.log(`Backend live on port ${PORT}`));
