import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, MapPin, Wifi, Database, Palette, ShieldCheck, 
  ChevronRight, Settings as SettingsIcon
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { lazyWithRetry } from "../lib/utils";

// Lazy Load Settings Modules for peak performance with deployment fault-tolerance
const OperationalTargets = lazyWithRetry(() => import("../components/settings/OperationalTargets"));
const SiteConfiguration = lazyWithRetry(() => import("../components/settings/SiteConfiguration"));
const PWAOffline = lazyWithRetry(() => import("../components/settings/PWAOffline"));
const BackupRecovery = lazyWithRetry(() => import("../components/settings/BackupRecovery"));
const Appearance = lazyWithRetry(() => import("../components/settings/Appearance"));
const Security = lazyWithRetry(() => import("../components/settings/Security"));

const TABS = [
  { id: "targets", label: "Operational Targets", icon: Target, component: OperationalTargets, desc: "Intelligence & Quotas" },
  { id: "infrastructure", label: "Site Configuration", icon: MapPin, component: SiteConfiguration, desc: "Zone & Fleet Nodes" },
  { id: "uplink", label: "PWA & Offline", icon: Wifi, component: PWAOffline, desc: "Sync & Cache Health" },
  { id: "governance", label: "Backup & Recovery", icon: Database, component: BackupRecovery, desc: "State Archival" },
  { id: "optics", label: "Appearance", icon: Palette, component: Appearance, desc: "Theme & Optics" },
  { id: "protocol", label: "Security", icon: ShieldCheck, component: Security, desc: "Auth & Session Audit" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("targets");

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || OperationalTargets;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
              <SettingsIcon size={22} className="text-slate-400" />
            </div>
            Enterprise Operational Configuration
          </h1>
          <p className="text-slate-400 text-sm ml-14 -mt-1 font-medium">Master governance matrix and infrastructure tuning.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar Navigation */}
        <Card className="w-72 p-3 flex flex-col overflow-y-auto scrollbar-none bg-slate-950/20 backdrop-blur-md border-white/5 h-full shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full group relative flex items-center gap-3.5 p-3 rounded-xl text-left transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-600/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" 
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute inset-0 border border-blue-500/30 rounded-xl bg-[linear-gradient(110deg,transparent,rgba(59,130,246,0.05),transparent)] pointer-events-none"
                    />
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="activeAccentLine"
                      className="absolute left-0 top-3 bottom-3 w-[3px] bg-blue-500 rounded-full"
                    />
                  )}

                  <div className={`p-2 rounded-lg transition-all ${
                    isActive ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]" : "bg-slate-900 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-300"
                  }`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold tracking-wide truncate uppercase">{tab.label}</p>
                    <p className={`text-[10px] truncate ${isActive ? "text-blue-400" : "text-slate-600"}`}>{tab.desc}</p>
                  </div>

                  <ChevronRight size={14} className={`transition-transform duration-200 ${
                    isActive ? "opacity-100 translate-x-0 text-blue-400" : "opacity-0 -translate-x-2 text-slate-600"
                  }`} />
                </button>
              );
            })}
          </nav>
          
          <div className="mt-auto pt-6 border-t border-white/5 px-3 pb-2 text-center">
            <div className="text-[10px] text-slate-600 uppercase tracking-widest font-mono mb-1">Kernel Release</div>
            <div className="text-xs font-bold text-slate-500">BM-SYS // STABLE 2.4.1</div>
          </div>
        </Card>

        {/* Content Space */}
        <div className="flex-1 overflow-y-auto scrollbar-none relative h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pb-12"
            >
              <Suspense fallback={
                <div className="h-full flex flex-col items-center justify-center pt-20 gap-4">
                  <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-xs font-mono tracking-widest text-slate-500 uppercase">Decrypting Panel Sequence...</p>
                </div>
              }>
                <ActiveComponent />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
