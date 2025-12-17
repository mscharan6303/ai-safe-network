import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainFeatures {
  length: number;
  hyphens: number;
  dots: number;
  hasFree: boolean;
  hasBet: boolean;
  hasWin: boolean;
  hasPhishing: boolean;
  hasAdult: boolean;
  entropy: number;
}

interface AnalysisResult {
  domain: string;
  riskScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  action: 'ALLOW' | 'SOFT-BLOCK' | 'HARD-BLOCK';
  features: DomainFeatures;
  category: string;
  timestamp: string;
}

// LRU Cache for domain decisions (in-memory for this instance)
const domainCache = new Map<string, { result: AnalysisResult; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

// Known safe domains whitelist
const SAFE_DOMAINS = [
  'google.com', 'github.com', 'stackoverflow.com', 'youtube.com', 
  'facebook.com', 'twitter.com', 'linkedin.com', 'microsoft.com',
  'apple.com', 'amazon.com', 'wikipedia.org', 'reddit.com'
];

// Known malicious patterns
const MALICIOUS_PATTERNS = [
  'phishing', 'scam', 'hack', 'crack', 'free-money', 'win-prize',
  'lottery', 'bitcoin-giveaway', 'password-reset', 'verify-account'
];

// Calculate string entropy (randomness indicator)
function calculateEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in freq) {
    const p = freq[char] / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 100) / 100;
}

// Extract domain features for ML analysis
function extractFeatures(domain: string): DomainFeatures {
  const d = domain.toLowerCase();
  
  return {
    length: d.length,
    hyphens: (d.match(/-/g) || []).length,
    dots: (d.match(/\./g) || []).length,
    hasFree: /free|gratis|frei/i.test(d),
    hasBet: /bet|casino|poker|gambling|slot|jackpot/i.test(d),
    hasWin: /win|prize|money|reward|gift|bonus/i.test(d),
    hasPhishing: /login|verify|secure|account|update|confirm|password/i.test(d),
    hasAdult: /xxx|porn|adult|sex/i.test(d),
    entropy: calculateEntropy(d.replace(/\./g, '')),
  };
}

// AI-powered risk analysis
function analyzeRisk(domain: string, features: DomainFeatures): { riskScore: number; category: string } {
  const d = domain.toLowerCase();
  let risk = 0;
  let category = 'general';

  // Check whitelist first
  if (SAFE_DOMAINS.some(safe => d.includes(safe) || d.endsWith(safe))) {
    return { riskScore: Math.min(10, risk), category: 'trusted' };
  }

  // Check malicious patterns
  if (MALICIOUS_PATTERNS.some(pattern => d.includes(pattern))) {
    risk += 50;
    category = 'malicious';
  }

  // Feature-based scoring
  if (features.length > 30) risk += 15;
  if (features.length > 50) risk += 10;
  if (features.hyphens > 2) risk += features.hyphens * 8;
  if (features.dots > 3) risk += 12;
  if (features.hasFree) { risk += 25; category = 'suspicious'; }
  if (features.hasBet) { risk += 40; category = 'gambling'; }
  if (features.hasWin) { risk += 30; category = 'scam'; }
  if (features.hasPhishing) { risk += 35; category = 'phishing'; }
  if (features.hasAdult) { risk += 45; category = 'adult'; }
  if (features.entropy > 4.0) risk += 15; // High randomness
  if (features.entropy > 4.5) risk += 10;

  // TLD analysis
  const suspiciousTLDs = ['.xyz', '.top', '.click', '.gq', '.tk', '.ml', '.cf', '.ga'];
  if (suspiciousTLDs.some(tld => d.endsWith(tld))) {
    risk += 20;
  }

  // Numeric subdomain patterns (often malicious)
  if (/\d{4,}/.test(d)) risk += 15;

  return { riskScore: Math.min(100, risk), category };
}

// Determine action based on risk score
function determineAction(riskScore: number): 'ALLOW' | 'SOFT-BLOCK' | 'HARD-BLOCK' {
  if (riskScore >= 80) return 'HARD-BLOCK';
  if (riskScore >= 50) return 'SOFT-BLOCK';
  return 'ALLOW';
}

// Determine threat level
function determineThreatLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

// Hash device identifier for privacy
function hashDeviceId(deviceId: string | undefined): string | null {
  if (!deviceId) return null;
  // Simple hash - in production use crypto.subtle
  let hash = 0;
  for (let i = 0; i < deviceId.length; i++) {
    const char = deviceId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { domain, deviceId, source = 'manual', batch } = await req.json();
    
    // Handle batch analysis for ESP32 high-frequency requests
    if (batch && Array.isArray(batch)) {
      console.log(`[BATCH] Analyzing ${batch.length} domains`);
      
      const results = await Promise.all(batch.map(async (item: { domain: string; deviceId?: string }) => {
        const result = await analyzeSingleDomain(item.domain, item.deviceId, 'esp32', supabase);
        return result;
      }));
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single domain analysis
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ANALYZE] Domain: ${domain}, Source: ${source}`);
    
    const result = await analyzeSingleDomain(domain, deviceId, source, supabase);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ERROR] Analysis failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeSingleDomain(
  domain: string, 
  deviceId: string | undefined, 
  source: string,
  supabase: any
): Promise<AnalysisResult> {
  const normalizedDomain = domain.toLowerCase().trim();
  
  // Check cache first
  const cached = domainCache.get(normalizedDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[CACHE HIT] ${normalizedDomain}`);
    return cached.result;
  }

  // Extract features and analyze
  const features = extractFeatures(normalizedDomain);
  const { riskScore, category } = analyzeRisk(normalizedDomain, features);
  const action = determineAction(riskScore);
  const threatLevel = determineThreatLevel(riskScore);
  const deviceHash = hashDeviceId(deviceId);
  const timestamp = new Date().toISOString();

  const result: AnalysisResult = {
    domain: normalizedDomain,
    riskScore,
    threatLevel,
    action,
    features,
    category,
    timestamp,
  };

  // Cache the result
  domainCache.set(normalizedDomain, { result, timestamp: Date.now() });

  // Log to database (async, don't await)
  supabase.from('domain_logs').insert({
    domain: normalizedDomain,
    risk_score: riskScore,
    threat_level: threatLevel,
    action,
    device_hash: deviceHash,
    source,
    features,
  }).then(() => {
    console.log(`[DB] Logged: ${normalizedDomain} -> ${action}`);
  }).catch((err: any) => {
    console.error('[DB ERROR]', err);
  });

  // Create alert for high-risk domains
  if (riskScore >= 60) {
    supabase.from('alerts').insert({
      domain: normalizedDomain,
      risk_score: riskScore,
      threat_level: threatLevel,
      action,
      device_hash: deviceHash,
    }).then(() => {
      console.log(`[ALERT] Created for: ${normalizedDomain}`);
    }).catch((err: any) => {
      console.error('[ALERT ERROR]', err);
    });
  }

  // Update daily stats (upsert)
  const today = new Date().toISOString().split('T')[0];
  
  supabase.rpc('update_traffic_stats', {
    p_date: today,
    p_action: action
  }).catch(() => {
    // If RPC doesn't exist, do manual upsert
    supabase.from('traffic_stats')
      .select('*')
      .eq('date', today)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          const updates: any = { total_analyzed: data.total_analyzed + 1 };
          if (action === 'ALLOW') updates.total_allowed = data.total_allowed + 1;
          if (action === 'SOFT-BLOCK') updates.soft_blocked = data.soft_blocked + 1;
          if (action === 'HARD-BLOCK') updates.total_blocked = data.total_blocked + 1;
          
          supabase.from('traffic_stats').update(updates).eq('id', data.id);
        } else {
          supabase.from('traffic_stats').insert({
            date: today,
            total_analyzed: 1,
            total_allowed: action === 'ALLOW' ? 1 : 0,
            soft_blocked: action === 'SOFT-BLOCK' ? 1 : 0,
            total_blocked: action === 'HARD-BLOCK' ? 1 : 0,
          });
        }
      });
  });

  return result;
}
