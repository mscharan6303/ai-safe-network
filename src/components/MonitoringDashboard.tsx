import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Activity, Bell, Cpu, BarChart3 } from 'lucide-react';
import LiveTrafficFeed from './LiveTrafficFeed';
import AlertsPanel from './AlertsPanel';
import StatsOverview from './StatsOverview';
import ESP32StatusPanel from './ESP32StatusPanel';
import { useRealtimeMonitor } from '@/hooks/useRealtimeMonitor';

const MonitoringDashboard = () => {
  const { alerts } = useRealtimeMonitor();
  const [activeTab, setActiveTab] = useState('traffic');

  return (
    <section className="py-24 relative" id="monitor">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(174_72%_50%_/_0.08),transparent_40%)]" />

      <div className="container px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Activity className="w-4 h-4" />
            Real-Time Monitoring
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Live <span className="text-gradient-cyber">Security Dashboard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Monitor network traffic in real-time. View analyzed domains, security alerts, and system statistics.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview />
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Traffic</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 relative">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="esp32" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">ESP32</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="mt-0">
            <LiveTrafficFeed />
          </TabsContent>

          <TabsContent value="alerts" className="mt-0">
            <AlertsPanel />
          </TabsContent>

          <TabsContent value="esp32" className="mt-0">
            <ESP32StatusPanel />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default MonitoringDashboard;
