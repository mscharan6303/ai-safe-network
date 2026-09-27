import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="container px-4">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm font-medium animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ESP32 + AI Powered Security
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground animate-fade-in">
            Intelligent Network <br />
            <span className="text-primary">Protection</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in delay-100">
            Secure your network with AI-powered DNA analysis. 
            Real-time filtering, zero manual blocklists, and instant threat blocking using ESP32.
          </p>



          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 border-t mt-16 animate-fade-in delay-300">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">99.2%</div>
              <div className="text-sm font-medium text-muted-foreground">Detection Rate</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">&lt;50ms</div>
              <div className="text-sm font-medium text-muted-foreground">Response Time</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">Auto</div>
              <div className="text-sm font-medium text-muted-foreground">Blocklists</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
