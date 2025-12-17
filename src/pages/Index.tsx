import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import DomainAnalyzer from "@/components/DomainAnalyzer";
import MonitoringDashboard from "@/components/MonitoringDashboard";
import FeaturesSection from "@/components/FeaturesSection";
import CodeSection from "@/components/CodeSection";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>AI Network Guard | ESP32 Powered Intelligent Website Blocking</title>
        <meta name="description" content="AI-powered automatic website and app blocking system using ESP32. Real-time DNS filtering with machine learning classification for network security." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <div id="architecture">
            <ArchitectureSection />
          </div>
          <div id="demo">
            <DomainAnalyzer />
          </div>
          <div id="monitor">
            <MonitoringDashboard />
          </div>
          <div id="features">
            <FeaturesSection />
          </div>
          <div id="code">
            <CodeSection />
          </div>
        </main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export default Index;
