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

CREATE POLICY "Self manage profile" 
ON public.users 
FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 4. PERMIT PUBLIC READ FOR INTERNAL DIRECTORIES (Dashboard lookup)
DROP POLICY IF EXISTS "Read all profiles" ON public.users;
CREATE POLICY "Read all profiles" ON public.users FOR SELECT TO authenticated USING (true);

ANALYZE public.users;
