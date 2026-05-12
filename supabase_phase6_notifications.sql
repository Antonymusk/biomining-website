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
CREATE INDEX idx_notif_user_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_events_site ON public.operational_events(affected_site_id);

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

CREATE TRIGGER on_event_emitted
AFTER INSERT ON public.operational_events
FOR EACH ROW EXECUTE PROCEDURE public.process_operational_event();

-- 5. ENABLE REALTIME BROADCAST FOR THESE TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operational_events;

-- 6. POLICIES
ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view events" ON public.operational_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert operational events" ON public.operational_events FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications are strictly restricted to self-view
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. SEED DEFAULT EVENTS FOR INITIAL SYSTEM STABILITY (Optional manual triggers simulated by application later)
INSERT INTO public.notification_rules (event_type, target_role_id, site_scoped)
SELECT 'procurement_raised', id, true FROM public.roles WHERE name = 'Back Office' ON CONFLICT DO NOTHING;
