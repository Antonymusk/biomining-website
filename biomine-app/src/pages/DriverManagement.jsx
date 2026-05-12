import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Plus, Shield, Clock, TrendingUp, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { supabase } from "../lib/supabase";
import { AdminActionMenu } from "../components/ui/AdminActionMenu";

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          fleet_vehicles ( vehicle_name, vehicle_number )
        `)
        .neq('is_deleted', true)
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    const channel = supabase.channel('drivers-table')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => loadDrivers())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const filteredDrivers = drivers.filter(d => 
    (d.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.license_number || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-primary" /> Driver Intelligence
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage personnel, track safety scores, and monitor efficiency</p>
        </div>
        
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              id="driver_search"
              name="driver_search"
              autoComplete="off"
              type="text" 
              placeholder="Search drivers or license..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <Button variant="primary" className="whitespace-nowrap h-9">
            <Plus size={16} className="mr-2" /> Add Driver
          </Button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary relative overflow-hidden group">
           <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Drivers</p>
           <h3 className="mt-1 text-2xl font-bold text-white">{drivers.length}</h3>
           <Users className="absolute right-4 top-4 text-primary/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-success relative overflow-hidden group">
           <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active on Shift</p>
           <h3 className="mt-1 text-2xl font-bold text-success">{drivers.filter(d => d.status === 'active').length}</h3>
           <Clock className="absolute right-4 top-4 text-success/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-warning relative overflow-hidden group">
           <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Safety Score</p>
           <h3 className="mt-1 text-2xl font-bold text-white">
              {drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.safety_score || 0), 0) / drivers.length) : 0}
           </h3>
           <Shield className="absolute right-4 top-4 text-warning/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
        <Card className="p-4 border-l-4 border-l-info relative overflow-hidden group">
           <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Efficiency</p>
           <h3 className="mt-1 text-2xl font-bold text-white">
              {drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.efficiency_score || 0), 0) / drivers.length) : 0}
           </h3>
           <TrendingUp className="absolute right-4 top-4 text-info/20 group-hover:scale-125 transition-transform" size={32} />
        </Card>
      </div>

      {/* DRIVERS TABLE */}
      <Card className="p-0 border-dark-border/60 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-dark-bg/50 animate-pulse rounded"></div>)}
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-dark-bg/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs text-gray-400">Driver Details</TableHead>
                  <TableHead className="text-xs text-gray-400">License / Contact</TableHead>
                  <TableHead className="text-xs text-gray-400">Assigned Vehicle</TableHead>
                  <TableHead className="text-xs text-gray-400">Status</TableHead>
                  <TableHead className="text-xs text-gray-400 text-center">Safety Score</TableHead>
                  <TableHead className="text-xs text-gray-400 text-center">Efficiency</TableHead>
                  <TableHead className="text-xs text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id} className="hover:bg-white/5 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
                          {driver.full_name?.substring(0,2) || 'XX'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-200 text-sm">{driver.full_name}</div>
                          <div className="text-[10px] text-gray-500">Joined {new Date(driver.joined_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono text-gray-300">{driver.license_number}</div>
                      <div className="text-[11px] text-gray-500">{driver.phone || "No phone"}</div>
                    </TableCell>
                    <TableCell>
                      {driver.fleet_vehicles ? (
                        <div>
                          <div className="text-sm text-gray-200">{driver.fleet_vehicles.vehicle_name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{driver.fleet_vehicles.vehicle_number}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        driver.status === 'active' ? 'success' : 
                        driver.status === 'on-leave' ? 'warning' : 'default'
                      } className="text-[10px] capitalize">
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${driver.safety_score >= 90 ? 'text-success' : driver.safety_score >= 75 ? 'text-warning' : 'text-danger'}`}>
                          {driver.safety_score}
                        </span>
                        <div className="w-12 h-1 bg-dark-bg rounded-full mt-1 overflow-hidden">
                          <div className={`h-full ${driver.safety_score >= 90 ? 'bg-success' : driver.safety_score >= 75 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${driver.safety_score}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${driver.efficiency_score >= 90 ? 'text-primary' : driver.efficiency_score >= 75 ? 'text-info' : 'text-danger'}`}>
                          {driver.efficiency_score}
                        </span>
                        <div className="w-12 h-1 bg-dark-bg rounded-full mt-1 overflow-hidden">
                          <div className={`h-full ${driver.efficiency_score >= 90 ? 'bg-primary' : driver.efficiency_score >= 75 ? 'bg-info' : 'bg-danger'}`} style={{ width: `${driver.efficiency_score}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <AdminActionMenu module="Drivers" recordId={driver.id} record={driver} onComplete={loadDrivers} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No Drivers Found</h3>
            <p className="text-sm">Get started by adding a new driver profile.</p>
          </div>
        )}
      </Card>

    </motion.div>
  );
}
