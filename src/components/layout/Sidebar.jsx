import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Truck, 
  PackageSearch, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  ShoppingCart,
  Wrench,
  Trash2,
  UserCheck
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/", preload: () => import("../../pages/Dashboard") },
  { name: "MIS Entry", icon: FileText, path: "/mis-entry", preload: () => import("../../pages/MISEntry") },
  { name: "Operations", icon: Activity, path: "/operations", preload: () => import("../../pages/Operations") },
  { name: "Fleet Control", icon: Truck, path: "/fleet-control", preload: () => import("../../pages/FleetControl") },
  { name: "Drivers", icon: Users, path: "/drivers", preload: () => import("../../pages/DriverManagement") },
  { name: "Manpower", icon: UserCheck, path: "/manpower", preload: () => import("../../pages/Manpower") },
  { name: "Inventory", icon: PackageSearch, path: "/inventory", preload: () => import("../../pages/Inventory") },
  { name: "Maintenance", icon: Wrench, path: "/maintenance", preload: () => import("../../pages/MaintenanceCenter") },
  { name: "Procurement", icon: ShoppingCart, path: "/requisition-center", preload: () => import("../../pages/RequisitionCenter") },
  { name: "Analytics", icon: BarChart3, path: "/analytics", preload: () => import("../../pages/Analytics") },
  { name: "Alert Center", icon: ShieldAlert, path: "/alert-center", preload: () => import("../../pages/AlertCenter") },
  { name: "Reports", icon: FileText, path: "/reports", preload: () => import("../../pages/Reports") },
  { name: "Recycle Bin", icon: Trash2, path: "/recycle-bin", preload: () => import("../../pages/RecycleBin") },
  { name: "Settings", icon: Settings, path: "/settings", preload: () => import("../../pages/Settings") },
  { name: "User Management", icon: UserCheck, path: "/user-management", preload: () => import("../../pages/UserManagement") },
];

export const Sidebar = React.memo(function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const { logout, hasPermission, user } = useAuth();
  
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      let moduleName = item.name;
      // Map frontend display names to DB matrix keys
      if (item.name === "MIS Entry") moduleName = "MIS";
      if (item.name === "Procurement") moduleName = "Procurement";
      if (item.name === "Recycle Bin") moduleName = "Archive"; 
      
      // Special handles for built-ins
      if (item.path === "/") return true; // Always allow dashboard
      
      return hasPermission(moduleName, 'READ_ONLY');
    });
  }, [user, hasPermission]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 64 : 260,
          x: isMobileOpen ? 0 : (window.innerWidth < 768 ? -260 : 0)
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl shadow-2xl md:relative overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Premium Diagonal Glass Reflection Streak Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_22%,rgba(255,255,255,0.008)_35%,rgba(255,255,255,0.03)_40%,rgba(255,255,255,0.008)_45%,transparent_58%)] pointer-events-none z-0" />

        <div className={cn("flex h-14 items-center border-b border-white/5 relative overflow-hidden px-3.5 z-10", isCollapsed ? "justify-center" : "justify-between")}>
          {/* Smooth atmospheric background glow */}
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08)_0%,transparent_70%)] pointer-events-none blur-md" />
          
          <div className="flex items-center gap-2.5 overflow-hidden relative z-10">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-slate-950/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
              <span className="relative text-sm font-black tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">B</span>
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-xs font-bold tracking-[0.25em] text-slate-100 uppercase whitespace-nowrap"
              >
                BioMine
              </motion.span>
            )}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors border border-transparent hover:border-white/5 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-white/5 z-10">
            <button 
              onClick={() => setIsCollapsed(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors border border-white/5 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <nav className={cn("flex-1 space-y-1.5 p-2 overflow-y-auto overflow-x-hidden scrollbar-none z-10", isCollapsed ? "flex flex-col items-center gap-1.5" : "")}>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              onClick={() => setIsMobileOpen(false)}
              onMouseEnter={() => {
                // Speculatively preload module chunks on link hover
                if (typeof item.preload === 'function') {
                  item.preload().catch(() => {});
                }
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center transition-all duration-150 group relative sidebar-item-hover cursor-pointer",
                  isCollapsed 
                    ? "justify-center h-10 w-10 rounded-xl" 
                    : "gap-3.5 rounded-xl px-4 h-11 text-[12px]",
                  isActive 
                    ? "bg-primary/[0.08] text-slate-100 font-bold border border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_18px_rgba(59,130,246,0.15)] rounded-xl" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] rounded-xl"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className={cn(
                        "absolute rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                        isCollapsed ? "left-0 top-2.5 bottom-2.5 w-0.5" : "left-1.5 top-3.5 bottom-3.5 w-1"
                      )}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon size={isCollapsed ? 18 : 16} className={cn("shrink-0 transition-transform group-hover:scale-105 cursor-pointer", isActive && "text-slate-100")} />
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="whitespace-nowrap uppercase tracking-widest text-[11px] font-bold cursor-pointer"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={cn("border-t border-white/5 p-2", isCollapsed ? "flex justify-center" : "")}>
          <button 
            onClick={logout}
            title={isCollapsed ? "Logout" : undefined}
            className={cn(
              "flex items-center transition-colors hover:bg-danger/5 hover:text-danger hover:border hover:border-danger/10 group overflow-hidden cursor-pointer",
              isCollapsed ? "justify-center h-8 w-8 rounded-md" : "w-full gap-3 rounded-md px-3 h-8"
            )}
          >
            <LogOut size={isCollapsed ? 16 : 14} className="shrink-0 cursor-pointer" />
            {!isCollapsed && (
              <span className="uppercase tracking-wider text-[10px] font-medium whitespace-nowrap cursor-pointer">Logout</span>
            )}
          </button>
          {!isCollapsed && (
            <div className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center mt-2 select-none">
              v0.9.4-beta
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
});
