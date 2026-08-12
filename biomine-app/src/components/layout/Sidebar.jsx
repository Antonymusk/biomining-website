import React, { useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  UserCheck,
  Coins,
  Pin,
  Building2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../lib/AuthContext";

// Group operational links into logical enterprise categories
const navGroups = [
  {
    group: "Operations",
    items: [
      { name: "MIS Entry", icon: FileText, path: "/mis-entry", preload: () => import("../../pages/MISEntry") },
      { name: "Site-Wise MIS", icon: Building2, path: "/mis-entry?view=site_wise", preload: () => import("../../pages/MISEntry") },
      { name: "Fleet Control", icon: Truck, path: "/fleet-control", preload: () => import("../../pages/FleetControl") },
      { name: "Manpower", icon: UserCheck, path: "/manpower", preload: () => import("../../pages/Manpower") },
    ]
  },
  {
    group: "Logistics",
    items: [
      { name: "Inventory", icon: PackageSearch, path: "/inventory", preload: () => import("../../pages/Inventory") },
      { name: "Maintenance", icon: Wrench, path: "/maintenance", preload: () => import("../../pages/MaintenanceCenter") },
      { name: "Procurement", icon: ShoppingCart, path: "/requisition-center", preload: () => import("../../pages/RequisitionCenter") },
      { name: "Price List", icon: Coins, path: "/price-list", preload: () => import("../../pages/PriceList") },
    ]
  },
  {
    group: "Intelligence",
    items: [
      { name: "Analytics", icon: BarChart3, path: "/analytics", preload: () => import("../../pages/Analytics") },
      { name: "Alert Center", icon: ShieldAlert, path: "/alert-center", preload: () => import("../../pages/AlertCenter") },
      { name: "Reports", icon: FileText, path: "/reports", preload: () => import("../../pages/Reports") },
      { name: "Recycle Bin", icon: Trash2, path: "/recycle-bin", preload: () => import("../../pages/RecycleBin") },
    ]
  },
  {
    group: "Management",
    items: [
      { name: "Settings", icon: Settings, path: "/settings", preload: () => import("../../pages/Settings") },
      { name: "User Management", icon: UserCheck, path: "/user-management", preload: () => import("../../pages/UserManagement") },
    ]
  }
];

export const Sidebar = React.memo(function Sidebar({ 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen,
  isPinned,
  setIsPinned,
  togglePin
}) {
  const { logout, hasPermission, user } = useAuth();
  
  // Persist collapsible group toggles locally
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    try {
      const saved = localStorage.getItem("biomine_sidebar_groups");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => {
      const updated = { ...prev, [groupName]: !prev[groupName] };
      localStorage.setItem("biomine_sidebar_groups", JSON.stringify(updated));
      return updated;
    });
  };

  // Hover Events (Auto-Hide / Auto-Expand) - desktop only
  const handleMouseEnter = () => {
    if (window.innerWidth < 768) return;
    if (!isPinned && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth < 768) return;
    if (!isPinned && !isCollapsed) {
      setIsCollapsed(true);
    }
  };

  // Helper checking if individual sub-items are allowed under RBAC
  const isItemAllowed = (name) => {
    let moduleName = name;
    if (name === "MIS Entry") moduleName = "MIS";
    if (name === "Procurement") moduleName = "Procurement";
    if (name === "Recycle Bin") moduleName = "Archive"; 
    
    return hasPermission(moduleName, 'READ_ONLY');
  };

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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-white/5 bg-slate-950/85 backdrop-blur-xl shadow-2xl overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Premium Diagonal Glass Reflection Streak Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_22%,rgba(255,255,255,0.008)_35%,rgba(255,255,255,0.03)_40%,rgba(255,255,255,0.008)_45%,transparent_58%)] pointer-events-none z-0" />

        <div className={cn("flex h-14 items-center border-b border-white/5 relative overflow-hidden px-3.5 z-10", isCollapsed ? "justify-center" : "justify-between")}>
          {/* Smooth atmospheric background glow */}
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_at_top,rgba(255,59,48,0.08)_0%,transparent_70%)] pointer-events-none blur-md" />
          
          <div className="flex items-center gap-2.5 overflow-hidden relative z-10">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-slate-950/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
              <span className="relative text-sm font-black tracking-wider bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">B</span>
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
          
          {/* STATEFUL PIN AND COLLAPSE BUTTONS */}
          {!isCollapsed && (
            <div className="flex items-center gap-1 z-10">
              <button 
                onClick={togglePin}
                title={isPinned ? "Enable Auto-Hide (Unpin)" : "Pin Sidebar Open"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors border border-transparent hover:bg-white/5 hover:border-white/5 cursor-pointer",
                  isPinned && "text-accent bg-accent/10 border-accent/20 hover:bg-accent/20 hover:border-accent/30 shadow-[0_0_10px_rgba(255,59,48,0.15)]"
                )}
              >
                <Pin size={12} className={cn("transition-transform duration-200", isPinned && "rotate-45")} />
              </button>
              <button 
                onClick={() => {
                  setIsPinned(false);
                  localStorage.setItem("biomine_sidebar_pinned", "false");
                  setIsCollapsed(true);
                }}
                title="Collapse Sidebar"
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors border border-transparent hover:border-white/5 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-white/5 z-10">
            <button 
              onClick={() => {
                setIsPinned(true);
                localStorage.setItem("biomine_sidebar_pinned", "true");
                setIsCollapsed(false);
              }}
              title="Expand & Pin Sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5 text-gray-400 transition-colors border border-white/5 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <nav className={cn("flex-1 space-y-4 p-2.5 overflow-y-auto overflow-x-hidden scrollbar-none z-10", isCollapsed ? "flex flex-col items-center gap-1.5" : "")}>
          
          {/* STANDALONE CORE DASHBOARD LINK (ALWAYS VISIBLE AT TOP) */}
          <NavLink
            to="/"
            title={isCollapsed ? "Dashboard" : undefined}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center transition-all duration-150 group relative sidebar-item-hover cursor-pointer w-full",
                isCollapsed 
                  ? "justify-center h-10 w-10 rounded-xl" 
                  : "gap-3.5 rounded-xl px-4 h-11 text-[12px] w-full",
                isActive 
                  ? "bg-primary/[0.08] text-slate-100 font-bold border border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_18px_rgba(255,59,48,0.15)] rounded-xl" 
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
                <LayoutDashboard size={isCollapsed ? 18 : 16} className={cn("shrink-0 transition-transform group-hover:scale-105 cursor-pointer", isActive && "text-slate-100")} />
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="whitespace-nowrap uppercase tracking-widest text-[11px] font-bold cursor-pointer"
                  >
                    Dashboard
                  </motion.span>
                )}
              </>
            )}
          </NavLink>

          {/* DYNAMIC COLLAPSIBLE SECTIONS */}
          {navGroups.map((group) => {
            const isGroupCollapsed = !!collapsedGroups[group.group];
            
            // Filter sub-items based on dynamic system permissions
            const allowedItems = group.items.filter(item => isItemAllowed(item.name));
            
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.group} className="space-y-1.5 w-full">
                
                {/* Collapsible Section Header (Visible when expanded) */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-3.5 py-1 text-[9px] font-black text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors cursor-pointer text-left"
                  >
                    <span>{group.group}</span>
                    <ChevronRight 
                      size={10} 
                      className={cn("transition-transform duration-200 text-gray-600", !isGroupCollapsed && "rotate-90 text-gray-400")} 
                    />
                  </button>
                ) : (
                  // Thin divider line for collapsed icon states
                  <div className="h-px bg-white/5 w-6 mx-auto my-3" />
                )}

                {/* Sub-items Render block with premium slide-accordion animation */}
                <AnimatePresence initial={false}>
                  {(!isGroupCollapsed || isCollapsed) && (
                    <motion.div
                      initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                      animate={isCollapsed ? false : { height: "auto", opacity: 1 }}
                      exit={isCollapsed ? false : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="space-y-1 overflow-hidden w-full flex flex-col items-center"
                    >
                      {allowedItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={isCollapsed ? item.name : undefined}
                          onClick={() => setIsMobileOpen(false)}
                          onMouseEnter={() => {
                            if (typeof item.preload === 'function') {
                              item.preload().catch(() => {});
                            }
                          }}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center transition-all duration-150 group relative sidebar-item-hover cursor-pointer w-full",
                              isCollapsed 
                                ? "justify-center h-10 w-10 rounded-xl" 
                                : "gap-3.5 rounded-xl px-4 h-11 text-[12px] w-full",
                              isActive 
                                ? "bg-primary/[0.08] text-slate-100 font-bold border border-primary/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_18px_rgba(255,59,48,0.15)] rounded-xl" 
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
                                    "absolute rounded-full bg-primary shadow-[0_0_8px_rgba(255,59,48,0.5)]",
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
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
