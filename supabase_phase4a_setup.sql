-- BioMine Phase 4A: Operations OS Upgrade

-- 1. Modify operational_alerts for Escalation Engine
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS resolution_notes text;
-- (Status can now be: 'active', 'acknowledged', 'investigating', 'resolved', 'archived')


-- 2. Driver Management System
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  phone text,
  license_number text UNIQUE,
  assigned_vehicle uuid REFERENCES fleet_vehicles(id),
  status text DEFAULT 'active', -- 'active', 'off-duty', 'on-leave'
  total_hours numeric DEFAULT 0,
  safety_score numeric DEFAULT 100,
  efficiency_score numeric DEFAULT 100,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated insert on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated update on drivers" ON drivers;

CREATE POLICY "Allow authenticated read on drivers" ON drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on drivers" ON drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on drivers" ON drivers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 3. Fleet Intelligence (Trips)
CREATE TABLE IF NOT EXISTS fleet_trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  origin_site text,
  destination_site text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  fuel_used numeric DEFAULT 0,
  distance numeric DEFAULT 0,
  trip_status text DEFAULT 'in-progress', -- 'in-progress', 'completed', 'cancelled'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fleet_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on fleet_trips" ON fleet_trips;
DROP POLICY IF EXISTS "Allow authenticated insert on fleet_trips" ON fleet_trips;
DROP POLICY IF EXISTS "Allow authenticated update on fleet_trips" ON fleet_trips;

CREATE POLICY "Allow authenticated read on fleet_trips" ON fleet_trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on fleet_trips" ON fleet_trips FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on fleet_trips" ON fleet_trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 4. Pre-populate mock data for Drivers
INSERT INTO drivers (full_name, phone, license_number, status, safety_score, efficiency_score) 
VALUES 
  ('Rajesh Kumar', '+91 9876543210', 'DL-12345', 'active', 95, 92),
  ('Suresh Singh', '+91 8765432109', 'DL-54321', 'active', 88, 75),
  ('Amit Patel', '+91 7654321098', 'DL-67890', 'off-duty', 100, 98)
ON CONFLICT (license_number) DO NOTHING;
