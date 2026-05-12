import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Search, RotateCcw, ShieldAlert, FileWarning, AlertOctagon } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { adminService } from "../services/adminService";
import toast from "react-hot-toast";
import { useAuth } from "../lib/AuthContext";

export default function RecycleBin() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBin();
  }, []);

  const fetchBin = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRecycleBinRecords();
      setRecords(data);
    } catch (err) {
      toast.error("Failed to load recycle bin");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (record) => {
    try {
      await adminService.restoreRecord(record.module, record.id, user.id);
      toast.success("Record Restored");
      fetchBin();
    } catch (err) {
      toast.error(err.message || "Failed to restore");
    }
  };

  const handleHardDelete = async (record) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently destroy the record. It cannot be recovered. Type 'YES' to confirm.")) return;
    try {
      await adminService.hardDeleteRecord(record.module, record.id, user.id);
      toast.success("Record Permanently Destroyed");
      fetchBin();
    } catch (err) {
      toast.error(err.message || "Dependency lock prevented deletion");
    }
  };

  const filteredData = records.filter(r => 
    (r.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.module || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.deletion_reason || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-danger flex items-center gap-2">
            <Trash2 /> Global Recycle Bin
          </h2>
          <p className="text-gray-400 text-sm mt-1">Enterprise Data Recovery & Permanent Destruction</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deleted records..." 
              className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-danger/50 focus:ring-1 focus:ring-danger/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 flex gap-3">
         <ShieldAlert className="text-danger shrink-0" />
         <p className="text-sm text-gray-300">
            <strong className="text-danger">Super Admin Warning:</strong> Records in this bin are soft-deleted and invisible to operational users. Restoring a record immediately reactivates it. Hard deletion permanently destroys the data and cannot be undone. Dependency locks will prevent destruction if linked history exists.
         </p>
      </div>

      {/* REGISTRY TABLE */}
      <Card className="p-0 border-dark-border/60 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-dark-bg/50 animate-pulse rounded"></div>)}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-dark-bg/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] text-gray-400 uppercase tracking-wider">Record ID</TableHead>
                  <TableHead className="text-[10px] text-gray-400 uppercase tracking-wider">Module</TableHead>
                  <TableHead className="text-[10px] text-gray-400 uppercase tracking-wider">Deletion Reason</TableHead>
                  <TableHead className="text-[10px] text-gray-400 uppercase tracking-wider">Deleted On</TableHead>
                  <TableHead className="text-[10px] text-gray-400 uppercase tracking-wider text-right">Admin Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((r) => (
                  <TableRow key={`${r.module}-${r.id}`} className="hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-gray-300">
                      {r.id.substring(0, 18)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider border-gray-600 text-gray-400">
                        {r.module}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-warning max-w-xs truncate">
                      {r.deletion_reason || "No reason provided"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 font-mono">
                      {new Date(r.deleted_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => handleRestore(r)} variant="outline" className="h-7 text-[10px] px-2 py-0 border-success text-success hover:bg-success hover:text-white">
                             <RotateCcw size={12} className="mr-1" /> Restore
                          </Button>
                          <Button onClick={() => handleHardDelete(r)} variant="outline" className="h-7 text-[10px] px-2 py-0 border-danger text-danger hover:bg-danger hover:text-white">
                             <AlertOctagon size={12} className="mr-1" /> Destroy
                          </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FileWarning size={48} className="text-gray-600 mb-4" />
            <p className="text-sm font-medium text-white mb-1">Recycle Bin Empty</p>
            <p className="text-xs">No soft-deleted records found across the enterprise.</p>
          </div>
        )}
      </Card>

    </motion.div>
  );
}
