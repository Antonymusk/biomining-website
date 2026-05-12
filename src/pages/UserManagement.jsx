import { useState, useEffect, useMemo } from "react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { Search, UserCheck, ShieldAlert, Trash2, ArrowRight, UserMinus, Plus, Settings, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersAndSites();
  }, []);

  const fetchUsersAndSites = async () => {
    setLoading(true);
    try {
      // 1. Fetch sites
      const { data: sitesData } = await supabase.from("inventory_sites").select("*");
      setSites(sitesData || []);

      // 2. Load user roles from local storage / Supabase
      const localRoles = JSON.parse(localStorage.getItem("local_user_roles") || "[]");
      
      // Attempt to load from public.users and user_roles
      const { data: dbUsers } = await supabase.from("users").select("*");
      const { data: dbRoles } = await supabase.from("user_roles").select("*");

      let mergedList = [];
      if (dbUsers && dbUsers.length > 0) {
        mergedList = dbUsers.map(u => {
          const matchingRole = dbRoles?.find(r => r.user_id === u.id) || localRoles.find(r => r.user_id === u.id);
          return {
            id: u.id,
            email: u.email,
            name: u.name || u.email?.split('@')[0],
            role: matchingRole?.role || "Viewer",
            assigned_site: matchingRole?.assigned_site || null,
            approval_status: matchingRole?.approval_status || "Pending",
            suspended: matchingRole?.suspended || false,
            created_at: u.created_at || matchingRole?.created_at || new Date().toISOString()
          };
        });
      } else {
        // Local roles fallback
        mergedList = localRoles.map(r => ({
          id: r.user_id,
          email: r.email,
          name: r.email?.split('@')[0] || "User",
          role: r.role || "Viewer",
          assigned_site: r.assigned_site || null,
          approval_status: r.approval_status || "Pending",
          suspended: r.suspended || false,
          created_at: r.created_at || new Date().toISOString()
        }));
      }

      setUsers(mergedList);
    } catch (err) {
      console.error("Failed to load user management data", err);
      toast.error("Failed to sync permissions table");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoleRecord = async (userId, email, fields) => {
    try {
      // Security boundaries checks
      const targetUser = users.find(u => u.id === userId);
      const superAdmins = users.filter(u => u.role === "Super Admin" && u.approval_status === "Approved" && !u.suspended);
      
      if (targetUser) {
        const isTargetSuperAdmin = targetUser.role === "Super Admin";
        const isCurrentSuperAdmin = currentUser?.role === "Super Admin";

        // Prevent non-Super-Admins from modifying Super Admins or granting Super Admin roles
        if (!isCurrentSuperAdmin && (fields.role === "Super Admin" || isTargetSuperAdmin)) {
          toast.error("Privilege Escalation Blocked: Only Super Admins can manage Super Admin accounts.");
          return;
        }

        // Prevent Demoting or Suspending the Last Remaining Super Admin
        if (isTargetSuperAdmin) {
          if (fields.role && fields.role !== "Super Admin" && superAdmins.length <= 1) {
            toast.error("Security Constraint: Cannot demote the last remaining Super Admin.");
            return;
          }
          if (fields.suspended === true && superAdmins.length <= 1) {
            toast.error("Security Constraint: Cannot suspend the last remaining Super Admin.");
            return;
          }
          if (fields.approval_status && fields.approval_status !== "Approved" && superAdmins.length <= 1) {
            toast.error("Security Constraint: Demoting the last active Super Admin is restricted.");
            return;
          }
        }
      }

      // Try DB update
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          ...fields
        });

      // Always update local storage fallback
      const localRoles = JSON.parse(localStorage.getItem("local_user_roles") || "[]");
      const idx = localRoles.findIndex(r => r.user_id === userId);
      if (idx !== -1) {
        localRoles[idx] = { ...localRoles[idx], ...fields };
      } else {
        localRoles.push({
          user_id: userId,
          email: email,
          ...fields,
          created_at: new Date().toISOString()
        });
      }
      localStorage.setItem("local_user_roles", JSON.stringify(localRoles));

      toast.success("User security clearance updated");
      fetchUsersAndSites();
    } catch (err) {
      console.error(err);
      toast.error("Database sync failed");
    }
  };

  const handleApprove = (userId, email, currentRole) => {
    updateUserRoleRecord(userId, email, { approval_status: "Approved", role: currentRole || "Operator" });
  };

  const handleReject = (userId, email) => {
    updateUserRoleRecord(userId, email, { approval_status: "Rejected" });
  };

  const handleRoleChange = (userId, email, newRole) => {
    updateUserRoleRecord(userId, email, { role: newRole });
  };

  const handleSiteChange = (userId, email, newSite) => {
    updateUserRoleRecord(userId, email, { assigned_site: newSite === "None" ? null : newSite });
  };

  const handleSuspendToggle = (userId, email, currentSuspended) => {
    updateUserRoleRecord(userId, email, { suspended: !currentSuspended });
  };

  const activeSuperAdminCount = useMemo(() => {
    return users.filter(u => u.role === "Super Admin" && u.approval_status === "Approved" && !u.suspended).length;
  }, [users]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Pending" && u.approval_status === "Pending") ||
      (statusFilter === "Approved" && u.approval_status === "Approved" && !u.suspended) ||
      (statusFilter === "Suspended" && u.suspended);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold primary-gradient-text flex items-center gap-2">
            <UserCheck className="text-primary" /> User Governance & Access Control
          </h2>
          <p className="text-xs text-gray-400 mt-1">Manage platform approvals, roles, site-level restrictions, and status</p>
        </div>

        {/* SEARCH AND FILTERCONTROLS */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search user email or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg/60 border border-dark-border rounded-md pl-8 pr-3 h-8 text-xs text-white outline-none focus:border-primary/50 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-dark-bg/60 border border-dark-border text-xs rounded-md h-8 px-2.5 outline-none text-white focus:border-primary/50 cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Admin">Admin</option>
              <option value="Site Manager">Site Manager</option>
              <option value="Operator">Operator</option>
              <option value="Viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-bg/60 border border-dark-border text-xs rounded-md h-8 px-2.5 outline-none text-white focus:border-primary/50 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved / Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* USER CARDS LISTING */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Syncing security clearances...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-dark-bg/20 rounded-xl border border-dark-border/40 p-6">
            <UserMinus size={40} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">No Cleared Users Found</h3>
            <p className="text-gray-500 text-xs">No users matched your active filter controls.</p>
          </div>
        ) : (
          filteredUsers.map(u => {
            const isSelf = u.id === currentUser?.id;
            const isSuperAdmin = u.role === "Super Admin";
            const isLastSuperAdmin = isSuperAdmin && activeSuperAdminCount <= 1;
            const isCurrentSuper = currentUser?.role === "Super Admin";

            return (
              <Card key={u.id} className={`flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 gap-4 transition-all duration-300 border-l-4 ${
                u.suspended 
                  ? 'border-l-danger bg-danger/5' 
                  : u.approval_status === 'Pending' 
                    ? 'border-l-amber-500 bg-amber-500/5' 
                    : 'border-l-emerald-500'
              }`}>
                {/* Profile Overview */}
                <div className="flex items-center gap-4 min-w-[220px]">
                  <img 
                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`}
                    alt="avatar" 
                    className="h-11 w-11 rounded-xl bg-dark-bg/60 border border-dark-border/60 object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {u.name}
                      {isSelf && <Badge variant="primary" className="text-[9px] py-0">You</Badge>}
                    </h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{u.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Status and Site Assignment */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 max-w-2xl w-full">
                  {/* Approval Status Badge */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] text-gray-500 uppercase font-semibold mb-1">System clearance</span>
                    <div>
                      {u.suspended ? (
                        <Badge variant="danger" className="text-[10px] py-0.5 animate-pulse flex items-center gap-1 w-fit"><ShieldAlert size={10} /> Suspended</Badge>
                      ) : u.approval_status === 'Pending' ? (
                        <Badge variant="warning" className="text-[10px] py-0.5 animate-pulse flex items-center gap-1 w-fit"><AlertTriangle size={10} /> Pending Approval</Badge>
                      ) : u.approval_status === 'Rejected' ? (
                        <Badge variant="danger" className="text-[10px] py-0.5 flex items-center gap-1 w-fit"><UserMinus size={10} /> Rejected</Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px] py-0.5 flex items-center gap-1 w-fit"><CheckCircle2 size={10} /> Approved / Active</Badge>
                      )}
                    </div>
                  </div>

                  {/* Assigned Role */}
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase font-semibold mb-1">Designated Role</span>
                    <select
                      disabled={isSelf || isLastSuperAdmin || !isCurrentSuper}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                      className="bg-dark-bg/60 border border-dark-border text-xs rounded-md h-8 outline-none text-white focus:border-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Site Manager">Site Manager</option>
                      <option value="Operator">Operator</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>

                  {/* Site Assignment Boundary */}
                  <div className="flex flex-col col-span-2 md:col-span-1">
                    <span className="text-[9px] text-gray-500 uppercase font-semibold mb-1">Assigned Site Boundary</span>
                    <select
                      disabled={u.role === "Super Admin" || u.role === "Admin" || isSelf}
                      value={u.assigned_site || "None"}
                      onChange={(e) => handleSiteChange(u.id, u.email, e.target.value)}
                      className="bg-dark-bg/60 border border-dark-border text-xs rounded-md h-8 outline-none text-white focus:border-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="None">None (Full Access)</option>
                      {sites.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Approval Actions / Governance Toggles */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {u.approval_status === "Pending" ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        disabled={!isCurrentSuper}
                        onClick={() => handleApprove(u.id, u.email, u.role)}
                        className="h-8 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <UserCheck size={14} /> Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled={!isCurrentSuper}
                        onClick={() => handleReject(u.id, u.email)}
                        className="h-8 px-3 text-xs text-danger border-danger/30 hover:bg-danger/10 hover:text-danger flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <UserMinus size={14} /> Reject
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant={u.suspended ? "primary" : "outline"}
                      disabled={isSelf || isLastSuperAdmin || !isCurrentSuper}
                      onClick={() => handleSuspendToggle(u.id, u.email, u.suspended)}
                      className={`h-8 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 ${
                        !u.suspended && "text-danger border-danger/30 hover:bg-danger/10 hover:text-danger"
                      }`}
                    >
                      {u.suspended ? (
                        <>
                          <CheckCircle2 size={14} /> Unsuspend Access
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} /> Suspend Access
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
