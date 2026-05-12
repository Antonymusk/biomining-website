import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Search, Filter, Edit3, Archive, Building2, X, Check, Loader2 } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { siteService } from "../../services/siteService";
import toast from "react-hot-toast";

export default function SiteConfiguration() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", zone: "North", capacity: "", status: "Active", hours: "24 Hours", manager: ""
  });

  const fetchSites = async () => {
    setLoading(true);
    try {
      const data = await siteService.getSites();
      setSites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const filteredSites = useMemo(() => {
    return sites.filter(site => 
      site.name.toLowerCase().includes(search.toLowerCase()) || 
      site.zone.toLowerCase().includes(search.toLowerCase()) ||
      site.manager.toLowerCase().includes(search.toLowerCase())
    );
  }, [sites, search]);

  const handleOpenModal = (site = null) => {
    if (site) {
      setEditingSite(site);
      setFormData({ ...site });
    } else {
      setEditingSite(null);
      setFormData({ name: "", zone: "North", capacity: "", status: "Active", hours: "24 Hours", manager: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const savingToast = toast.loading("Committing infrastructure configuration payload...");
    
    try {
      const updatedData = await siteService.saveSite({
        ...(editingSite ? { id: editingSite.id } : {}),
        ...formData
      });

      setSites(updatedData);
      toast.success(editingSite ? "Site metadata committed successfully." : "New installation profile activated.", { id: savingToast });
      setIsModalOpen(false);
      
      // Dispatch notification to refresh useSites hooks system-wide
      window.dispatchEvent(new Event("biomine_sites_updated"));
    } catch (err) {
      toast.error(`Core Rejection: ${err.message || "Unknown link break"}`, { id: savingToast });
    }
  };

  const toggleStatus = async (id) => {
    const site = sites.find(s => s.id === id);
    if (!site) return;

    const nextStatus = site.status === "Active" ? "Inactive" : "Active";
    const updatedData = await siteService.saveSite({ ...site, status: nextStatus });
    setSites(updatedData);
    
    window.dispatchEvent(new Event("biomine_sites_updated"));
    toast.success(`${site.name} established to ${nextStatus} state.`);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-emerald-500" size={22} />
            Operational Infrastructure
          </h2>
          <p className="text-sm text-slate-400">Register new zones and manage active governance per site.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2" variant="success">
          <Plus size={16} /> Add Site
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-slate-950/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search via Facility ID, Zone or Manager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-lg border border-white/5 text-xs text-slate-400">
            <Building2 size={14} />
            Total Capable: {sites.reduce((acc, curr) => acc + parseInt(curr.capacity || 0), 0)} T
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-slate-400 uppercase bg-slate-900/30 border-b border-white/5">
                <th className="px-6 py-3 font-semibold">Site Designation</th>
                <th className="px-6 py-3 font-semibold">Operational Zone</th>
                <th className="px-6 py-3 font-semibold">Daily Max Cap</th>
                <th className="px-6 py-3 font-semibold">Assigned Manager</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-500 mb-2" size={24} />
                    <span className="text-sm text-slate-500">Querying secure node repository...</span>
                  </td>
                </tr>
              ) : filteredSites.length > 0 ? (
                filteredSites.map((site) => (
                  <tr key={site.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{site.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{site.hours}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-white/5">
                        {site.zone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                      {site.capacity} Tons
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {site.manager}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                        site.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        site.status === 'Maintenance' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {site.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(site)}
                          className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 text-slate-500 rounded transition-colors"
                          title="Edit Site Configurations"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(site.id)}
                          className={`p-1.5 rounded transition-colors ${
                            site.status === 'Active' 
                              ? 'hover:bg-red-500/10 hover:text-red-400 text-slate-500' 
                              : 'hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500'
                          }`}
                          title={site.status === 'Active' ? "Suspend Site Operations" : "Reinstate Operations"}
                        >
                          {site.status === 'Active' ? <Archive size={14} /> : <Check size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 text-sm">
                    No active infrastructure entries found matching current directives.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Management Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-card border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-slate-900/20">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="text-emerald-500" size={20} />
                  {editingSite ? "Relay: Adjust Configuration" : "Initiate: Provision New Facility"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation / Site Name</label>
                  <input 
                    required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="e.g. Delhi Plant Delta"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Governance Zone</label>
                    <select 
                      value={formData.zone} onChange={(e) => setFormData({...formData, zone: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40"
                    >
                      {["North", "South", "East", "West", "Central"].map(z => <option key={z} value={z} className="bg-slate-900">{z} Zone</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Status</label>
                    <select 
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40"
                    >
                      {["Active", "Maintenance", "Inactive"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Hours</label>
                    <input 
                      required type="text" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="e.g. 24 Hours"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Cap (Tons/Day)</label>
                    <input 
                      required type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointed Site Overseer</label>
                  <input 
                    required type="text" value={formData.manager} onChange={(e) => setFormData({...formData, manager: e.target.value})}
                    className="w-full bg-slate-950/60 border border-white/5 rounded-lg px-4 py-2.5 text-white outline-none focus:border-emerald-500/40 transition-colors"
                    placeholder="Enter personnel name..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">Abort</Button>
                  <Button type="submit" variant="success" className="flex-1 uppercase tracking-widest text-[10px]">Confirm Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
