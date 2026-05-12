-- BioMine Enterprise Database Hardening & Optimization Script

-- 1. CRITICAL PERFORMANCE INDEXES
-- Optimize Operational Alerts queries (by severity, status, timestamps)
CREATE INDEX IF NOT EXISTS idx_operational_alerts_severity ON operational_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_status ON operational_alerts(status);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_created_at ON operational_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_alerts_source ON operational_alerts(source_type, source_id);

-- Optimize Fleet Trips queries (by vehicle, driver, times, status)
CREATE INDEX IF NOT EXISTS idx_fleet_trips_vehicle_id ON fleet_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_trips_driver_id ON fleet_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_trips_trip_status ON fleet_trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_fleet_trips_start_time ON fleet_trips(start_time DESC);

-- Optimize Requisitions queries (by site, status, priority, tracking, and timestamps)
CREATE INDEX IF NOT EXISTS idx_requisitions_site_id ON requisitions(site_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_priority ON requisitions(priority);
CREATE INDEX IF NOT EXISTS idx_requisitions_requisition_number ON requisitions(requisition_number);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_at ON requisitions(created_at DESC);

-- Optimize Maintenance Logs queries (by machine, service date, service type)
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_machine_id ON maintenance_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_service_date ON maintenance_logs(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_service_type ON maintenance_logs(service_type);

-- Optimize MIS Entries (by date, site)
CREATE INDEX IF NOT EXISTS idx_mis_entries_date ON mis_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_mis_entries_site ON mis_entries(site);


-- 2. PRODUCTION LOGGING SYSTEM
-- Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_level text NOT NULL, -- 'error', 'warn', 'info'
  module text NOT NULL,
  message text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for fast log retrieval and sorting
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(log_level);

-- RLS Hardening for system_logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on system_logs" ON system_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on system_logs" ON system_logs;
CREATE POLICY "Allow authenticated read on system_logs" ON system_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on system_logs" ON system_logs FOR INSERT TO authenticated WITH CHECK (true);


-- 3. ENTERPRISE AUDIT LOG TRACEABILITY
-- Generate unified trigger to log updates and deletes to audit_logs
CREATE OR REPLACE FUNCTION log_record_modification()
RETURNS TRIGGER AS $$
DECLARE
    performed_by_user text;
    old_val jsonb := null;
    new_val jsonb := null;
    rec_id uuid;
BEGIN
    -- Determine who is performing the change (fallback to system/authenticated user email)
    performed_by_user := coalesce(
        current_setting('request.jwt.claims', true)::jsonb->>'email',
        'system'
    );

    IF (TG_OP = 'DELETE') THEN
        rec_id := OLD.id;
        old_val := to_jsonb(OLD);
    ELSIF (TG_OP = 'UPDATE') THEN
        rec_id := NEW.id;
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        rec_id := NEW.id;
        new_val := to_jsonb(NEW);
    END IF;

    INSERT INTO audit_logs (
        action_type,
        module,
        record_id,
        performed_by,
        reason,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        rec_id,
        performed_by_user,
        'Database trigger auto-audit',
        old_val,
        new_val,
        now()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind modification triggers to major transaction tables
DROP TRIGGER IF EXISTS audit_requisitions ON requisitions;
CREATE TRIGGER audit_requisitions
AFTER INSERT OR UPDATE OR DELETE ON requisitions
FOR EACH ROW EXECUTE FUNCTION log_record_modification();

DROP TRIGGER IF EXISTS audit_maintenance_logs ON maintenance_logs;
CREATE TRIGGER audit_maintenance_logs
AFTER INSERT OR UPDATE OR DELETE ON maintenance_logs
FOR EACH ROW EXECUTE FUNCTION log_record_modification();

DROP TRIGGER IF EXISTS audit_fleet_trips ON fleet_trips;
CREATE TRIGGER audit_fleet_trips
AFTER INSERT OR UPDATE OR DELETE ON fleet_trips
FOR EACH ROW EXECUTE FUNCTION log_record_modification();

DROP TRIGGER IF EXISTS audit_mis_entries ON mis_entries;
CREATE TRIGGER audit_mis_entries
AFTER INSERT OR UPDATE OR DELETE ON mis_entries
FOR EACH ROW EXECUTE FUNCTION log_record_modification();
