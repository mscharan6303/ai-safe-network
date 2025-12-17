import { Shield, Github, FileText, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-secondary/20">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">AI Network Guard</div>
              <div className="text-sm text-muted-foreground">ESP32 + ML Security</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Github className="w-5 h-5" />
              <span className="text-sm">Source Code</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <FileText className="w-5 h-5" />
              <span className="text-sm">Documentation</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Mail className="w-5 h-5" />
              <span className="text-sm">Contact</span>
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            © 2024 Final Year Project
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
