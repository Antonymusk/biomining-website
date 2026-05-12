import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dbConnected, setDbConnected] = useState(true);
  const [checking, setChecking] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const updateQueueCount = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("biomine_offline_queue") || "[]");
        setPendingSyncCount(queue.length);
      } catch (err) {
        setPendingSyncCount(0);
      }
    };

    updateQueueCount();
    window.addEventListener("storage", updateQueueCount);
    const interval = setInterval(updateQueueCount, 5000);

    return () => {
      window.removeEventListener("storage", updateQueueCount);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Heartbeat to check Supabase health
    const interval = setInterval(checkSupabaseHealth, 30000);
    checkSupabaseHealth();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkSupabaseHealth = async () => {
    try {
      setChecking(true);
      const { error } = await supabase.from("inventory_sites").select("id").limit(1);
      setDbConnected(!error);
    } catch (err) {
      setDbConnected(false);
    } finally {
      setChecking(false);
    }
  };

  const handleReconnect = () => {
    checkSupabaseHealth();
  };

  if (isOnline && dbConnected) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#0B1120]/80 backdrop-blur-xl border border-success/30 px-3 py-1.5 rounded-full text-xs text-success shadow-[0_0_15px_rgba(16,185,129,0.15)] select-none">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
        <Wifi size={13} className="inline" /> Core Uplink Active
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
      {pendingSyncCount > 0 && (
        <div className="bg-warning/20 border border-warning/30 backdrop-blur-md text-warning text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md animate-pulse">
          ⚠️ {pendingSyncCount} entries pending sync
        </div>
      )}
      <div className="flex items-center gap-3 bg-danger/10 backdrop-blur-xl border border-danger/40 px-4 py-2 rounded-xl text-xs text-danger shadow-[0_0_20px_rgba(239,68,68,0.2)] select-none">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <WifiOff size={14} className="animate-pulse" />
          <span>Uplink Compromised</span>
        </div>
        <button 
          disabled={checking}
          onClick={handleReconnect}
          className="bg-danger/20 hover:bg-danger text-white rounded-md p-1 transition-colors border border-danger/30 flex items-center justify-center shrink-0 disabled:opacity-50"
          title="Retry connection"
        >
          <RefreshCw size={12} className={checking ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
