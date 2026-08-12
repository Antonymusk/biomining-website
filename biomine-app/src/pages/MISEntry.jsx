import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Plus, Trash2, CheckCircle2, X, Lock, 
  AlertTriangle, FileCheck, BarChart3, ClipboardList, Truck,
  Activity, Building2, MapPin, UserCheck, Clock, Target,
  Search, Download, ChevronDown, ChevronRight, Layers, Calendar, RefreshCw, FileSpreadsheet, Filter
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

const VehicleRow = React.memo(({ v, i, isShiftClosedToday, isReadOnly, updateVehicle, removeVehicle }) => {
  const [localV, setLocalV] = useState(v);
  
  // Sync if parent updates externally
  useEffect(() => { setLocalV(v); }, [v]);

  const handleChange = (f, val) => setLocalV(prev => ({...prev, [f]: val}));
  const handleBlur = (f, val) => {
    if (v[f] !== val) updateVehicle(i, f, val);
  };

  const a = getVehicleAnalysis(localV);

  return (
    <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3">
      <div className="flex flex-col md:flex-row gap-3">
         <div className="flex-1">
            <Input placeholder="Vehicle/Excavator Name" value={localV.name} 
              onChange={e => handleChange('name', e.target.value)} 
              onBlur={e => handleBlur('name', e.target.value)}
              disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 text-white font-bold text-xs" />
         </div>
         <div className="w-full md:w-24">
            <Input type="number" placeholder="Hrs" value={localV.hours} 
              onChange={e => handleChange('hours', e.target.value)} 
              onBlur={e => handleBlur('hours', e.target.value)}
              disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 text-center font-mono" />
         </div>
         <div className="w-full md:w-28">
            <Input type="number" placeholder="Diesel (L)" value={localV.diesel} 
              onChange={e => handleChange('diesel', e.target.value)} 
              onBlur={e => handleBlur('diesel', e.target.value)}
              disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 font-mono" />
         </div>
         {!isReadOnly && (
            <button onClick={() => removeVehicle(v.id)} disabled={isShiftClosedToday} className="text-gray-600 hover:text-red-500 transition-colors flex items-center justify-center px-2 disabled:opacity-30"><Trash2 size={16} /></button>
         )}
      </div>
      {localV.name && localV.hours && (
         <div className={`mt-2 pt-2 border-t border-white/5 text-[10px] flex justify-between items-center ${a.color}`}>
            <span className="font-bold uppercase tracking-widest">Current Burn: {a.rate.toFixed(1)} L/Hr</span>
            <span className="opacity-70">Metric Status: {a.status} (Bench: {a.baseBench} L/h)</span>
         </div>
      )}
    </div>
  );
});
VehicleRow.displayName = 'VehicleRow';

const MachineRow = React.memo(({ m, i, isShiftClosedToday, isReadOnly, updateMachine, removeMachine }) => {
  const [localM, setLocalM] = useState(m);
  
  useEffect(() => { setLocalM(m); }, [m]);

  const handleChange = (f, val) => setLocalM(prev => ({...prev, [f]: val}));
  const handleBlur = (f, val) => {
    if (m[f] !== val) updateMachine(i, f, val);
  };

  return (
    <div className="bg-slate-950/50 border border-white/5 rounded-xl p-3 flex flex-col md:flex-row gap-3">
      <div className="flex-1">
        <Input placeholder="Plant Node Name" value={localM.name} 
          onChange={e => handleChange('name', e.target.value)} 
          onBlur={e => handleBlur('name', e.target.value)}
          disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 font-bold text-xs" />
      </div>
      <div className="flex-1">
        <Input type="number" placeholder="Yield (Tons)" value={localM.production} 
          onChange={e => handleChange('production', e.target.value)} 
          onBlur={e => handleBlur('production', e.target.value)}
          disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 font-mono" />
      </div>
      <div className="flex-1">
        <Input type="number" placeholder="Aux Fuel (L)" value={localM.diesel} 
          onChange={e => handleChange('diesel', e.target.value)} 
          onBlur={e => handleBlur('diesel', e.target.value)}
          disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/5 font-mono" />
      </div>
      {!isReadOnly && (
        <button onClick={() => removeMachine(m.id)} disabled={isShiftClosedToday} className="text-gray-600 hover:text-red-500 px-2 disabled:opacity-30"><Trash2 size={16} /></button>
      )}
    </div>
  );
});
MachineRow.displayName = 'MachineRow';

export default function MISEntry() {
  const { user, hasPermission } = useAuth();
  const isReadOnly = !hasPermission('MIS', 'READ_WRITE');
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

  // UI Tab & Explorer State
  const [activeTab, setActiveTab] = useState("controller"); // "controller" | "site_wise"
  const [selectedExplorerSite, setSelectedExplorerSite] = useState("ALL");
  const [allMisEntries, setAllMisEntries] = useState([]);
  const [isExplorerLoading, setIsExplorerLoading] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState(null);

  // UI Control
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --------------------------------------------
  // Site-Wise MIS Entries Fetch & Grouping
  // --------------------------------------------
  const fetchAllMisEntries = useCallback(async () => {
    setIsExplorerLoading(true);
    try {
      const { data, error } = await supabase
        .from("mis_entries")
        .select(`*, vehicles(*), machines(*)`)
        .order("date", { ascending: false });
      if (error) throw error;
      setAllMisEntries(data || []);
    } catch (err) {
      console.error("Error fetching site-wise MIS entries:", err);
      showToast("Failed to load site-wise MIS records", "error");
    } finally {
      setIsExplorerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "site_wise") {
      fetchAllMisEntries();
    }
  }, [activeTab, fetchAllMisEntries]);

  const siteGroupedData = useMemo(() => {
    let filtered = allMisEntries;
    
    // Filter by search string
    if (explorerSearch.trim()) {
      const q = explorerSearch.toLowerCase();
      filtered = filtered.filter(e => 
        (e.site && e.site.toLowerCase().includes(q)) ||
        (e.date && e.date.includes(q)) ||
        (e.vehicles && e.vehicles.some(v => v.name && v.name.toLowerCase().includes(q))) ||
        (e.machines && e.machines.some(m => m.name && m.name.toLowerCase().includes(q)))
      );
    }

    if (selectedExplorerSite !== "ALL") {
      filtered = filtered.filter(e => e.site === selectedExplorerSite);
    }

    // Group by site name
    const map = {};
    
    // Pre-initialize for allowed sites so even empty sites show up in summary cards
    allowedSites.forEach(s => {
      map[s.name] = {
        siteName: s.name,
        manager: s.manager || "N/A",
        status: s.status || "Active",
        entries: [],
        totalDisposal: 0,
        totalProduction: 0,
        totalDiesel: 0
      };
    });

    filtered.forEach(entry => {
      const siteName = entry.site || "Unassigned Site";
      if (!map[siteName]) {
        const siteMeta = allowedSites.find(s => s.name === siteName);
        map[siteName] = {
          siteName,
          manager: siteMeta?.manager || "N/A",
          status: siteMeta?.status || "Active",
          entries: [],
          totalDisposal: 0,
          totalProduction: 0,
          totalDiesel: 0
        };
      }
      map[siteName].entries.push(entry);
      map[siteName].totalDisposal += Number(entry.total_disposal) || 0;
      map[siteName].totalProduction += Number(entry.total_production) || 0;
      map[siteName].totalDiesel += Number(entry.total_diesel) || 0;
    });

    return map;
  }, [allMisEntries, explorerSearch, selectedExplorerSite, allowedSites]);

  const handleExportSiteEntries = (siteName, entries) => {
    if (!entries || entries.length === 0) {
      showToast("No MIS records to export for this selection", "error");
      return;
    }
    const rows = entries.map(e => ({
      "Date": e.date,
      "Site Name": e.site,
      "Disposal Yield (Tons)": e.total_disposal || 0,
      "Production Yield (Tons)": e.total_production || 0,
      "Claimed Diesel (L)": e.total_diesel || 0,
      "Fuel Opening (L)": e.fuel_opening || 0,
      "Calculated Fuel (L)": e.calculated_diesel || 0,
      "Vehicles Count": e.vehicles?.length || 0,
      "Machines Count": e.machines?.length || 0,
      "Recorded At": new Date(e.created_at).toLocaleString()
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, siteName ? siteName.substring(0, 30) : "MIS_Entries");
    XLSX.writeFile(book, `BioMine_${siteName || 'All_Sites'}_MIS_Report.xlsx`);
    showToast(`Exported MIS records for ${siteName || 'All Sites'}`);
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

  // --------------------------------------------
  // Handlers
  // --------------------------------------------
  const addVehicle = useCallback(() => setVehicles(prev => [...prev, { id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]), []);
  const updateVehicle = useCallback((idx, f, v) => setVehicles(prev => { const u = [...prev]; u[idx] = {...u[idx], [f]: v}; return u; }), []);
  const removeVehicle = useCallback((id) => setVehicles(prev => prev.filter(v => v.id !== id)), []);

  const addMachine = useCallback(() => setMachines(prev => [...prev, { id: crypto.randomUUID(), name: "", production: "", diesel: "" }]), []);
  const updateMachine = useCallback((idx, f, v) => setMachines(prev => { const u = [...prev]; u[idx] = {...u[idx], [f]: v}; return u; }), []);
  const removeMachine = useCallback((id) => setMachines(prev => prev.filter(m => m.id !== id)), []);

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
               {activeTab === "controller" ? "Input Matrix Controller" : "Site-Wise MIS Entries Matrix"}
               {isShiftClosedToday && activeTab === "controller" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-black uppercase gap-1.5"><Lock size={12} /> Locked</Badge>}
               {isReadOnly && <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-black uppercase gap-1.5"><Lock size={12} /> Read Only</Badge>}
            </h1>
         </div>

         {!isReadOnly && activeTab === "controller" && (
            <div className="flex gap-3">
               <Button onClick={handleSaveEntry} disabled={isSubmitting || isShiftClosedToday} variant="primary" className="font-black gap-2 uppercase text-xs shadow-lg shadow-primary/20">
                  {isSubmitting ? <span className="animate-spin">...</span> : <Save size={14} />} Sync Data
               </Button>
            </div>
         )}
      </div>

      {/* MODULE TAB SWITCHER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/40 p-2 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("controller")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "controller"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ClipboardList size={16} /> Daily Input Controller
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("site_wise")}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "site_wise"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Building2 size={16} /> Site-Wise MIS Entries Matrix
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono ml-1">
              {allMisEntries.length}
            </span>
          </button>
        </div>

        {activeTab === "site_wise" && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllMisEntries}
              className="p-2.5 rounded-xl bg-slate-900/60 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-900 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw size={14} className={isExplorerLoading ? "animate-spin" : ""} />
            </button>
            <Button 
              onClick={() => handleExportSiteEntries(selectedExplorerSite === "ALL" ? "" : selectedExplorerSite, selectedExplorerSite === "ALL" ? allMisEntries : allMisEntries.filter(e => e.site === selectedExplorerSite))}
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet size={14} /> Export Site Report
            </Button>
          </div>
        )}
      </div>

      {/* TAB 1: DAILY INPUT CONTROLLER */}
      {activeTab === "controller" && (
        <>
          {/* MASTER CONFIG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="p-5">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Context Scope</h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Log Window</label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/10" />
                   </div>
                   <div>
                      <div className="flex justify-between items-center mb-1.5">
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Operational Zone</label>
                         {isSuperAdmin && !isReadOnly && (
                            <button 
                               type="button"
                               onClick={() => setIsSiteModalOpen(true)}
                               className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-primary/20 hover:border-primary/40 hover:text-white transition-all shadow-sm"
                            >
                               <Plus size={10} /> Add Site
                            </button>
                         )}
                      </div>
                      <select value={site} onChange={e => setSite(e.target.value)} disabled={isShiftClosedToday || allowedSites.length <= 1 || isReadOnly} className="w-full h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-white text-sm font-bold focus:border-primary outline-none transition-all cursor-pointer">
                         {allowedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Total Disposal (Tons)</label>
                      <Input type="number" value={disposal} onChange={e => setDisposal(e.target.value)} placeholder="0.00" disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/10 text-lg font-mono" />
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
                      <Input type="number" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/10" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Claimed Consumed (L)</label>
                      <Input type="number" value={claimedDiesel} onChange={e => setClaimedDiesel(e.target.value)} disabled={isShiftClosedToday || isReadOnly} className="bg-slate-950 border-white/10" />
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
                {!isReadOnly && (
                   <Button variant="outline" size="sm" onClick={addVehicle} disabled={isShiftClosedToday} className="text-[10px] font-bold border-white/10 hover:bg-white/5 uppercase tracking-wider"><Plus size={12} className="mr-1" /> Append Asset</Button>
                )}
             </div>
             <div className="space-y-3">
                {vehicles.map((v, i) => (
                   <VehicleRow 
                      key={v.id} 
                      v={v} 
                      i={i} 
                      isShiftClosedToday={isShiftClosedToday} 
                      isReadOnly={isReadOnly} 
                      updateVehicle={updateVehicle} 
                      removeVehicle={removeVehicle} 
                   />
                ))}
             </div>
          </Card>

          {/* MACHINES ENTRY */}
          <Card className="p-5">
             <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                   <Activity size={16} className="text-emerald-500" /> Fixed Plant & Machinery
                </h3>
                {!isReadOnly && (
                   <Button variant="outline" size="sm" onClick={addMachine} disabled={isShiftClosedToday} className="text-[10px] font-bold border-white/10 hover:bg-white/5 uppercase tracking-wider"><Plus size={12} className="mr-1" /> Append Plant</Button>
                )}
             </div>
             <div className="space-y-3">
                {machines.map((m, i) => (
                   <MachineRow 
                      key={m.id} 
                      m={m} 
                      i={i} 
                      isShiftClosedToday={isShiftClosedToday} 
                      isReadOnly={isReadOnly} 
                      updateMachine={updateMachine} 
                      removeMachine={removeMachine} 
                   />
                ))}
             </div>
          </Card>

          {/* ENTERPRISE FEATURE: SHIFT CLOSURE CONSOLE */}
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
                {!isShiftClosedToday && isReadOnly && <div className="bg-amber-500/20 px-3 py-1 rounded font-black text-amber-400 text-[10px] uppercase flex items-center gap-1"><Lock size={10} /> Read Only State</div>}
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
                         disabled={isReadOnly}
                         placeholder={isReadOnly ? "Read-only: Incidents and summaries briefing locked." : "Provide official hand-over briefing, incidents, and structural summaries..."}
                         className="w-full h-32 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-primary outline-none transition-all resize-none placeholder:text-gray-600 disabled:opacity-60"
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
                      {!isReadOnly && (
                         <Button 
                            onClick={handleCloseShift}
                            disabled={isClosureLoading || !disposal}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs gap-2 h-11 shadow-lg shadow-red-900/20 mt-4"
                         >
                            {isClosureLoading ? "Sealing Record..." : <><Lock size={14} /> Execute Shift Closure</>}
                         </Button>
                      )}
                      <p className="text-[9px] text-gray-600 text-center mt-2">WARNING: Irreversible structural action.</p>
                   </div>
                </div>
             )}
          </Card>
        </>
      )}

      {/* TAB 2: SITE-WISE MIS ENTRIES MATRIX */}
      {activeTab === "site_wise" && (
        <div className="space-y-6">
          {/* SEARCH & FILTER CONTROLS */}
          <Card className="p-4 bg-slate-950/40">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text"
                  placeholder="Search by Site, Asset, Date..."
                  value={explorerSearch}
                  onChange={(e) => setExplorerSearch(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* SITE FILTER PILLS */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                <button
                  onClick={() => setSelectedExplorerSite("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedExplorerSite === "ALL"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                      : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  All Sites ({allMisEntries.length})
                </button>
                {allowedSites.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedExplorerSite(s.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      selectedExplorerSite === s.name
                        ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                        : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* SITE SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(siteGroupedData).map(([sName, group]) => (
              <Card 
                key={sName} 
                className={`p-4 transition-all cursor-pointer border ${
                  selectedExplorerSite === sName ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-white/5 hover:border-white/20'
                }`}
                onClick={() => setSelectedExplorerSite(selectedExplorerSite === sName ? "ALL" : sName)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building2 size={16} className="text-emerald-400" />
                      {sName}
                    </h4>
                    <span className="text-[11px] text-slate-400">Incharge: {group.manager}</span>
                  </div>
                  <Badge className={
                    group.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]'
                  }>
                    {group.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                  <div className="bg-slate-950/40 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Entries</span>
                    <span className="text-xs font-black text-white font-mono">{group.entries.length}</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Disposal</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{group.totalDisposal.toLocaleString()} T</span>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Diesel</span>
                    <span className="text-xs font-black text-cyan-400 font-mono">{group.totalDiesel.toLocaleString()} L</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* SITE-WISE DETAILED ENTRIES TABLES */}
          {isExplorerLoading ? (
            <Card className="p-12 text-center">
              <RefreshCw className="animate-spin mx-auto text-emerald-500 mb-3" size={28} />
              <p className="text-sm text-slate-400 font-medium">Fetching site-wise MIS records from database...</p>
            </Card>
          ) : Object.keys(siteGroupedData).length === 0 ? (
            <Card className="p-12 text-center">
              <ClipboardList className="mx-auto text-slate-600 mb-3" size={32} />
              <h4 className="text-lg font-bold text-white">No MIS Entries Found</h4>
              <p className="text-xs text-slate-400 mt-1">No operational logs match your active filter directives.</p>
            </Card>
          ) : (
            Object.entries(siteGroupedData).map(([sName, group]) => (
              <Card key={sName} className="p-0 overflow-hidden border border-white/10">
                {/* Site Accordion Header */}
                <div className="p-4 bg-slate-900/60 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{sName}</h3>
                      <span className="text-xs text-slate-400 font-mono">
                        Site Incharge: {group.manager} • {group.entries.length} Logs Recorded
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-mono text-emerald-400 font-bold block">{group.totalDisposal.toLocaleString()} Tons Disposal</span>
                      <span className="text-[10px] text-slate-400 font-mono">{group.totalDiesel.toLocaleString()} L Total Fuel</span>
                    </div>
                    <button
                      onClick={() => handleExportSiteEntries(sName, group.entries)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Export this Site's MIS Entries"
                    >
                      <Download size={12} /> Excel
                    </button>
                  </div>
                </div>

                {/* Table of Entries for this Site */}
                {group.entries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No MIS entries recorded for {sName} under active filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="text-[10px] tracking-wider text-slate-400 uppercase bg-slate-950/40 border-b border-white/5">
                          <th className="px-5 py-3 font-bold">Log Date</th>
                          <th className="px-5 py-3 font-bold">Disposal Yield</th>
                          <th className="px-5 py-3 font-bold">Production Yield</th>
                          <th className="px-5 py-3 font-bold">Claimed Diesel</th>
                          <th className="px-5 py-3 font-bold">Fuel Opening</th>
                          <th className="px-5 py-3 font-bold">Calc Fuel</th>
                          <th className="px-5 py-3 font-bold">Variance</th>
                          <th className="px-5 py-3 font-bold">Assets Tracked</th>
                          <th className="px-5 py-3 font-bold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {group.entries.map((entry) => {
                          const isExpanded = expandedEntryId === entry.id;
                          const diff = (Number(entry.total_diesel) || 0) - (Number(entry.calculated_diesel) || 0);
                          const hasAssets = (entry.vehicles?.length > 0) || (entry.machines?.length > 0);

                          return (
                            <React.Fragment key={entry.id}>
                              <tr className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-3.5 text-xs font-mono font-bold text-white flex items-center gap-2">
                                  <Calendar size={13} className="text-emerald-400" />
                                  {entry.date}
                                </td>
                                <td className="px-5 py-3.5 text-xs font-mono text-emerald-400 font-bold">
                                  {entry.total_disposal || 0} T
                                </td>
                                <td className="px-5 py-3.5 text-xs font-mono text-white">
                                  {entry.total_production || 0} T
                                </td>
                                <td className="px-5 py-3.5 text-xs font-mono text-cyan-300">
                                  {entry.total_diesel || 0} L
                                </td>
                                <td className="px-5 py-3.5 text-xs font-mono text-slate-400">
                                  {entry.fuel_opening || 0} L
                                </td>
                                <td className="px-5 py-3.5 text-xs font-mono text-slate-300">
                                  {entry.calculated_diesel || 0} L
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    Math.abs(diff) <= 5 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                                  }`}>
                                    {diff > 0 ? `+${diff}` : diff} L
                                  </span>
                                </td>
                                <td className="px-5 py-3.5">
                                  <span className="text-xs text-slate-300 font-mono">
                                    {(entry.vehicles?.length || 0)} Vehicles • {(entry.machines?.length || 0)} Plants
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                                    disabled={!hasAssets}
                                    className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ml-auto ${
                                      !hasAssets
                                        ? 'opacity-30 cursor-not-allowed border-white/5 text-slate-500'
                                        : isExpanded
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                                    }`}
                                  >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    <span>{isExpanded ? "Hide" : "Inspect"}</span>
                                  </button>
                                </td>
                              </tr>

                              {/* EXPANDABLE TELEMETRY BREAKDOWN DRAWER */}
                              {isExpanded && hasAssets && (
                                <tr className="bg-slate-950/80 border-b border-emerald-500/20">
                                  <td colSpan="9" className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Vehicles Breakdown */}
                                      {entry.vehicles?.length > 0 && (
                                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                                          <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Truck size={14} /> Vehicles & Excavators Telemetry
                                          </h5>
                                          <div className="space-y-1.5">
                                            {entry.vehicles.map((v) => (
                                              <div key={v.id} className="flex justify-between items-center text-xs bg-slate-950/40 p-2 rounded-lg border border-white/5">
                                                <span className="font-bold text-white">{v.name}</span>
                                                <span className="font-mono text-slate-300">
                                                  {v.hours} Hrs • {v.diesel} L Diesel
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Machines Breakdown */}
                                      {entry.machines?.length > 0 && (
                                        <div className="bg-slate-900/60 border border-white/5 rounded-xl p-3">
                                          <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Activity size={14} /> Fixed Plant & Machinery
                                          </h5>
                                          <div className="space-y-1.5">
                                            {entry.machines.map((m) => (
                                              <div key={m.id} className="flex justify-between items-center text-xs bg-slate-950/40 p-2 rounded-lg border border-white/5">
                                                <span className="font-bold text-white">{m.name}</span>
                                                <span className="font-mono text-emerald-400 font-bold">
                                                  {m.production} Tons Yield
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

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
                  
                  <form onSubmit={handleCreateSite} className="p-6 space-y-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                           <Building2 size={12} className="text-primary" /> Site Name
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

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                           <Check size={12} className="text-emerald-400" /> Status
                        </label>
                        <select 
                           value={newSiteForm.status || 'Active'} 
                           onChange={(e) => setNewSiteForm({...newSiteForm, status: e.target.value})}
                           className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none cursor-pointer"
                        >
                           {["Active", "Maintenance", "Inactive"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                        </select>
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                           <UserCheck size={12} className="text-violet-400" /> Site Incharge Name
                        </label>
                        <input 
                           required 
                           type="text" 
                           value={newSiteForm.manager} 
                           onChange={(e) => setNewSiteForm({...newSiteForm, manager: e.target.value})}
                           className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none"
                           placeholder="Enter site incharge name..."
                        />
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