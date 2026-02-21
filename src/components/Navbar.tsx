import { Shield, Menu, X, Power, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProtectionOn, setIsProtectionOn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial status
    fetch('http://localhost:3000/api/status')
      .then(res => res.json())
      .then(data => setIsProtectionOn(data.active))
      .catch(err => console.error("Backend offline", err));
  }, []);

  const toggleProtection = async () => {
    setIsLoading(true);
    try {
      const newState = !isProtectionOn;
      const res = await fetch('http://localhost:3000/api/toggle-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
      
      const data = await res.json();
      setIsProtectionOn(data.active);
      
      toast({
        title: data.active ? "Protection Activated 🛡️" : "Protection Paused ⏸️",
        description: data.active ? "Background analysis is running." : "Network traffic will pass through.",
        variant: data.active ? "default" : "destructive"
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to toggle protection", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const navLinks = [
    { label: "Architecture", href: "#architecture" },
    { label: "Demo", href: "#demo" },
    { label: "Monitor", href: "#monitor" },
    { label: "Features", href: "#features" },
    { label: "Code", href: "#code" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg tracking-tight">AI Network Guard</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            
            <Button 
              onClick={toggleProtection} 
              variant={isProtectionOn ? "default" : "destructive"}
              className={`min-w-[140px] transition-all`}
              disabled={isLoading}
            >
              {isLoading ? (
                <Activity className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Power className="w-4 h-4 mr-2" />
              )}
              {isProtectionOn ? "Active" : "Paused"}
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button 
              onClick={() => { toggleProtection(); setIsOpen(false); }}
              className="w-full mt-4"
              variant={isProtectionOn ? "default" : "destructive"}
            >
              <Power className="w-4 h-4 mr-2" />
              {isProtectionOn ? "Stop Protection" : "Start Protection"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
