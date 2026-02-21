import { useState } from "react";
import { Search, Shield, AlertTriangle, CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
    hasDataCollection?: boolean;
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
      const response = await fetch('https://ai-safe-network-backend.onrender.com/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), source: 'manual' }),
      });

      if (!response.ok) throw new Error('Analysis request failed');
      const data = await response.json();
      setResult(data);
      
      if (data.action !== 'ALLOW') {
        toast({
          title: data.action === 'HARD-BLOCK' ? "🚨 Domain Blocked" : "⚠️ Domain Flagged",
          description: `Risk Level: ${data.threatLevel}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze domain. Ensure backend is running.",
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
    "analytics-pixel-track.net",
  ];

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 50) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <section className="py-20 bg-secondary/30" id="demo">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Live Analysis Demo
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the AI engine in real-time. Enter a domain to see how the system classifies it.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Input section */}
          <div className="bg-card border shadow-sm rounded-xl p-6 mb-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter domain (e.g., example.com)"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="pl-10"
                />
              </div>
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !domain.trim()}
                className="w-full sm:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Domain
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center">Try:</span>
              {exampleDomains.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className="px-2.5 py-1 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md transition-colors text-secondary-foreground"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Results section */}
          {result && (
            <div className="bg-card border shadow-md rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-8 pb-6 border-b">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    result.action === 'HARD-BLOCK' ? 'bg-red-100 text-red-600' :
                    result.action === 'SOFT-BLOCK' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {result.action === 'HARD-BLOCK' ? <XCircle className="w-6 h-6" /> :
                     result.action === 'SOFT-BLOCK' ? <AlertTriangle className="w-6 h-6" /> : 
                     <CheckCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-mono text-lg font-medium">{result.domain}</h3>
                    <p className={`text-sm font-semibold ${
                      result.action === 'HARD-BLOCK' ? 'text-destructive' :
                      result.action === 'SOFT-BLOCK' ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {result.action}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold ${getRiskColor(result.riskScore)}`}>
                    {result.riskScore}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Risk Score</div>
                </div>
              </div>

              {result.features.hasDataCollection && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-lg flex items-center gap-3 text-orange-800">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 className="font-semibold text-sm">Privacy Warning</h4>
                    <p className="text-xs opacity-90">This site appears to collect user data (analytics/tracking) in the background.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <span className="text-muted-foreground block text-xs mb-1">Threat Level</span>
                  <span className="font-medium capitalize">{result.threatLevel}</span>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg">
                  <span className="text-muted-foreground block text-xs mb-1">Category</span>
                  <span className="font-medium capitalize">{result.category}</span>
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
