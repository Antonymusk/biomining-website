-- 1. Alter fleet_vehicles to support advanced tracking
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS vehicle_number text;
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS driver_name text;
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS site text;
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS last_updated timestamptz DEFAULT now();

-- 2. Ensure total_disposal exists in mis_entries (just in case they missed the previous step)
ALTER TABLE mis_entries ADD COLUMN IF NOT EXISTS total_disposal numeric DEFAULT 0;

-- 3. Pre-populate notifications table with sample operational alerts
INSERT INTO notifications (title, message, type, is_read) 
VALUES 
  ('Fuel Level Critical', 'Vehicle DL01AB1234 dropped below 15% fuel capacity at Site A.', 'danger', false),
  ('Maintenance Due', 'Trommel 1 at Northern Zone requires scheduled maintenance in 48 hours.', 'warning', false),
  ('High Disposal Rate', 'Disposal threshold exceeded normal parameters at Delhi Plant.', 'warning', false),
  ('System Update', 'New fleet intelligence firmware deployed successfully.', 'info', true)
ON CONFLICT DO NOTHING;

-- 4. Create trigger to auto-update last_updated on fleet_vehicles
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fleet_vehicles_modtime ON fleet_vehicles;
CREATE TRIGGER update_fleet_vehicles_modtime
BEFORE UPDATE ON fleet_vehicles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
