import { Bell, BellRing, X, Check, AlertTriangle, XCircle } from 'lucide-react';
import { useRealtimeMonitor, Alert } from '@/hooks/useRealtimeMonitor';
import { Button } from './ui/button';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

const AlertsPanel = () => {
  const { alerts, acknowledgeAlert, acknowledgeAllAlerts } = useRealtimeMonitor();
  const prevAlertCount = useRef(alerts.length);

  // Show toast for new alerts
  useEffect(() => {
    if (alerts.length > prevAlertCount.current && alerts.length > 0) {
      const latestAlert = alerts[0];
      toast({
        title: "🚨 Security Alert",
        description: `High-risk domain detected: ${latestAlert.domain}`,
        variant: "destructive",
      });
    }
    prevAlertCount.current = alerts.length;
  }, [alerts]);

  const getSeverityIcon = (riskScore: number) => {
    if (riskScore >= 80) return <XCircle className="w-5 h-5 text-destructive" />;
    return <AlertTriangle className="w-5 h-5 text-warning" />;
  };

  const getSeverityColor = (riskScore: number) => {
    if (riskScore >= 80) return 'border-destructive/50 bg-destructive/5';
    return 'border-warning/50 bg-warning/5';
  };

  return (
    <div className="card-cyber p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            alerts.length > 0 ? 'bg-destructive/20' : 'bg-muted'
          }`}>
            {alerts.length > 0 ? (
              <BellRing className="w-5 h-5 text-destructive animate-pulse" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Security Alerts
              {alerts.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {alerts.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">Real-time threat notifications</p>
          </div>
        </div>
        
        {alerts.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={acknowledgeAllAlerts}
            className="text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Alerts list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active alerts</p>
            <p className="text-sm">System is monitoring for threats</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              onAcknowledge={() => acknowledgeAlert(alert.id)} 
            />
          ))
        )}
      </div>
    </div>
  );
};

const AlertItem = ({ 
  alert, 
  onAcknowledge 
}: { 
  alert: Alert; 
  onAcknowledge: () => void;
}) => {
  const getSeverityColor = (riskScore: number) => {
    if (riskScore >= 80) return 'border-destructive/50 bg-destructive/10';
    return 'border-warning/50 bg-warning/10';
  };

  const getSeverityIcon = (riskScore: number) => {
    if (riskScore >= 80) return <XCircle className="w-5 h-5 text-destructive" />;
    return <AlertTriangle className="w-5 h-5 text-warning" />;
  };

  return (
    <div className={`p-4 rounded-lg border ${getSeverityColor(alert.risk_score)} animate-fade-in`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getSeverityIcon(alert.risk_score)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm font-semibold truncate">
              {alert.domain}
            </span>
            <button 
              onClick={onAcknowledge}
              className="p-1 hover:bg-background/50 rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className={`font-bold ${
              alert.risk_score >= 80 ? 'text-destructive' : 'text-warning'
            }`}>
              {alert.risk_score}% Risk
            </span>
            <span>•</span>
            <span className="uppercase font-semibold">{alert.action}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
          </div>
          
          {alert.device_hash && (
            <div className="mt-2 text-xs text-muted-foreground">
              Device: <span className="font-mono">{alert.device_hash.slice(0, 8)}...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
