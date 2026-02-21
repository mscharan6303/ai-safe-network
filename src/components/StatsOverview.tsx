import { Shield, XCircle, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useRealtimeMonitor } from '@/hooks/useRealtimeMonitor';

const StatsOverview = () => {
  const { stats } = useRealtimeMonitor();

  const statCards = [
    {
      label: 'Scanned',
      value: stats.total_analyzed,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      label: 'Clean',
      value: stats.total_allowed,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      label: 'Suspicious',
      value: stats.soft_blocked,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      label: 'Threats Blocked',
      value: stats.total_blocked,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
      {statCards.map((stat) => (
        <div 
          key={stat.label}
          className={`p-4 rounded-xl border ${stat.borderColor} ${stat.bgColor} shadow-sm transition-all hover:scale-[1.02] bg-white`}
        >
          <div className="flex items-center justify-between mb-2">
             <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{stat.label}</span>
             <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
             {stat.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
