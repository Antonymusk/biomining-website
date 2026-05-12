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
