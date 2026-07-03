import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserCog, Plus, Search, Filter, MoreVertical, 
  Trash2, Edit2, MapPin, Briefcase, Phone, Calendar,
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, LayoutGrid,
  UserMinus, UserPlus, Mail, BadgeInfo, ChevronRight
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { manpowerService } from "../services/manpowerService";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationContext";
import { useSites } from "../hooks/useSites";
import toast from "react-hot-toast";

const DESIGNATIONS = [
  "Site Incharge", "MIS Operator", "Supervisor", "Excavator Operator", 
  "Trommel Operator", "Helper", "Security Guard", "Maintenance Technician", 
  "Procurement Officer", "Fleet Coordinator"
];

const STATUS_COLORS = {
  Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Leave: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Suspended: "bg-red-500/10 text-red-400 border-red-500/20",
  Resigned: "bg-slate-800 text-slate-500 border-white/5"
};

export default function Manpower() {
  const { user } = useAuth();
  const { emitOperationalEvent } = useNotifications();
  const { sites } = useSites();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSite, setFilterSite] = useState("All");
  const [filterDesignation, setFilterDesignation] = useState("All");

  const isSuperAdmin = user?.role === 'Super Admin';
  const isAuditor = user?.role === 'Operations Auditor';
  
  const allowedSites = useMemo(() => {
     if (isSuperAdmin || isAuditor) return sites;
     return user?.assigned_sites || [];
  }, [sites, user, isSuperAdmin, isAuditor]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Determine scope for initial data fetch: 
      // null returns global list, otherwise restrict back-end query to explicit site string if allowedSites is strictly 1 location.
      let querySite = null;
      if (!isSuperAdmin && !isAuditor && allowedSites.length === 1) {
         querySite = allowedSites[0].name;
      }
      const raw = await manpowerService.getAll(querySite);
      setData(raw);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, isAuditor, allowedSites]);

  useEffect(() => {
    loadData();
    
    // Listen for updates across tabs or other modals using explicit bus
    window.addEventListener("manpower_updated", loadData);
    return () => window.removeEventListener("manpower_updated", loadData);
  }, [loadData]);

  const handleDelete = async (id) => {
    if(!confirm("Confirm irrevocable archival of employee intelligence record?")) return;
    try {
      await manpowerService.delete(id);
      toast.success("Staff record purged successfully.");
    } catch (e) { toast.error("Purge failed."); }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSite = filterSite === "All" ? true : item.site === filterSite;
      const matchesDesig = filterDesignation === "All" ? true : item.designation === filterDesignation;
      return matchesSearch && matchesSite && matchesDesig;
    });
  }, [data, searchTerm, filterSite, filterDesignation]);

  // Compute Metrics
  const activeCount = data.filter(x => x.status === "Active").length;
  const operatorsCount = data.filter(x => x.designation?.toLowerCase().includes("operator")).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <UserCog className="text-primary" size={26} />
            Workforce Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise site personnel registry and allocation console.</p>
        </div>
        
        <Button onClick={() => { setSelectedEmployee(null); setShowModal(true); }} variant="primary" className="gap-2 shadow-lg shadow-primary/20 font-bold px-5">
          <Plus size={16} /> Onboard Staff
        </Button>
      </div>

      {/* OPERATIONAL KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card className="p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-slate-800"><Users size={60} /></div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Headcount</div>
            <div className="text-3xl font-black text-white font-mono relative z-10">{data.length}</div>
         </Card>
         <Card className="p-4 relative overflow-hidden border-l-2 border-l-emerald-500">
            <div className="absolute top-0 right-0 p-3 text-emerald-900/20"><CheckCircle2 size={60} /></div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 relative z-10">Active Ops</div>
            <div className="text-3xl font-black text-white font-mono relative z-10">{activeCount}</div>
         </Card>
         <Card className="p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-slate-800"><Briefcase size={60} /></div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Hardware Operators</div>
            <div className="text-3xl font-black text-white font-mono relative z-10">{operatorsCount}</div>
         </Card>
         <Card className="p-4 relative overflow-hidden border-l-2 border-l-amber-500">
            <div className="absolute top-0 right-0 p-3 text-amber-900/20"><Clock size={60} /></div>
            <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 relative z-10">On Leave</div>
            <div className="text-3xl font-black text-white font-mono relative z-10">{data.filter(x=>x.status==="Leave").length}</div>
         </Card>
      </div>

      {/* MATRIX CONTROL BLOCK (FILTERS) */}
      <Card className="p-3 border-white/5 bg-dark-bg/40 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row gap-3">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
             <input 
               type="text" placeholder="Search ID or Name..." 
               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/5 rounded-lg text-sm text-white focus:border-primary/40 outline-none transition-all"
             />
           </div>
           
           <div className="flex flex-wrap gap-3">
             {(isSuperAdmin || isAuditor || allowedSites.length > 1) && (
               <select 
                 value={filterSite} onChange={(e) => setFilterSite(e.target.value)}
                 className="bg-slate-900/50 border border-white/5 rounded-lg text-xs font-bold text-gray-300 px-3 py-2 outline-none cursor-pointer hover:border-white/10"
               >
                 <option value="All">{allowedSites.length > 1 && !isSuperAdmin && !isAuditor ? "All Assigned Sites" : "Global View"}</option>
                 {allowedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
             )}
             
             <select 
               value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)}
               className="bg-slate-900/50 border border-white/5 rounded-lg text-xs font-bold text-gray-300 px-3 py-2 outline-none cursor-pointer hover:border-white/10"
             >
               <option value="All">All Roles</option>
               {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
           </div>
        </div>
      </Card>

      {/* RESULTS TABLE */}
      <Card className="overflow-hidden border-white/5 p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-950/50">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-6">Personnel Identity</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Designation & Dept</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Node Assigment</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 tracking-widest text-right pr-6">Command</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 [1,2,3,4].map(x => (
                   <TableRow key={x} className="animate-pulse border-white/5"><TableCell colSpan={5} className="h-16 bg-white/5"></TableCell></TableRow>
                 ))
              ) : filteredData.length > 0 ? filteredData.map((emp) => (
                 <TableRow key={emp.id} className="group hover:bg-white/5 transition-colors border-white/5">
                    <TableCell className="pl-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center font-bold text-white text-sm shadow-md">
                             {emp.name?.substring(0, 2).toUpperCase() || "E"}
                          </div>
                          <div>
                             <div className="text-sm font-bold text-gray-200">{emp.name}</div>
                             <div className="text-[10px] font-mono text-gray-500 uppercase">{emp.employee_id || "NO-ID"}</div>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div>
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5 mb-0.5">{emp.designation}</Badge>
                          <div className="text-[10px] text-gray-400 ml-1">{emp.department}</div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <MapPin size={12} className="text-gray-500" />
                          {emp.site}
                       </div>
                    </TableCell>
                    <TableCell>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${STATUS_COLORS[emp.status] || STATUS_COLORS.Active}`}>
                          {emp.status}
                       </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => { setSelectedEmployee(emp); setShowModal(true); }}
                             className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Edit"
                          ><Edit2 size={14} /></button>
                          <button 
                             onClick={() => handleDelete(emp.id)}
                             className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400" title="Purge"
                          ><Trash2 size={14} /></button>
                       </div>
                    </TableCell>
                 </TableRow>
              )) : (
                 <TableRow>
                   <TableCell colSpan={5} className="text-center py-12 text-gray-500 text-sm italic border-transparent">
                     No roster entities detected aligning to selected queries.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ONBOARDING / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            >
               <div className="p-6 border-b border-white/5 bg-gradient-to-br from-slate-900 to-slate-950 flex justify-between items-center">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                     <BadgeInfo className="text-primary" size={20} />
                     {selectedEmployee ? "Edit Personnel Construct" : "Register New Staff Unit"}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
               </div>
               
               <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const payload = {
                    employee_id: form.employee_id.value,
                    name: form.name.value,
                    designation: form.designation.value,
                    department: form.department.value,
                    site: form.site.value,
                    phone: form.phone.value,
                    status: form.status.value,
                    description: form.description.value
                  };

                  try {
                    if (selectedEmployee) {
                      await manpowerService.update(selectedEmployee.id, payload);
                      toast.success("Entity revision committed.");
                    } else {
                      await manpowerService.create(payload);
                      
                      // Dispatch Operational Alert for Onboarding
                      const matchedSite = sites.find(s => s.name === payload.site);
                      await emitOperationalEvent({
                         title: "New Personnel Registered",
                         message: `${payload.name} onboarded as ${payload.designation} at ${payload.site}.`,
                         severity: 'INFO',
                         event_type: 'manpower_added',
                         source_module: 'Manpower',
                         affected_site_id: matchedSite?.id
                      });

                      toast.success("Roster injection authenticated.");
                    }
                    setShowModal(false);
                  } catch (err) { toast.error("Protocol failure."); }

               }} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Unique EMP ID</label>
                    <input defaultValue={selectedEmployee?.employee_id} name="employee_id" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary" placeholder="e.g. EMP-120" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Legal Designation</label>
                    <input defaultValue={selectedEmployee?.name} name="name" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary" placeholder="Full Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Assigned Role</label>
                    <select defaultValue={selectedEmployee?.designation || "Helper"} name="designation" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary cursor-pointer">
                       {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Department Vector</label>
                    <input defaultValue={selectedEmployee?.department || "Operations"} name="department" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary" placeholder="e.g. Heavy Machinery" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Physical Location (Site)</label>
                    <select defaultValue={selectedEmployee?.site || allowedSites[0]?.name} name="site" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary cursor-pointer">
                       {allowedSites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Current Condition</label>
                    <select defaultValue={selectedEmployee?.status || "Active"} name="status" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary cursor-pointer">
                       <option value="Active">Active Deployment</option>
                       <option value="Leave">Inactive (Leave)</option>
                       <option value="Suspended">Suspended Ops</option>
                       <option value="Resigned">Permanently Relieved</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Comm Node (Contact)</label>
                    <input defaultValue={selectedEmployee?.phone} name="phone" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary" placeholder="+91 XXXX-XXXXXX" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Objective Parameters (Role Description)</label>
                    <textarea defaultValue={selectedEmployee?.description} name="description" rows={3} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none focus:border-primary resize-none" placeholder="Describe core daily functions..." />
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                     <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white font-medium">Abort</button>
                     <Button type="submit" variant="primary" className="font-bold px-6 shadow-lg shadow-primary/20">
                        Authorize Sequence
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
