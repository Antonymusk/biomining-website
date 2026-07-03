import { useState, useEffect, useRef, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { Search, Command, CornerDownLeft, Activity } from "lucide-react";
import { AICopilot } from "./AICopilot";

export function Layout() {
  const [isPinned, setIsPinned] = useState(() => {
    try {
      const saved = localStorage.getItem("biomine_sidebar_pinned");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("biomine_sidebar_pinned");
      const pinned = saved ? JSON.parse(saved) : false;
      return !pinned; // If pinned, expanded (false). If auto-hide, start collapsed (true).
    } catch {
      return true;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const togglePin = () => {
    setIsPinned(prev => {
      const updated = !prev;
      localStorage.setItem("biomine_sidebar_pinned", JSON.stringify(updated));
      if (updated) {
        setIsCollapsed(false);
      }
      return updated;
    });
  };

  // Expand sidebar automatically if mobile open toggles
  useEffect(() => {
    if (isMobileOpen) {
      setIsCollapsed(false);
    }
  }, [isMobileOpen]);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandKOpen(prev => !prev);
        setSearchQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setIsCommandKOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input
  useEffect(() => {
    if (isCommandKOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 80);
    }
  }, [isCommandKOpen]);

  const actions = [
    { label: "Go to Dashboard", path: "/", description: "Operational intelligence overview & executive KPIs", icon: "🏠" },
    { label: "New MIS Entry", path: "/mis-entry", description: "Enter daily site waste disposal and fleet telemetry", icon: "📝" },
    { label: "Fleet Control Monitor", path: "/fleet-control", description: "Manage trucks, drivers, and real-time geofences", icon: "🚚" },
    { label: "Reports & Site-Wise Exports", path: "/reports", description: "Generate printable PDFs and flat industrial Excel exports", icon: "📊" },
    { label: "Advanced Trend Analytics", path: "/analytics", description: "Deep-dive operational metrics & best performing units", icon: "📈" },
    { label: "Platform Settings", path: "/settings", description: "Configure system thresholds and account details", icon: "⚙️" },
  ];

  const filteredActions = useMemo(() => {
    return actions.filter(action => 
      action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleActionSelect = (path) => {
    navigate(path);
    setIsCommandKOpen(false);
  };

  const handleCommandKKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        handleActionSelect(filteredActions[selectedIndex].path);
      }
    }
  };

  const getPageTitle = (pathname) => {
    switch (pathname) {
      case "/": return { title: "Dashboard", subtitle: "Operational Intelligence Overview" };
      case "/mis-entry": return { title: "MIS Entry", subtitle: "Daily Operations Data Input" };
      case "/operations": return { title: "Operations", subtitle: "Live Site Monitoring" };
      case "/fleet-control": return { title: "Fleet Control", subtitle: "Vehicle Management System" };
      case "/inventory": return { title: "Inventory", subtitle: "Stock & Material Tracking" };
      case "/analytics": return { title: "Analytics", subtitle: "Advanced Performance Metrics" };
      case "/reports": return { title: "Reports", subtitle: "Data Export & Summaries" };
      case "/settings": return { title: "Settings", subtitle: "Platform Configuration" };
      default: return { title: "BioMine", subtitle: "Waste Management Platform" };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-dark-bg text-foreground relative">
      {/* Background Animated Rich Cinematic Gradient Blobs - Disabled for pure black theme */}

      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        togglePin={togglePin}
      />

      {/* Spacer to prevent sidebar overlapping content on desktop */}
      <div 
        className="hidden md:block transition-all duration-200 ease-out shrink-0" 
        style={{ 
          width: isPinned ? (isCollapsed ? 64 : 260) : 64 
        }} 
      />

      <div className="flex flex-1 flex-col overflow-hidden z-10">
        <TopHeader setIsMobileOpen={setIsMobileOpen} title={title} subtitle={subtitle} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.995 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* GLOBAL SPOTLIGHT COMMAND K BAR */}
      <AnimatePresence>
        {isCommandKOpen && (
          <div 
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-black/75 backdrop-blur-md"
            onClick={() => setIsCommandKOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-dark-card/95 border border-dark-border/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input header */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-dark-border/60">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or search action..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  onKeyDown={handleCommandKKeyDown}
                  className="w-full bg-transparent text-white border-none outline-none text-sm placeholder-gray-500"
                />
                <span className="text-[10px] bg-dark-bg/80 border border-dark-border/80 px-2 py-0.5 rounded font-mono text-gray-400 shrink-0 flex items-center gap-1">
                  <Command size={10} /> K
                </span>
              </div>

              {/* Actions list */}
              <div className="max-h-[320px] overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {filteredActions.map((action, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={action.path}
                      onClick={() => handleActionSelect(action.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? "bg-primary/20 border border-primary/40 text-white shadow-lg shadow-primary/5" 
                          : "border border-transparent hover:bg-dark-bg/40 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-xl shrink-0">{action.icon}</span>
                        <div className="text-left">
                          <p className="text-xs font-bold">{action.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{action.description}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <CornerDownLeft size={10} /> Enter
                        </span>
                      )}
                    </div>
                  );
                })}
                {filteredActions.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-500">No actions found matching "{searchQuery}"</div>
                )}
              </div>

              {/* Footer hotkeys guide */}
              <div className="px-4 py-2.5 bg-dark-bg/60 border-t border-dark-border/40 flex justify-between items-center text-[10px] text-gray-500 font-medium">
                <div className="flex items-center gap-3">
                  <span>↑↓ Navigate</span>
                  <span>Esc Close</span>
                </div>
                <span>BioMine Spotlight Navigation v1.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AICopilot />
    </div>
  );
}
