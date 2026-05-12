import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../lib/NotificationContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Bell, Search, Filter, Clock, ShieldAlert, 
  AlertCircle, Info, CheckCircle2, CheckSquare, Archive,
  MoreHorizontal, MapPin, Calendar
} from 'lucide-react';

const SEVERITY_CONFIG = {
   'CRITICAL': { color: 'text-red-400', bg: 'bg-red-950/30', border: 'border-red-500/40', icon: ShieldAlert },
   'WARNING': { color: 'text-amber-400', bg: 'bg-amber-950/30', border: 'border-amber-500/40', icon: AlertCircle },
   'HIGH': { color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-500/40', icon: AlertCircle },
   'SUCCESS': { color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-500/40', icon: CheckCircle2 },
   'INFO': { color: 'text-cyan-400', bg: 'bg-slate-800/40', border: 'border-white/10', icon: Info }
};

export default function Notifications() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'critical'

  const filteredNotifications = useMemo(() => {
     return notifications.filter(n => {
        const matchesSearch = 
           n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (n.site_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = 
           activeFilter === 'all' ? true :
           activeFilter === 'unread' ? !n.is_read :
           activeFilter === 'critical' ? (n.severity === 'CRITICAL' || n.severity === 'HIGH') : true;

        return matchesSearch && matchesFilter;
     });
  }, [notifications, searchTerm, activeFilter]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto pb-20">
       {/* TOP CONTROL BANNER */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
             <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <div className="relative">
                   <Bell size={28} className="text-primary" />
                   <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                </div>
                Operational Intelligence Inbox
             </h1>
             <p className="text-sm text-gray-400 mt-1">System audits, workflow actions, and event telemetry logs.</p>
          </div>

          <div className="flex gap-3">
             <Button onClick={markAllAsRead} variant="outline" className="border-white/10 text-[11px] font-black uppercase tracking-wider gap-2">
                <CheckSquare size={14} /> Mass Seal Read
             </Button>
          </div>
       </div>

       {/* FILTER MATRIX */}
       <Card className="p-3 bg-slate-900/40 backdrop-blur-md border-white/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
             <input 
                type="text"
                placeholder="Search vector identifiers, sites or titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2 outline-none text-sm text-white border-b border-transparent focus:border-primary/40 transition-all placeholder:text-slate-600"
             />
          </div>
          
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 shrink-0">
             {['all', 'unread', 'critical'].map((f) => (
                <button
                   key={f}
                   onClick={() => setActiveFilter(f)}
                   className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      activeFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'
                   }`}
                >
                   {f}
                </button>
             ))}
          </div>
       </Card>

       {/* MAIN EVENT LIST */}
       <div className="space-y-3">
          <AnimatePresence mode="popLayout">
             {loading ? (
                <div className="text-center py-20 text-gray-500 uppercase text-xs font-bold tracking-widest animate-pulse">Initiating Signal Relay...</div>
             ) : filteredNotifications.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 flex flex-col items-center justify-center">
                   <Archive size={48} className="text-slate-800 mb-4" />
                   <h3 className="text-xl font-bold text-gray-400">System Logs Purged</h3>
                   <p className="text-xs text-gray-600 uppercase mt-2">No telemetry fits applied dimension.</p>
                </motion.div>
             ) : (
                filteredNotifications.map((notif) => {
                   const conf = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.INFO;
                   const Icon = conf.icon;
                   return (
                      <motion.div
                         key={notif.id}
                         layout
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, x: -50 }}
                         onClick={() => !notif.is_read && markAsRead(notif.id)}
                         className={`group relative flex flex-col md:flex-row gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                            notif.is_read 
                              ? 'bg-slate-950/40 border-white/5 hover:bg-slate-900/50 opacity-70 hover:opacity-100' 
                              : `bg-slate-900 border-white/10 shadow-xl shadow-black/20 hover:border-primary/30 ${notif.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : ''}`
                         }`}
                      >
                         {/* Left Accents */}
                         <div className="shrink-0 flex flex-row md:flex-col items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner border ${conf.bg} ${conf.border}`}>
                               <Icon className={conf.color} size={24} />
                            </div>
                            {!notif.is_read && <div className="md:hidden w-2 h-2 bg-primary rounded-full" />}
                         </div>

                         {/* Content Body */}
                         <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                               <h3 className={`text-lg font-black uppercase tracking-tight ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>
                                  {notif.title}
                               </h3>
                               <Badge className={`${conf.bg} ${conf.color} border-transparent text-[9px] font-black uppercase py-0 px-2`}>
                                  {notif.severity}
                               </Badge>
                               {!notif.is_read && <span className="hidden md:inline-block w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                            </div>
                            
                            <p className="text-sm text-gray-400 font-medium leading-relaxed">{notif.message}</p>

                            <div className="flex flex-wrap items-center gap-4 pt-3 mt-3 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                               {notif.site_name && (
                                  <span className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/5">
                                     <MapPin size={12} className="text-cyan-500" /> {notif.site_name}
                                  </span>
                               )}
                               <span className="flex items-center gap-1.5">
                                  <Clock size={12} /> {new Date(notif.created_at).toLocaleTimeString()}
                               </span>
                               <span className="flex items-center gap-1.5">
                                  <Calendar size={12} /> {new Date(notif.created_at).toLocaleDateString()}
                               </span>
                            </div>
                         </div>

                         {/* Context Actions (Hidden until hover in desktop) */}
                         <div className="md:opacity-0 group-hover:opacity-100 transition-all self-center">
                            <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                               <MoreHorizontal size={20} />
                            </button>
                         </div>
                      </motion.div>
                   );
                })
             )}
          </AnimatePresence>
       </div>
    </motion.div>
  );
}
