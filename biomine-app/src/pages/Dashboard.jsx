import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, Activity, AlertTriangle, CheckCircle2,
  RefreshCw, MapPin, Plus, Truck, Zap, Droplets,
  ArrowRight, ShieldAlert, Clock, BrainCircuit, Target, Trash2,
  ChevronRight, Layers, Flame, Shovel
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useSites } from "../hooks/useSites";
import { useAuth } from "../lib/AuthContext";

// Standard Operational Presets if targeted setup is missing
const FALLBACK_TARGETS = {
  dailyDisposal: 350,
  fuelEfficiency: 0.6,
  warningThreshold: 75,
  criticalThreshold: 90
};

// Circular Gauge Component for Premium Aesthetic
const TargetGauge = ({ current, target, title="Achieved", size=44, scoreMode=false }) => {
  const percentage = Math.min(Math.round((current / (target || 1)) * 100), 100);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  let colorClass = "stroke-primary";
  if (scoreMode) {
    if (percentage < 60) colorClass = "stroke-danger";
    else if (percentage < 85) colorClass = "stroke-warning";
    else colorClass = "stroke-emerald-500";
  } else {
    if (percentage < 50) colorClass = "stroke-danger";
    else if (percentage < 80) colorClass = "stroke-warning";
    else colorClass = "stroke-emerald-500";
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg 
        viewBox="0 0 176 176" 
        style={{ width: size * 4, height: size * 4 }}
        className="transform -rotate-90 overflow-visible"
      >
        <circle className="text-dark-bg/20 stroke-white/5" strokeWidth="12" fill="transparent" r={radius} cx="88" cy="88" />
        <motion.circle 
          className={`${colorClass} stroke-current drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="88"
          cy="88"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center transform text-center">
        <span className="text-3xl font-black text-white tracking-tight">{percentage}{scoreMode ? '' : '%'}</span>
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{title}</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sites, loading: sitesLoading } = useSites();

  // Site Selection Logic
  const [selectedSite, setSelectedSite] = useState("");
  const [dashboardLoading, setDashboardLoading] = useState(true);
  
  // Data States
  const [todayData, setTodayData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [fleetStats, setFleetStats] = useState({ active: 0, idle: 0, maintenance: 0, offline: 0 });
  const [siteTargets, setSiteTargets] = useState(FALLBACK_TARGETS);

  // Roles Configuration
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Operations Auditor';
  const canSwitchSites = isSuperAdmin || isAuditor || (user?.assigned_sites && user.assigned_sites.length > 1);
  
  const availableSites = useMemo(() => {
     if (isSuperAdmin || isAuditor) return sites;
     return user?.assigned_sites || [];
  }, [sites, user, isSuperAdmin, isAuditor]);

  // Initial Site Lock-on
  useEffect(() => {
    if (sitesLoading) return;
    
    if (!selectedSite) {
       if (isSuperAdmin || isAuditor) {
          setSelectedSite("ALL_SITES_GLOBAL");
       } else if (availableSites.length > 0) {
          setSelectedSite(availableSites[0].name);
       }
    }
  }, [sitesLoading, availableSites, selectedSite, isSuperAdmin, isAuditor]);

  // Load Target Thresholds
  useEffect(() => {
    if (!selectedSite) return;
    try {
      const saved = localStorage.getItem(`biomine_targets_${selectedSite}`);
      setSiteTargets(saved ? JSON.parse(saved) : FALLBACK_TARGETS);
    } catch (e) {
      setSiteTargets(FALLBACK_TARGETS);
    }
  }, [selectedSite]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedSite) return;
    setDashboardLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const isGlobal = selectedSite === "ALL_SITES_GLOBAL";

      // 1. Fetch MIS Performance
      let misQuery = supabase.from('mis_entries').select('*').eq('date', today);
      if (!isGlobal) misQuery = misQuery.eq('site', selectedSite);
      
      const { data: misData } = await (isGlobal ? misQuery : misQuery.maybeSingle());
      
      if (isGlobal && Array.isArray(misData)) {
         // Calculate Global Totals
         const agg = misData.reduce((acc, row) => ({
            total_production: acc.total_production + (Number(row.total_production) || 0),
            total_disposal: acc.total_disposal + (Number(row.total_disposal) || 0),
            total_diesel: acc.total_diesel + (Number(row.total_diesel) || 0)
         }), { total_production: 0, total_disposal: 0, total_diesel: 0 });
         setTodayData(agg);
      } else {
         setTodayData(misData || { total_production: 0, total_disposal: 0, total_diesel: 0 });
      }

      // 2. Fetch Alerts
      let alertQuery = supabase.from('operational_alerts').select('*').eq('status', 'active');
      // Only filter alerts by site if not global view
      if (!isGlobal) alertQuery = alertQuery.eq('site', selectedSite);
      
      const { data: alertData } = await alertQuery.order('created_at', { ascending: false });
      setAlerts(alertData || []);

      // 3. Fetch Fleet Distribution
      let fleetQuery = supabase.from('fleet_vehicles').select('status, site');
      if (!isGlobal) fleetQuery = fleetQuery.eq('site', selectedSite);
      
      const { data: vehicles } = await fleetQuery;
      
      const stats = { active: 0, idle: 0, maintenance: 0, offline: 0 };
      if (vehicles) {
         vehicles.forEach(v => {
            const s = v.status?.toLowerCase();
            if (['active', 'operational', 'running'].includes(s)) stats.active++;
            else if (['maintenance', 'repair'].includes(s)) stats.maintenance++;
            else if (['idle', 'parked'].includes(s)) stats.idle++;
            else stats.offline++;
         });
      }
      setFleetStats(stats);

    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Subscriptions
  useRealtimeSubscription('mis_entries', loadDashboardData);
  useRealtimeSubscription('fleet_vehicles', loadDashboardData);

  // Computations
  const currentDisposal = Number(todayData?.total_disposal || 0);
  const targetDisposal = Number(siteTargets.dailyDisposal || 350);
  const remainingTarget = Math.max(0, targetDisposal - currentDisposal);
  
  const currentDiesel = Number(todayData?.total_diesel || 0);
  const targetEfficiency = Number(siteTargets.fuelEfficiency || 0.6);
  const efficiency = currentDisposal > 0 ? (currentDiesel / currentDisposal) : 0;

  // -------------------------------------------------
  // CORE ENTERPRISE FEATURE: SITE HEALTH SCORE (0-100)
  // -------------------------------------------------
  const calculateHealthScore = () => {
     let score = 100;
     
     // 1. Target Disposal Efficiency (Weight: 40%)
     const disposalPct = Math.min(100, (currentDisposal / targetDisposal) * 100);
     score -= (100 - disposalPct) * 0.4;

     // 2. Fuel Performance (Weight: 20%)
     if (efficiency > targetEfficiency) {
        const variance = (efficiency - targetEfficiency) / targetEfficiency;
        score -= Math.min(20, variance * 50); // Drop up to 20 pts for fuel variance
     }

     // 3. Alert Deduction (Weight: 20%)
     const siteAlertsCount = alerts.length; 
     score -= Math.min(20, siteAlertsCount * 5);

     // 4. Fleet Uptime (Weight: 20%)
     const totalFleet = fleetStats.active + fleetStats.maintenance + fleetStats.idle + fleetStats.offline;
     if (totalFleet > 0) {
        const uptimePct = (fleetStats.active / totalFleet) * 100;
        score -= (100 - uptimePct) * 0.2;
     } else {
        score -= 5; // Penalty for no fleet visibility
     }

     return Math.max(0, Math.round(score));
  };

  const healthScore = calculateHealthScore();

  if (sitesLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20">
        <motion.div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-gray-400 font-medium text-sm tracking-widest uppercase">Synchronizing Neural Link...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      
      {/* HEADER: SITE-CENTRIC GOVERNANCE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping"></div>
            Operational Intelligence Center
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span className="opacity-60">SITE</span>
            <ChevronRight size={20} className="text-gray-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{selectedSite || "Not Assigned"}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {canSwitchSites && availableSites.length > 1 ? (
             <div className="relative">
               <select 
                value={selectedSite} 
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full md:w-64 bg-slate-900 border border-primary/30 text-white rounded-lg pl-9 pr-10 py-2 text-sm font-bold focus:border-primary appearance-none cursor-pointer shadow-lg shadow-primary/5"
              >
                {(isSuperAdmin || isAuditor) && <option value="ALL_SITES_GLOBAL">🌍 Enterprise Global View</option>}
                {availableSites.map(s => <option key={s.id} value={s.name}>{s.name} Site</option>)}
              </select>
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
             </div>
          ) : (
             <Badge className="py-2 px-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-2">
               <ShieldAlert size={14} /> Locked Scope
             </Badge>
          )}
          
          <Button onClick={() => navigate('/mis-entry')} variant="primary" className="shadow-lg shadow-primary/20 font-black gap-2 text-xs uppercase tracking-wider">
            <Plus size={14} /> Log Ops
          </Button>
        </div>
      </div>

      {/* LAYER 1: EXECUTIVE METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SITE HEALTH SCORE */}
        <Card className="lg:col-span-4 relative overflow-hidden bg-slate-950 flex flex-col justify-center items-center p-6 border-white/10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-500 to-emerald-500 opacity-50" />
          <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">
             {selectedSite === 'ALL_SITES_GLOBAL' ? 'Executive Enterprise Health' : 'Overall Site Health'}
          </h3>
          
          <TargetGauge current={healthScore} target={100} title="Score" scoreMode={true} size={44} />
          
          <div className="mt-4 text-center">
             <div className={`text-xs font-black uppercase tracking-widest ${healthScore > 80 ? 'text-emerald-500' : healthScore > 50 ? 'text-warning' : 'text-danger'}`}>
                {healthScore > 80 ? 'Nominal Status' : healthScore > 50 ? 'Degraded Performance' : 'Critical Operations'}
             </div>
             <p className="text-[9px] text-gray-500 mt-1">Real-time composite of disposal, fuel, & fleet telemetry.</p>
          </div>
        </Card>

        {/* PRODUCTION DIRECTIVE HERO */}
        <Card className="lg:col-span-8 relative bg-[#0D1117] border-emerald-500/10 flex flex-col md:flex-row gap-6 p-6 overflow-hidden">
           <div className="absolute -right-20 -bottom-20 opacity-5 text-emerald-500"><Target size={250} /></div>
           
           <div className="flex-1 flex flex-col justify-between">
              <div>
                 <h3 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-1">Operational Targets</h3>
                 <h2 className="text-2xl font-extrabold text-white tracking-tight">Shift Disposal Pipeline</h2>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                 <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Directive</div>
                    <div className="text-2xl font-black text-white font-mono">{targetDisposal} <span className="text-[10px] font-normal text-gray-500">T</span></div>
                 </div>
                 <div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase">Achieved</div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">{currentDisposal} <span className="text-[10px] font-normal text-gray-500">T</span></div>
                 </div>
                 <div>
                    <div className="text-[10px] font-bold text-cyan-500 uppercase">Remaining</div>
                    <div className="text-2xl font-black text-cyan-400 font-mono">{remainingTarget} <span className="text-[10px] font-normal text-gray-500">T</span></div>
                 </div>
              </div>

              <div className="mt-6 bg-white/5 p-3 rounded-lg flex items-center gap-3 border border-white/5">
                 <div className={`p-2 rounded-md ${remainingTarget === 0 ? 'bg-emerald-500/20' : 'bg-cyan-500/20'}`}>
                    {remainingTarget === 0 ? <CheckCircle2 className="text-emerald-400" size={16} /> : <Clock className="text-cyan-400" size={16} />}
                 </div>
                 <div className="text-xs text-gray-300">
                    {remainingTarget === 0 
                       ? <b className="text-emerald-400">Production cycle finalized.</b> 
                       : <span>Active Shift. <b>{remainingTarget} Tons</b> left to capture today.</span>}
                 </div>
              </div>
           </div>

           <div className="shrink-0 flex items-center justify-center md:border-l md:border-white/5 md:pl-6">
              <TargetGauge current={currentDisposal} target={targetDisposal} size={32} />
           </div>
        </Card>
      </div>

      {/* LAYER 2: INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         
         {/* PREDICTIVE RISKS */}
         <Card className="p-5 border-red-500/20 bg-red-950/10">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <AlertTriangle size={16} className="text-red-400" /> Predictive Risks
            </h3>
            <div className="space-y-3 h-[180px] overflow-y-auto custom-scrollbar pr-1">
               {efficiency > targetEfficiency * 1.15 && (
                  <div className="p-3 bg-slate-950/60 border border-amber-500/30 rounded-xl flex gap-3 animate-pulse">
                     <Droplets className="text-amber-400 shrink-0" size={16} />
                     <div>
                        <h4 className="text-[11px] font-bold text-white">Abnormal Fuel Variance</h4>
                        <p className="text-[9px] text-gray-400">Ratio ({efficiency.toFixed(2)}) exceeds by +{Math.round(((efficiency-targetEfficiency)/targetEfficiency)*100)}%.</p>
                     </div>
                  </div>
               )}
               {currentDisposal === 0 && !dashboardLoading && (
                  <div className="p-3 bg-slate-950/60 border border-red-500/30 rounded-xl flex gap-3">
                     <Clock className="text-red-400 shrink-0" size={16} />
                     <div>
                        <h4 className="text-[11px] font-bold text-white">Operational Stagnation</h4>
                        <p className="text-[9px] text-gray-400">No shift data injected.</p>
                     </div>
                  </div>
               )}
               {efficiency <= targetEfficiency && currentDisposal > 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-40">
                     <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Grid Nominal</p>
                  </div>
               )}
            </div>
         </Card>

         {/* FLEET ACTIVITY BOARD */}
         <Card className="p-5 border-white/10 bg-slate-950 relative overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <Activity size={16} className="text-primary" /> Fleet Activity Board
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-2">
               <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active</span>
                  <span className="text-2xl font-black text-white font-mono">{fleetStats.active}</span>
               </div>
               <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[9px] font-black text-cyan-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500"></span> Idle</span>
                  <span className="text-2xl font-black text-white font-mono">{fleetStats.idle}</span>
               </div>
               <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[9px] font-black text-warning uppercase tracking-wider mb-1 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-warning"></span> Repair</span>
                  <span className="text-2xl font-black text-white font-mono">{fleetStats.maintenance}</span>
               </div>
               <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span> Offline</span>
                  <span className="text-2xl font-black text-white font-mono">{fleetStats.offline}</span>
               </div>
            </div>
         </Card>

         {/* FUEL EFFICIENCY */}
         <Card className={`p-5 border-t-4 border-t-emerald-500 bg-slate-950`}>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
               <Droplets size={16} className="text-emerald-500" /> Ratio Threshold
            </h3>
            <div className="flex flex-col items-center justify-center py-2 space-y-1">
               <div className="text-4xl font-black text-white font-mono">
                  {efficiency.toFixed(2)}
                  <span className="text-xs font-normal text-gray-500 ml-1">L/T</span>
               </div>
               <div className="text-[9px] font-bold text-gray-500 uppercase">Ceiling: {targetEfficiency.toFixed(2)} L/T</div>
            </div>
            <div className="mt-6 border-t border-white/5 pt-4">
               <div className="flex justify-between text-[10px] mb-2 text-gray-400">
                  <span>Diesel Input:</span>
                  <span className="text-white font-black">{currentDiesel.toLocaleString()} L</span>
               </div>
               <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                     className={`h-full ${efficiency > targetEfficiency ? 'bg-red-500' : 'bg-emerald-500'}`}
                     style={{ width: `${Math.min(100, (efficiency / targetEfficiency) * 100)}%`, transition: 'width 1s' }}
                  />
               </div>
            </div>
         </Card>
      </div>
    </motion.div>
  );
}
