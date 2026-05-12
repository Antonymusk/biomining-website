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
    assigned_role := 'Operator';
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
