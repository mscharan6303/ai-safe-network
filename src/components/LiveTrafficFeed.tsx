import { Shield, AlertTriangle, CheckCircle, XCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeMonitor, DomainLog } from '@/hooks/useRealtimeMonitor';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';

const LiveTrafficFeed = () => {
  const { recentLogs, isConnected, isLoading, refresh } = useRealtimeMonitor();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'SOFT-BLOCK':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <CheckCircle className="w-4 h-4 text-success" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return 'text-destructive bg-destructive/10 border-destructive/30';
      case 'SOFT-BLOCK':
        return 'text-warning bg-warning/10 border-warning/30';
      default:
        return 'text-success bg-success/10 border-success/30';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-destructive';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  return (
    <div className="card-cyber p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Live Traffic Feed</h3>
            <p className="text-sm text-muted-foreground">Real-time domain analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isConnected ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Traffic list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading traffic data...</p>
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No traffic data yet</p>
            <p className="text-sm">Analyze a domain or connect ESP32 to see data</p>
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
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return <XCircle className="w-4 h-4" />;
      case 'SOFT-BLOCK':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'HARD-BLOCK':
        return 'text-destructive bg-destructive/20';
      case 'SOFT-BLOCK':
        return 'text-warning bg-warning/20';
      default:
        return 'text-success bg-success/20';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-destructive';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionStyles(log.action)}`}>
        {getActionIcon(log.action)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm truncate">{log.domain}</span>
          {log.source === 'esp32' && (
            <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded">ESP32</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span className={`font-semibold ${getRiskColor(log.risk_score)}`}>
            {log.risk_score}% risk
          </span>
          <span>•</span>
          <span className="capitalize">{log.threat_level}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      
      <div className={`px-2 py-1 rounded text-xs font-semibold ${getActionStyles(log.action)}`}>
        {log.action}
      </div>
    </div>
  );
};

export default LiveTrafficFeed;
