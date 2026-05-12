import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Plus, Search, Filter, AlertTriangle, Clock,
  Settings, Activity, ActivitySquare, AlertCircle, Calendar, FileText, ChevronRight, PenTool, X, WrenchIcon
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { maintenanceService } from "../services/maintenanceService";
import { inventoryService } from "../services/inventoryService";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { AdminActionMenu } from "../components/ui/AdminActionMenu";
import { DataTable } from "../ui/DataTable";
import { useDebounce } from "../hooks/useDebounce";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useAuth } from "../lib/AuthContext";
import { DocumentManager } from "../components/ui/DocumentManager";

export default function MaintenanceCenter() {
  const [machines, setMachines] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isActionAllowed } = useAuth();
  const canControl = isActionAllowed('MAINTENANCE_CONTROL');

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals
  const [isAddMachineOpen, setIsAddMachineOpen] = useState(false);
  const [machineData, setMachineData] = useState({ site_id: "", machine_name: "", machine_type: "Excavator", machine_id: "", manufacturer: "" });

  const [isLogServiceOpen, setIsLogServiceOpen] = useState(false);
  const [serviceData, setServiceData] = useState({ machine_id: "", service_type: "Preventative", service_notes: "", technician_name: "", downtime_hours: 0, service_cost: 0, next_service_date: "", service_date: new Date().toISOString().split('T')[0] });

  const [isAddWOOpen, setIsAddWOOpen] = useState(false);
  const [woData, setWoData] = useState({ machine_id: "", title: "", description: "", priority: "Medium", assigned_technician: "", due_date: "" });

  // Drawer
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineHistory, setMachineHistory] = useState({ logs: [], workOrders: [] });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchMachines();
  }, [filterStatus]);

  useRealtimeSubscription('maintenance_machines', fetchMachines);

  async function fetchSites() {
    try {
      const data = await inventoryService.getSites();
      setSites(data);
    } catch (err) { console.error(err); }
  }

  async function fetchMachines() {
    setLoading(true);
    try {
      // In a real app, we'd also pull the latest log for next_service_date.
      // For this demo, we'll do a basic fetch.
      const data = await maintenanceService.getMachines({ status: filterStatus });
      setMachines(data);
    } catch (err) {
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  }

  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.createMachine(machineData);
      toast.success("Machine Registered");
      setIsAddMachineOpen(false);
      setMachineData({ site_id: "", machine_name: "", machine_type: "Excavator", machine_id: "", manufacturer: "" });
      fetchMachines();
    } catch (err) { toast.error("Failed to register machine"); }
  };

  const handleLogService = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.logService(serviceData);
      toast.success("Service Logged Successfully");
      setIsLogServiceOpen(false);
      setServiceData({ machine_id: "", service_type: "Preventative", service_notes: "", technician_name: "", downtime_hours: 0, service_cost: 0, next_service_date: "", service_date: new Date().toISOString().split('T')[0] });
      fetchMachines();
      if (selectedMachine && selectedMachine.id === serviceData.machine_id) {
        openDrawer(selectedMachine);
      }
    } catch (err) { toast.error("Failed to log service"); }
  };

  const handleAddWO = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.createWorkOrder(woData);
      toast.success("Work Order Created");
      setIsAddWOOpen(false);
      setWoData({ machine_id: "", title: "", description: "", priority: "Medium", assigned_technician: "", due_date: "" });
      if (selectedMachine && selectedMachine.id === woData.machine_id) {
        openDrawer(selectedMachine);
      }
    } catch (err) { toast.error("Failed to create WO"); }
  };

  const openDrawer = async (machine) => {
    setSelectedMachine(machine);
    setIsDrawerOpen(true);
    try {
      const history = await maintenanceService.getMachineHistory(machine.id);
      setMachineHistory(history);
    } catch (err) {
      toast.error("Failed to load machine history");
    }
  };

  const filteredData = useMemo(() => {
    return machines.filter(m =>
      (m.machine_name || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (m.machine_id || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [machines, debouncedSearchQuery]);

  const machineColumns = useMemo(() => [
    {
      title: 'Asset Info',
      width: '25%',
      render: (m) => (
        <div onClick={() => openDrawer(m)} className="cursor-pointer">
          <div className="font-semibold text-gray-200 text-sm flex items-center gap-2">
            {m.machine_name}
          </div>
          <div className="text-[10px] text-primary font-mono mt-0.5 font-semibold">{m.machine_id} • {m.machine_type}</div>
        </div>
      )
    },
    {
      title: 'Assigned Site',
      width: '20%',
      render: (m) => <span onClick={() => openDrawer(m)} className="text-xs text-gray-300 cursor-pointer">{m.inventory_sites?.name || "Unknown"}</span>
    },
    {
      title: 'Health Score',
      width: '25%',
      render: (m) => (
        <div onClick={() => openDrawer(m)} className="flex items-center gap-2 cursor-pointer">
          <div className="w-16 h-1.5 bg-dark-bg rounded-full overflow-hidden">
            <div className={`h-full ${m.health_score > 70 ? 'bg-success' : m.health_score > 40 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${m.health_score}%` }}></div>
          </div>
          <span className={`text-xs font-bold ${m.health_score > 70 ? 'text-success' : m.health_score > 40 ? 'text-warning' : 'text-danger'}`}>{m.health_score}%</span>
        </div>
      )
    },
    {
      title: 'Status',
      width: '15%',
      render: (m) => (
        <Badge onClick={() => openDrawer(m)} variant={
          m.status === 'Operational' ? 'success' :
            m.status === 'Warning' ? 'warning' : 'danger'
        } className={`text-[9px] uppercase cursor-pointer ${m.status !== 'Operational' ? 'animate-pulse' : ''}`}>
          {m.status}
        </Badge>
      )
    },
    {
      title: 'Actions',
      width: '15%',
      render: (m) => (
        <div className="flex justify-end gap-1.5 items-center" onClick={(e) => e.stopPropagation()}>
          <Button onClick={() => { setServiceData({ ...serviceData, machine_id: m.id }); setIsLogServiceOpen(true); }} variant="outline" className="h-7 text-[10px] px-2 py-0 border-info text-info hover:bg-info hover:text-white">Quick Log</Button>
          <Button onClick={() => { setWoData({ ...woData, machine_id: m.id }); setIsAddWOOpen(true); }} variant="outline" className="h-7 text-[10px] px-2 py-0 border-primary text-primary hover:bg-primary hover:text-white">+ WO</Button>
          <AdminActionMenu module="Maintenance" recordId={m.id} record={m} onComplete={fetchMachines} />
        </div>
      )
    }
  ], [serviceData, woData, fetchMachines, openDrawer]);

  const avgHealth = machines.length > 0 ? Math.round(machines.reduce((acc, m) => acc + (m.health_score || 0), 0) / machines.length) : 0;
  const warnings = machines.filter(m => m.health_score < 60 || m.status === 'Warning' || m.status === 'Maintenance').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-primary" /> Maintenance OS
          </h2>
          <p className="text-gray-400 text-sm mt-1">Enterprise Machine Lifecycle & Servicing Intelligence</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              id="maint_search"
              name="search"
              autoComplete="off"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
          {canControl && (
            <>
              <Button onClick={() => setIsLogServiceOpen(true)} variant="outline" className="whitespace-nowrap h-9 border-primary text-primary hover:bg-primary hover:text-white">
                <PenTool size={16} className="mr-2" /> Log Service
              </Button>
              <Button onClick={() => setIsAddMachineOpen(true)} variant="primary" className="whitespace-nowrap h-9">
                <Plus size={16} className="mr-2" /> Register Asset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary group bg-gradient-to-br from-dark-card to-dark-bg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Assets</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-white">{machines.length}</h3>
            <Settings className="text-primary/30 group-hover:scale-110 transition-transform" />
          </div>
        </Card>
        <Card className={`p-4 border-l-4 ${warnings > 0 ? 'border-l-danger bg-danger/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-l-gray-600'} group`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Critical / Maintenance</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className={`text-2xl font-bold ${warnings > 0 ? 'text-danger animate-pulse' : 'text-gray-500'}`}>{warnings}</h3>
            <AlertTriangle className={`${warnings > 0 ? 'text-danger/50' : 'text-gray-600'}`} />
          </div>
        </Card>
        <Card className={`p-4 border-l-4 ${avgHealth < 70 ? 'border-l-warning' : 'border-l-success'} group bg-gradient-to-br from-dark-card to-dark-bg`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Fleet Health</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className={`text-2xl font-bold ${avgHealth < 70 ? 'text-warning' : 'text-success'}`}>{avgHealth}%</h3>
            <Activity className={`${avgHealth < 70 ? 'text-warning/30' : 'text-success/30'} group-hover:scale-110 transition-transform`} />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-info group bg-gradient-to-br from-dark-card to-dark-bg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Work Orders</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-info">12</h3> {/* Mocked KPI */}
            <FileText className="text-info/30 group-hover:scale-110 transition-transform" />
          </div>
        </Card>
      </div>

      {/* MACHINE REGISTRY TABLE */}
      <Card className="p-0 border-dark-border/60 overflow-hidden min-h-[400px]">
        <div className="flex items-center gap-4 p-3 border-b border-dark-border/50 bg-dark-bg/20">
          <Filter size={14} className="text-gray-500 ml-2" />
          <div className="flex gap-2">
            {['All', 'Operational', 'Warning', 'Maintenance', 'Offline'].map(s => (
              <button
                key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${filterStatus === s ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <DataTable 
          data={filteredData} 
          columns={machineColumns} 
          isLoading={loading} 
          emptyTitle="No Assets Found" 
          emptyDescription="Adjust your filters or register a new asset." 
          height={500} 
        />
      </Card>


      {/* SIDE DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedMachine && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl h-full bg-dark-card border-l border-dark-border shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedMachine.machine_name} <Badge variant={selectedMachine.health_score > 70 ? 'success' : 'danger'} className="text-[10px]">{selectedMachine.health_score}% Health</Badge>
                  </h3>
                  <p className="text-xs font-mono text-primary mt-1">{selectedMachine.machine_id} • {selectedMachine.manufacturer}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-lg bg-dark-bg hover:bg-white/10 text-gray-400 transition-colors"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">

                {/* Timeline Visualizer */}
                {machineHistory.logs.length > 0 && (
                  <div className="bg-dark-bg/60 rounded-xl p-4 border border-dark-border/50">
                    <h4 className="text-[10px] text-gray-400 uppercase font-bold mb-3 flex items-center gap-2"><Calendar size={12} /> Service Window</h4>

                    <div className="relative h-2 bg-dark-border rounded-full flex items-center my-4">
                      <div className="absolute left-0 w-3 h-3 rounded-full bg-success ring-4 ring-[#0B1120] transform -translate-y-1/2 top-1/2"></div>
                      <div className="absolute right-0 w-3 h-3 rounded-full bg-warning ring-4 ring-[#0B1120] transform -translate-y-1/2 top-1/2"></div>
                      {/* Assuming current time is somewhere in between */}
                      <div className="absolute left-1/2 w-3 h-3 rounded-full bg-primary ring-4 ring-[#0B1120] animate-pulse transform -translate-x-1/2 -translate-y-1/2 top-1/2 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <div className="text-left">
                        <span className="block text-success font-bold uppercase">Last Service</span>
                        {new Date(machineHistory.logs[0].service_date).toLocaleDateString()}
                      </div>
                      <div className="text-center">
                        <span className="block text-primary font-bold uppercase">Today</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-warning font-bold uppercase">Next Due</span>
                        {machineHistory.logs[0].next_service_date ? new Date(machineHistory.logs[0].next_service_date).toLocaleDateString() : 'Unscheduled'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Work Orders */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border pb-2">
                    <FileText size={14} className="text-gray-400" /> Active Work Orders
                  </h4>
                  {machineHistory.workOrders.length > 0 ? (
                    <div className="space-y-3">
                      {machineHistory.workOrders.map((wo, idx) => (
                        <div key={idx} className="bg-dark-bg/40 border border-dark-border rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] font-mono text-primary">{wo.wo_number}</span>
                              <h5 className="text-sm font-semibold text-gray-200">{wo.title}</h5>
                            </div>
                            <Badge variant={wo.status === 'Open' ? 'warning' : 'success'} className="text-[9px]">{wo.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{wo.description}</p>
                          <div className="mt-3 flex justify-between text-[10px] text-gray-400">
                            <span>Assignee: {wo.assigned_technician || 'Unassigned'}</span>
                            <span>Due: {new Date(wo.due_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No work orders recorded.</p>
                  )}
                </div>

                {/* Service Logs */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border pb-2">
                    <Wrench size={14} className="text-gray-400" /> Service History
                  </h4>
                  {machineHistory.logs.length > 0 ? (
                    <div className="space-y-4 relative border-l border-dark-border/50 ml-2 pl-4 py-2">
                      {machineHistory.logs.map((log, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#0B1120] ${log.service_type === 'Breakdown' ? 'bg-danger' : 'bg-info'}`}></div>
                          <div className="bg-dark-bg/40 border border-dark-border/50 rounded-lg p-3">
                            <div className="flex justify-between mb-2">
                              <span className={`text-[10px] font-bold uppercase ${log.service_type === 'Breakdown' ? 'text-danger' : 'text-info'}`}>{log.service_type}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{new Date(log.service_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-gray-300">{log.service_notes}</p>
                            {log.parts_changed && (
                              <div className="mt-2 text-[10px]">
                                <span className="text-gray-500 uppercase font-bold">Parts Replaced:</span> <span className="text-gray-300">{log.parts_changed}</span>
                              </div>
                            )}
                            <div className="mt-2 flex gap-4 text-[10px] text-gray-500">
                              <span>Tech: {log.technician_name || 'Unknown'}</span>
                              <span>Downtime: <span className={log.downtime_hours > 0 ? 'text-warning font-bold' : ''}>{log.downtime_hours}h</span></span>
                              {log.service_cost > 0 && <span>Cost: ${log.service_cost}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No service logs available.</p>
                  )}
                </div>

                {/* Maintenance Document Attachment */}
                <div className="border-t border-dark-border/40 pt-4">
                  <DocumentManager title="Servicing Photos & Maintenance Reports" />
                </div>

              </div>
              <div className="p-4 border-t border-dark-border bg-dark-bg/80 backdrop-blur-md flex gap-3">
                <Button onClick={() => { setServiceData({ ...serviceData, machine_id: selectedMachine.id }); setIsLogServiceOpen(true); setIsDrawerOpen(false); }} variant="primary" className="flex-1">Log Service</Button>
                <Button onClick={() => setIsDrawerOpen(false)} variant="outline">Close Drawer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER MACHINE MODAL (Hidden logic for brevity) */}
      <AnimatePresence>
        {isAddMachineOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddMachineOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
              <button onClick={() => setIsAddMachineOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              <h3 className="text-xl font-bold text-white mb-4">Register Asset</h3>
              <form onSubmit={handleAddMachine} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Asset Name *</label>
                  <input id="maint_reg_name" name="machine_name" autoComplete="off" required type="text" value={machineData.machine_name} onChange={e => setMachineData({ ...machineData, machine_name: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Asset ID Tag *</label>
                  <input id="maint_reg_tag" name="machine_id" autoComplete="off" required type="text" value={machineData.machine_id} onChange={e => setMachineData({ ...machineData, machine_id: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Target Site *</label>
                  <select id="maint_reg_site" name="site_id" autoComplete="off" required value={machineData.site_id} onChange={e => setMachineData({ ...machineData, site_id: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                    <option value="">Select a site...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddMachineOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Register Asset</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG SERVICE MODAL (Hidden logic for brevity) */}
      <AnimatePresence>
        {isLogServiceOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLogServiceOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
              <button onClick={() => setIsLogServiceOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              <h3 className="text-xl font-bold text-white mb-4">Log Service Event</h3>
              <form onSubmit={handleLogService} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Target Machine *</label>
                  <select id="maint_log_machine" name="machine_id" autoComplete="off" required value={serviceData.machine_id} onChange={e => setServiceData({ ...serviceData, machine_id: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                    <option value="">Select a machine...</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.machine_name} ({m.machine_id})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Service Type</label>
                    <select id="maint_log_type" name="service_type" autoComplete="off" value={serviceData.service_type} onChange={e => setServiceData({ ...serviceData, service_type: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option>Preventative</option><option className="text-danger font-bold">Breakdown</option><option>Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Downtime (Hours)</label>
                    <input id="maint_log_downtime" name="downtime_hours" autoComplete="off" type="number" min="0" value={serviceData.downtime_hours} onChange={e => setServiceData({ ...serviceData, downtime_hours: Number(e.target.value) })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Technician Notes</label>
                  <textarea id="maint_log_notes" name="service_notes" autoComplete="off" required rows="2" value={serviceData.service_notes} onChange={e => setServiceData({ ...serviceData, service_notes: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none resize-none"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Service Performed On *</label>
                    <input id="maint_log_date" name="service_date" autoComplete="off" required type="date" value={serviceData.service_date} onChange={e => setServiceData({ ...serviceData, service_date: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Next Due Date</label>
                    <input id="maint_log_next_date" name="next_service_date" autoComplete="off" type="date" value={serviceData.next_service_date} onChange={e => setServiceData({ ...serviceData, next_service_date: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Parts Changed</label>
                  <input id="maint_log_parts" name="parts_changed" autoComplete="off" type="text" value={serviceData.parts_changed} onChange={e => setServiceData({ ...serviceData, parts_changed: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsLogServiceOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Submit Log</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD WORK ORDER MODAL (Hidden logic for brevity) */}
      <AnimatePresence>
        {isAddWOOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddWOOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
              <button onClick={() => setIsAddWOOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              <h3 className="text-xl font-bold text-white mb-4">Create Work Order</h3>
              <form onSubmit={handleAddWO} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Target Machine *</label>
                  <select id="maint_wo_machine" name="machine_id" autoComplete="off" required value={woData.machine_id} onChange={e => setWoData({ ...woData, machine_id: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                    <option value="">Select a machine...</option>
                    {machines.map(m => <option key={m.id} value={m.id}>{m.machine_name} ({m.machine_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">WO Title *</label>
                  <input id="maint_wo_title" name="title" autoComplete="off" required type="text" value={woData.title} onChange={e => setWoData({ ...woData, title: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Priority</label>
                    <select id="maint_wo_priority" name="priority" autoComplete="off" value={woData.priority} onChange={e => setWoData({ ...woData, priority: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option>Low</option><option>Medium</option><option>High</option><option className="text-danger font-bold">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Due Date</label>
                    <input id="maint_wo_due_date" name="due_date" autoComplete="off" type="date" value={woData.due_date} onChange={e => setWoData({ ...woData, due_date: e.target.value })} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddWOOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create WO</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
