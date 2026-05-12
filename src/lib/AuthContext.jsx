import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef(null);

  const fetchUserProfile = async (authUserId, email) => {
    try {
      // 1. Fetch basic profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select(`*`)
        .eq("id", authUserId)
        .maybeSingle();

      // 2. Query user_roles WITH joined role information
      let { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select(`*, roles(*)`)
        .eq("user_id", authUserId)
        .maybeSingle();

      // 3. Handle missing role data via simple migration logic / fallback
      if (!roleData || !roleData.roles) {
        // Check local/existing simple role and map it to dynamic role in DB
        const simpleRoleName = roleData?.role || "MIS Operator"; 
        const { data: dbRole } = await supabase.from("roles").select("*").eq("name", simpleRoleName).maybeSingle();
        
        if (dbRole) {
           // Patch missing link
           await supabase.from("user_roles").update({ role_id: dbRole.id }).eq("user_id", authUserId);
           // re-fetch
           const { data: refetched } = await supabase.from("user_roles").select(`*, roles(*)`).eq("user_id", authUserId).maybeSingle();
           roleData = refetched;
        }
      }

      // --- CRITICAL ENTERPRISE BOOTSTRAP SEQUENCE ---
      // A: FORCED DEVELOPER OVERRIDE RECOVERY
      const isDeveloperEmail = email?.toLowerCase() === 'k.shubhamchaubey@gmail.com';

      // Verify if ANY Super Admin exists currently active in the enterprise ecosystem.
      const { count: superAdminCount } = await supabase
         .from("user_roles")
         .select("id", { count: 'exact', head: true })
         .eq("role", "Super Admin");

      const noSuperAdminsExist = (superAdminCount === 0 || superAdminCount === null);

      if (!roleData || noSuperAdminsExist || isDeveloperEmail) {
         const { data: superRole } = await supabase.from("roles").select("id").eq("name", "Super Admin").maybeSingle();
         
         // Auto-promote to Super Admin to prevent critical governance deadlock
         const bootstrapPayload = {
           user_id: authUserId,
           role: "Super Admin",
           role_id: superRole?.id || null,
           approval_status: "Approved",
           suspended: false,
           created_at: new Date().toISOString()
         };
         
         // Write immediate recovery persistence to DB
         await supabase.from("user_roles").upsert(bootstrapPayload, { onConflict: 'user_id' });
         
         // Resync finalized state
         const { data: resynced } = await supabase.from("user_roles").select(`*, roles(*)`).eq("user_id", authUserId).maybeSingle();
         roleData = resynced;
      }

       // Override in-memory derived roleName for absolute developer privilege guarantees.
       let roleName = roleData?.roles?.name || roleData?.role || "Viewer";
       let roleId = roleData?.roles?.id;
       
       if (isDeveloperEmail) {
          roleName = "Super Admin";
       }

      // 4. Fetch Module Permission Matrix
      let modulePermissions = {};
      if (roleId) {
        const { data: matrix } = await supabase
          .from("module_permissions")
          .select("module_name, access_level")
          .eq("role_id", roleId);
        
        if (matrix) {
           matrix.forEach(row => {
             modulePermissions[row.module_name] = row.access_level;
           });
        }
      }

      // Super Admin emergency overrides
      if (roleName === "Super Admin") {
         modulePermissions["All"] = "FULL_CONTROL";
      }

      // 5. Fetch Assigned Sites
      let assignedSites = [];

      if (roleName === "Super Admin") {
         // SUPER ADMIN GLOBAL SCOPE INJECTION
         // Pull all sites from master node index, ensuring absolute governance visibility.
         const { data: allSites } = await supabase.from("sites").select("*");
         if (allSites) assignedSites = allSites;
      } else {
         const { data: siteMaps } = await supabase
           .from("site_assignments")
           .select(`site_id, sites(*)`)
           .eq("user_id", authUserId);
         
         if (siteMaps && siteMaps.length > 0) {
           assignedSites = siteMaps.map(m => m.sites).filter(Boolean);
         } else if (roleData?.assigned_site) {
           assignedSites = [{ id: "legacy", name: roleData.assigned_site }];
         }
      }

      const mergedUser = {
        id: authUserId,
        name: userData?.name || (isDeveloperEmail ? "Super Admin Control" : (email?.split('@')[0] || "User")),
        email: email || userData?.email || "",
        avatar_url: userData?.avatar_url || "https://i.pravatar.cc/150?u=" + authUserId,
        phone: userData?.phone || "",
        bio: userData?.bio || "",
        designation: userData?.designation || "",
        
        role: isDeveloperEmail ? "Super Admin" : roleName,
        role_details: roleData?.roles,
        assigned_sites: assignedSites, 
        primary_site: assignedSites[0]?.name || "Enterprise Global",
        
        // ULTIMATE FAIL-SAFE OVERRIDE: Still ensures total system access for Super Admin/Dev
        approval_status: (roleName === "Super Admin" || isDeveloperEmail) ? "Approved" : (roleData?.approval_status || "Pending"),
        suspended: (roleName === "Super Admin" || isDeveloperEmail) ? false : (roleData?.suspended || false),
        permissions: modulePermissions,
        hasGlobalScope: (roleName === "Super Admin" || isDeveloperEmail)
      };

      setUser(mergedUser);
      userIdRef.current = authUserId;
    } catch (err) {
      console.error("Error fetching centralized user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (userIdRef.current !== session.user.id) {
          setLoading(true);
          fetchUserProfile(session.user.id, session.user.email);
        }
      } else {
        setUser(null);
        userIdRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = (moduleName, requiredLevel = 'READ_ONLY') => {
    if (!user) return false;
    if (user.role === 'Super Admin' || user.permissions?.['All'] === 'FULL_CONTROL') return true;
    
    const userLevel = user.permissions?.[moduleName] || 'NO_ACCESS';
    
    const hierarchy = { 'NO_ACCESS': 0, 'READ_ONLY': 1, 'READ_WRITE': 2, 'FULL_CONTROL': 3 };
    return (hierarchy[userLevel] || 0) >= (hierarchy[requiredLevel] || 1);
  };

  const hasRole = (roleList) => {
    if (!user) return false;
    const userRole = user.role || "Viewer";
    if (Array.isArray(roleList)) {
      return roleList.includes(userRole);
    }
    return userRole === roleList;
  };

  const isActionAllowed = (action, siteContext = null) => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;

    // Site Scoping Enforcement
    if (siteContext && user.role !== 'Operations Auditor') {
       const hasSiteAccess = user.assigned_sites?.some(s => s.name === siteContext);
       if (!hasSiteAccess) return false;
    }
    
    switch (action) {
      case 'DELETE':
      case 'SYSTEM_CONFIG':
        return ['Super Admin'].includes(user.role);
      case 'SOFT_DELETE':
      case 'EXPORT':
        return ['Super Admin', 'Back Office', 'Operations Auditor'].includes(user.role);
      case 'MIS_ENTRY':
        return ['Super Admin', 'Site Incharge', 'Back Office', 'MIS Operator'].includes(user.role);
      case 'PROCUREMENT_APPROVAL':
        return ['Super Admin', 'Back Office'].includes(user.role);
      default:
        return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchUserProfile(session.user.id, session.user.email);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, hasPermission, hasRole, isActionAllowed, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
