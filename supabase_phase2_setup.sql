-- BioMine Phase 2A: Operational Alerts & Timeline

-- 1. Operational Alerts Engine
CREATE TABLE IF NOT EXISTS operational_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  severity text, -- 'critical', 'warning', 'info'
  category text, -- 'diesel', 'fleet', 'maintenance', 'production', 'disposal'
  source_type text, -- 'vehicle', 'machine', 'site', 'system'
  source_id text,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for Alerts
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on alerts" ON operational_alerts;
DROP POLICY IF EXISTS "Allow authenticated insert on alerts" ON operational_alerts;
DROP POLICY IF EXISTS "Allow authenticated update on alerts" ON operational_alerts;

CREATE POLICY "Allow authenticated read on alerts" ON operational_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on alerts" ON operational_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on alerts" ON operational_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 2. Realtime Operational Timeline
CREATE TABLE IF NOT EXISTS operational_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text, -- 'movement', 'maintenance', 'threshold', 'mis_entry', 'alert'
  site text,
  message text NOT NULL,
  severity text DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for Timeline
ALTER TABLE operational_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on timeline" ON operational_timeline;
DROP POLICY IF EXISTS "Allow authenticated insert on timeline" ON operational_timeline;

CREATE POLICY "Allow authenticated read on timeline" ON operational_timeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on timeline" ON operational_timeline FOR INSERT TO authenticated WITH CHECK (true);


-- 3. Pre-populate mock data for demonstration
INSERT INTO operational_alerts (severity, category, source_type, title, description, status) 
VALUES 
  ('critical', 'fleet', 'vehicle', 'Vehicle Inactive', 'Heavy Truck DL-01-1234 has been idle for > 6 hours at Siliguri Plant.', 'active'),
  ('warning', 'maintenance', 'machine', 'Trommel Maintenance Due', 'Trommel Unit 2 at Northern Hub is scheduled for maintenance in 24 hours.', 'active'),
  ('info', 'production', 'site', 'Production Target Reached', 'Delhi facility exceeded daily production target by 12%.', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO operational_timeline (event_type, site, message, severity) 
VALUES 
  ('movement', 'Siliguri Plant', 'Vehicle DL-01-1234 arrived at site.', 'info'),
  ('threshold', 'Delhi Facility', 'Disposal volume exceeded 85% capacity threshold.', 'warning'),
  ('maintenance', 'Northern Hub', 'Routine maintenance completed on Baler System A.', 'success'),
  ('mis_entry', 'Siliguri Plant', 'New MIS log submitted by Rajesh Kumar.', 'info')
ON CONFLICT DO NOTHING;
