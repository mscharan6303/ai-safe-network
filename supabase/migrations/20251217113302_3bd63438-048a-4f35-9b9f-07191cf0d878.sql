-- Create table for domain analysis logs
CREATE TABLE public.domain_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  threat_level TEXT NOT NULL DEFAULT 'safe',
  action TEXT NOT NULL DEFAULT 'ALLOW',
  device_hash TEXT,
  source TEXT DEFAULT 'manual',
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for real-time alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  risk_score NUMERIC NOT NULL,
  threat_level TEXT NOT NULL,
  action TEXT NOT NULL,
  device_hash TEXT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for statistics
CREATE TABLE public.traffic_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_analyzed INTEGER DEFAULT 0,
  total_blocked INTEGER DEFAULT 0,
  total_allowed INTEGER DEFAULT 0,
  soft_blocked INTEGER DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS
ALTER TABLE public.domain_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_stats ENABLE ROW LEVEL SECURITY;

-- Public read policies (no auth required for this security monitoring tool)
CREATE POLICY "Anyone can view domain logs" ON public.domain_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert domain logs" ON public.domain_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update alerts" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "Anyone can view traffic stats" ON public.traffic_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can insert traffic stats" ON public.traffic_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update traffic stats" ON public.traffic_stats FOR UPDATE USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.domain_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_stats;

-- Create index for faster queries
CREATE INDEX idx_domain_logs_created_at ON public.domain_logs(created_at DESC);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_acknowledged ON public.alerts(acknowledged);