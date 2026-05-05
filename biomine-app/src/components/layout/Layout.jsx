import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

export function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

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
      {/* Background Animated Gradient Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[150px]" />
      </div>

      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex flex-1 flex-col overflow-hidden z-10">
        <TopHeader setIsMobileOpen={setIsMobileOpen} title={title} subtitle={subtitle} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 relative scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
