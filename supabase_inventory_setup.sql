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
CREATE POLICY "Allow authenticated read" ON inventory_sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON inventory_sites FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON inventory_sites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON inventory_sites FOR DELETE TO authenticated USING (true);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated insert" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated update" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated delete" ON inventory_items;
CREATE POLICY "Allow authenticated read" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON inventory_items FOR DELETE TO authenticated USING (true);

ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated insert" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated update" ON fleet_vehicles;
DROP POLICY IF EXISTS "Allow authenticated delete" ON fleet_vehicles;
CREATE POLICY "Allow authenticated read" ON fleet_vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON fleet_vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON fleet_vehicles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON fleet_vehicles FOR DELETE TO authenticated USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated insert" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated update" ON notifications;
DROP POLICY IF EXISTS "Allow authenticated delete" ON notifications;
CREATE POLICY "Allow authenticated read" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated delete" ON notifications FOR DELETE TO authenticated USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update own profile" ON public.users;
CREATE POLICY "Allow authenticated read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
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

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update an avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can delete their avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
