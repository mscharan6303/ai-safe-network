import { useState } from "react";
import { Search, Shield, AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AnalysisResult {
  domain: string;
  riskScore: number;
  threatLevel: string;
  action: "ALLOW" | "SOFT-BLOCK" | "HARD-BLOCK";
  category: string;
  features: {
    length: number;
    hyphens: number;
    dots: number;
    hasFree: boolean;
    hasBet: boolean;
    hasWin: boolean;
    hasPhishing: boolean;
    hasAdult: boolean;
    entropy: number;
  };
}

const DomainAnalyzer = () => {
  const [domain, setDomain] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!domain.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-domain', {
        body: { domain: domain.trim(), source: 'manual' },
      });

      if (error) throw error;

      setResult(data);
      
      // Show toast for blocked domains
      if (data.action !== 'ALLOW') {
        toast({
          title: data.action === 'HARD-BLOCK' ? "🚨 Domain Blocked!" : "⚠️ Domain Flagged",
          description: `${domain} has been classified as ${data.threatLevel} risk`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze domain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exampleDomains = [
    "google.com",
    "free-money-win.xyz",
    "bet-now-casino.com",
    "github.com",
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return <XCircle className="w-8 h-8 text-destructive" />;
      case 'SOFT-BLOCK':
        return <AlertTriangle className="w-8 h-8 text-warning" />;
      default:
        return <CheckCircle className="w-8 h-8 text-success" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return 'border-destructive/50';
      case 'SOFT-BLOCK':
        return 'border-warning/50';
      default:
        return 'border-success/50';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <section className="py-24 relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(174_72%_50%_/_0.05),transparent_50%)]" />

      <div className="container px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live <span className="text-gradient-cyber">Demo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Test the AI domain classifier. Enter any domain to see real-time risk analysis.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Input section */}
          <div className="card-cyber p-8 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter domain (e.g., example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="pl-12 h-12 bg-secondary border-border focus:border-primary font-mono"
                />
              </div>
              <Button
                variant="cyber"
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !domain.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {/* Example domains */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {exampleDomains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className="px-3 py-1 text-sm font-mono bg-secondary hover:bg-secondary/80 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Results section */}
          {result && (
            <div className={`card-cyber p-8 animate-fade-in ${getActionColor(result.action)}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    result.action === 'HARD-BLOCK' ? 'bg-destructive/20' :
                    result.action === 'SOFT-BLOCK' ? 'bg-warning/20' : 'bg-success/20'
                  }`}>
                    {getActionIcon(result.action)}
                  </div>
                  <div>
                    <div className="font-mono text-lg mb-1">{result.domain}</div>
                    <div className={`text-sm font-semibold ${
                      result.action === 'HARD-BLOCK' ? 'text-destructive' :
                      result.action === 'SOFT-BLOCK' ? 'text-warning' : 'text-success'
                    }`}>
                      {result.action === 'HARD-BLOCK' ? '🚫 HARD BLOCKED' :
                       result.action === 'SOFT-BLOCK' ? '⚠️ SOFT BLOCKED' : '✓ ALLOWED'}
                    </div>
                  </div>
                </div>

                {/* Risk score gauge */}
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                </div>
              </div>

              {/* Risk bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Threat Level</span>
                  <span className={getRiskColor(result.riskScore)}>
                    {result.threatLevel.charAt(0).toUpperCase() + result.threatLevel.slice(1)}
                  </span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      result.riskScore >= 80 ? "bg-destructive" :
                      result.riskScore >= 50 ? "bg-warning" : "bg-success"
                    }`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Category badge */}
              <div className="mb-6">
                <span className="text-sm text-muted-foreground mr-2">Category:</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary capitalize">
                  {result.category}
                </span>
              </div>

              {/* Feature analysis */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary" />
                  Feature Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Length</div>
                    <div className="font-mono font-semibold">{result.features.length} chars</div>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Entropy</div>
                    <div className="font-mono font-semibold">{result.features.entropy}</div>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Hyphens</div>
                    <div className="font-mono font-semibold">{result.features.hyphens}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${result.features.hasFree ? "bg-destructive/20" : "bg-secondary/50"}`}>
                    <div className="text-xs text-muted-foreground mb-1">"free" keyword</div>
                    <div className="font-mono font-semibold">{result.features.hasFree ? "Found ⚠️" : "None"}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${result.features.hasBet ? "bg-destructive/20" : "bg-secondary/50"}`}>
                    <div className="text-xs text-muted-foreground mb-1">Gambling terms</div>
                    <div className="font-mono font-semibold">{result.features.hasBet ? "Found ⚠️" : "None"}</div>
                  </div>
                  <div className={`p-3 rounded-lg ${result.features.hasPhishing ? "bg-destructive/20" : "bg-secondary/50"}`}>
                    <div className="text-xs text-muted-foreground mb-1">Phishing terms</div>
                    <div className="font-mono font-semibold">{result.features.hasPhishing ? "Found ⚠️" : "None"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DomainAnalyzer;
