import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Shield, Bell, Database, Edit2, Trash2, X, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";

const ALL_MODULES = ["Dashboard", "MIS Entry", "Operations", "Fleet Control", "Inventory", "Analytics", "Reports", "Settings"];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: "", permissions: [] });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const { refreshUser } = useAuth();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        supabase.from("roles").select("*").order("created_at", { ascending: true }),
        supabase.from("users").select("*, roles(name)").order("name", { ascending: true })
      ]);
      if (rolesRes.error) throw rolesRes.error;
      if (usersRes.error) throw usersRes.error;
      
      setRoles(rolesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ROLE MANAGEMENT
  const openRoleModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, permissions: role.permissions || [] });
    } else {
      setEditingRole(null);
      setRoleForm({ name: "", permissions: [] });
    }
    setIsRoleModalOpen(true);
  };

  const togglePermission = (module) => {
    const isSelected = roleForm.permissions.includes(module);
    if (module === "All Modules") {
      setRoleForm({ ...roleForm, permissions: isSelected ? [] : ["All Modules"] });
      return;
    }

    let newPerms = isSelected 
      ? roleForm.permissions.filter(p => p !== module)
      : [...roleForm.permissions.filter(p => p !== "All Modules"), module];
      
    if (newPerms.length === ALL_MODULES.length) {
      newPerms = ["All Modules"];
    }
    setRoleForm({ ...roleForm, permissions: newPerms });
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      showToast("Role name is required", "error");
      return;
    }
    try {
      if (editingRole) {
        const { error } = await supabase.from("roles").update({
          name: roleForm.name,
          permissions: roleForm.permissions
        }).eq("id", editingRole.id);
        if (error) throw error;
        showToast("Role updated successfully");
      } else {
        const { error } = await supabase.from("roles").insert([{
          name: roleForm.name,
          permissions: roleForm.permissions
        }]);
        if (error) throw error;
        showToast("Role created successfully");
      }
      setIsRoleModalOpen(false);
      fetchData();
      refreshUser(); // Refresh current user's permissions in case their role changed
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const deleteRole = async () => {
    try {
      const { error } = await supabase.from("roles").delete().eq("id", roleToDelete.id);
      if (error) throw error;
      showToast("Role deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // USER MANAGEMENT
  const assignUserRole = async (userId, roleId) => {
    try {
      const { error } = await supabase.from("users").update({ role_id: roleId }).eq("id", userId);
      if (error) throw error;
      showToast("User role updated");
      fetchData();
      refreshUser();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto relative"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-success text-white" : "bg-danger text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium text-left transition-colors ${activeTab === 'roles' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-dark-border/50 hover:text-white'}`}
          >
            <Shield size={20} /> Roles & Permissions
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium text-left transition-colors ${activeTab === 'users' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-dark-border/50 hover:text-white'}`}
          >
            <UserPlus size={20} /> User Management
          </button>
          <button 
            onClick={() => showToast("Notifications module coming soon", "error")}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-dark-border/50 hover:text-white font-medium text-left transition-colors"
          >
            <Bell size={20} /> Notifications
          </button>
          <button 
            onClick={() => showToast("Backups module coming soon", "error")}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-dark-border/50 hover:text-white font-medium text-left transition-colors"
          >
            <Database size={20} /> Data Backups
          </button>
        </div>

        <div className="md:col-span-3">
          {activeTab === "roles" && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Roles & Access Control</h3>
                <Button onClick={() => openRoleModal()} variant="primary" size="sm" className="gap-2 text-xs">
                  <Shield size={14} /> Add Role
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-24 bg-dark-bg/50 animate-pulse rounded-xl"></div>)}
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role.id} className="p-4 rounded-xl border border-dark-border bg-dark-bg/30 relative group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-white">{role.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-dark-bg rounded-full border border-dark-border">
                            {users.filter(u => u.role_id === role.id).length} Users
                          </span>
                          <button onClick={() => openRoleModal(role)} className="p-1.5 text-gray-400 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 bg-dark-bg rounded">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDeleteRole(role)} className="p-1.5 text-gray-400 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 bg-dark-bg rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {role.permissions?.map(perm => (
                          <span key={perm} className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">
                            {perm}
                          </span>
                        ))}
                        {(!role.permissions || role.permissions.length === 0) && (
                          <span className="text-xs text-gray-500 italic">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {roles.length === 0 && <div className="text-center text-gray-500 py-8">No roles found</div>}
                </div>
              )}
            </Card>
          )}

          {activeTab === "users" && (
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">User Management</h3>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-dark-bg/50 animate-pulse rounded-xl"></div>)}
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map(user => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-dark-bg/50 border border-dark-border gap-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar_url || "https://i.pravatar.cc/150"} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-dark-border" />
                        <div>
                          <div className="font-medium text-sm text-white">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                      <div className="w-full sm:w-48">
                        <select
                          value={user.role_id || ""}
                          onChange={(e) => assignUserRole(user.id, e.target.value)}
                          className="w-full h-9 rounded-lg border border-dark-border bg-dark-bg/80 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="" disabled>Select Role</option>
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <div className="text-center text-gray-500 py-8">No users found</div>}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-dark-border">
                <h3 className="text-lg font-bold text-white">{editingRole ? "Edit Role" : "Create New Role"}</h3>
                <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Role Name</label>
                  <Input 
                    value={roleForm.name} 
                    onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    placeholder="e.g. Site Manager" 
                    className="bg-dark-bg/80" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-3 block">Permissions (Modules)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={roleForm.permissions.includes("All Modules")}
                        onChange={() => togglePermission("All Modules")}
                        className="rounded border-dark-border bg-dark-bg text-primary focus:ring-primary/50" 
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">All Modules (Admin)</span>
                    </label>
                    {ALL_MODULES.map(mod => (
                      <label key={mod} className={`flex items-center gap-2 cursor-pointer group ${roleForm.permissions.includes("All Modules") ? "opacity-50" : ""}`}>
                        <input 
                          type="checkbox" 
                          checked={roleForm.permissions.includes(mod) || roleForm.permissions.includes("All Modules")}
                          onChange={() => togglePermission(mod)}
                          disabled={roleForm.permissions.includes("All Modules")}
                          className="rounded border-dark-border bg-dark-bg text-primary focus:ring-primary/50" 
                        />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{mod}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-dark-border bg-dark-bg/30">
                <Button onClick={() => setIsRoleModalOpen(false)} variant="outline">Cancel</Button>
                <Button onClick={saveRole} variant="primary">Save Role</Button>
              </div>
            </motion.div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-xl overflow-hidden p-6 text-center"
            >
              <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-danger" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Role?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to delete the <span className="text-white font-medium">{roleToDelete?.name}</span> role? Users assigned to this role may lose access. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setIsDeleteModalOpen(false)} variant="outline" className="flex-1">Cancel</Button>
                <Button onClick={deleteRole} className="flex-1 bg-danger hover:bg-danger/90 text-white">Delete</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
