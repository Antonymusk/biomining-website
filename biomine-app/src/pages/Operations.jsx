import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Activity, AlertTriangle, Battery, Settings2, 
  ChevronRight, MapPin, Plus, Truck, Zap, ShieldAlert, 
  RefreshCw, Boxes, Server, Cog
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import { useSites } from "../hooks/useSites";
import { useAuth } from "../lib/AuthContext";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";

export default function Operations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sites, loading: sitesLoading } = useSites();

  // Site State
  const [selectedSite, setSelectedSite] = useState("");
  const [opLoading, setOpLoading] = useState(true);
  
  // Fetched Local Telemetry
  const [misToday, setMisToday] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';
  const userSite = user?.assigned_site;

  // Default selection logic
  useEffect(() => {
    if (sitesLoading) return;
    if (userSite && !isSuperAdmin) {
      setSelectedSite(userSite);
    } else if (!selectedSite && sites.length > 0) {
      setSelectedSite(sites[0].name);
    }
  }, [sitesLoading, sites, userSite, isSuperAdmin]);

  const loadSiteIntelligence = useCallback(async () => {
    if (!selectedSite) return;
    setOpLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [{ data: misData }, { data: fleetData }, { data: alertData }] = await Promise.all([
        supabase.from('mis_entries').select('*').eq('site', selectedSite).eq('date', today).maybeSingle(),
        supabase.from('fleet_vehicles').select('*').eq('site', selectedSite).limit(10),
        supabase.from('operational_alerts').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(5)
      ]);

      setMisToday(misData || { total_production: 0, total_disposal: 0 });
      setVehicles(fleetData || []);
      setAlerts(alertData || []);
    } catch (err) {
      console.error("Telemetry load error:", err);
    } finally {
      setOpLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    loadSiteIntelligence();
  }, [loadSiteIntelligence]);

  useRealtimeSubscription('fleet_vehicles', loadSiteIntelligence);

  // Derivative Stats
  const activeVehicles = useMemo(() => vehicles.filter(v => v.status === 'Active').length, [vehicles]);
  const systemStatus = useMemo(() => {
    if (vehicles.length > 0 && activeVehicles / vehicles.length < 0.5) return 'Degraded';
    const criticalAlert = alerts.some(a => a.severity === 'critical');
    if (criticalAlert) return 'Caution';
    return 'Optimal';
  }, [vehicles, activeVehicles, alerts]);

  if (sitesLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mb-4" />
        <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">Hydrating Control Deck...</span>
      </div>
    );
  }

  if (!sitesLoading && sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4">
        <div className="p-5 bg-dark-bg/50 rounded-full border border-white/10 text-gray-600">
          <Boxes size={48} className="opacity-50" />
        </div>
        <h2 className="text-xl font-bold text-white">No Operational Nodes Configured</h2>
        <p className="text-sm text-gray-400 max-w-md">System cannot provision operations matrix because zero nodes have been enabled inside configuration master control.</p>
        <Button onClick={() => navigate('/settings')} variant="primary" className="gap-2">
          <Cog size={16} /> Configure Node Infrastructure
        </Button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      
      {/* SCALABLE OPERATIONS HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg/40 p-4 border border-white/5 rounded-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={systemStatus === 'Optimal' ? 'success' : systemStatus === 'Caution' ? 'warning' : 'danger'} className="animate-pulse px-1.5">
               LIVE
            </Badge>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-Time Node Surveillance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Site Operations</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isSuperAdmin ? (
            <div className="relative flex-1 md:flex-none">
              <select 
                value={selectedSite} 
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full md:w-64 bg-slate-900 border border-primary/30 text-white rounded-lg pl-9 pr-10 py-2 text-sm font-semibold focus:border-primary appearance-none cursor-pointer"
              >
                {sites.map(s => <option key={s.id} value={s.name}>{s.name} Node</option>)}
              </select>
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-emerald-500/20">
              <ShieldAlert size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-white">Locked: {selectedSite}</span>
            </div>
          )}
        </div>
      </div>

      {/* THE FOCUSSED OPERATIONAL CONTROL MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CORE TELEMETRY GRID */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="relative overflow-hidden border-l-4 border-l-primary">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><Server size={120} /></div>
             
             <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {selectedSite} <Badge variant="outline" className="text-[9px] uppercase tracking-wider">Active Matrix</Badge>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Consolidated hardware and logistics telemetry feed.</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                  systemStatus === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  systemStatus === 'Caution' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  System {systemStatus}
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-dark-bg/50 p-4 rounded-xl border border-white/5 shadow-inner">
                   <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Today's Yield</div>
                   <div className="text-2xl font-black text-white font-mono">{opLoading ? '--' : misToday?.total_production || 0}<span className="text-sm text-gray-500 ml-1">Tons</span></div>
                </div>
                <div className="bg-dark-bg/50 p-4 rounded-xl border border-white/5 shadow-inner">
                   <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Disposal Queue</div>
                   <div className="text-2xl font-black text-white font-mono">{opLoading ? '--' : misToday?.total_disposal || 0}<span className="text-sm text-gray-500 ml-1">Tons</span></div>
                </div>
                <div className="bg-dark-bg/50 p-4 rounded-xl border border-white/5 shadow-inner col-span-2 md:col-span-1">
                   <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Live Uplinks</div>
                   <div className="text-2xl font-black text-white font-mono">{vehicles.length}<span className="text-xs text-emerald-500 ml-1 font-bold">(+{activeVehicles} Act)</span></div>
                </div>
             </div>
          </Card>

          {/* MACHINERY & VEHICLE LIST */}
          <Card className="p-5 border-white/5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={16} className="text-primary" /> Connected Hardware Trace
                </h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase font-mono">Total {vehicles.length} Found</span>
             </div>

             <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {vehicles.length > 0 ? vehicles.map((v, i) => (
                   <motion.div 
                      key={v.id} 
                      initial={{ opacity: 0, x: -5 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/40 border border-white/5 hover:border-white/10 transition-colors"
                   >
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${v.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                            {v.vehicle_type === 'Excavator' ? <Activity size={16} /> : <Truck size={16} />}
                         </div>
                         <div>
                            <div className="text-sm font-bold text-gray-200">{v.vehicle_name}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{v.vehicle_number || 'U-ID'} | {v.driver_name || 'System Ops'}</div>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="text-right">
                            <div className="text-[10px] text-gray-500 uppercase font-bold">V-Refuel</div>
                            <div className="flex items-center gap-1.5 justify-end">
                               <span className={`text-xs font-mono font-bold ${Number(v.fuel_level || 0) < 20 ? 'text-red-400' : 'text-gray-300'}`}>{v.fuel_level || '100'}%</span>
                               <div className="w-10 h-1 bg-gray-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${Number(v.fuel_level || 0) < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${v.fuel_level || 100}%` }} />
                               </div>
                            </div>
                         </div>
                         <Badge variant={v.status === 'Active' ? 'success' : v.status === 'Idle' ? 'warning' : 'default'} className="uppercase text-[9px] py-0.5 font-black">
                            {v.status}
                         </Badge>
                      </div>
                   </motion.div>
                )) : (
                   <div className="py-10 text-center text-gray-500 text-xs font-medium border border-dashed border-white/10 rounded-xl bg-slate-950/30">
                      Zero machinery assets indexed for this node in database grid.
                   </div>
                )}
             </div>
          </Card>
        </div>

        {/* ALERTS & LOGISTICS FEED */}
        <div className="space-y-6">
           <Card className="border-red-500/10 bg-slate-950/30">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                 <AlertTriangle className="text-red-500" size={18} />
                 <h3 className="text-sm font-black text-white uppercase tracking-wider">Actionable Criticality</h3>
              </div>

              <div className="space-y-3">
                 {alerts.length > 0 ? alerts.map((alert, i) => (
                   <div key={alert.id} className={`p-3 rounded-xl border ${alert.severity === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'} flex flex-col gap-1`}>
                      <div className="flex justify-between items-start">
                         <h4 className={`text-xs font-bold ${alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.title}</h4>
                         <span className="text-[9px] text-gray-500 font-mono">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{alert.description}</p>
                   </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                       <Zap size={32} className="text-emerald-500 mb-2" />
                       <p className="text-xs text-gray-400 font-bold uppercase">Zero Active Conflicts</p>
                    </div>
                 )}
              </div>
           </Card>

           <Card className="bg-gradient-to-br from-primary/10 to-dark-bg border-primary/20">
              <div className="flex flex-col items-center text-center py-4 space-y-3">
                 <div className="p-3 bg-primary/20 rounded-full text-primary"><Battery size={28} /></div>
                 <div>
                    <div className="text-xs font-bold text-primary uppercase tracking-widest">Shift Endurance</div>
                    <h3 className="text-2xl font-black text-white mt-1">Running Nominal</h3>
                    <p className="text-[10px] text-gray-400 px-4 mt-2 leading-tight">Current uptime metrics and asset health align with target operational parameters.</p>
                 </div>
              </div>
           </Card>
        </div>

      </div>

    </motion.div>
  );
}
