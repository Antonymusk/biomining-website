import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Download, UploadCloud, History, Server, AlertTriangle, FileJson, Clock, CheckCircle2, Loader } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

const MOCK_BACKUPS = [
  { id: "BK-994", date: "2026-05-10 04:00", size: "4.2 MB", type: "Scheduled System", status: "Secure" },
  { id: "BK-982", date: "2026-05-09 04:00", size: "4.1 MB", type: "Scheduled System", status: "Secure" },
  { id: "BK-971", date: "2026-05-08 14:23", size: "3.9 MB", type: "Manual Admin", status: "Secure" },
];

export default function BackupRecovery() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backups, setBackups] = useState(MOCK_BACKUPS);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const generateSnapshot = async () => {
    setIsBackingUp(true);
    const snapshotToast = toast.loading("Compiling operational schemas and datasets...");
    
    // Complex export simulation
    await new Promise(r => setTimeout(r, 2500));

    // Generate client JSON dump mock
    const mockData = {
      project: "BioMine Intelligence",
      exportDate: new Date().toISOString(),
      data: localStorage.getItem("biomine_sites_data") || "[]",
      version: "1.0.0"
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mockData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `biomine_snapshot_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    const newEntry = {
      id: `BK-${Math.floor(Math.random()*900 + 100)}`,
      date: new Date().toLocaleString(),
      size: "0.8 KB",
      type: "Manual Admin",
      status: "Secure"
    };

    setBackups([newEntry, ...backups]);
    setIsBackingUp(false);
    toast.success("Operational snapshot successfully delivered.", { id: snapshotToast });
  };

  const triggerRestore = (backup) => {
    setRestoreTarget(backup);
    setShowRestoreModal(true);
  };

  const performRestore = async () => {
    setIsRestoring(true);
    // Restore delay
    await new Promise(r => setTimeout(r, 3000));
    
    setIsRestoring(false);
    setShowRestoreModal(false);
    toast.success("System state rolled back successfully.", { 
      duration: 5000,
      icon: "✅"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="text-violet-400" size={22} />
            Archival & Governance Backup
          </h2>
          <p className="text-sm text-slate-400">Secure and export system states or initiate disaster recovery protocols.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateSnapshot} disabled={isBackingUp} className="gap-2 bg-violet-600/20 text-violet-300 hover:bg-violet-600/30 border-violet-500/30">
            <Download size={16} className={isBackingUp ? "animate-bounce" : ""} />
            Generate Snapshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <History className="text-slate-400" size={18} />
              State Log Index
            </h3>
            <span className="text-xs text-slate-500 font-mono">RETAINING 30 CYCLES</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-white/5">
                  <th className="py-2 font-medium">Signature</th>
                  <th className="py-2 font-medium">Recorded Timestamp</th>
                  <th className="py-2 font-medium">Context</th>
                  <th className="py-2 text-right font-medium">Utility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {backups.map((bk) => (
                  <tr key={bk.id} className="group hover:bg-white/[0.01]">
                    <td className="py-3">
                      <div className="flex items-center gap-2 font-mono text-white">
                        <FileJson size={14} className="text-violet-400" />
                        {bk.id}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs flex flex-col">
                      <span>{bk.date}</span>
                      <span className="text-[10px] text-slate-600">{bk.size}</span>
                    </td>
                    <td className="py-3 text-xs text-slate-300">
                      {bk.type}
                    </td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => triggerRestore(bk)}
                        className="opacity-50 group-hover:opacity-100 px-2 py-1 text-[10px] font-bold tracking-wider uppercase bg-slate-800 hover:bg-slate-700 text-white rounded border border-white/10 transition-all"
                      >
                        Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-violet-950/20 to-indigo-950/20 border-violet-500/10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-violet-300 text-sm font-bold uppercase tracking-wider mb-1">
                  <Server size={16} />
                  Cloud Node Status
                </div>
                <p className="text-[10px] text-violet-400/70 font-mono">Secondary Cold Storage active</p>
              </div>
              <CheckCircle2 className="text-emerald-400" size={20} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-slate-400">Auto-Schedule</span>
                <span className="text-sm text-white font-medium">Every 24 Hours</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-violet-500"></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Next Cycle</span>
                <span>T-minus 4h 12m</span>
              </div>
            </div>
          </Card>

          <Card className="border-amber-500/10 bg-amber-950/5 flex items-start gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-amber-200 mb-1">Governance Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Rolling back operational states will overwrite the current live configuration workspace irreversibly.</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Restore Safeguard Modal */}
      <AnimatePresence>
        {showRestoreModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-md w-full glass-card border border-red-500/20 p-6 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-white">Confirm System Rollback</h3>
                <p className="text-sm text-slate-400 mt-2">
                  You are initiating a restoration to state signature <span className="text-red-400 font-mono font-bold">{restoreTarget?.id}</span>.
                  This action forces a kernel state replacement and overwrites current staging data.
                </p>
              </div>

              <div className="bg-slate-950/50 border border-white/5 rounded-lg p-3 text-xs text-left font-mono text-slate-500">
                {">"} SHUTDOWN SEQUENCE INITIATED... <br/>
                {">"} AWAITING OPERATOR CONSENT...
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={isRestoring}
                  onClick={() => setShowRestoreModal(false)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium border border-white/5"
                >
                  Abort
                </button>
                <button 
                  disabled={isRestoring}
                  onClick={performRestore}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                >
                  {isRestoring ? <Loader className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                  {isRestoring ? "DECODING..." : "CONFIRM OVERWRITE"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
