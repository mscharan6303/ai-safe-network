import { Cpu, Wifi, Database, ShieldCheck, Server, AlertCircle } from 'lucide-react';
import { useRealtimeMonitor } from '@/hooks/useRealtimeMonitor';

const ESP32StatusPanel = () => {
  const { isConnected, recentLogs } = useRealtimeMonitor();

  // Check if we have recent DNS queries (ESP32 is active)
  const hasRecentActivity = recentLogs.length > 0;
  const esp32Status = hasRecentActivity ? 'Active / Connected' : 'Standby / Searching';
  const esp32Color = hasRecentActivity ? 'text-emerald-600' : 'text-amber-600';
  const esp32Bg = hasRecentActivity ? 'bg-emerald-50' : 'bg-amber-50';

  const statuses = [
    {
       name: 'AI Analysis Engine',
       status: 'Operational',
       icon: ShieldCheck,
       color: 'text-emerald-600',
       bg: 'bg-emerald-50'
    },
    {
       name: 'Backend Server',
       status: isConnected ? 'Online' : 'Reconnecting',
       icon: Server,
       color: isConnected ? 'text-emerald-600' : 'text-red-600',
       bg: isConnected ? 'bg-emerald-50' : 'bg-red-50'
    },
    {
       name: 'Database Cluster',
       status: 'Connected',
       icon: Database,
       color: 'text-blue-600',
       bg: 'bg-blue-50'
    },
    {
       name: 'ESP32 Gateway',
       status: esp32Status,
       icon: Cpu,
       color: esp32Color,
       bg: esp32Bg
    }
  ];

  return (
    <div className="p-4 bg-white h-full flex flex-col justify-center">
       <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
           <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">System Health</h3>
           <span className="text-xs text-gray-500">Uptime: 99.9%</span>
       </div>
       
       <div className="space-y-3">
          {statuses.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${item.bg}`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')} animate-pulse`} />
                       <span className={`text-xs ${item.color} font-mono`}>{item.status}</span>
                  </div>
              </div>
          ))}
       </div>
       
       <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-center text-gray-400 font-mono">
           v2.4.0-stable • secure-boot enabled
       </div>
    </div>
  );
};

export default ESP32StatusPanel;
