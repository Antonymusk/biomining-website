-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. inventory_sites
CREATE TABLE IF NOT EXISTS inventory_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  current_stock numeric DEFAULT 0,
  status text,
  trend text,
  created_at timestamptz DEFAULT now()
);

-- 3. fleet_vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  vehicle_name text NOT NULL,
  vehicle_type text,
  status text,
  running_hours numeric DEFAULT 0,
  fuel_level numeric DEFAULT 0,
  efficiency numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid, -- Optional, if you want user-specific notifications
  title text NOT NULL,
  message text,
  type text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE fleet_vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- RLS (Row Level Security) Policies
-- For now, allowing all authenticated users to select/insert/update/delete.
-- In a real production app, restrict based on user_id or roles.

ALTER TABLE inventory_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON inventory_sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON inventory_sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON inventory_sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON inventory_sites FOR DELETE TO authenticated USING (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON inventory_items FOR DELETE TO authenticated USING (true);

ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON fleet_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON fleet_vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON fleet_vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON fleet_vehicles FOR DELETE TO authenticated USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON notifications FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_site_id ON inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_site_id ON fleet_vehicles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
