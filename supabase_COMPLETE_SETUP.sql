-- =======================================================================
-- BIOMINE ENTERPRISE DATABASE INITIALIZATION SCRIPT
-- Run this entire script in Supabase SQL Editor to resolve all schema issues.
-- =======================================================================



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. inventory_sites
CREATE TABLE IF NOT EXISTS inventory_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  current_stock numeric DEFAULT 0,
  status text,
  trend text,
  created_at timestamptz DEFAULT now()
);

-- 3. fleet_vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  vehicle_name text NOT NULL,
  vehicle_type text,
  status text,
  running_hours numeric DEFAULT 0,
  fuel_level numeric DEFAULT 0,
  efficiency numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid, -- Optional, if you want user-specific notifications
  title text NOT NULL,
  message text,
  type text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Realtime Setup

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'inventory_items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'fleet_vehicles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE fleet_vehicles';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE notifications';
  END IF;
END $$;


-- RLS (Row Level Security) Policies
-- For now, allowing all authenticated users to select/insert/update/delete.
-- In a real production app, restrict based on user_id or roles.

ALTER TABLE inventory_sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_sites;
CREATE POLICY "Allow authenticated read" ON inventory_sites FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_sites;
CREATE POLICY "Allow authenticated insert" ON inventory_sites FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_sites;
CREATE POLICY "Allow authenticated update" ON inventory_sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_sites;
CREATE POLICY "Allow authenticated delete" ON inventory_sites FOR DELETE TO authenticated USING (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_items;
CREATE POLICY "Allow authenticated read" ON inventory_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_items;
CREATE POLICY "Allow authenticated insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_items;
CREATE POLICY "Allow authenticated update" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_items;
CREATE POLICY "Allow authenticated delete" ON inventory_items FOR DELETE TO authenticated USING (true);

ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON fleet_vehicles;
CREATE POLICY "Allow authenticated read" ON fleet_vehicles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON fleet_vehicles;
CREATE POLICY "Allow authenticated insert" ON fleet_vehicles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON fleet_vehicles;
CREATE POLICY "Allow authenticated update" ON fleet_vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON fleet_vehicles;
CREATE POLICY "Allow authenticated delete" ON fleet_vehicles FOR DELETE TO authenticated USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON notifications;
CREATE POLICY "Allow authenticated read" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON notifications;
CREATE POLICY "Allow authenticated insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON notifications;
CREATE POLICY "Allow authenticated update" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON notifications;
CREATE POLICY "Allow authenticated delete" ON notifications FOR DELETE TO authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_site_id ON inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_site_id ON fleet_vehicles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_schema.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase9_profile_infrastructure.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==================================================================
-- BioMine Dynamic Profile Infrastructure Expansion
-- ==================================================================

-- 1. ENSURE THE USERS TABLE EXISTS (Just in case of environment mismatch)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text,
    avatar_url text,
    created_at timestamptz DEFAULT now()
);

-- 2. APPEND MISSING EXTENDED ATTRIBUTE COLUMNS
-- Expands profile storage for dynamic operational configurations
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS designation text;

-- 3. RESET RLS POLICIES (ENFORCE TOTAL READ/WRITE FOR OWN PROFILE)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users access" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Self manage profile" ON public.users;

DROP POLICY IF EXISTS "Self manage profile" ON public.users;
CREATE POLICY "Self manage profile" 
ON public.users 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 4. PERMIT PUBLIC READ FOR INTERNAL DIRECTORIES (Dashboard lookup)
DROP POLICY IF EXISTS "Read all profiles" ON public.users;
DROP POLICY IF EXISTS "Read all profiles" ON public.users;
CREATE POLICY "Read all profiles" ON public.users FOR SELECT TO authenticated USING (true);

ANALYZE public.users;


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase9_profile_infrastructure.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: database_user_roles.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- BioMine Enterprise Role-Based Access Control (RBAC) Schema Setup

-- 1. Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Viewer', -- 'Super Admin', 'Admin', 'Site Manager', 'Operator', 'Viewer'
  assigned_site text, -- Name of the inventory site (site restriction boundary)
  approval_status text NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for speedy security lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(approval_status);

-- 2. Row Level Security (RLS) Configuration
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read roles (needed to fetch their own and check permissions)
DROP POLICY IF EXISTS "Allow authenticated read on roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated read on roles" ON public.user_roles;
CREATE POLICY "Allow authenticated read on roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Helper function to avoid infinite recursion inside RLS policies
CREATE OR REPLACE FUNCTION public.check_is_admin(check_user_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role IN ('Super Admin', 'Admin')
  );
END;
$$ LANGUAGE plpgsql;

-- Allow Super Admin and Admin to manage roles
DROP POLICY IF EXISTS "Allow administrative write on roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow administrative write on roles" ON public.user_roles;
CREATE POLICY "Allow administrative write on roles" ON public.user_roles
  FOR ALL TO authenticated
  USING ( public.check_is_admin(auth.uid()) )
  WITH CHECK ( public.check_is_admin(auth.uid()) );

-- 3. Automatic User Registration Trigger & Bootstrap Rules
-- Automatically registers any new sign-up and auto-promotes the first user or emergency recovery emails
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
  super_admin_count int;
  assigned_role text;
  assigned_status text;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- Calculate existing approved Super Admins
  SELECT count(*) INTO super_admin_count FROM public.user_roles WHERE role = 'Super Admin' AND approval_status = 'Approved' AND suspended = false;

  -- Bootstrap Trigger & Emergency Recovery Protection
  IF super_admin_count = 0 OR new.email = 'system@biomine.com' OR new.email = 'admin@biomine.com' OR new.email LIKE 'admin@%' THEN
    assigned_role := 'Super Admin';
    assigned_status := 'Approved';
  ELSE
    assigned_role := 'Viewer';
    assigned_status := 'Pending';
  END IF;

  -- Insert into public.user_roles
  INSERT INTO public.user_roles (user_id, role, approval_status, suspended, created_at)
  VALUES (
    new.id,
    assigned_role,
    assigned_status,
    false,
    now()
  ) ON CONFLICT (user_id) DO UPDATE 
  SET role = EXCLUDED.role, approval_status = EXCLUDED.approval_status;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: database_user_roles.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase5_rbac_governance.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.sites;
CREATE POLICY "Enable read for authenticated users" ON public.sites FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.roles;
CREATE POLICY "Enable read for authenticated users" ON public.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.module_permissions;
CREATE POLICY "Enable read for authenticated users" ON public.module_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.site_assignments;
CREATE POLICY "Enable read for authenticated users" ON public.site_assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Enable access for manpower" ON public.manpower;
CREATE POLICY "Enable access for manpower" ON public.manpower FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable access for closures" ON public.shift_closures;
CREATE POLICY "Enable access for closures" ON public.shift_closures FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Enable access for sessions" ON public.user_sessions;
CREATE POLICY "Enable access for sessions" ON public.user_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- End of Setup


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase5_rbac_governance.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_inventory_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. inventory_sites
CREATE TABLE IF NOT EXISTS inventory_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. inventory_items
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text,
  current_stock numeric DEFAULT 0,
  status text,
  trend text,
  created_at timestamptz DEFAULT now()
);

-- 3. fleet_vehicles
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id uuid REFERENCES inventory_sites(id) ON DELETE CASCADE,
  vehicle_name text NOT NULL,
  vehicle_type text,
  status text,
  running_hours numeric DEFAULT 0,
  fuel_level numeric DEFAULT 0,
  efficiency numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid, -- Optional
  title text NOT NULL,
  message text,
  type text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Users table extensions
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Add new columns for the extended profile
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS designation text;

-- RLS (Row Level Security) Policies
ALTER TABLE inventory_sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_sites;
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_sites;
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_sites;
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_sites;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_sites;
CREATE POLICY "Allow authenticated read" ON inventory_sites FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_sites;
CREATE POLICY "Allow authenticated insert" ON inventory_sites FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_sites;
CREATE POLICY "Allow authenticated update" ON inventory_sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_sites;
CREATE POLICY "Allow authenticated delete" ON inventory_sites FOR DELETE TO authenticated USING (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_items;
CREATE POLICY "Allow authenticated read" ON inventory_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_items;
CREATE POLICY "Allow authenticated insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_items;
CREATE POLICY "Allow authenticated update" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_items;
CREATE POLICY "Allow authenticated delete" ON inventory_items FOR DELETE TO authenticated USING (true);

ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated update" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated delete" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated read" ON fleet_vehicles;
CREATE POLICY "Allow authenticated read" ON fleet_vehicles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON fleet_vehicles;
CREATE POLICY "Allow authenticated insert" ON fleet_vehicles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON fleet_vehicles;
CREATE POLICY "Allow authenticated update" ON fleet_vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON fleet_vehicles;
CREATE POLICY "Allow authenticated delete" ON fleet_vehicles FOR DELETE TO authenticated USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated insert" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated update" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated delete" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated read" ON notifications;
CREATE POLICY "Allow authenticated read" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert" ON notifications;
CREATE POLICY "Allow authenticated insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update" ON notifications;
CREATE POLICY "Allow authenticated update" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated delete" ON notifications;
CREATE POLICY "Allow authenticated delete" ON notifications FOR DELETE TO authenticated USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.users;
CREATE POLICY "Allow authenticated read" ON public.users FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.users;
CREATE POLICY "Allow authenticated insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Allow authenticated update own profile" ON public.users;
CREATE POLICY "Allow authenticated update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_site_id ON inventory_items(site_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_site_id ON fleet_vehicles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 6. Storage Bucket for Avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their avatar" ON storage.objects;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;
CREATE POLICY "Anyone can update an avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Anyone can delete their avatar" ON storage.objects;
CREATE POLICY "Anyone can delete their avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_inventory_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_equipment_prices_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ====================================================================
-- BIOMINE OPERATIONAL INTELLIGENCE PLATFORM
-- DATABASE UPGRADE: STATE-WISE EQUIPMENT & MACHINERY PRICE TRANSPARENCY
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create equipment_prices table
CREATE TABLE IF NOT EXISTS public.equipment_prices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name text NOT NULL,
    model_number text,
    category text NOT NULL CHECK (category IN ('Machinery', 'Equipment', 'Auxiliary')),
    state text NOT NULL,
    base_price numeric NOT NULL DEFAULT 0,
    gst_percent numeric NOT NULL DEFAULT 18.0,
    freight_cost numeric NOT NULL DEFAULT 0,
    state_cess numeric NOT NULL DEFAULT 0,
    specifications jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Ensure same equipment/model is unique per state
    CONSTRAINT uq_equipment_state UNIQUE (item_name, model_number, state)
);

-- Enable RLS
ALTER TABLE public.equipment_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated read on prices" ON public.equipment_prices;
DROP POLICY IF EXISTS "Allow authorized write on prices" ON public.equipment_prices;

-- Read policy: Anyone authenticated can read (transparency guaranteed)
DROP POLICY IF EXISTS "Allow authenticated read on prices" ON public.equipment_prices;
CREATE POLICY "Allow authenticated read on prices" 
ON public.equipment_prices 
FOR SELECT 
TO authenticated 
USING (true);

-- Write policy: Restricted to Super Admins, Site Incharges, or Back Office
-- (We'll check user_roles/roles setup in Supabase or fallback to user permissions check in app)
DROP POLICY IF EXISTS "Allow authorized write on prices" ON public.equipment_prices;
CREATE POLICY "Allow authorized write on prices" 
ON public.equipment_prices 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('Super Admin', 'Site Incharge', 'Back Office')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('Super Admin', 'Site Incharge', 'Back Office')
    )
);

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_equipment_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS tr_update_equipment_prices_updated_at ON public.equipment_prices;
CREATE TRIGGER tr_update_equipment_prices_updated_at
BEFORE UPDATE ON public.equipment_prices
FOR EACH ROW
EXECUTE FUNCTION update_equipment_prices_updated_at();

-- Seed dynamic transparency parameters state-wise
INSERT INTO public.equipment_prices (item_name, model_number, category, state, base_price, gst_percent, freight_cost, state_cess, specifications)
VALUES
-- Excavators
('CAT Heavy Excavator', '390D L', 'Machinery', 'Jharkhand', 32000000, 18.0, 450000, 2.5, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Odisha', 32000000, 18.0, 480000, 4.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Chhattisgarh', 32000000, 18.0, 420000, 1.5, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'Madhya Pradesh', 32000000, 18.0, 520000, 2.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),
('CAT Heavy Excavator', '390D L', 'Machinery', 'West Bengal', 32000000, 18.0, 390000, 3.0, '{"engine_power": "524 HP", "operating_weight": "86275 kg", "bucket_capacity": "4.6 m³", "warranty": "36 Months"}'),

-- Dump Trucks
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Jharkhand', 48000000, 18.0, 600000, 2.0, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Odisha', 48000000, 18.0, 650000, 3.5, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Chhattisgarh', 48000000, 18.0, 580000, 1.5, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),
('Komatsu Off-Highway Dump Truck', 'HD785-7', 'Machinery', 'Madhya Pradesh', 48000000, 18.0, 720000, 2.0, '{"engine_power": "1200 HP", "payload_capacity": "91.0 Ton", "gross_weight": "166500 kg", "max_speed": "65 km/h"}'),

-- Drill Rigs
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Jharkhand', 19000000, 18.0, 250000, 1.0, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Odisha', 19000000, 18.0, 280000, 2.5, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),
('Sandvik Crawler Drill', 'DI550', 'Equipment', 'Rajasthan', 19000000, 18.0, 320000, 1.5, '{"hole_diameter": "90-165 mm", "engine": "CAT C13 328 kW", "air_delivery": "24.4 m³/min", "operating_weight": "24000 kg"}'),

-- Wheel Loaders
('CAT Wheel Loader', '966L', 'Equipment', 'Jharkhand', 16500000, 18.0, 180000, 1.2, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),
('CAT Wheel Loader', '966L', 'Equipment', 'Odisha', 16500000, 18.0, 210000, 2.5, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),
('CAT Wheel Loader', '966L', 'Equipment', 'Chhattisgarh', 16500000, 18.0, 170000, 1.0, '{"flywheel_power": "290 HP", "operating_weight": "23000 kg", "bucket_capacity": "3.8 m³", "transmission": "Powershift"}'),

-- Auxiliary Power
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'Jharkhand', 4500000, 18.0, 85000, 0.5, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}'),
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'Odisha', 4500000, 18.0, 92000, 1.0, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}'),
('Cummins Silent Power DG Set', '500kVA', 'Auxiliary', 'West Bengal', 4500000, 18.0, 78000, 0.8, '{"power_rating": "500 kVA / 400 kWe", "engine": "KTA19-G9", "fuel_tank": "850 Liters", "dimensions": "5200x2000x2200 mm"}')
ON CONFLICT (item_name, model_number, state) 
DO UPDATE SET 
    base_price = EXCLUDED.base_price,
    gst_percent = EXCLUDED.gst_percent,
    freight_cost = EXCLUDED.freight_cost,
    state_cess = EXCLUDED.state_cess,
    specifications = EXCLUDED.specifications,
    updated_at = now();

COMMENT ON TABLE public.equipment_prices IS 'Sovereign pricing indices for equipments and machineries across Indian operational states.';


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_equipment_prices_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_mis_entries_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- Supabase Schema Setup for MIS Entries, Vehicles, and Machines

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create mis_entries table
CREATE TABLE IF NOT EXISTS mis_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  site text NOT NULL,
  total_disposal numeric DEFAULT 0,
  total_production numeric DEFAULT 0,
  total_diesel numeric DEFAULT 0,
  fuel_opening numeric DEFAULT 0,
  calculated_diesel numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(site, date)
);

-- 2. Create vehicles table (child of mis_entries)
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mis_id uuid REFERENCES mis_entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  hours numeric DEFAULT 0,
  diesel numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Create machines table (child of mis_entries)
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mis_id uuid REFERENCES mis_entries(id) ON DELETE CASCADE,
  name text NOT NULL,
  production numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mis_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to perform all actions
DROP POLICY IF EXISTS "Allow authenticated full access on mis_entries" ON mis_entries;
CREATE POLICY "Allow authenticated full access on mis_entries" ON mis_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated full access on vehicles" ON vehicles;
CREATE POLICY "Allow authenticated full access on vehicles" ON vehicles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated full access on machines" ON machines;
CREATE POLICY "Allow authenticated full access on machines" ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_mis_entries_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_requisitions_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
DROP POLICY IF EXISTS "Allow authenticated read on vendors" ON vendors;
CREATE POLICY "Allow authenticated read on vendors" ON vendors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on vendors" ON vendors;
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
DROP POLICY IF EXISTS "Allow authenticated read on requisitions" ON requisitions;
CREATE POLICY "Allow authenticated read on requisitions" ON requisitions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on requisitions" ON requisitions;
CREATE POLICY "Allow authenticated insert on requisitions" ON requisitions FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on requisitions" ON requisitions;
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
DROP POLICY IF EXISTS "Allow authenticated read on requisition_comments" ON requisition_comments;
CREATE POLICY "Allow authenticated read on requisition_comments" ON requisition_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on requisition_comments" ON requisition_comments;
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
DROP POLICY IF EXISTS "Allow authenticated read on requisition_attachments" ON requisition_attachments;
CREATE POLICY "Allow authenticated read on requisition_attachments" ON requisition_attachments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on requisition_attachments" ON requisition_attachments;
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
DROP POLICY IF EXISTS "Allow authenticated read on audit_logs" ON audit_logs;
CREATE POLICY "Allow authenticated read on audit_logs" ON audit_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on audit_logs" ON audit_logs;
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_requisitions_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_procurement_workflow_upgrade.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- BioMine Procurement Workflow Upgrade

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS dispatched_by text;

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivered_by text;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS invoice_reference text;

ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS quantity_fulfilled numeric DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS procurement_owner uuid REFERENCES auth.users(id);

-- Optional: Add status constraint if we want to enforce it later, but keeping it text for flexibility.


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_procurement_workflow_upgrade.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_maintenance_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_machines" ON maintenance_machines;
CREATE POLICY "Allow authenticated read on maintenance_machines" ON maintenance_machines FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_machines" ON maintenance_machines;
CREATE POLICY "Allow authenticated insert on maintenance_machines" ON maintenance_machines FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on maintenance_machines" ON maintenance_machines;
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
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_work_orders" ON maintenance_work_orders;
CREATE POLICY "Allow authenticated read on maintenance_work_orders" ON maintenance_work_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_work_orders" ON maintenance_work_orders;
CREATE POLICY "Allow authenticated insert on maintenance_work_orders" ON maintenance_work_orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on maintenance_work_orders" ON maintenance_work_orders;
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
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_logs" ON maintenance_logs;
CREATE POLICY "Allow authenticated read on maintenance_logs" ON maintenance_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_logs" ON maintenance_logs;
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
DROP POLICY IF EXISTS "Allow authenticated read on maintenance_attachments" ON maintenance_attachments;
CREATE POLICY "Allow authenticated read on maintenance_attachments" ON maintenance_attachments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on maintenance_attachments" ON maintenance_attachments;
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_maintenance_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase10_fleet_maintenance_sync.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
            NEW.vehicle_name,
            NEW.site_id,
            COALESCE(NEW.status, 'Operational'),
            COALESCE(NEW.running_hours, 0),
            COALESCE(NEW.efficiency, 100),
            COALESCE(NEW.created_at, now()),
            now()
        )
        ON CONFLICT (id) DO NOTHING;

    ELSIF TG_OP = 'UPDATE' THEN
        -- When a fleet vehicle is updated, sync the relevant fields
        UPDATE maintenance_machines SET
            machine_name = NEW.vehicle_name,
            machine_type = COALESCE(NEW.vehicle_type, 'Vehicle'),
            machine_id = NEW.vehicle_name,
            site_id = NEW.site_id,
            status = COALESCE(NEW.status, 'Operational'),
            runtime_hours = COALESCE(NEW.running_hours, 0),
            health_score = COALESCE(NEW.efficiency, 100),
            updated_at = now()
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
    vehicle_name,
    site_id,
    COALESCE(status, 'Operational'),
    COALESCE(running_hours, 0),
    COALESCE(efficiency, 100),
    COALESCE(created_at, now()),
    now()
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase10_fleet_maintenance_sync.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_analytics_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- Add total_disposal to mis_entries if it does not exist
ALTER TABLE mis_entries ADD COLUMN IF NOT EXISTS total_disposal numeric DEFAULT 0;

-- Optional: Create an index to speed up date-range and site filtering
CREATE INDEX IF NOT EXISTS idx_mis_entries_date ON mis_entries(date);
CREATE INDEX IF NOT EXISTS idx_mis_entries_site ON mis_entries(site);


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_analytics_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_command_center_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_command_center_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase2_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- BioMine Phase 2A: Operational Alerts & Timeline

-- 1. Operational Alerts Engine
CREATE TABLE IF NOT EXISTS operational_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  severity text, -- 'critical', 'warning', 'info'
  category text, -- 'diesel', 'fleet', 'maintenance', 'production', 'disposal'
  source_type text, -- 'vehicle', 'machine', 'site', 'system'
  source_id text,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for Alerts
ALTER TABLE operational_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on alerts" ON operational_alerts;
DROP POLICY IF EXISTS "Allow authenticated insert on alerts" ON operational_alerts;
DROP POLICY IF EXISTS "Allow authenticated update on alerts" ON operational_alerts;

DROP POLICY IF EXISTS "Allow authenticated read on alerts" ON operational_alerts;
CREATE POLICY "Allow authenticated read on alerts" ON operational_alerts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on alerts" ON operational_alerts;
CREATE POLICY "Allow authenticated insert on alerts" ON operational_alerts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on alerts" ON operational_alerts;
CREATE POLICY "Allow authenticated update on alerts" ON operational_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 2. Realtime Operational Timeline
CREATE TABLE IF NOT EXISTS operational_timeline (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text, -- 'movement', 'maintenance', 'threshold', 'mis_entry', 'alert'
  site text,
  message text NOT NULL,
  severity text DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

-- RLS Policies for Timeline
ALTER TABLE operational_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on timeline" ON operational_timeline;
DROP POLICY IF EXISTS "Allow authenticated insert on timeline" ON operational_timeline;

DROP POLICY IF EXISTS "Allow authenticated read on timeline" ON operational_timeline;
CREATE POLICY "Allow authenticated read on timeline" ON operational_timeline FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on timeline" ON operational_timeline;
CREATE POLICY "Allow authenticated insert on timeline" ON operational_timeline FOR INSERT TO authenticated WITH CHECK (true);


-- 3. Pre-populate mock data for demonstration
INSERT INTO operational_alerts (severity, category, source_type, title, description, status) 
VALUES 
  ('critical', 'fleet', 'vehicle', 'Vehicle Inactive', 'Heavy Truck DL-01-1234 has been idle for > 6 hours at Siliguri Plant.', 'active'),
  ('warning', 'maintenance', 'machine', 'Trommel Maintenance Due', 'Trommel Unit 2 at Northern Hub is scheduled for maintenance in 24 hours.', 'active'),
  ('info', 'production', 'site', 'Production Target Reached', 'Delhi facility exceeded daily production target by 12%.', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO operational_timeline (event_type, site, message, severity) 
VALUES 
  ('movement', 'Siliguri Plant', 'Vehicle DL-01-1234 arrived at site.', 'info'),
  ('threshold', 'Delhi Facility', 'Disposal volume exceeded 85% capacity threshold.', 'warning'),
  ('maintenance', 'Northern Hub', 'Routine maintenance completed on Baler System A.', 'success'),
  ('mis_entry', 'Siliguri Plant', 'New MIS log submitted by Rajesh Kumar.', 'info')
ON CONFLICT DO NOTHING;


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase2_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase4a_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- BioMine Phase 4A: Operations OS Upgrade

-- 1. Modify operational_alerts for Escalation Engine
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id);
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE operational_alerts ADD COLUMN IF NOT EXISTS resolution_notes text;
-- (Status can now be: 'active', 'acknowledged', 'investigating', 'resolved', 'archived')


-- 2. Driver Management System
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  phone text,
  license_number text UNIQUE,
  assigned_vehicle uuid REFERENCES fleet_vehicles(id),
  status text DEFAULT 'active', -- 'active', 'off-duty', 'on-leave'
  total_hours numeric DEFAULT 0,
  safety_score numeric DEFAULT 100,
  efficiency_score numeric DEFAULT 100,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated insert on drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated update on drivers" ON drivers;

DROP POLICY IF EXISTS "Allow authenticated read on drivers" ON drivers;
CREATE POLICY "Allow authenticated read on drivers" ON drivers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on drivers" ON drivers;
CREATE POLICY "Allow authenticated insert on drivers" ON drivers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on drivers" ON drivers;
CREATE POLICY "Allow authenticated update on drivers" ON drivers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 3. Fleet Intelligence (Trips)
CREATE TABLE IF NOT EXISTS fleet_trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id uuid REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  origin_site text,
  destination_site text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  fuel_used numeric DEFAULT 0,
  distance numeric DEFAULT 0,
  trip_status text DEFAULT 'in-progress', -- 'in-progress', 'completed', 'cancelled'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fleet_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read on fleet_trips" ON fleet_trips;
DROP POLICY IF EXISTS "Allow authenticated insert on fleet_trips" ON fleet_trips;
DROP POLICY IF EXISTS "Allow authenticated update on fleet_trips" ON fleet_trips;

DROP POLICY IF EXISTS "Allow authenticated read on fleet_trips" ON fleet_trips;
CREATE POLICY "Allow authenticated read on fleet_trips" ON fleet_trips FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on fleet_trips" ON fleet_trips;
CREATE POLICY "Allow authenticated insert on fleet_trips" ON fleet_trips FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated update on fleet_trips" ON fleet_trips;
CREATE POLICY "Allow authenticated update on fleet_trips" ON fleet_trips FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- 4. Pre-populate mock data for Drivers
INSERT INTO drivers (full_name, phone, license_number, status, safety_score, efficiency_score) 
VALUES 
  ('Rajesh Kumar', '+91 9876543210', 'DL-12345', 'active', 95, 92),
  ('Suresh Singh', '+91 8765432109', 'DL-54321', 'active', 88, 75),
  ('Amit Patel', '+91 7654321098', 'DL-67890', 'off-duty', 100, 98)
ON CONFLICT (license_number) DO NOTHING;


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase4a_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase6_notifications.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================
-- BioMine Enterprise Notification Architecture
-- ==============================================

-- 1. RAW OPERATIONAL EVENTS
CREATE TABLE IF NOT EXISTS public.operational_events (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL, -- e.g. 'procurement_raised', 'fuel_breach', 'maintenance_due'
    title text NOT NULL,
    message text,
    severity text NOT NULL CHECK (severity IN ('INFO', 'LOW', 'WARNING', 'HIGH', 'CRITICAL')),
    source_module text, -- 'Procurement', 'Fleet', 'Fuel', etc.
    triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    affected_site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE,
    payload jsonb DEFAULT '{}'::jsonb, -- Dynamic attributes for context
    created_at timestamptz DEFAULT now()
);

-- 2. NOTIFICATION INBOX (PER-USER RESOLVED ITEMS)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id uuid REFERENCES public.operational_events(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text,
    severity text NOT NULL,
    site_name text, -- Cached for fast render
    is_read boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 3. NOTIFICATION RULES REGISTRY
CREATE TABLE IF NOT EXISTS public.notification_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type text NOT NULL,
    target_role_id uuid REFERENCES public.roles(id), -- null = all roles
    site_scoped boolean DEFAULT true, -- If true, user must match affected_site_id to receive
    min_severity text DEFAULT 'INFO',
    is_active boolean DEFAULT true
);

-- Indexing for high-velocity reads/writes
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_events_site ON public.operational_events(affected_site_id);

-- 4. AUTOMATED RESOLUTION TRIGGER
-- This logic executes whenever an operational event enters the system,
-- scanning the user base and populating individual notification buckets instantly.
CREATE OR REPLACE FUNCTION public.process_operational_event()
RETURNS TRIGGER AS $$
DECLARE
    target_rule RECORD;
    target_user RECORD;
    site_nm text;
BEGIN
    -- Get site name for caching
    SELECT name INTO site_nm FROM public.sites WHERE id = NEW.affected_site_id;

    -- Iterate over all users eligible for notifications.
    -- Logic:
    -- 1. Matches rule setup for roles
    -- 2. AND has site clearance if rule is site-scoped
    FOR target_user IN
        SELECT DISTINCT ur.user_id
        FROM public.user_roles ur
        LEFT JOIN public.site_assignments sa ON sa.user_id = ur.user_id
        WHERE 
            -- Site match logic
            (
                EXISTS (SELECT 1 FROM public.roles r WHERE r.id = ur.role_id AND r.name = 'Super Admin') -- Super Admin gets all
                OR (NEW.affected_site_id IS NULL) -- No site specified, everyone with role gets it
                OR (sa.site_id = NEW.affected_site_id) -- Site assignment matches
            )
    LOOP
        -- Insert personal notification copy
        INSERT INTO public.notifications (
            user_id,
            event_id,
            title,
            message,
            severity,
            site_name
        ) VALUES (
            target_user.user_id,
            NEW.id,
            NEW.title,
            NEW.message,
            NEW.severity,
            site_nm
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_event_emitted ON public.operational_events;
CREATE TRIGGER on_event_emitted
AFTER INSERT ON public.operational_events
FOR EACH ROW EXECUTE PROCEDURE public.process_operational_event();

-- 5. ENABLE REALTIME BROADCAST FOR THESE TABLES

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE notifications';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'operational_events'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE operational_events';
  END IF;
END $$;


-- 6. POLICIES
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view events" ON public.operational_events;
CREATE POLICY "Authenticated users can view events" ON public.operational_events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can insert operational events" ON public.operational_events;
CREATE POLICY "Users can insert operational events" ON public.operational_events FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications are strictly restricted to self-view
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. SEED DEFAULT EVENTS FOR INITIAL SYSTEM STABILITY (Optional manual triggers simulated by application later)
INSERT INTO public.notification_rules (event_type, target_role_id, site_scoped)
SELECT 'procurement_raised', id, true FROM public.roles WHERE name = 'Back Office' ON CONFLICT DO NOTHING;


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase6_notifications.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase7_emergency_bootstrap.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================
-- BioMine Emergency Recovery & Protection Logic
-- ==============================================

-- 1. SAFEGUARD: FORBID ELIMINATING THE LAST SUPER ADMIN
-- Prevents recursive self-destruct of governance chain.
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
    admin_count INT;
BEGIN
    -- Check total Super Admins
    SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'Super Admin';
    
    -- If the user being deleted or demoted is one of them, check if it drops to zero
    IF (OLD.role = 'Super Admin') THEN
        IF (admin_count <= 1) THEN
            RAISE EXCEPTION 'GOVERNANCE VIOLATION: Critical failure prevention. Cannot remove or demote the absolute final Super Admin of the environment.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on Deletion of Roles
DROP TRIGGER IF EXISTS enforce_min_admins_del ON public.user_roles;
CREATE TRIGGER enforce_min_admins_del
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE PROCEDURE public.prevent_last_admin_removal();

-- Trigger on Updating Roles (Demotion)
DROP TRIGGER IF EXISTS enforce_min_admins_upd ON public.user_roles;
CREATE TRIGGER enforce_min_admins_upd
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
WHEN (OLD.role = 'Super Admin' AND NEW.role != 'Super Admin')
EXECUTE PROCEDURE public.prevent_last_admin_removal();


-- ====================================================
-- 2. EMERGENCY SQL RECOVERY UTILITY
-- ====================================================
-- PASTE AND RUN THIS IN SQL EDITOR TO FORCE RECOVER ACCESS
/*
DO $$ 
DECLARE 
    v_user_email TEXT := 'admin@yourcompany.com'; -- <-- ENTER YOUR EMAIL HERE
    v_user_id UUID;
    v_role_id UUID;
BEGIN
    -- 1. Resolve User UUID from Auth
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found.', v_user_email;
        RETURN;
    END IF;

    -- 2. Resolve Role UUID
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'Super Admin';

    -- 3. Push Absolute Override
    INSERT INTO public.user_roles (user_id, role, role_id, approval_status, suspended)
    VALUES (v_user_id, 'Super Admin', v_role_id, 'Approved', false)
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'Super Admin', 
        role_id = EXCLUDED.role_id, 
        approval_status = 'Approved', 
        suspended = false;

    RAISE NOTICE 'RECOVERY COMPLETE: User % successfully elevated to Approved Super Admin.', v_user_email;
END $$;
*/


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase7_emergency_bootstrap.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_phase8_site_infrastructure_fix.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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

-- ENSURE COLUMNS EXIST EVEN IF TABLE WAS CREATED IN PRIOR PHASES
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS hours text DEFAULT '24 Hours';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS manager text DEFAULT 'N/A';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS capacity numeric DEFAULT 500;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS zone text DEFAULT 'Central';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active';
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS location text;

-- RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_phase8_site_infrastructure_fix.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_master_architecture_setup.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_master_architecture_setup.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: database_hardening.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
DROP POLICY IF EXISTS "Allow authenticated read on system_logs" ON system_logs;
CREATE POLICY "Allow authenticated read on system_logs" ON system_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated insert on system_logs" ON system_logs;
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


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: database_hardening.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- START OF FILE: supabase_enterprise_optimization.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- Phase 2: Database Optimization & Enterprise Hardening

-- 1. ADD B-TREE INDEXES FOR SCALABILITY
-- Fleet Vehicles
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_is_deleted ON fleet_vehicles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_is_archived ON fleet_vehicles(is_archived);

-- Maintenance Machines
CREATE INDEX IF NOT EXISTS idx_maintenance_machines_status ON maintenance_machines(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_machines_priority ON maintenance_work_orders(priority);

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
DROP POLICY IF EXISTS "Allow read access to authenticated users for KPI snapshots" ON daily_kpi_snapshots;
CREATE POLICY "Allow read access to authenticated users for KPI snapshots" 
ON daily_kpi_snapshots FOR SELECT 
USING (auth.role() = 'authenticated');

-- Additional RLS hardening can be added here for specific roles in the future.


-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
-- END OF FILE: supabase_enterprise_optimization.sql
-- <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

