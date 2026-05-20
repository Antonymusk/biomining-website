-- =================================================================================
-- Phase 10: Fleet to Maintenance Sync Automation
-- Description: Automatically synchronizes fleet vehicles as maintenance assets.
-- =================================================================================

-- 1. Create the synchronization trigger function
CREATE OR REPLACE FUNCTION sync_fleet_to_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- When a new fleet vehicle is added, insert it into maintenance_machines
        INSERT INTO maintenance_machines (
            id, 
            machine_name, 
            machine_type, 
            machine_id, 
            site_id, 
            status, 
            runtime_hours, 
            health_score,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.vehicle_name,
            COALESCE(NEW.vehicle_type, 'Vehicle'),
            NEW.vehicle_number,
            NEW.site_id,
            COALESCE(NEW.status, 'Operational'),
            COALESCE(NEW.running_hours, 0),
            COALESCE(NEW.efficiency, 100),
            COALESCE(NEW.created_at, now()),
            COALESCE(NEW.last_updated, now())
        )
        ON CONFLICT (id) DO NOTHING;

    ELSIF TG_OP = 'UPDATE' THEN
        -- When a fleet vehicle is updated, sync the relevant fields
        UPDATE maintenance_machines SET
            machine_name = NEW.vehicle_name,
            machine_type = COALESCE(NEW.vehicle_type, 'Vehicle'),
            machine_id = NEW.vehicle_number,
            site_id = NEW.site_id,
            status = COALESCE(NEW.status, 'Operational'),
            runtime_hours = COALESCE(NEW.running_hours, 0),
            health_score = COALESCE(NEW.efficiency, 100),
            updated_at = COALESCE(NEW.last_updated, now())
        WHERE id = NEW.id;

    ELSIF TG_OP = 'DELETE' THEN
        -- When a fleet vehicle is deleted, remove the maintenance asset
        DELETE FROM maintenance_machines WHERE id = OLD.id;
    END IF;

    RETURN NULL; -- AFTER trigger returns NULL
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to fleet_vehicles
DROP TRIGGER IF EXISTS trg_sync_fleet_to_maintenance ON fleet_vehicles;
CREATE TRIGGER trg_sync_fleet_to_maintenance
AFTER INSERT OR UPDATE OR DELETE ON fleet_vehicles
FOR EACH ROW EXECUTE PROCEDURE sync_fleet_to_maintenance();

-- 3. Backfill: Import all currently existing fleet vehicles into maintenance
INSERT INTO maintenance_machines (
    id, 
    machine_name, 
    machine_type, 
    machine_id, 
    site_id, 
    status, 
    runtime_hours, 
    health_score,
    created_at,
    updated_at
)
SELECT 
    id,
    vehicle_name,
    COALESCE(vehicle_type, 'Vehicle'),
    vehicle_number,
    site_id,
    COALESCE(status, 'Operational'),
    COALESCE(running_hours, 0),
    COALESCE(efficiency, 100),
    COALESCE(created_at, now()),
    COALESCE(last_updated, now())
FROM fleet_vehicles
ON CONFLICT (id) DO UPDATE SET
    machine_name = EXCLUDED.machine_name,
    machine_type = EXCLUDED.machine_type,
    machine_id = EXCLUDED.machine_id,
    site_id = EXCLUDED.site_id,
    status = EXCLUDED.status,
    runtime_hours = EXCLUDED.runtime_hours,
    health_score = EXCLUDED.health_score,
    updated_at = EXCLUDED.updated_at;

-- End of Script
