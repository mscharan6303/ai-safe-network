import { Shield, Brain, Zap, Lock, RefreshCw, Users, Cpu, Eye } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Random Forest ML model analyzes domain features in real-time without manual blocklists",
    },
    {
      icon: Cpu,
      title: "ESP32 Hardware",
      description: "Low-cost microcontroller acts as WiFi access point and DNS interceptor",
    },
    {
      icon: Zap,
      title: "Sub-50ms Response",
      description: "FastAPI backend delivers instant threat classification decisions",
    },
    {
      icon: Shield,
      title: "Automatic Blocking",
      description: "No manual intervention needed — AI decides based on learned patterns",
    },
    {
      icon: Lock,
      title: "Privacy Safe",
      description: "Hashed MAC addresses, no URL storage, only domain+category logs",
    },
    {
      icon: RefreshCw,
      title: "Crowdsourced Learning",
      description: "User feedback continuously improves model accuracy through retraining",
    },
    {
      icon: Eye,
      title: "Full Visibility",
      description: "Monitor all network requests with transparent threat scoring",
    },
    {
      icon: Users,
      title: "Family Protection",
      description: "Protect all devices on your network with centralized filtering",
    },
  ];

  return (
    <section className="py-24 relative bg-secondary/30">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Core <span className="text-gradient-cyber">Features</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade network security powered by machine learning
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-cyber p-6 hover:border-primary/50 transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
