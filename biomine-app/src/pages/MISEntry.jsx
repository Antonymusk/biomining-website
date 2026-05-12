import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Plus, Trash2, CheckCircle2, X, Lock, 
  AlertTriangle, FileCheck, BarChart3, ClipboardList, Truck,
  Activity, Building2, MapPin, UserCheck, Clock, Target
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationContext";
import { useSites } from "../hooks/useSites";
import { siteService } from "../services/siteService";

export default function MISEntry() {
  const { user } = useAuth();
  const { emitOperationalEvent } = useNotifications();
  const { sites: dbSites, loading: isSitesLoading, refetch: refetchSites } = useSites();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [site, setSite] = useState("");
  const [disposal, setDisposal] = useState("");

  // New Site Modal Logic
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [newSiteForm, setNewSiteForm] = useState({ 
    name: "", zone: "Central", capacity: "500", manager: "", hours: "24 Hours", status: "Active" 
  });
  
  // --------------------------------------------
  // Site Resolution (Multi-Site vs Restricted)
  // --------------------------------------------
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Operations Auditor';

  const allowedSites = useMemo(() => {
     if (isSuperAdmin || isAuditor) return dbSites;
     return user?.assigned_sites || [];
  }, [dbSites, user, isSuperAdmin, isAuditor]);

  useEffect(() => {
    if (!site && allowedSites.length > 0) {
       setSite(allowedSites[0].name);
    }
  }, [allowedSites, site]);

  // Data State
  const [vehicles, setVehicles] = useState([{ id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]);
  const [machines, setMachines] = useState([{ id: crypto.randomUUID(), name: "", production: "", diesel: "" }]);
  const [openingBalance, setOpeningBalance] = useState("");
  const [claimedDiesel, setClaimedDiesel] = useState("");

  // Shift Closure State
  const [closureNotes, setClosureNotes] = useState("");
  const [isClosureLoading, setIsClosureLoading] = useState(false);
  const [isShiftClosedToday, setIsShiftClosedToday] = useState(false);

  // Historic state for intelligence engine
  const [historicEntries, setHistoricEntries] = useState([]);

  // UI Control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --------------------------------------------
  // Site Provisioning Handler
  // --------------------------------------------
  const handleCreateSite = async (e) => {
     e.preventDefault();
     setIsCreatingSite(true);
     try {
        if (!newSiteForm.name.trim()) throw new Error("Site Designation is mandatory.");
        
        // Core Provisioning
        await siteService.saveSite({
           name: newSiteForm.name,
           zone: newSiteForm.zone,
           capacity: newSiteForm.capacity,
           manager: newSiteForm.manager,
           hours: newSiteForm.hours,
           status: newSiteForm.status
        });

        // Invalidate and refresh site master list instantly
        await refetchSites();
        window.dispatchEvent(new Event("biomine_sites_updated"));

        // Operational Auto-lock: Force interface onto the new node immediately
        setSite(newSiteForm.name);

        // Audit Trail Emit
        await emitOperationalEvent({
           event_type: 'site_created',
           title: 'Infrastructure Expanded',
           message: `New node "${newSiteForm.name}" dynamically provisioned via MIS command.`,
           severity: 'INFO',
           source_module: 'MIS',
           affected_site_id: null
        });

        showToast(`Site ${newSiteForm.name} provisioned successfully!`);
        setIsSiteModalOpen(false);
        setNewSiteForm({ name: "", zone: "Central", capacity: "500", manager: "", hours: "24 Hours", status: "Active" });

     } catch (err) {
        showToast(err.message || "Failed to provision node.", "error");
     } finally {
        setIsCreatingSite(false);
     }
  };

  // Auto Computations
  const totalVehicleDiesel = useMemo(() => vehicles.reduce((s, v) => s + (Number(v.diesel) || 0), 0), [vehicles]);
  const totalMachineDiesel = useMemo(() => machines.reduce((s, m) => s + (Number(m.diesel) || 0), 0), [machines]);
  const autoCalculatedDiesel = totalVehicleDiesel + totalMachineDiesel;
  const dieselDifference = (Number(claimedDiesel) || 0) - autoCalculatedDiesel;
  const dieselLeft = Math.max(0, (Number(openingBalance) || 0) - (Number(claimedDiesel) || 0));

  // Checks if shift closure exists for the current pair of site+date
  const checkClosureStatus = useCallback(async () => {
     if (!site || !date) return;
     try {
       // Need to find site ID first because closure table queries by uuid site_id
       const activeSite = allowedSites.find(s => s.name === site);
       if (!activeSite) return;

       const { data } = await supabase
          .from('shift_closures')
          .select('id')
          .eq('site_id', activeSite.id)
          .eq('shift_date', date)
          .maybeSingle();

       setIsShiftClosedToday(!!data);
     } catch (e) { console.error(e); }
  }, [site, date, allowedSites]);

  useEffect(() => { checkClosureStatus(); }, [checkClosureStatus]);

  // --------------------------------------------
  // Intelligence Engine Fetch
  // --------------------------------------------
  useEffect(() => {
    if (!site) return;
    const fetchHistoric = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data } = await supabase
        .from("mis_entries")
        .select(`*, vehicles(*), machines(*)`)
        .eq("site", site)
        .gte("date", cutoff)
        .order("date", { ascending: false });
        
      if (data) setHistoricEntries(data);
    };
    fetchHistoric();
  }, [site]);

  const getVehicleAnalysis = (v) => {
    const hrs = Number(v.hours) || 0;
    const fuel = Number(v.diesel) || 0;
    const rate = hrs > 0 ? fuel / hrs : 0;
    let baseBench = 9;
    const n = (v.name || "").toLowerCase();
    if (n.includes("200") || n.includes("210")) baseBench = 12;
    else if (n.includes("hyva") || n.includes("truck")) baseBench = 4;

    let status = "Operational";
    let color = "text-gray-400 border-white/10";
    if (rate > baseBench * 1.15) {
      status = "High Burn"; color = "text-warning border-warning/30 bg-warning/5";
    } else if (rate > 0 && rate < baseBench * 0.85) {
      status = "Efficient"; color = "text-emerald-500 border-emerald-500/30 bg-emerald-500/5";
    }
    return { rate, baseBench, status, color };
  };

  // --------------------------------------------
  // Handlers
  // --------------------------------------------
  const addVehicle = () => setVehicles([...vehicles, { id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]);
  const updateVehicle = (idx, f, v) => { const u = [...vehicles]; u[idx][f] = v; setVehicles(u); };
  const removeVehicle = (id) => setVehicles(vehicles.filter(v => v.id !== id));

  const addMachine = () => setMachines([...machines, { id: crypto.randomUUID(), name: "", production: "", diesel: "" }]);
  const updateMachine = (idx, f, v) => { const u = [...machines]; u[idx][f] = v; setMachines(u); };
  const removeMachine = (id) => setMachines(machines.filter(m => m.id !== id));

  const validate = () => {
     if (!site) return "Location required";
     if (!date) return "Date required";
     if (vehicles.filter(x => x.name).length === 0 && machines.filter(x => x.name).length === 0) {
        return "Enter at least one asset track";
     }
     return null;
  };

  const handleSaveEntry = async () => {
     if (isShiftClosedToday) {
        showToast("This shift is locked and cannot be modified.", "error");
        return;
     }

     const err = validate();
     if (err) { showToast(err, "error"); return; }

     setIsSubmitting(true);
     try {
       const vMap = vehicles.filter(v => v.name.trim());
       const mMap = machines.filter(m => m.name.trim());
       const prod = mMap.reduce((s, x) => s + (Number(x.production) || 0), 0);

       // 1. Upsert Parent
       const { data: parent, error: pErr } = await supabase
          .from("mis_entries")
          .upsert([{
             date,
             site,
             total_disposal: Number(disposal) || 0,
             total_production: prod,
             total_diesel: Number(claimedDiesel) || 0,
             fuel_opening: Number(openingBalance) || 0,
             calculated_diesel: autoCalculatedDiesel
          }], { onConflict: 'site,date' })
          .select().single();

       if (pErr) throw pErr;

       // 2. Save Child Relations (Wipe old for this logic if replace mode, simplify for this code block)
       if (vMap.length > 0) {
          await supabase.from('vehicles').delete().eq('mis_id', parent.id);
          await supabase.from('vehicles').insert(vMap.map(x => ({
             mis_id: parent.id,
             name: x.name,
             hours: Number(x.hours) || 0,
             diesel: Number(x.diesel) || 0
          })));
       }
       
       if (mMap.length > 0) {
          await supabase.from('machines').delete().eq('mis_id', parent.id);
          await supabase.from('machines').insert(mMap.map(x => ({
             mis_id: parent.id,
             name: x.name,
             production: Number(x.production) || 0
          })));
       }

       showToast("MIS Log Stream Synchronized Successfully", "success");
     } catch (e) {
       console.error(e);
       showToast(e.message || "Synchronization Failure", "error");
     } finally { setIsSubmitting(false); }
  };

  const handleCloseShift = async () => {
     const activeSite = allowedSites.find(s => s.name === site);
     if (!activeSite) { showToast("Invalid Site Instance", "error"); return; }

     setIsClosureLoading(true);
     try {
        const { error } = await supabase.from('shift_closures').insert([{
           site_id: activeSite.id,
           closed_by: user.id,
           shift_date: date,
           total_disposal: Number(disposal) || 0,
           operational_notes: closureNotes,
           audit_trail_locked: true
        }]);
        
        if (error) {
           if (error.code === '23505') throw new Error("Shift is already officially closed for this window.");
           throw error;
        }

        // DISPATCH ENTERPRISE OPERATIONAL EVENT
        await emitOperationalEvent({
           title: "Shift Formally Closed",
           message: `Official validation executed for ${site}. Total Disposal: ${disposal} Tons.`,
           severity: 'SUCCESS',
           event_type: 'shift_closure_submitted',
           source_module: 'MIS',
           affected_site_id: activeSite.id
        });

        setIsShiftClosedToday(true);
        showToast("Shift Operations Legally Sealed", "success");
     } catch (e) {
        showToast(e.message, "error");
     } finally { setIsClosureLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto relative pb-20">
      
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' : 'bg-red-950/80 border-red-500/30 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="font-bold text-sm uppercase tracking-wider">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-4">
         <div>
            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Module / Operational MIS</div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
               Input Matrix Controller
               {isShiftClosedToday && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-black uppercase gap-1.5"><Lock size={12} /> Locked</Badge>}
            </h1>
         </div>

         <div className="flex gap-3">
            <Button onClick={handleSaveEntry} disabled={isSubmitting || isShiftClosedToday} variant="primary" className="font-black gap-2 uppercase text-xs shadow-lg shadow-primary/20">
               {isSubmitting ? <span className="animate-spin">...</span> : <Save size={14} />} Sync Data
            </Button>
         </div>
      </div>

      {/* MASTER CONFIG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-5">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Context Scope</h3>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Log Window</label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/10" />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1.5">
                     <label className="text-[10px] font-bold text-gray-400 uppercase">Operational Zone</label>
                     {isSuperAdmin && (
                        <button 
                           type="button"
                           onClick={() => setIsSiteModalOpen(true)}
                           className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/20 hover:border-primary/40 hover:text-white transition-all shadow-sm"
                        >
                           <Plus size={10} /> Add Site
                        </button>
                     )}
                  </div>
                  <select value={site} onChange={e => setSite(e.target.value)} disabled={isShiftClosedToday || allowedSites.length <= 1} className="w-full h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-white text-sm font-bold focus:border-primary outline-none transition-all cursor-pointer">
                     {allowedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Total Disposal (Tons)</label>
                  <Input type="number" value={disposal} onChange={e => setDisposal(e.target.value)} placeholder="0.00" disabled={isShiftClosedToday} className="bg-slate-950 border-white/10 text-lg font-mono" />
               </div>
            </div>
         </Card>

         <Card className="md:col-span-2 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Fuel Inventory Reconciliation</h3>
               <Badge className={Math.abs(dieselDifference) > 5 ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"}>
                  {Math.abs(dieselDifference) <= 5 ? "Valid" : "Mismatch Gap"}
               </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Fuel Opening (L)</label>
                  <Input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/10" />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Claimed Consumed (L)</label>
                  <Input type="number" value={claimedDiesel} onChange={e => setClaimedDiesel(e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/10" />
               </div>
               <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col justify-center">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Calc Total Sum</span>
                  <span className="text-2xl font-black font-mono text-white">{autoCalculatedDiesel} <span className="text-xs font-normal opacity-50">L</span></span>
               </div>
               <div className={`border p-3 rounded-xl flex flex-col justify-center ${Math.abs(dieselDifference) > 5 ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Audit Diff</span>
                  <span className={`text-2xl font-black font-mono ${dieselDifference > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{dieselDifference > 0 ? '+' : ''}{dieselDifference}</span>
               </div>
            </div>
         </Card>
      </div>

      {/* FLEET ENTRY */}
      <Card className="p-5">
         <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
               <Truck size={16} className="text-cyan-500" /> Fleet Asset Telemetry
            </h3>
            <Button variant="outline" size="sm" onClick={addVehicle} disabled={isShiftClosedToday} className="text-[10px] font-bold border-white/10 hover:bg-white/5 uppercase tracking-wider"><Plus size={12} className="mr-1" /> Append Asset</Button>
         </div>
         <div className="space-y-3">
            {vehicles.map((v, i) => {
               const a = getVehicleAnalysis(v);
               return (
               <div key={v.id} className="bg-slate-950/50 border border-white/5 rounded-xl p-3">
                  <div className="flex flex-col md:flex-row gap-3">
                     <div className="flex-1">
                        <Input placeholder="Vehicle/Excavator Name" value={v.name} onChange={e => updateVehicle(i, 'name', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 text-white font-bold text-xs" />
                     </div>
                     <div className="w-full md:w-24">
                        <Input type="number" placeholder="Hrs" value={v.hours} onChange={e => updateVehicle(i, 'hours', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 text-center font-mono" />
                     </div>
                     <div className="w-full md:w-28">
                        <Input type="number" placeholder="Diesel (L)" value={v.diesel} onChange={e => updateVehicle(i, 'diesel', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 font-mono" />
                     </div>
                     <button onClick={() => removeVehicle(v.id)} disabled={isShiftClosedToday} className="text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center px-2 disabled:opacity-30"><Trash2 size={16} /></button>
                  </div>
                  {v.name && v.hours && (
                     <div className={`mt-2 pt-2 border-t border-white/5 text-[10px] flex justify-between items-center ${a.color}`}>
                        <span className="font-bold uppercase tracking-widest">Current Burn: {a.rate.toFixed(1)} L/Hr</span>
                        <span className="opacity-70">Metric Status: {a.status} (Bench: {a.baseBench} L/h)</span>
                     </div>
                  )}
               </div>
            )})}
         </div>
      </Card>

      {/* MACHINES ENTRY */}
      <Card className="p-5">
         <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
               <Activity size={16} className="text-emerald-500" /> Fixed Plant & Machinery
            </h3>
            <Button variant="outline" size="sm" onClick={addMachine} disabled={isShiftClosedToday} className="text-[10px] font-bold border-white/10 hover:bg-white/5 uppercase tracking-wider"><Plus size={12} className="mr-1" /> Append Plant</Button>
         </div>
         <div className="space-y-3">
            {machines.map((m, i) => (
               <div key={m.id} className="bg-slate-950/50 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row gap-3">
                  <div className="flex-1"><Input placeholder="Plant Node Name" value={m.name} onChange={e => updateMachine(i, 'name', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 font-bold text-xs" /></div>
                  <div className="flex-1"><Input type="number" placeholder="Yield (Tons)" value={m.production} onChange={e => updateMachine(i, 'production', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 font-mono" /></div>
                  <div className="flex-1"><Input type="number" placeholder="Aux Fuel (L)" value={m.diesel} onChange={e => updateMachine(i, 'diesel', e.target.value)} disabled={isShiftClosedToday} className="bg-slate-950 border-white/5 font-mono" /></div>
                  <button onClick={() => removeMachine(m.id)} disabled={isShiftClosedToday} className="text-gray-600 hover:text-red-500 px-2 disabled:opacity-30"><Trash2 size={16} /></button>
               </div>
            ))}
         </div>
      </Card>

      {/* ---------------------------------------------------
          ENTERPRISE FEATURE: SHIFT CLOSURE CONSOLE
      --------------------------------------------------- */}
      <Card className={`p-6 border-t-4 ${isShiftClosedToday ? 'border-t-red-500 bg-red-950/5' : 'border-t-primary bg-slate-950'}`}>
         <div className="flex items-center justify-between mb-6">
            <div>
               <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <FileCheck size={20} className={isShiftClosedToday ? 'text-red-400' : 'text-primary'} />
                  Shift Operations Seal & Closure
               </h3>
               <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 tracking-widest">Execute final legally-binding daily validation</p>
            </div>
            {isShiftClosedToday && <div className="bg-red-500/20 px-3 py-1 rounded font-black text-red-400 text-[10px] uppercase flex items-center gap-1"><Lock size={10} /> Read Only State</div>}
         </div>

         {isShiftClosedToday ? (
            <div className="bg-slate-900/60 border border-white/5 p-6 rounded-xl text-center flex flex-col items-center justify-center space-y-3">
               <div className="p-4 bg-red-500/10 rounded-full text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10">
                  <Lock size={32} />
               </div>
               <h4 className="text-xl font-bold text-white">Day Window Officially Closed</h4>
               <p className="text-sm text-gray-400 max-w-md mx-auto">All ledger entries for this day-period have been hashed into the read-only audit record. Edits are locked for governance.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase block mb-2">Operational Finalizer Notes</label>
                  <textarea 
                     value={closureNotes}
                     onChange={e => setClosureNotes(e.target.value)}
                     placeholder="Provide official hand-over briefing, incidents, and structural summaries..."
                     className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none transition-all resize-none placeholder:text-gray-600"
                  />
               </div>
               <div className="flex flex-col justify-between bg-slate-900/40 border border-white/5 p-4 rounded-xl">
                  <div>
                     <h4 className="text-[11px] font-black text-white uppercase mb-3">Verification Summary</h4>
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Final Disposal:</span>
                           <span className="font-mono text-white font-bold">{disposal || 0} T</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-gray-500">Fuel Delta:</span>
                           <span className={`font-mono font-bold ${Math.abs(dieselDifference) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>{dieselDifference} L</span>
                        </div>
                     </div>
                  </div>
                  <Button 
                     onClick={handleCloseShift}
                     disabled={isClosureLoading || !disposal}
                     className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs gap-2 h-11 shadow-lg shadow-red-900/20 mt-4"
                  >
                     {isClosureLoading ? "Sealing Record..." : <><Lock size={14} /> Execute Shift Closure</>}
                  </Button>
                  <p className="text-[9px] text-gray-600 text-center mt-2">WARNING: Irreversible structural action.</p>
               </div>
            </div>
         )}
      </Card>

      {/* ===================================================== */}
      {/* DYNAMIC SITE PROVISIONING MODAL */}
      {/* ===================================================== */}
      <AnimatePresence>
         {isSiteModalOpen && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsSiteModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
               />
               <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg glass-card bg-slate-900/90 border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col z-10"
               >
                  {/* Modal Top Ribbon */}
                  <div className="flex justify-between items-center p-5 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                           <Building2 size={20} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white tracking-tight">Provision New Site</h3>
                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Direct Infrastructure Injection</p>
                        </div>
                     </div>
                     <button onClick={() => setIsSiteModalOpen(false)} className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                     </button>
                  </div>
                  
                  <form onSubmit={handleCreateSite} className="p-6 space-y-5">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                           <Building2 size={12} className="text-primary" /> Site Designation / Name
                        </label>
                        <input 
                           required 
                           type="text" 
                           value={newSiteForm.name} 
                           onChange={(e) => setNewSiteForm({...newSiteForm, name: e.target.value})}
                           className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                           placeholder="e.g. Lucknow Processing Hub"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin size={12} className="text-cyan-400" /> Governance Zone
                           </label>
                           <select 
                              value={newSiteForm.zone} 
                              onChange={(e) => setNewSiteForm({...newSiteForm, zone: e.target.value})}
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none cursor-pointer"
                           >
                              {["North", "South", "East", "West", "Central"].map(z => <option key={z} value={z} className="bg-slate-900">{z} Region</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Target size={12} className="text-emerald-400" /> Daily Target (Tons)
                           </label>
                           <input 
                              required 
                              type="number" 
                              value={newSiteForm.capacity} 
                              onChange={(e) => setNewSiteForm({...newSiteForm, capacity: e.target.value})}
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono outline-none"
                              placeholder="500"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Clock size={12} className="text-amber-400" /> Operating Hours
                           </label>
                           <input 
                              required 
                              type="text" 
                              value={newSiteForm.hours} 
                              onChange={(e) => setNewSiteForm({...newSiteForm, hours: e.target.value})}
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none"
                              placeholder="e.g. 24 Hours"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                              <UserCheck size={12} className="text-violet-400" /> Site Overseer
                           </label>
                           <input 
                              required 
                              type="text" 
                              value={newSiteForm.manager} 
                              onChange={(e) => setNewSiteForm({...newSiteForm, manager: e.target.value})}
                              className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none"
                              placeholder="Personnel Name"
                           />
                        </div>
                     </div>

                     <div className="flex gap-3 pt-3 border-t border-white/5 mt-6">
                        <Button 
                           type="button" 
                           variant="outline" 
                           onClick={() => setIsSiteModalOpen(false)} 
                           className="flex-1 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                        >
                           Cancel
                        </Button>
                        <Button 
                           type="submit" 
                           disabled={isCreatingSite}
                           variant="success" 
                           className="flex-1 uppercase tracking-wider text-[11px] font-black gap-2 shadow-lg shadow-emerald-900/20"
                        >
                           {isCreatingSite ? (
                              <>Running Registry Insertion...</>
                           ) : (
                              <><CheckCircle2 size={14} /> Confirm Injection</>
                           )}
                        </Button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

    </motion.div>
  );
}