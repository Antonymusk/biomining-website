import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Truck, Plus, X, Loader2, Navigation, Activity, ShieldCheck, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../ui/DataTable";
import { fleetService } from "../services/fleetService";
import { inventoryService } from "../services/inventoryService";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { AdminActionMenu } from "../components/ui/AdminActionMenu";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useDebounce } from "../hooks/useDebounce";
import { useSites } from "../hooks/useSites";
import { useAuth } from "../lib/AuthContext";

export default function FleetControl() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const { sites: dbSites, loading: isSitesLoading } = useSites();
  const [loading, setLoading] = useState(true);
  
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Operations Auditor';

  const allowedSites = useMemo(() => {
     if (isSuperAdmin || isAuditor) return dbSites;
     return user?.assigned_sites || [];
  }, [dbSites, user, isSuperAdmin, isAuditor]);
  
  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedSite, setSelectedSite] = useState("");
  const [viewMode, setViewMode] = useState("fleet"); // fleet, trips

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    site_id: "",
    vehicle_name: "",
    vehicle_number: "",
    vehicle_type: "Excavator",
    status: "Active",
    running_hours: 0,
    fuel_level: 100,
    efficiency: 100
  });

  useEffect(() => {
    fetchData();
  }, [selectedSite]);

  useRealtimeSubscription('fleet_vehicles', fetchData);
  useRealtimeSubscription('fleet_trips', fetchData);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch vehicles
      let vQuery = supabase.from('fleet_vehicles').select('*').neq('is_deleted', true);
      if (selectedSite) vQuery = vQuery.eq('site', selectedSite);
      
      const [vRes, tRes] = await Promise.all([
        vQuery.order('created_at', { ascending: false }),
        supabase.from('fleet_trips').select('*, fleet_vehicles(vehicle_name, vehicle_number), drivers(full_name)').order('start_time', { ascending: false }).limit(50)
      ]);

      if (vRes.error) throw vRes.error;
      setVehicles(vRes.data || []);
      
      if (!tRes.error) setTrips(tRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  }

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    try {
      if (!newVehicle.site_id) return toast.error("Please select a site");
      
      // Direct supabase insert
      const { error } = await supabase.from('fleet_vehicles').insert([
        { 
          vehicle_name: newVehicle.vehicle_name,
          vehicle_number: newVehicle.vehicle_number,
          vehicle_type: newVehicle.vehicle_type,
          status: newVehicle.status,
          site: newVehicle.site_id, // store site name directly for reliability across components
          running_hours: Number(newVehicle.running_hours) || 0,
          fuel_level: Number(newVehicle.fuel_level) || 0,
          efficiency: Number(newVehicle.efficiency) || 0
        }
      ]);
      
      if (error) throw error;

      toast.success("Vehicle added successfully");
      setIsAddVehicleOpen(false);
      setNewVehicle({ site_id: "", vehicle_name: "", vehicle_number: "", vehicle_type: "Excavator", status: "Active", running_hours: 0, fuel_level: 100, efficiency: 100 });
      fetchData();
    } catch (error) {
      toast.error("Failed to add vehicle");
    }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => 
      (v.vehicle_name || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (v.vehicle_number || "").toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [vehicles, debouncedSearch]);

  const totalFleet = vehicles.length;
  const activeUnits = vehicles.filter(v => v.status === 'Active').length;
  const avgEfficiency = vehicles.length > 0 ? Math.round(vehicles.reduce((a, b) => a + (b.efficiency || 0), 0) / vehicles.length) : 0;
  const activeTrips = trips.filter(t => t.trip_status === 'in-progress').length;

  const fleetColumns = useMemo(() => [
    { 
      title: 'Vehicle / ID', 
      width: '20%', 
      render: (v) => (
        <div>
          <div className="font-semibold text-white text-sm">{v.vehicle_name}</div>
          <div className="text-[10px] text-gray-400 font-mono">{v.vehicle_number || "NO-ID"} • {v.vehicle_type}</div>
        </div>
      ) 
    },
    { title: 'Assigned Site', width: '15%', render: (v) => <span className="text-xs text-gray-300">{v.site || 'Unknown'}</span> },
    { title: 'Status', width: '10%', render: (v) => <Badge variant={v.status === "Active" ? "success" : v.status === "Idle" ? "warning" : "danger"} className="text-[10px]">{v.status}</Badge> },
    { title: 'Running Hours', width: '15%', render: (v) => <span className="text-sm font-medium text-gray-300">{v.running_hours} <span className="text-[10px] text-gray-500 font-normal">hrs</span></span> },
    { title: 'Fuel Level', width: '20%', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full bg-dark-bg overflow-hidden">
          <div className={`h-full rounded-full ${v.fuel_level > 50 ? 'bg-success' : v.fuel_level > 20 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(100, Math.max(0, v.fuel_level))}%` }} />
        </div>
        <span className="text-[10px] text-gray-400">{v.fuel_level}%</span>
      </div>
    )},
    { title: 'Health Score', width: '10%', render: (v) => <div className="text-right w-full"><span className={`font-bold text-sm ${v.efficiency > 80 ? 'text-success' : v.efficiency > 50 ? 'text-warning' : 'text-danger'}`}>{v.efficiency}%</span></div> },
    { title: 'Actions', width: '10%', render: (v) => <div className="flex justify-end w-full" onClick={e => e.stopPropagation()}><AdminActionMenu module="Fleet" recordId={v.id} record={v} onComplete={fetchData} /></div> }
  ], [fetchData]);

  const tripColumns = useMemo(() => [
    { title: 'Vehicle / Driver', width: '25%', render: (t) => (
      <div>
        <div className="font-semibold text-white text-xs">{t.fleet_vehicles?.vehicle_name || 'Unknown Vehicle'}</div>
        <div className="text-[10px] text-gray-400">{t.drivers?.full_name || 'No Driver'}</div>
      </div>
    )},
    { title: 'Route', width: '30%', render: (t) => (
      <div className="flex items-center gap-2 text-xs text-gray-300">
        <span className="truncate max-w-[100px]" title={t.origin_site}>{t.origin_site || 'Origin'}</span>
        <ArrowRight size={10} className="text-gray-500 shrink-0" />
        <span className="truncate max-w-[100px]" title={t.destination_site}>{t.destination_site || 'Destination'}</span>
      </div>
    )},
    { title: 'Start Time', width: '20%', render: (t) => <span className="text-[11px] text-gray-400 font-mono">{new Date(t.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span> },
    { title: 'Status', width: '15%', render: (t) => <Badge variant={t.trip_status === 'in-progress' ? 'warning' : t.trip_status === 'completed' ? 'success' : 'default'} className="text-[9px] capitalize">{t.trip_status}</Badge> },
    { title: 'Fuel Used', width: '10%', render: (t) => <div className="text-right text-xs text-gray-300 font-medium w-full">{t.fuel_used} L</div> }
  ], []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Navigation className="text-primary" /> Logistics & Fleet Intelligence
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage vehicles, track trips, and monitor fleet health</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <Input 
              id="fleet_search"
              name="search"
              autoComplete="off"
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vehicles or IDs..." className="pl-8 bg-dark-bg/60 border-dark-border" 
            />
          </div>
          <button onClick={() => setIsAddVehicleOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-sm font-medium">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary relative overflow-hidden group">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Fleet</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{totalFleet}</h3>
          <Truck className="absolute right-4 top-4 text-primary/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-success relative overflow-hidden group">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Units</p>
          <h3 className="mt-1 text-2xl font-bold text-success">{activeUnits}</h3>
          <Activity className="absolute right-4 top-4 text-success/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-info relative overflow-hidden group">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fleet Efficiency</p>
          <h3 className="mt-1 text-2xl font-bold text-white">{avgEfficiency}%</h3>
          <ShieldCheck className="absolute right-4 top-4 text-info/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-warning relative overflow-hidden group">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Trips</p>
          <h3 className="mt-1 text-2xl font-bold text-warning">{activeTrips}</h3>
          <Navigation className="absolute right-4 top-4 text-warning/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
      </div>

      <Card className="p-0 border-dark-border/60 overflow-hidden">
        <div className="flex items-center gap-4 p-4 border-b border-dark-border/50 bg-dark-bg/20">
          <div className="flex bg-dark-bg rounded-lg border border-dark-border p-1">
            <button onClick={() => setViewMode('fleet')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'fleet' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Fleet Inventory</button>
            <button onClick={() => setViewMode('trips')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'trips' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Trip History</button>
          </div>
          {viewMode === 'fleet' && (
            <select 
              id="fleet_site_filter"
              name="site_filter"
              autoComplete="off"
              value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none"
            >
              <option value="">{allowedSites.length > 1 ? "All Assigned Sites" : "All Sites"}</option>
              {allowedSites.map(site => <option key={site.id} value={site.name}>{site.name}</option>)}
            </select>
          )}
        </div>

        {viewMode === 'fleet' ? (
          <DataTable 
            data={filteredVehicles} 
            columns={fleetColumns} 
            isLoading={loading} 
            emptyTitle="No Vehicles Found" 
            height={500} 
          />
        ) : (
          <DataTable 
            data={trips} 
            columns={tripColumns} 
            isLoading={loading} 
            emptyTitle="No Trips Found" 
            height={500} 
          />
        )}
      </Card>

      <AnimatePresence>
        {isAddVehicleOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddVehicleOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <button onClick={() => setIsAddVehicleOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              <h3 className="text-lg font-bold text-white mb-4">Add Logistics Vehicle</h3>
              <form onSubmit={handleAddVehicle} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Assigned Site *</label>
                    <select id="fleet_add_site" name="site_id" autoComplete="off" required value={newVehicle.site_id} onChange={(e) => setNewVehicle({...newVehicle, site_id: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option value="">Select a site...</option>
                      {allowedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Vehicle Name *</label>
                    <input id="fleet_add_name" name="vehicle_name" autoComplete="off" required type="text" value={newVehicle.vehicle_name} onChange={(e) => setNewVehicle({...newVehicle, vehicle_name: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" placeholder="e.g. EX-01" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Registration Number</label>
                    <input id="fleet_add_number" name="vehicle_number" autoComplete="off" type="text" value={newVehicle.vehicle_number} onChange={(e) => setNewVehicle({...newVehicle, vehicle_number: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none font-mono" placeholder="DL-01-XXXX" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Vehicle Type</label>
                    <select id="fleet_add_type" name="vehicle_type" autoComplete="off" value={newVehicle.vehicle_type} onChange={(e) => setNewVehicle({...newVehicle, vehicle_type: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option>Excavator</option><option>Dumper</option><option>Loader</option><option>Heavy Truck</option><option>Machine</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Initial Status</label>
                    <select id="fleet_add_status" name="status" autoComplete="off" value={newVehicle.status} onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option>Active</option><option>Idle</option><option>Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">Add Vehicle</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
