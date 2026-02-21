import { Shield, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeMonitor, DomainLog } from '@/hooks/useRealtimeMonitor';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';

const LiveTrafficFeed = () => {
  const { recentLogs, isConnected, isLoading, refresh } = useRealtimeMonitor();

  return (
    <div className="h-full flex flex-col">
      {/* Optional: Connection Status Bar if desired, or simplified */}
      {!isConnected && (
         <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-400 text-xs">
            <WifiOff className="w-3 h-3" />
            <span>Connection Lost - Reconnecting...</span>
         </div>
      )}

      {/* Traffic list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 max-h-[600px]">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 opacity-50" />
            <p className="text-sm">Syncing stream...</p>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-10" />
            <p className="text-sm opacity-50">Waiting for network traffic...</p>
          </div>
        ) : (
          recentLogs.map((log) => (
            <TrafficLogItem key={log.id} log={log} />
          ))
        )}
      </div>
    </div>
  );
};

const TrafficLogItem = ({ log }: { log: DomainLog }) => {
  const isHighRisk = log.risk_score >= 80;
  const isMediumRisk = log.risk_score >= 50;

  const getIcon = () => {
    if (log.action === 'HARD-BLOCK') return <XCircle className="w-4 h-4 text-red-600" />;
    if (log.action === 'SOFT-BLOCK') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    return <CheckCircle className="w-4 h-4 text-emerald-600" />;
  };

  const getStatusColor = () => {
    if (log.action === 'HARD-BLOCK') return 'bg-red-50 border-red-200 text-red-700';
    if (log.action === 'SOFT-BLOCK') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  return (
    <div className="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100/50 border border-transparent hover:border-gray-200 transition-all bg-white/50 backdrop-blur-sm shadow-sm md:shadow-none mb-1">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        log.action === 'HARD-BLOCK' ? 'bg-red-100' :
        log.action === 'SOFT-BLOCK' ? 'bg-amber-100' : 'bg-emerald-100'
      }`}>
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate text-gray-900 group-hover:text-blue-600 transition-colors">{log.domain}</span>
          {log.source === 'esp32' && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded font-medium border border-blue-200">Device</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span className={`font-medium ${
            isHighRisk ? 'text-red-600' : isMediumRisk ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {log.risk_score}% risk
          </span>
          <span className="text-gray-300">•</span>
          <span className="capitalize text-gray-500">{log.threat_level}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getStatusColor()}`}>
        {log.action}
      </div>
    </div>
  );
};

export default LiveTrafficFeed;
