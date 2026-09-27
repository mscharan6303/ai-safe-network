import Navbar from "@/components/Navbar";
import MonitoringDashboard from "@/components/MonitoringDashboard";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>AI Security Center | Network Guard</title>
        <meta name="description" content="Real-time Network Security Dashboard." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-primary/20">
        <Navbar />
        <main className="pt-20 px-4 md:px-6 lg:px-8 max-w-[1600px] mx-auto pb-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
              <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">
                      Security Operations Center
                  </h1>
                  <p className="text-gray-500 text-sm">
                      Real-time Threat Monitoring & AI Analysis Active
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-medium text-green-400">System Online</span>
              </div>
          </div>

          {/* Main Dashboard Component */}
          <MonitoringDashboard />
          
        </main>
      </div>
      <Toaster />
    </>
  );
};

export default Index;
