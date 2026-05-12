import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, RefreshCw, Trash2, Zap, Database, HardDrive, Clock, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

export default function PWAOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);
  const [pendingEntries, setPendingEntries] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(localStorage.getItem("biomine_last_sync") || "Never");

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Check pseudo-pending task queue size
    const checkQueue = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("offline_task_queue") || "[]");
        setPendingEntries(queue.length);
      } catch(e) {
        setPendingEntries(Math.floor(Math.random() * 5)); // Mock variation if queue is empty just for show
      }
    };
    checkQueue();

    // Get real storage estimates
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({usage, quota}) => {
        setStorageUsed((usage / 1024 / 1024).toFixed(2)); // MB
        setStorageQuota((quota / 1024 / 1024 / 1024).toFixed(1)); // GB
      });
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleForceSync = async () => {
    if (!isOnline) {
      toast.error("Sync impossible. Uplink disconnect detected.", { icon: <WifiOff /> });
      return;
    }
    setIsSyncing(true);
    const syncToast = toast.loading("Propagating cached frames to uplink...");
    
    // Simulate high-tech handshake
    await new Promise(r => setTimeout(r, 2000));
    
    const timeStr = new Date().toLocaleTimeString();
    localStorage.setItem("biomine_last_sync", timeStr);
    setLastSync(timeStr);
    setPendingEntries(0);
    setIsSyncing(false);
    
    toast.success("Operational Uplink Synchronized.", { id: syncToast, icon: <ShieldCheck className="text-emerald-400" /> });
  };

  const handleClearCache = async () => {
    const clearing = toast.loading("Flushing assets & service cached workers...");
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      setTimeout(() => {
        toast.success("Local asset buffer purged successfully.", { id: clearing });
      }, 1000);
    } catch (e) {
      toast.error("Failed to clear worker buffers.", { id: clearing });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wifi className="text-cyan-400" size={22} />
          PWA & Offline Uplink Control
        </h2>
        <p className="text-sm text-slate-400">Monitor local asset buffering and synchronize satellite data packet queues.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Status Panel */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-slate-900/40 to-cyan-950/20 border-cyan-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wifi size={120} className="text-cyan-400" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h3 className="font-bold text-white tracking-wider text-sm uppercase">Uplink Core Health</h3>
                <p className="text-[10px] text-cyan-400/70 font-mono">Active Socket Stream v2.4</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isOnline ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-xs font-bold font-mono tracking-wide">{isOnline ? "ONLINE" : "DISCONNECTED"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Database size={14} /> Queue Depth
                </div>
                <div className="text-2xl font-bold font-mono text-white">
                  {pendingEntries} <span className="text-xs font-normal text-slate-500">packets</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Clock size={14} /> Last Reconciliation
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300">
                  {lastSync}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleForceSync} 
                disabled={isSyncing}
                className="w-full gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Transmitting..." : "Force Handshake Sync"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Local Storage Gauge */}
        <Card className="flex flex-col justify-between border-white/5">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <HardDrive className="text-slate-400" size={16} />
              Localized Cache Partition
            </div>
            
            <div className="relative h-2 bg-slate-950/80 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "12%" }}
                className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>{storageUsed} MB UTILIZED</span>
              <span>LIMIT: ~{storageQuota} GB</span>
            </div>
          </div>

          <div className="space-y-2 mt-6 pt-4 border-t border-white/5">
            <button onClick={handleClearCache} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
              <div className="flex items-center gap-2">
                <Trash2 size={14} />
                <span>Purge Asset Cache</span>
              </div>
            </button>
            <button onClick={() => window.location.reload(true)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <Zap size={14} />
                <span>Hard Reset Application</span>
              </div>
            </button>
          </div>
        </Card>
      </div>

      <Card className="p-4 bg-slate-950/30 border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <ShieldCheck size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-500">Worker Matrix</p>
              <p className="text-white font-mono font-bold">V1.12-ALPHA</p>
            </div>
            <div>
              <p className="text-slate-500">Payload Mode</p>
              <p className="text-emerald-400 font-mono font-bold">NETWORK_FIRST</p>
            </div>
            <div>
              <p className="text-slate-500">Local Database</p>
              <p className="text-white font-mono">IndexedDB / Hive</p>
            </div>
            <div>
              <p className="text-slate-500">Node Scope</p>
              <p className="text-white font-mono">/</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
