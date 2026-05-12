-- Phase 2: Database Optimization & Enterprise Hardening

-- 1. ADD B-TREE INDEXES FOR SCALABILITY
-- Fleet Vehicles
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_is_deleted ON fleet_vehicles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_is_archived ON fleet_vehicles(is_archived);

-- Maintenance Machines
CREATE INDEX IF NOT EXISTS idx_maintenance_machines_status ON maintenance_machines(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_machines_priority ON maintenance_machines(priority);

-- Requisitions
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_at ON requisitions(created_at DESC);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);

-- MIS Entries
CREATE INDEX IF NOT EXISTS idx_mis_entries_date ON mis_entries(date DESC);


-- 2. CREATE DAILY KPI SNAPSHOTS TABLE
-- This prevents massive recalculations on dashboard load
CREATE TABLE IF NOT EXISTS daily_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date date NOT NULL UNIQUE DEFAULT current_date,
  total_production numeric DEFAULT 0,
  total_fuel_consumed numeric DEFAULT 0,
  active_fleet_count integer DEFAULT 0,
  active_alerts_count integer DEFAULT 0,
  maintenance_pending_count integer DEFAULT 0,
  calculated_efficiency numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_date ON daily_kpi_snapshots(snapshot_date DESC);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_kpi_snapshot_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_kpi_snapshot_timestamp ON daily_kpi_snapshots;
CREATE TRIGGER trigger_update_kpi_snapshot_timestamp
BEFORE UPDATE ON daily_kpi_snapshots
FOR EACH ROW
EXECUTE FUNCTION update_kpi_snapshot_timestamp();


-- 3. RLS HARDENING 
-- Moving from public access to authenticated access
-- Enable RLS on core tables (assuming auth is enabled via Supabase)
ALTER TABLE daily_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users for KPI snapshots" 
ON daily_kpi_snapshots FOR SELECT 
USING (auth.role() = 'authenticated');

-- Additional RLS hardening can be added here for specific roles in the future.
