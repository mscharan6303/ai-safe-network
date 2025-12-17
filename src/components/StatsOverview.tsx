import { Shield, XCircle, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useRealtimeMonitor } from '@/hooks/useRealtimeMonitor';

const StatsOverview = () => {
  const { stats, isConnected } = useRealtimeMonitor();

  const statCards = [
    {
      label: 'Total Analyzed',
      value: stats.total_analyzed,
      icon: Activity,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      label: 'Allowed',
      value: stats.total_allowed,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      label: 'Soft Blocked',
      value: stats.soft_blocked,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
    },
    {
      label: 'Hard Blocked',
      value: stats.total_blocked,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/20',
    },
  ];

  const blockRate = stats.total_analyzed > 0 
    ? ((stats.total_blocked + stats.soft_blocked) / stats.total_analyzed * 100).toFixed(1)
    : '0.0';

  return (
    <div className="card-cyber p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Traffic Statistics</h3>
            <p className="text-sm text-muted-foreground">Today's overview</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{blockRate}%</div>
          <div className="text-xs text-muted-foreground">Block Rate</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div 
            key={stat.label}
            className="p-4 rounded-lg bg-secondary/30 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Visual bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Traffic Distribution</span>
          <span>{stats.total_analyzed} total</span>
        </div>
        <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
          {stats.total_analyzed > 0 && (
            <>
              <div 
                className="h-full bg-success transition-all duration-500"
                style={{ width: `${(stats.total_allowed / stats.total_analyzed) * 100}%` }}
              />
              <div 
                className="h-full bg-warning transition-all duration-500"
                style={{ width: `${(stats.soft_blocked / stats.total_analyzed) * 100}%` }}
              />
              <div 
                className="h-full bg-destructive transition-all duration-500"
                style={{ width: `${(stats.total_blocked / stats.total_analyzed) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Allowed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">Soft Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Hard Block</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
