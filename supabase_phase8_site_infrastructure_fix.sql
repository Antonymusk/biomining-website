-- ==================================================================
-- BioMine Ultimate Operational Registry & Governance Genesis FIX
-- ==================================================================

-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE THE MASTER REGISTRY (Fixes "Relation does not exist")
CREATE TABLE IF NOT EXISTS public.sites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    location text,
    zone text DEFAULT 'Central', -- North, South, East, West
    capacity numeric DEFAULT 500,
    status text DEFAULT 'Active', -- 'Active', 'Offline', 'Maintenance'
    hours text DEFAULT '24 Hours',
    manager text DEFAULT 'N/A',
    created_at timestamptz DEFAULT now()
);

-- 3. ACTIVATE ROW LEVEL SECURITY ON SITE ENTITY
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 4. ESTABLISH ABSOLUTE UNRESTRICTED WRITE PERMISSIONS (FOR ALL AUTHS)
DROP POLICY IF EXISTS "Enable master access for authenticated users" ON public.sites;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.sites;
DROP POLICY IF EXISTS "Enable write for authenticated users" ON public.sites;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.sites;

CREATE POLICY "Enable master access for authenticated users" 
ON public.sites 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. ENSURE GOVERNANCE CROSS-REFERENCES EXIST
-- Just in case Phase 5 was interrupted, ensure dependencies are established
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, site_id)
);

-- Enable RLS on the new dependency blocks just in case
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assignments ENABLE ROW LEVEL SECURITY;

-- Add minimal standard policies to guarantee app can always read them
DROP POLICY IF EXISTS "Auth Read Roles" ON public.roles;
CREATE POLICY "Auth Read Roles" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Read Maps" ON public.site_assignments;
CREATE POLICY "Auth Read Maps" ON public.site_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 6. [DATA RECOVERY] MIGRATE FROM LEGACY "inventory_sites" IF PRESENT
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_sites') THEN
        INSERT INTO public.sites (name, location, status)
        SELECT name, 'Inherited Legacy System Node', 'Active'
        FROM public.inventory_sites
        ON CONFLICT (name) DO NOTHING;
    END IF;
END $$;

-- 7. SEED DEFAULT CORE BASELINES (Ensures dashboard is never empty)
INSERT INTO public.sites (name, zone, capacity, status)
VALUES 
('Delhi Hub', 'North', 500, 'Active'),
('Mumbai Plant', 'West', 800, 'Active'),
('Pune Depot', 'West', 400, 'Active')
ON CONFLICT (name) DO NOTHING;

-- Finalize
ANALYZE public.sites;
