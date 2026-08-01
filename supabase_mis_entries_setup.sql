-- Supabase Schema Setup for MIS Entries, Vehicles, and Machines

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create mis_entries table
CREATE TABLE IF NOT EXISTS mis_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  site text NOT NULL,
  total_disposal numeric DEFAULT 0,
  total_production numeric DEFAULT 0,
  total_diesel numeric DEFAULT 0,
  fuel_opening numeric DEFAULT 0,
  calculated_diesel numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(site, date)
);

-- 2. Create vehicles table (child of mis_entries)
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mis_id uuid REFERENCES mis_entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  hours numeric DEFAULT 0,
  diesel numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Create machines table (child of mis_entries)
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mis_id uuid REFERENCES mis_entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  production numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mis_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all actions
CREATE POLICY "Allow authenticated full access on mis_entries" ON mis_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on vehicles" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access on machines" ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
