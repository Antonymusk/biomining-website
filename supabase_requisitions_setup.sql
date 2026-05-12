-- BioMine Requisition & Procurement Management Center

-- 1. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name text NOT NULL UNIQUE,
  contact_person text,
  email text,
  phone text,
  performance_score numeric DEFAULT 100,
  reliability_score numeric DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow authenticated insert on vendors" ON vendors;
CREATE POLICY "Allow authenticated read on vendors" ON vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on vendors" ON vendors FOR INSERT TO authenticated WITH CHECK (true);


-- 2. Requisitions Table
CREATE TABLE IF NOT EXISTS requisitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_number text UNIQUE NOT NULL,
  site_id uuid REFERENCES inventory_sites(id),
  requested_by text,
  department text,
  category text,
  item_name text NOT NULL,
  item_description text,
  quantity numeric NOT NULL DEFAULT 1,
  priority text DEFAULT 'Medium', -- 'Critical', 'High', 'Medium', 'Low'
  status text DEFAULT 'Pending', -- 'Pending', 'Approved', 'In Procurement', 'Dispatched', 'Delivered', 'Fulfilled', 'Closed', 'Rejected', 'Cancelled'
  
  -- Workflow / Approval
  requested_date timestamptz DEFAULT now(),
  approved_by text,
  approved_at timestamptz,
  rejected_reason text,
  
  -- Procurement / Fulfillment
  fulfilled_by text,
  fulfilled_at timestamptz,
  expected_delivery_date timestamptz,
  actual_delivery_date timestamptz,
  vendor_id uuid REFERENCES vendors(id),
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  
  -- Tracking & Integration
  tracking_number text,
  inventory_item_id uuid, -- For inventory integration
  sla_deadline timestamptz,
  sla_breached boolean DEFAULT false,
  remarks text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on requisitions" ON requisitions;
DROP POLICY IF EXISTS "Allow authenticated insert on requisitions" ON requisitions;
DROP POLICY IF EXISTS "Allow authenticated update on requisitions" ON requisitions;
CREATE POLICY "Allow authenticated read on requisitions" ON requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on requisitions" ON requisitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on requisitions" ON requisitions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 3. Requisition Comments
CREATE TABLE IF NOT EXISTS requisition_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id uuid REFERENCES requisitions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  user_name text,
  comment_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requisition_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on requisition_comments" ON requisition_comments;
DROP POLICY IF EXISTS "Allow authenticated insert on requisition_comments" ON requisition_comments;
CREATE POLICY "Allow authenticated read on requisition_comments" ON requisition_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on requisition_comments" ON requisition_comments FOR INSERT TO authenticated WITH CHECK (true);


-- 4. Requisition Attachments
CREATE TABLE IF NOT EXISTS requisition_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  requisition_id uuid REFERENCES requisitions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requisition_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on requisition_attachments" ON requisition_attachments;
DROP POLICY IF EXISTS "Allow authenticated insert on requisition_attachments" ON requisition_attachments;
CREATE POLICY "Allow authenticated read on requisition_attachments" ON requisition_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on requisition_attachments" ON requisition_attachments FOR INSERT TO authenticated WITH CHECK (true);


-- 5. Audit Log Integration (Optional generic audit table)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  target_table text,
  target_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated read on audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);


-- Trigger to auto-update 'updated_at' on requisitions
CREATE OR REPLACE FUNCTION update_requisitions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_requisitions_updated_at ON requisitions;
CREATE TRIGGER update_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW
  EXECUTE PROCEDURE update_requisitions_updated_at_column();
