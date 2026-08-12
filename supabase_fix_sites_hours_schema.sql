-- ==================================================================
-- BioMine Master Database Schema & Trigger Patch
-- Fixes:
-- 1. Missing 'hours' & 'manager' on public.sites
-- 2. Missing 'action_type' on public.audit_logs
-- 3. NOT NULL constraint error on 'action' column of public.audit_logs
-- ==================================================================

-- 1. FIX SITES TABLE COLUMNS
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS hours text DEFAULT '24 Hours';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS manager text DEFAULT 'N/A';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS capacity numeric DEFAULT 500;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS zone text DEFAULT 'Central';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS location text;

-- 2. FIX AUDIT_LOGS TABLE COLUMNS & CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action_type text DEFAULT 'AUDIT_LOG';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action text DEFAULT 'AUDIT_LOG';
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_table text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS performed_by text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_values jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_values jsonb;

-- Remove NOT NULL constraints on audit_logs columns so insertions from triggers or legacy code never fail
ALTER TABLE public.audit_logs ALTER COLUMN action DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN action_type DROP NOT NULL;
ALTER TABLE public.audit_logs ALTER COLUMN action SET DEFAULT 'AUDIT_LOG';
ALTER TABLE public.audit_logs ALTER COLUMN action_type SET DEFAULT 'AUDIT_LOG';

-- 3. UPDATE DATABASE AUDIT TRIGGER FUNCTION TO SUPPLY BOTH ACTION & ACTION_TYPE
CREATE OR REPLACE FUNCTION log_record_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    rec_id uuid;
    old_val jsonb := null;
    new_val jsonb := null;
    performed_by_user text := 'System/Trigger';
BEGIN
    BEGIN
        performed_by_user := current_setting('request.jwt.claim.email', true);
    EXCEPTION WHEN OTHERS THEN
        performed_by_user := 'System';
    END;

    IF (performed_by_user IS NULL OR performed_by_user = '') THEN
        performed_by_user := 'System';
    END IF;

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
        action,
        module,
        record_id,
        performed_by,
        reason,
        description,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_OP,
        TG_OP,
        TG_TABLE_NAME,
        rec_id,
        performed_by_user,
        'Database trigger auto-audit',
        TG_OP || ' operation on ' || TG_TABLE_NAME,
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

-- 4. RELOAD SUPABASE POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 5. ENSURE RLS POLICIES FOR SITES & AUDIT_LOGS
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable master access for authenticated users" ON public.sites;
CREATE POLICY "Enable master access for authenticated users" 
ON public.sites FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable master access for authenticated users" ON public.audit_logs;
CREATE POLICY "Enable master access for authenticated users" 
ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated read on audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

ANALYZE public.sites;
ANALYZE public.audit_logs;
