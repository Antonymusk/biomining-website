import { useState } from "react";
import { ShieldCheck, Monitor, Smartphone, MapPin, KeyRound, Lock, Power, Fingerprint, Activity, AlertCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

const MOCK_SESSIONS = [
  { id: 1, device: "MacBook Pro • Chrome", location: "Mumbai, IN", ip: "192.168.1.45", current: true, active: "Active Now", type: "desktop" },
  { id: 2, device: "iPhone 15 • Mobile Safari", location: "New Delhi, IN", ip: "45.22.11.90", current: false, active: "2 hours ago", type: "mobile" },
  { id: 3, device: "Windows 11 • Edge", location: "Bangalore, IN", ip: "103.42.1.12", current: false, active: "4 days ago", type: "desktop" },
];

const MOCK_AUDIT = [
  { event: "Admin Access Granted", timestamp: "10 min ago", severity: "low" },
  { event: "Export Download Initiated", timestamp: "1 hour ago", severity: "medium" },
  { event: "Failed Auth Attempt", timestamp: "Yesterday", severity: "high" },
  { event: "Site Config Adjusted", timestamp: "2 days ago", severity: "low" },
];

export default function Security() {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [resetLoading, setResetLoading] = useState(false);

  const handleTerminateSession = (id) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success("External session terminated.", {
      icon: "🔒"
    });
  };

  const triggerPasswordReset = async () => {
    setResetLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.email) throw new Error("No authenticated user discovered.");
      
      const { error } = await supabase.auth.resetPasswordForEmail(userData.user.email);
      if (error) throw error;

      toast.success(`Secure reset cipher dispatched to ${userData.user.email}`);
    } catch (err) {
      toast.error(err.message || "Communication disruption with auth server.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="text-rose-500" size={22} />
          Security Operations & Audit
        </h2>
        <p className="text-sm text-slate-400">Govern cryptographic keys, track footprint provenance, and oversee sessions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sessions */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Monitor size={16} className="text-slate-400" /> Live Token Workspace
            </h3>
            <span className="text-[10px] font-bold tracking-widest text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">SECURE</span>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                session.current ? "bg-blue-600/5 border-blue-500/20" : "bg-slate-950/30 border-white/5"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${session.current ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"}`}>
                    {session.type === 'desktop' ? <Monitor size={20} /> : <Smartphone size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{session.device}</span>
                      {session.current && (
                        <span className="text-[9px] uppercase font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-sm">Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 font-mono">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {session.location}</span>
                      <span>•</span>
                      <span>IP: {session.ip}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 hidden md:block">{session.active}</span>
                  {!session.current && (
                    <button 
                      onClick={() => handleTerminateSession(session.id)}
                      className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                      title="Revoke Auth Privilege"
                    >
                      <Power size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Access Controls */}
          <Card className="bg-gradient-to-b from-rose-950/10 to-transparent border-rose-500/10">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <KeyRound size={16} className="text-rose-400" /> Directives
            </h3>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 bg-slate-950/50 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all py-6"
                onClick={triggerPasswordReset}
                disabled={resetLoading}
              >
                <div className="p-2 bg-slate-800 rounded text-slate-300">
                  <Lock size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Recalibrate Key</p>
                  <p className="text-[10px] text-slate-500 lowercase tracking-normal normal-case font-normal">Send reset vector via secure mail</p>
                </div>
              </Button>
            </div>
          </Card>

          {/* Event log */}
          <Card className="flex-1">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> Audit Stream
            </h3>
            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
              {MOCK_AUDIT.map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute left-0 top-1.5 w-4 h-4 -ml-2 rounded-full border-2 border-slate-900 flex items-center justify-center ${
                    item.severity === 'high' ? 'bg-rose-500' : item.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}>
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">{item.event}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.timestamp}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
