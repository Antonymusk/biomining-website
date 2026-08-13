-- SQL Fix Script for MIS Entries, Vehicles, Machines, Sites, and Shift Closures RLS Policies
-- This enables public/anonymous access alongside authenticated access to prevent 42501 RLS policy errors

-- 1. mis_entries
ALTER TABLE mis_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on mis_entries" ON mis_entries;
DROP POLICY IF EXISTS "Allow public full access on mis_entries" ON mis_entries;
CREATE POLICY "Allow public full access on mis_entries" ON mis_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public full access on vehicles" ON vehicles;
CREATE POLICY "Allow public full access on vehicles" ON vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. machines
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on machines" ON machines;
DROP POLICY IF EXISTS "Allow public full access on machines" ON machines;
CREATE POLICY "Allow public full access on machines" ON machines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. sites
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on sites" ON sites;
DROP POLICY IF EXISTS "Allow public full access on sites" ON sites;
CREATE POLICY "Allow public full access on sites" ON sites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. shift_closures
ALTER TABLE shift_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on shift_closures" ON shift_closures;
DROP POLICY IF EXISTS "Allow public full access on shift_closures" ON shift_closures;
CREATE POLICY "Allow public full access on shift_closures" ON shift_closures FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
