-- ==============================================
-- BioMine Enterprise RBAC & Governance Setup
-- ==============================================

-- 1. CENTRALIZED SITES REGISTRY
CREATE TABLE IF NOT EXISTS public.sites (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    location text,
    zone text, -- North, South, East, West
    capacity numeric,
    status text DEFAULT 'Active', -- 'Active', 'Offline', 'Maintenance'
    created_at timestamptz DEFAULT now()
);

-- Seed default sites to prevent blank states
INSERT INTO public.sites (name, zone, capacity, status)
VALUES 
('Delhi Hub', 'North', 500, 'Active'),
('Mumbai Plant', 'West', 800, 'Active'),
('Pune Depot', 'West', 400, 'Active')
ON CONFLICT (name) DO NOTHING;


-- 2. RBAC STRUCTURE
CREATE TABLE IF NOT EXISTS public.roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    module_name text NOT NULL,
    access_level text NOT NULL CHECK (access_level IN ('NO_ACCESS', 'READ_ONLY', 'READ_WRITE', 'FULL_CONTROL')),
    UNIQUE(role_id, module_name)
);

CREATE TABLE IF NOT EXISTS public.site_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now(),
    UNIQUE(user_id, site_id)
);

-- Update/Refine core User Roles to support linking to the role table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);

-- 3. POPULATE ROLES & PERMISSION MATRIX
DO $$
DECLARE
    super_admin_id uuid;
    site_incharge_id uuid;
    back_office_id uuid;
    ops_auditor_id uuid;
    mis_operator_id uuid;
BEGIN
    -- Insert Roles
    INSERT INTO public.roles (name, description) VALUES 
    ('Super Admin', 'Platform owner / enterprise governance controller.'),
    ('Site Incharge', 'Operational site supervisor.'),
    ('Back Office', 'Operational data management & site administration.'),
    ('Operations Auditor', 'Cross-site audit & workforce oversight.'),
    ('MIS Operator', 'Dedicated operational MIS data entry role.')
    ON CONFLICT (name) DO NOTHING;

    -- Get IDs
    SELECT id INTO super_admin_id FROM public.roles WHERE name = 'Super Admin';
    SELECT id INTO site_incharge_id FROM public.roles WHERE name = 'Site Incharge';
    SELECT id INTO back_office_id FROM public.roles WHERE name = 'Back Office';
    SELECT id INTO ops_auditor_id FROM public.roles WHERE name = 'Operations Auditor';
    SELECT id INTO mis_operator_id FROM public.roles WHERE name = 'MIS Operator';

    -- -----------------------------------------
    -- A. Super Admin Perms (FULL_CONTROL all)
    -- -----------------------------------------
    INSERT INTO public.module_permissions (role_id, module_name, access_level)
    SELECT super_admin_id, m, 'FULL_CONTROL' FROM unnest(ARRAY['Dashboard', 'MIS', 'Fleet Control', 'Drivers', 'Inventory', 'Maintenance', 'Procurement', 'Analytics', 'Alert Center', 'Manpower', 'Reports', 'Settings', 'Global Configuration', 'User Management']) AS m
    ON CONFLICT DO NOTHING;

    -- -----------------------------------------
    -- B. Site Incharge Perms
    -- -----------------------------------------
    INSERT INTO public.module_permissions (role_id, module_name, access_level) VALUES 
    (site_incharge_id, 'Dashboard', 'READ_ONLY'),
    (site_incharge_id, 'MIS', 'READ_WRITE'),
    (site_incharge_id, 'Fleet Control', 'READ_WRITE'),
    (site_incharge_id, 'Drivers', 'READ_WRITE'),
    (site_incharge_id, 'Manpower', 'READ_ONLY'),
    (site_incharge_id, 'Procurement', 'READ_WRITE'),
    (site_incharge_id, 'Reports', 'READ_ONLY'),
    (site_incharge_id, 'Settings', 'READ_ONLY')
    ON CONFLICT DO NOTHING;

    -- -----------------------------------------
    -- C. Back Office Perms
    -- -----------------------------------------
    INSERT INTO public.module_permissions (role_id, module_name, access_level) VALUES 
    (back_office_id, 'Dashboard', 'READ_ONLY'),
    (back_office_id, 'MIS', 'READ_WRITE'),
    (back_office_id, 'Fleet Control', 'READ_WRITE'),
    (back_office_id, 'Drivers', 'READ_WRITE'),
    (back_office_id, 'Manpower', 'READ_WRITE'),
    (back_office_id, 'Inventory', 'READ_WRITE'),
    (back_office_id, 'Maintenance', 'READ_WRITE'),
    (back_office_id, 'Procurement', 'READ_WRITE'),
    (back_office_id, 'Analytics', 'READ_ONLY'),
    (back_office_id, 'Alert Center', 'READ_ONLY'),
    (back_office_id, 'Reports', 'READ_ONLY'),
    (back_office_id, 'Settings', 'READ_ONLY')
    ON CONFLICT DO NOTHING;

    -- -----------------------------------------
    -- D. Operations Auditor Perms
    -- -----------------------------------------
    -- Allowed editable: Fleet, Drivers, Inventory, Maintenance, Manpower
    -- View-only: MIS, Procurement, Analytics, Reports, Alert Center
    INSERT INTO public.module_permissions (role_id, module_name, access_level) VALUES 
    (ops_auditor_id, 'Fleet Control', 'READ_WRITE'),
    (ops_auditor_id, 'Drivers', 'READ_WRITE'),
    (ops_auditor_id, 'Inventory', 'READ_WRITE'),
    (ops_auditor_id, 'Maintenance', 'READ_WRITE'),
    (ops_auditor_id, 'Manpower', 'READ_WRITE'),
    (ops_auditor_id, 'MIS', 'READ_ONLY'),
    (ops_auditor_id, 'Procurement', 'READ_ONLY'),
    (ops_auditor_id, 'Analytics', 'READ_ONLY'),
    (ops_auditor_id, 'Reports', 'READ_ONLY'),
    (ops_auditor_id, 'Alert Center', 'READ_ONLY')
    ON CONFLICT DO NOTHING;

    -- -----------------------------------------
    -- E. MIS Operator Perms
    -- -----------------------------------------
    INSERT INTO public.module_permissions (role_id, module_name, access_level) VALUES 
    (mis_operator_id, 'MIS', 'READ_WRITE')
    ON CONFLICT DO NOTHING;
END $$;

-- 4. ENTERPRISE MODULE ENTITIES

-- Manpower Management
CREATE TABLE IF NOT EXISTS public.manpower (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name text NOT NULL,
    designation text,
    work_responsibility text,
    site_id uuid REFERENCES public.sites(id) ON DELETE SET NULL,
    status text DEFAULT 'Active', -- 'Active', 'On Leave', 'Terminated'
    contact_number text,
    created_at timestamptz DEFAULT now()
);

-- Shift Closure System
CREATE TABLE IF NOT EXISTS public.shift_closures (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    closed_by uuid REFERENCES auth.users(id),
    closed_at timestamptz DEFAULT now(),
    shift_date date NOT NULL DEFAULT CURRENT_DATE,
    total_disposal numeric DEFAULT 0,
    operational_notes text,
    audit_trail_locked boolean DEFAULT false,
    UNIQUE(site_id, shift_date)
);

-- 5. ENTERPRISE SECURITY (SESSION TRACKING)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address text,
    user_agent text,
    login_time timestamptz DEFAULT now(),
    last_activity timestamptz DEFAULT now(),
    status text DEFAULT 'Active' -- 'Active', 'Terminated', 'Expired'
);

-- Automatically sync existing string roles in user_roles to role_id
UPDATE public.user_roles ur
SET role_id = r.id
FROM public.roles r
WHERE ur.role = r.name AND ur.role_id IS NULL;

-- Setup basic RLS for these tables
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manpower ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON public.module_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read for authenticated users" ON public.site_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable access for manpower" ON public.manpower FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for closures" ON public.shift_closures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for sessions" ON public.user_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- End of Setup
