import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertTriangle, Settings, RefreshCw, Filter, ShieldCheck, Archive } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useSites } from "../hooks/useSites";

export default function AlertCenter() {
  const { sites, loading: isSitesLoading } = useSites();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, investigating, resolved, all
  const [activePreset, setActivePreset] = useState("Standard");
  
  const presets = {
    "Standard": { disposal: "300 T/D", fuel: "8.0 L/Hr", variance: "15%", achievement: "94%" },
    "High Capacity": { disposal: "450 T/D", fuel: "12.0 L/Hr", variance: "10%", achievement: "82%" },
    "Fuel Sensitive": { disposal: "250 T/D", fuel: "6.0 L/Hr", variance: "8%", achievement: "98%" },
    "Heavy Excavation": { disposal: "400 T/D", fuel: "15.0 L/Hr", variance: "20%", achievement: "91%" }
  };

  const handleCreateSmartAlert = async (title, description, category, severity) => {
    try {
      const existing = alerts.find(a => a.title === title && ['active', 'acknowledged'].includes(a.status));
      if (existing) {
        const currentCount = (existing.repeat_count || 1) + 1;
        await supabase.from('operational_alerts')
          .update({
            severity: 'critical',
            description: `${description} (Deduplicated Count: x${currentCount})`,
            repeat_count: currentCount
          })
          .eq('id', existing.id);
        toast.success(`Escalated to CRITICAL: ${title} (Grouped x${currentCount})`);
      } else {
        await supabase.from('operational_alerts').insert([{
          title,
          description,
          category,
          severity,
          status: 'active',
          repeat_count: 1
        }]);
        toast.success(`Smart Alert Generated: ${title}`);
      }
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase.from('operational_alerts').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') {
        if (filter === 'active') query = query.in('status', ['active', 'acknowledged']);
        else query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const channel = supabase.channel('alerts-center')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operational_alerts' }, () => loadAlerts())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [filter]);

  const updateAlertStatus = async (id, newStatus) => {
    try {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      await supabase.from('operational_alerts').update({ 
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
      }).eq('id', id);
    } catch (err) {
      console.error(err);
      loadAlerts();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-danger" /> Incident Command Center
          </h2>
          <p className="text-gray-400 text-sm mt-1">Enterprise alert escalation and resolution tracking</p>
        </div>
        
        <div className="flex items-center gap-2 bg-dark-bg/60 p-1 rounded-lg border border-dark-border">
          <Filter size={14} className="text-gray-500 ml-2" />
          {['active', 'investigating', 'resolved', 'all'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ENTERPRISE OPERATIONAL TARGETS & SIMULATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Disposal Targets Configuration */}
        <Card className="lg:col-span-2 p-5 border-dark-border/60">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="text-primary" size={18} /> Site Target Configuration & Profile Presets
            </h3>
            <div className="flex flex-wrap gap-1 bg-dark-bg/60 p-1 rounded-lg border border-dark-border/50">
              {Object.keys(presets).map(pName => (
                <button
                  key={pName}
                  onClick={() => {
                    setActivePreset(pName);
                    toast.success(`Applied "${pName}" operational threshold configuration!`);
                  }}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-colors ${
                    activePreset === pName
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {isSitesLoading ? (
               <div className="col-span-4 py-6 flex justify-center text-xs text-gray-500">Retrieving active infrastructure presets...</div>
            ) : sites.length > 0 ? (
              sites.slice(0, 4).map((item, idx) => (
                <div key={item.id} className="p-3 bg-dark-bg/40 border border-dark-border/40 rounded-xl hover:border-primary/20 transition-all">
                  <span className="text-xs text-gray-400 block font-medium truncate">{item.name}</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{presets[activePreset].disposal} Limit</span>
                  <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">★ {[94, 82, 98, 91][idx % 4]}% Achievement</span>
                </div>
              ))
            ) : (
              <div className="col-span-4 py-6 text-center text-xs text-gray-500 border border-dashed border-dark-border rounded-xl">
                No active sites configured for baseline performance metrics.
              </div>
            )}
          </div>
        </Card>

        {/* Live Operational Anomaly Generator */}
        <Card className="p-5 border-primary/10 bg-gradient-to-br from-dark-bg via-transparent to-primary/5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <RefreshCw className="text-primary animate-spin-slow" size={18} /> Smart Cooldown Incident Generator
          </h3>
          <p className="text-xs text-gray-400 mb-4">Trigger enterprise anomaly scenarios. Repeated triggers invoke the deduplication engine to scale existing alert severities safely.</p>
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => handleCreateSmartAlert(
                "Delhi Target Deficiency Alert",
                "Delhi daily disposal drops below safe target limit.",
                "production",
                "warning"
              )}
              variant="outline"
              className="w-full text-xs py-2 text-danger hover:bg-danger/10 hover:border-danger/30 justify-start"
            >
              ⚠️ Trigger Disposal Target Dip Anomaly
            </Button>
            <Button
              type="button"
              onClick={() => handleCreateSmartAlert(
                "Siliguri High Fuel Variance Anomaly",
                "Excavator PC140-02 fuel rate registered above model benchmark limit.",
                "fuel",
                "warning"
              )}
              variant="outline"
              className="w-full text-xs py-2 text-warning hover:bg-warning/10 hover:border-warning/30 justify-start"
            >
              ⚡ Trigger Excessive Diesel Usage Anomaly
            </Button>
          </div>
        </Card>

      </div>

      <Card className="p-0 border-dark-border/60 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-dark-bg/50 animate-pulse rounded"></div>)}
          </div>
        ) : alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-dark-bg/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-gray-400">Severity</TableHead>
                  <TableHead className="text-xs text-gray-400">Incident Details</TableHead>
                  <TableHead className="text-xs text-gray-400">Category</TableHead>
                  <TableHead className="text-xs text-gray-400">Status</TableHead>
                  <TableHead className="text-xs text-gray-400">Time Logged</TableHead>
                  <TableHead className="text-xs text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-white/5 transition-colors group">
                    <TableCell>
                      <div className={`flex items-center gap-2 ${
                        alert.severity === 'critical' ? 'text-danger' : 
                        alert.severity === 'warning' ? 'text-warning' : 'text-info'
                      }`}>
                        {alert.severity === 'critical' ? <AlertTriangle size={16} /> : 
                         alert.severity === 'warning' ? <Settings size={16} /> : <CheckCircle2 size={16} />}
                        <span className="text-xs font-bold uppercase tracking-wider">{alert.severity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-gray-200 text-sm">{alert.title}</div>
                      <div className="text-xs text-gray-500 max-w-md truncate" title={alert.description}>{alert.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">{alert.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        alert.status === 'active' ? 'danger' :
                        alert.status === 'acknowledged' ? 'warning' :
                        alert.status === 'investigating' ? 'primary' : 'success'
                      } className="text-[10px] capitalize">
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {new Date(alert.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {alert.status !== 'resolved' && (
                          <>
                            {alert.status === 'active' && (
                              <Button onClick={() => updateAlertStatus(alert.id, 'acknowledged')} variant="outline" className="h-7 text-[10px] px-2 py-0 border-warning text-warning hover:bg-warning hover:text-white">Acknowledge</Button>
                            )}
                            {(alert.status === 'active' || alert.status === 'acknowledged') && (
                              <Button onClick={() => updateAlertStatus(alert.id, 'investigating')} variant="outline" className="h-7 text-[10px] px-2 py-0">Investigate</Button>
                            )}
                            <Button onClick={() => updateAlertStatus(alert.id, 'resolved')} variant="primary" className="h-7 text-[10px] px-2 py-0 bg-success hover:bg-success/90">Resolve</Button>
                          </>
                        )}
                        {alert.status === 'resolved' && (
                          <Button onClick={() => updateAlertStatus(alert.id, 'archived')} variant="outline" className="h-7 text-[10px] px-2 py-0 text-gray-400">
                            <Archive size={12} className="mr-1" /> Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ShieldCheck size={48} className="text-success/30 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No Incidents Found</h3>
            <p className="text-sm">There are no {filter !== 'all' ? filter : ''} alerts at this time.</p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
