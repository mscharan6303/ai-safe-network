import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DomainLog {
  id: string;
  domain: string;
  risk_score: number;
  threat_level: string;
  action: string;
  device_hash: string | null;
  source: string;
  features: any;
  created_at: string;
}

export interface Alert {
  id: string;
  domain: string;
  risk_score: number;
  threat_level: string;
  action: string;
  device_hash: string | null;
  acknowledged: boolean;
  created_at: string;
}

export interface TrafficStats {
  total_analyzed: number;
  total_blocked: number;
  total_allowed: number;
  soft_blocked: number;
}

export function useRealtimeMonitor() {
  const [recentLogs, setRecentLogs] = useState<DomainLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<TrafficStats>({
    total_analyzed: 0,
    total_blocked: 0,
    total_allowed: 0,
    soft_blocked: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch recent logs
      const { data: logs } = await supabase
        .from('domain_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logs) {
        setRecentLogs(logs as DomainLog[]);
      }

      // Fetch unacknowledged alerts
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertsData) {
        setAlerts(alertsData as Alert[]);
      }

      // Fetch today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData } = await supabase
        .from('traffic_stats')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (statsData) {
        setStats({
          total_analyzed: statsData.total_analyzed || 0,
          total_blocked: statsData.total_blocked || 0,
          total_allowed: statsData.total_allowed || 0,
          soft_blocked: statsData.soft_blocked || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchInitialData();

    // Subscribe to domain_logs changes
    const logsChannel = supabase
      .channel('domain-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'domain_logs',
        },
        (payload) => {
          console.log('[REALTIME] New log:', payload.new);
          setRecentLogs((prev) => [payload.new as DomainLog, ...prev.slice(0, 49)]);
          
          // Update stats
          setStats((prev) => {
            const newStats = { ...prev, total_analyzed: prev.total_analyzed + 1 };
            const action = (payload.new as DomainLog).action;
            if (action === 'ALLOW') newStats.total_allowed++;
            if (action === 'SOFT-BLOCK') newStats.soft_blocked++;
            if (action === 'HARD-BLOCK') newStats.total_blocked++;
            return newStats;
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('[REALTIME] Logs channel status:', status);
      });

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          console.log('[REALTIME] New alert:', payload.new);
          setAlerts((prev) => [payload.new as Alert, ...prev.slice(0, 19)]);
          
          // Play alert sound for high-risk domains
          const alert = payload.new as Alert;
          if (alert.risk_score >= 80) {
            playAlertSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [fetchInitialData]);

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    }
  };

  // Acknowledge all alerts
  const acknowledgeAllAlerts = async () => {
    const alertIds = alerts.map((a) => a.id);
    if (alertIds.length === 0) return;

    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .in('id', alertIds);

    if (!error) {
      setAlerts([]);
    }
  };

  return {
    recentLogs,
    alerts,
    stats,
    isConnected,
    isLoading,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    refresh: fetchInitialData,
  };
}

// Play alert sound
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log('Could not play alert sound');
  }
}
