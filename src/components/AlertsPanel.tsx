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

  return (
    <div className="h-full flex flex-col">
       {/* Actions Bar */}
       <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs text-muted-foreground bg-white/5">
           <span>{alerts.length} Active Events</span>
           {alerts.length > 0 && (
            <button 
                onClick={acknowledgeAllAlerts}
                className="hover:text-white transition-colors flex items-center gap-1"
            >
                <Check className="w-3 h-3" /> Acknowledge All
            </button>
           )}
       </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-10" />
            <p className="text-sm opacity-50">No security alerts</p>
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
  const getSeverityStyle = (riskScore: number) => {
    if (riskScore >= 80) return 'border-red-100 bg-red-50 hover:bg-red-100/50';
    return 'border-amber-100 bg-amber-50 hover:bg-amber-100/50';
  };

  const getSeverityIcon = (riskScore: number) => {
    if (riskScore >= 80) return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertTriangle className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className={`p-3 rounded border ${getSeverityStyle(alert.risk_score)} animate-fade-in transition-all group mb-2 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {getSeverityIcon(alert.risk_score)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-sm font-semibold text-gray-900 truncate pr-2">
              {alert.domain}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all transform hover:scale-110"
              title="Dismiss"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
             <span className={alert.risk_score >= 80 ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
                 {alert.risk_score}%
             </span>
             <span>|</span>
             <span className="uppercase">{alert.action}</span>
             <span>|</span>
             <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;
