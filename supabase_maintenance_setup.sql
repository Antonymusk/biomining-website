-- BioMine Phase 4B: Maintenance Center

-- 1. Maintenance Machines
CREATE TABLE IF NOT EXISTS maintenance_machines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_name text NOT NULL,
  machine_type text,
  machine_id text UNIQUE, -- Asset tag
  site_id uuid REFERENCES inventory_sites(id),
  manufacturer text,
  installation_date timestamptz,
  status text DEFAULT 'Operational', -- 'Operational', 'Warning', 'Maintenance', 'Offline'
  health_score numeric DEFAULT 100,
  runtime_hours numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_machines" ON maintenance_machines;
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_machines" ON maintenance_machines;
DROP POLICY IF EXISTS "Allow authenticated update on maintenance_machines" ON maintenance_machines;
CREATE POLICY "Allow authenticated read on maintenance_machines" ON maintenance_machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on maintenance_machines" ON maintenance_machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on maintenance_machines" ON maintenance_machines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 2. Maintenance Work Orders
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wo_number text UNIQUE NOT NULL,
  machine_id uuid REFERENCES maintenance_machines(id),
  title text NOT NULL,
  description text,
  priority text DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
  status text DEFAULT 'Open', -- 'Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'
  assigned_technician text, -- Prep for technician architecture
  reported_by text,
  due_date timestamptz,
  completed_date timestamptz,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  requisition_id uuid REFERENCES requisitions(id), -- Procurement hook
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_work_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_work_orders" ON maintenance_work_orders;
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_work_orders" ON maintenance_work_orders;
DROP POLICY IF EXISTS "Allow authenticated update on maintenance_work_orders" ON maintenance_work_orders;
CREATE POLICY "Allow authenticated read on maintenance_work_orders" ON maintenance_work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on maintenance_work_orders" ON maintenance_work_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on maintenance_work_orders" ON maintenance_work_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 3. Maintenance Logs (Service History)
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id uuid REFERENCES maintenance_machines(id) ON DELETE CASCADE,
  work_order_id uuid REFERENCES maintenance_work_orders(id),
  service_type text, -- 'Preventative', 'Breakdown', 'Inspection', 'Calibration'
  service_notes text,
  parts_changed text,
  technician_name text,
  downtime_hours numeric DEFAULT 0,
  service_cost numeric DEFAULT 0,
  service_date timestamptz DEFAULT now(),
  next_service_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_logs" ON maintenance_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_logs" ON maintenance_logs;
CREATE POLICY "Allow authenticated read on maintenance_logs" ON maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on maintenance_logs" ON maintenance_logs FOR INSERT TO authenticated WITH CHECK (true);


-- 4. Maintenance Attachments
CREATE TABLE IF NOT EXISTS maintenance_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id uuid REFERENCES maintenance_machines(id),
  work_order_id uuid REFERENCES maintenance_work_orders(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_attachments" ON maintenance_attachments;
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_attachments" ON maintenance_attachments;
CREATE POLICY "Allow authenticated read on maintenance_attachments" ON maintenance_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on maintenance_attachments" ON maintenance_attachments FOR INSERT TO authenticated WITH CHECK (true);


-- Triggers
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_machines_updated_at ON maintenance_machines;
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON maintenance_machines FOR EACH ROW EXECUTE PROCEDURE update_maintenance_updated_at();

DROP TRIGGER IF EXISTS update_work_orders_updated_at ON maintenance_work_orders;
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON maintenance_work_orders FOR EACH ROW EXECUTE PROCEDURE update_maintenance_updated_at();
