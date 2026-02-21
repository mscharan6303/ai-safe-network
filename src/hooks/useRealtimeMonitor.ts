import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from "@/hooks/use-toast";

const BACKEND_URL = 'https://ai-safe-network-backend.onrender.com';

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
  category?: string; // Add this if needed
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
  const [socket, setSocket] = useState<Socket | null>(null);
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

  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'], // Allow fallback for stability
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
      setIsLoading(false);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('new_analysis', (log: any) => {
       // Adapt backend camelCase to frontend snake_case
       const adaptedLog: DomainLog = {
         id: log.id || Date.now().toString() + Math.random(),
         domain: log.domain,
         risk_score: log.riskScore ?? log.risk_score,
         threat_level: log.threatLevel ?? log.threat_level,
         action: log.action,
         device_hash: log.deviceHash || null,
         source: log.source,
         features: log.features,
         created_at: log.timestamp || new Date().toISOString(),
         category: log.category
       };

       setRecentLogs(prev => [adaptedLog, ...prev].slice(0, 50));
       
       setStats(prev => {
         const newStats = { ...prev, total_analyzed: prev.total_analyzed + 1 };
         if (adaptedLog.action === 'HARD-BLOCK') newStats.total_blocked++;
         else if (adaptedLog.action === 'SOFT-BLOCK') newStats.soft_blocked++;
         else newStats.total_allowed++;
         return newStats;
       });
    });

    newSocket.on('alert', (alertData: any) => {
       const alert: Alert = {
         id: alertData.id || Date.now().toString(),
         domain: alertData.domain,
         risk_score: alertData.risk_score ?? alertData.riskScore,
         threat_level: alertData.threat_level ?? alertData.threatLevel,
         action: alertData.action,
         device_hash: alertData.deviceHash || null,
         acknowledged: false,
         created_at: alertData.timestamp || new Date().toISOString()
       };

       setAlerts(prev => [alert, ...prev].slice(0, 20));
       
       if (alert.risk_score >= 80) {
         toast({
           title: "🚨 High Risk Detected",
           description: `Blocked access to ${alert.domain}`,
           variant: "destructive"
         });
         playAlertSound();
       }
    });

    setSocket(newSocket);

    // Initial fetch could go here if the backend had an endpoint for recent history
    // For now we start empty or assume local state. 

    return () => {
      newSocket.close();
    };
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const acknowledgeAllAlerts = async () => {
    setAlerts([]);
  };

  const refresh = () => {
    // Reconnect or fetch history if implemented
    if (socket && !socket.connected) socket.connect();
  };

  return {
    recentLogs,
    alerts,
    stats,
    isConnected,
    isLoading,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    refresh,
  };
}

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
    console.error('Could not play alert sound');
  }
}

