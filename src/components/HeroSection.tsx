import { Shield, Cpu, Wifi, Brain } from "lucide-react";
import { Button } from "./ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174_72%_50%_/_0.12),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(280_60%_50%_/_0.08),transparent_40%)]" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(174 72% 50%) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(174 72% 50%) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Floating elements */}
      <div className="absolute top-1/4 left-[10%] animate-float">
        <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 backdrop-blur-sm">
          <Shield className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute top-1/3 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
        <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 backdrop-blur-sm">
          <Cpu className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-1/3 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
        <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 backdrop-blur-sm">
          <Wifi className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-1/4 right-[10%] animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/20 backdrop-blur-sm">
          <Brain className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="container relative z-10 px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-primary/30 text-sm text-primary mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            ESP32 + AI Powered Security
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Intelligent </span>
            <span className="text-gradient-cyber">Network</span>
            <br />
            <span className="text-foreground">Protection</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            AI-powered automatic website & app blocking system using ESP32.
            Real-time DNS filtering with machine learning classification.
            <span className="text-primary font-medium"> No manual blocklists needed.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button variant="cyber" size="lg">
              <Shield className="w-5 h-5" />
              Try Demo Analysis
            </Button>
            <Button variant="outline" size="lg">
              View Architecture
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">99.2%</div>
              <div className="text-sm text-muted-foreground">Detection Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">&lt;50ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-1">Zero</div>
              <div className="text-sm text-muted-foreground">Manual Lists</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
