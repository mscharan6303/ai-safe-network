import { Smartphone, Wifi, Cpu, Server, Shield, ArrowRight, CheckCircle, XCircle } from "lucide-react";

const ArchitectureSection = () => {
  const steps = [
    {
      icon: Smartphone,
      title: "Device Request",
      description: "Phone/Laptop connects to ESP32 WiFi Access Point",
      color: "text-foreground",
    },
    {
      icon: Wifi,
      title: "DNS Capture",
      description: "ESP32 intercepts DNS queries for all domain requests",
      color: "text-primary",
    },
    {
      icon: Server,
      title: "AI Analysis",
      description: "FastAPI backend runs ML model on domain features",
      color: "text-warning",
    },
    {
      icon: Cpu,
      title: "Risk Score",
      description: "Random Forest classifier calculates threat probability",
      color: "text-accent",
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            System <span className="text-gradient-cyber">Architecture</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            End-to-end flow from device request to AI-powered decision
          </p>
        </div>

        {/* Architecture flow */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Arrow between cards */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-primary/50" />
                  </div>
                )}

                <div className="card-cyber p-6 h-full hover:border-primary/50 transition-all duration-300 group-hover:glow-primary">
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4 ${step.color}`}>
                    <step.icon className="w-7 h-7" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision outcome */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="card-cyber p-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Decision Engine</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allow */}
              <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <span className="font-semibold text-success">ALLOW</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Risk Score &lt; 80% → DNS resolves to real IP address
                </p>
                <div className="mt-3 font-mono text-xs text-success/70 bg-success/5 p-2 rounded">
                  google.com → 142.250.190.46
                </div>
              </div>

              {/* Block */}
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <span className="font-semibold text-destructive">BLOCK</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Risk Score ≥ 80% → DNS redirects to ESP32 block page
                </p>
                <div className="mt-3 font-mono text-xs text-destructive/70 bg-destructive/5 p-2 rounded">
                  malware-site.xyz → 192.168.4.1
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
