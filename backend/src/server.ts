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
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Initialize Supabase if keys allow
const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const domainCache = new Map<string, any>();

function calculateEntropy(str: string): number {
  const len = str.length;
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

// Target brands for Typosquatting detection
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

function analyzeUrlLogic(urlStr: string, isBackgroundData: boolean = false) {
  let domain = "";
  let fullPath = "";
  
  try {
    // Handle partial domains (e.g. "google.com" -> "https://google.com")
    if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
    const u = new URL(urlStr);
    domain = u.hostname.toLowerCase();
    fullPath = (u.pathname + u.search).toLowerCase();
  } catch (e) {
    domain = urlStr.toLowerCase(); // Fallback
  }

  // 1. Expanded Whitelist Check (Fastest)
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
  
    // 2. Strict Banking Policy (Refined)
    // Only trigger if the bank keyword is part of the MAIN domain name, not subdomains or paths.
    const BANKING_KEYWORDS = ["bank", "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "bob", "canara", "unionbank", "rbi", "chase", "boa", "citi", "amex", "wellsfargo", "hsbc", "paytm", "phonepe"];
    const domainParts = domain.split('.');
    const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domain;
    
    // High trust TLDs that override banking blocks (e.g. worldbank.org)
    const HIGH_TRUST_TLDS = ["gov", "edu", "mil", "org", "int", "gov.in"];
    const currentTLD = domainParts.slice(-1)[0];
  
    for (const bankWord of BANKING_KEYWORDS) {
      if (mainName.includes(bankWord)) {
        if (domain.endsWith('.bank.in') || HIGH_TRUST_TLDS.includes(currentTLD)) {
          // Legitimate bank or high-trust organization
          return {
            domain,
            fullUrl: urlStr,
            riskScore: 0,
            threatLevel: "safe",
            action: "ALLOW",
            category: "verified_authority",
            features: { isWhitelisted: true, compliance: "authorized_entity" }
          };
        } else {
          // High suspicion: using bank name on commercial/generic TLD
          // Only block if it's a very clear match, otherwise just increase risk
          if (mainName === bankWord || mainName.startsWith(bankWord + "-") || mainName.endsWith("-" + bankWord)) {
            return {
              domain,
              fullUrl: urlStr,
              riskScore: 95,
              threatLevel: "critical",
              action: "HARD-BLOCK",
              category: "unauthorized_banking",
              features: { matchedBankKeyword: bankWord, violation: "commercial_tld_mismatch" }
            };
          }
        }
      }
    }
  
    // 3. General Authority Whitelist
    const AUTHORITY_DOMAINS = ["gov", "edu", "mil", "nic.in", "gov.in", "ac.in", "edu.in"];
    if (AUTHORITY_DOMAINS.some(tld => domain.endsWith("." + tld))) {
      return {
        domain,
        fullUrl: urlStr,
        riskScore: 5,
        threatLevel: "safe",
        action: "ALLOW",
        category: "educational_government",
        features: { isAuthority: true }
      };
    }




  const features: any = {
    entropy: calculateEntropy(domain),
    matchedKeywords: [] as string[],
    isTyposquat: false,
    suspiciousTLD: false
  };

  let riskScore = 0;
  let category = "general";
  let detectedCategories = new Set<string>();

  // 2. Typosquatting Analysis (AI Logic)
  // Check if domain looks like a brand but isn't whitelisted
  // domainParts and mainName are already declared above
  
  for (const brand of BRAND_WATCHLIST) {
      if (mainName !== brand) {
          const dist = levenshtein(mainName, brand);
          if (dist === 1 || (dist === 2 && mainName.length > 6)) {
              // High probability of targetting a brand (e.g. amaz0n, g0ogle)
              riskScore += 90;
              features.isTyposquat = true;
              detectedCategories.add("phishing_impersonation");
          }
      }
  }

  // 3. TLD Analysis
  const suspiciousTLDs = ['.xyz', '.top', '.club', '.info', '.live', '.loan', '.gq', '.cf', '.tk', '.ml', '.ga', '.cn', '.ru'];
  const trustedTLDs = ['.com', '.net', '.org', '.gov', '.edu', '.in', '.io', '.co', '.me', '.app', '.dev'];

  if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
      riskScore += 20; // Increase baseline suspicion
      features.suspiciousTLD = true;
  } else if (trustedTLDs.some(tld => domain.endsWith(tld))) {
      riskScore -= 10; // Bonus for established TLDs
  }

  // 4. Keyword Analysis (Nuanced)
  // We check Domain separately from Path. Domain keywords are 3x more dangerous.
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
        // Path matches are weighted at 1/3 of Domain matches
        const finalWeight = isPath ? (weight / 3) : weight;
        // Cap the score: First match gives full category weight, subsequent matches give 5 points each
        riskScore += finalWeight + (Math.min(foundCount - 1, 3) * 5);
    }
  };

  const domainLower = domain.toLowerCase();
  const pathLower = fullPath.toLowerCase();

  const scanCategories = () => {
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
  };

  scanCategories();

  // DATA EXFILTRATION & TRACKING RULES (Apply mostly to background data)
  const TRACKING_KEYWORDS = ["analytics", "pixel", "telemetry", "collect", "event", "measure", "beacon", "metrics", "tracker", "log"];
  let trackingMatches = 0;
  for (const word of TRACKING_KEYWORDS) {
      if (domainLower.includes(word) || pathLower.includes(word)) {
          trackingMatches++;
          features.matchedKeywords.push(word);
      }
  }
  
  if (trackingMatches > 0) {
      detectedCategories.add("data_collection");
      // Tracking is only suspicious if it happens multiple times or in background
      if (isBackgroundData || trackingMatches > 2) {
          riskScore += 20 + (trackingMatches * 5);
      }
  }


  // 5. Heuristics
  // Only penalize high entropy/length if other risky flags are present
  const hasRiskFlags = detectedCategories.size > 0 || features.suspiciousTLD || features.isTyposquat;
  
  if (features.entropy > 4.8 && hasRiskFlags) riskScore += 20;
  if (domain.length > 70 && hasRiskFlags) riskScore += 15;
  
  // Subdomain stacking (e.g., secure.login.paypal.verify.com)
  const dotCount = (domain.match(/\./g) || []).length;
  if (dotCount > 4) riskScore += 30;

  // Final normalization
  riskScore = Math.max(0, Math.min(riskScore, 100));

  if (detectedCategories.size > 0) {
      category = Array.from(detectedCategories).join(", ");
  }

  // 6. Final Decision (Higher Thresholds for Blocking)
  let threatLevel = "low";
  let action = "ALLOW";

  if (riskScore >= 90) { // Increased from 80 to reduce false positives
    threatLevel = "critical";
    action = "HARD-BLOCK";
  } else if (riskScore >= 65) { // Increased from 50
    threatLevel = "high";
    action = "SOFT-BLOCK";
  } else if (riskScore >= 40) {
    threatLevel = "medium";
    action = "ALLOW"; // Log but don't block
  } else if (riskScore > 15) {
    threatLevel = "suspicious";
  }

  return {
    domain,
    fullUrl: urlStr,
    riskScore,
    threatLevel,
    action,
    category,
    features
  };
}

async function logToSupabase(logData: any) {
  if (!supabase) return;
  
  try {
    // We only log if we have a table. Assuming 'domain_logs' exists from previous migration.
    // If not, this will fail silently in catch block, which is acceptable for resilience.
    const { error } = await supabase
      .from('domain_logs')
      .insert([
        {
          domain: logData.domain,
          risk_score: logData.riskScore,
          threat_level: logData.threatLevel,
          action: logData.action,
          features: logData.features,
          source: logData.source || 'unknown',
          device_hash: logData.deviceHash || null
        }
      ]);
      
    if (error) console.error('Supabase write error:', error);
  } catch (err) {
    console.error('Logging failed:', err);
  }
}



// ... (previous imports)

async function performContentScan(url: string, currentScore: number): Promise<{ score: number, detected: string[], features: any }> {
  try {
    // 1. Fetch Page Content (Fast, lower timeout to avoid dropping ESP32 UDP packets)
    const response = await axios.get(url, {
      timeout: 2500,
      maxContentLength: 500000, // Look at first 500KB
      validateStatus: () => true // Don't throw on 404/500, we still scan content
    });

    const bodyText = typeof response.data === 'string' ? response.data.toLowerCase() : '';
    if (!bodyText) return { score: 0, detected: [], features: {} };

    let scanScore = 0;
    const detectedCategories = new Set<string>();
    const matches: string[] = [];
    
    // 2. Scan Body against Risk Keywords
    const checkDeepList = (list: string[], catName: string, weight: number) => {
        let count = 0;
        for (const word of list) {
            // distinctive words only to avoid false positives on common words
            // simple inclusion check is fast
            if (bodyText.includes(word)) {
                count++;
                matches.push(word);
            }
        }
        // Threshold: Single occurrence might be a news article. Multiple is a site topic.
        if (count >= 2) { 
            scanScore += weight;
            detectedCategories.add(catName);
        }
    };

    checkDeepList(KEYWORD_RULES.gambling, "gambling_content", 80);
    checkDeepList(KEYWORD_RULES.scam, "scam_content", 80);
    checkDeepList(KEYWORD_RULES.phishing, "phishing_content", 100);
    checkDeepList(KEYWORD_RULES.malware, "malware_content", 100);
    checkDeepList(KEYWORD_RULES.adult, "adult_content", 90);
    checkDeepList(KEYWORD_RULES.fake_apps, "piracy_content", 80);
    
    // 3. Context Mismatch Logic (Simple Heuristic)
    // If domain looks "Safe" (e.g. valid blog) but has High Risk Content -> Critical
    if (currentScore < 50 && scanScore >= 80) {
        scanScore += 20; // Critical Boost (Trap detected)
    }

    return { 
        score: Math.min(scanScore, 100), 
        detected: Array.from(detectedCategories),
        features: { contentMatches: matches.slice(0, 10) } 
    };

  } catch (err) {
    // If we can't fetch (timeout/ssl error), we can't judge content. Return neutral.
    // console.log("Content scan failed", err.message);
    return { score: 0, detected: [], features: { fetchError: true } };
  }
}

app.post('/api/analyze', async (req: Request, res: Response) => {
  const { domain, source, deepScan, isBackgroundData } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain/URL required" });

  let result;
  const cacheKey = `${domain}_${deepScan}`;

  // Use domainCache to ensure DNS queries (especially retries) process instantaneously
  if (domainCache.has(cacheKey)) {
      result = { ...domainCache.get(cacheKey) };
  } else {
      // 1. Static Analysis (Fast)
      result = analyzeUrlLogic(domain, isBackgroundData);
      
      // 2. Dynamic Content Analysis (Slower, only on navigation)
      if (deepScan && result.riskScore < 80) { // Only if not already blocked
          // console.log(`Performing Deep Scan on: ${domain}`);
          const contentResult = await performContentScan(result.fullUrl, result.riskScore);
          
          if (contentResult.score > result.riskScore) {
              result.riskScore = contentResult.score;
              // Update threat level based on new score
              if (result.riskScore >= 80) {
                 result.threatLevel = "critical";
                 result.action = "HARD-BLOCK";
              } else if (result.riskScore >= 50) {
                 result.threatLevel = "medium";
                 result.action = "SOFT-BLOCK";
              }
              
              if (contentResult.detected.length > 0) {
                  result.category = result.category === "general" ? 
                                    contentResult.detected.join(", ") : 
                                    result.category + ", " + contentResult.detected.join(", ");
              }
              result.features = { ...result.features, ...contentResult.features, deepScan: true };
          }
      }
      
      domainCache.set(cacheKey, result);
      if (domainCache.size > 2000) domainCache.clear();
  }

  const logEntry = { ...result, source: source || 'manual', timestamp: new Date().toISOString() };
  
  io.emit('new_analysis', logEntry);
  logToSupabase(logEntry);

  res.json(result);
});

// ... (rest of the file: toggle-protection, etc)




// Add a global variable for protection status
let isProtectionActive = true;

// Endpoint to toggle protection
app.post('/api/toggle-protection', (req: Request, res: Response) => {
  const { active } = req.body;
  isProtectionActive = active;
  
  io.emit('status_update', { active: isProtectionActive });
  
  if (isProtectionActive) {
     notifier.notify({ title: 'AI Guard', message: 'Background Protection STARTED 🛡️', appID: 'AI Network Guard' });
  } else {
     notifier.notify({ title: 'AI Guard', message: 'Background Protection PAUSED ⏸️', appID: 'AI Network Guard' });
  }
  
  res.json({ active: isProtectionActive });
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ active: isProtectionActive });
});

// Test endpoint to verify socket connection
app.get('/api/test-socket', (req: Request, res: Response) => {
  const testLog = {
    id: Date.now().toString(),
    domain: 'test-domain.example.com',
    riskScore: 25,
    threatLevel: 'low',
    action: 'ALLOW',
    source: 'test',
    features: {},
    timestamp: new Date().toISOString()
  };
  
  io.emit('new_analysis', testLog);
  console.log('Test socket event sent');
  
  res.json({ success: true, message: 'Test event sent' });
});

app.post('/api/dns-query', async (req: Request, res: Response) => {
  if (!req.body.domain) return res.status(400).json({ action: "ALLOW" });

  // Check if protection is active
  if (!isProtectionActive) {
    return res.json({ action: "ALLOW" }); // Fail-open if paused
  }

  const { domain, deviceHash } = req.body;
  
  let result;
  // Note: Caching might skip analysis features if not careful. 
  // For safety in this demo, let's re-analyze or ensure cache has full object.
  if (domainCache.has(domain)) {
     result = domainCache.get(domain);
  } else {
     result = analyzeUrlLogic(domain || '');
     domainCache.set(domain, result);
     if (domainCache.size > 2000) domainCache.clear();
  }

  res.json({ action: result.action });

  // Broadcast to Frontend
  const logEntry = { ...result, source: 'esp32', deviceHash, timestamp: new Date().toISOString() };
  io.emit('new_analysis', logEntry);

  // Critical Alert Logic
  if (result.riskScore >= 50 || result.action !== 'ALLOW') {
    io.emit('alert', {
      id: Date.now().toString(),
      domain: domain,
      risk_score: result.riskScore,
      threat_level: result.threatLevel,
      action: result.action,
      timestamp: new Date().toISOString()
    });

    // NATIVE DESKTOP NOTIFICATION (Works without browser)
    notifier.notify({
      title: '🛡️ AI Safety Alert',
      message: `BLOCKED: ${domain}\nThreat: ${result.threatLevel} (${result.riskScore}%)`,
      sound: true, 
      wait: true,
      appID: 'AI Network Guard'
    });
  }

  logToSupabase(logEntry);
});

io.on('connection', (socket) => {
  console.log('Frontend connected:', socket.id);
  socket.emit('status', { status: 'online', clients: io.engine.clientsCount });
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
