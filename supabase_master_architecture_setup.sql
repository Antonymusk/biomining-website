-- BioMine Phase 5: Ultimate Master Architecture Foundation

-- Enable pgvector extension for AI features
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. MULTI-TENANT & UNIFIED ASSET REGISTRY
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  domain text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id),
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plant_id uuid REFERENCES plants(id),
  asset_type text NOT NULL, -- 'Vehicle', 'Machine', 'Generator', 'Tool'
  serial_number text UNIQUE,
  lifecycle_status text DEFAULT 'Active',
  depreciation_value numeric,
  ownership text,
  operational_state text DEFAULT 'Online',
  created_at timestamptz DEFAULT now()
);

-- 2. AUTOMATION & EVENT-DRIVEN ENGINE
CREATE TABLE IF NOT EXISTS system_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL, -- 'maintenance.completed', 'fleet.offline'
  payload jsonb,
  source_module text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name text NOT NULL,
  trigger_condition jsonb, -- e.g., {"field": "fuel", "operator": "<", "value": 20}
  action_payload jsonb, -- e.g., {"action": "alert", "target": "admin"}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. WORKFLOW & APPROVALS
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  module text,
  steps jsonb, -- Array of approval steps
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module text,
  record_id uuid,
  approval_type text,
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. OBSERVABILITY, API & TELEMETRY
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  permissions jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name text NOT NULL, -- 'websocket_latency', 'sync_failure'
  metric_value numeric,
  details jsonb,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS file_registry (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  file_size numeric,
  linked_entity text, -- 'requisitions', 'maintenance'
  linked_id uuid,
  uploaded_by uuid REFERENCES auth.users(id),
  retention_policy text,
  created_at timestamptz DEFAULT now()
);

-- 5. INTELLIGENCE, SEARCH & COMPLIANCE
CREATE TABLE IF NOT EXISTS operational_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_date date DEFAULT current_date,
  kpi_data jsonb,
  alerts_count integer,
  active_fleet_count integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_search_index (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module text,
  record_id uuid,
  search_text text,
  embeddings vector(1536), -- Prepared for pgvector / AI features
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type text,
  status text,
  audit_date timestamptz,
  document_id uuid REFERENCES file_registry(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  severity text,
  status text DEFAULT 'Open',
  assigned_to uuid REFERENCES auth.users(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. CORE GOVERNANCE (AUDIT & VERSIONS)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type text NOT NULL, -- 'Archive', 'Restore', 'Delete', 'Lock'
  module text NOT NULL,
  record_id uuid,
  performed_by text,
  reason text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS record_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module text,
  record_id uuid,
  version_number integer,
  snapshot_data jsonb,
  changed_by text,
  created_at timestamptz DEFAULT now()
);


-- 7. UPGRADING EXISTING CORE TABLES FOR LIFECYCLE GOVERNANCE
DO $$ 
DECLARE
    t text;
    table_exists boolean;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY['mis_entries', 'fleet_vehicles', 'driver_profiles', 'requisitions', 'maintenance_machines', 'inventory_items'])
    LOOP
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t
        ) INTO table_exists;

        IF table_exists THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS archived_at timestamptz;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS archived_by text;', t);
            
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at timestamptz;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_by text;', t);
            
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deletion_reason text;', t);
            
            -- Smart Tagging & Collaborative Notes
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tags text[];', t);
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS internal_notes jsonb DEFAULT ''[]''::jsonb;', t);
        END IF;
    END LOOP;
END $$;
