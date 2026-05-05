import { motion } from "framer-motion";
import { UserPlus, Shield, Bell, Database } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export default function Settings() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary font-medium text-left">
            <Shield size={20} /> Roles & Permissions
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-dark-border/50 hover:text-white font-medium text-left transition-colors">
            <UserPlus size={20} /> User Management
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-dark-border/50 hover:text-white font-medium text-left transition-colors">
            <Bell size={20} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:bg-dark-border/50 hover:text-white font-medium text-left transition-colors">
            <Database size={20} /> Data Backups
          </button>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Roles & Access Control</h3>
              <Button variant="primary" size="sm" className="gap-2 text-xs">
                <UserPlus size={14} /> Add Role
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">Administrator</div>
                  <span className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded-full">3 Users</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Full access to all modules, including user management and system configuration.</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">All Modules</span>
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">Settings</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dark-border bg-dark-bg/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">Site Manager</div>
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-dark-bg rounded-full border border-dark-border">8 Users</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Access to MIS Entry, Operations, and specific Site Analytics. Cannot modify system settings.</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">MIS Entry</span>
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">Operations</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dark-border bg-dark-bg/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-white">Viewer / Investor</div>
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-dark-bg rounded-full border border-dark-border">12 Users</span>
                </div>
                <p className="text-sm text-gray-400 mb-4">Read-only access to Dashboard, Analytics, and Reports.</p>
                <div className="flex gap-2">
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">Dashboard</span>
                  <span className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-gray-300">Reports</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
