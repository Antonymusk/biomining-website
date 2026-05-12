import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertCircle, Info, ShieldAlert, CheckCircle2, X, Clock, 
  Shield, Zap
} from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (e) {
      console.error("Notification Load Failed", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Internal Toast Dispatcher with intelligent deduplication
  const addToast = useCallback((notif) => {
     const id = crypto.randomUUID();
     
     setToasts(prev => {
        // 1. Check for recent duplicate within previous 3 seconds to curb flood storms
        const matches = prev.find(t => t.title === notif.title && t.message === notif.message);
        if (matches) return prev; // Throttle spam
        
        // 2. Truncate buffer to max 3 stack depth
        const base = prev.length >= 3 ? prev.slice(1) : prev;
        return [...base, { ...notif, toast_id: id }];
     });
     
     const timeout = notif.severity === 'CRITICAL' ? 10000 : 6000;
     setTimeout(() => {
       setToasts(prev => prev.filter(t => t.toast_id !== id));
     }, timeout);
  }, []);

  // Realtime Subscription Engine
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Channel for THIS specific user's resolved notification bucket
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(c => c + 1);
          addToast(newNotif); // Push to premium toaster
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, addToast]);

  const markAsRead = async (notifId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notifId);

      if (!error) {
         setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
         setUnreadCount(c => Math.max(0, c - 1));
      }
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
     if (!user) return;
     try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date() })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
     } catch (e) { console.error(e); }
  };

  /**
   * EMIT EVENT UTILITY
   * Use this anywhere in the application to dump a trigger into the operational pool.
   */
  const emitOperationalEvent = async ({ title, message, severity = 'INFO', event_type = 'system_event', source_module = 'Generic', affected_site_id = null, payload = {} }) => {
     try {
        await supabase
          .from('operational_events')
          .insert([{
             event_type,
             title,
             message,
             severity,
             source_module,
             triggered_by: user?.id,
             affected_site_id,
             payload
          }]);
     } catch (e) { console.error("Failed to dispatch operation event", e); }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      markAsRead, 
      markAllAsRead,
      emitOperationalEvent,
      fetchNotifications
    }}>
      {children}

      {/* PREMIUM ENTERPRISE TOAST LAYER */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
         <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
               <motion.div
                 key={t.toast_id}
                 initial={{ opacity: 0, y: 20, scale: 0.95, x: 50 }}
                 animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                 exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
                 className={`pointer-events-auto relative overflow-hidden rounded-xl border shadow-2xl flex gap-4 p-4 backdrop-blur-md transition-all duration-300 ${
                    t.severity === 'CRITICAL' ? 'bg-red-950/90 border-red-500/40 shadow-red-950/40 animate-pulse-subtle' :
                    t.severity === 'WARNING'  ? 'bg-amber-950/90 border-amber-500/40 shadow-amber-950/20' :
                    t.severity === 'SUCCESS'  ? 'bg-emerald-950/90 border-emerald-500/40' :
                    'bg-slate-900/90 border-slate-700/50 shadow-black/40'
                 }`}
               >
                  {/* Accent Bar */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                     t.severity === 'CRITICAL' ? 'bg-red-500' :
                     t.severity === 'WARNING' ? 'bg-amber-500' :
                     t.severity === 'HIGH' ? 'bg-orange-500' :
                     t.severity === 'SUCCESS' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`} />

                  <div className="shrink-0 mt-0.5">
                     {t.severity === 'CRITICAL' ? <ShieldAlert className="text-red-400" size={22} /> :
                      t.severity === 'WARNING'  ? <AlertCircle className="text-amber-400" size={22} /> :
                      t.severity === 'INFO'     ? <Info className="text-cyan-400" size={22} /> :
                      <Bell className="text-white" size={22} />}
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-white tracking-tight truncate pr-2 uppercase">{t.title}</h4>
                        <button 
                           onClick={() => setToasts(prev => prev.filter(item => item.toast_id !== t.toast_id))}
                           className="text-gray-500 hover:text-white"
                        >
                           <X size={14} />
                        </button>
                     </div>
                     <p className="text-xs text-gray-300 mt-1 leading-relaxed line-clamp-2 font-medium">{t.message}</p>
                     <div className="flex items-center gap-2 mt-2.5">
                        {t.site_name && (
                           <span className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-black text-gray-300 uppercase tracking-wider">
                              {t.site_name}
                           </span>
                        )}
                        <span className="text-[9px] text-gray-500 flex items-center gap-1">
                           <Clock size={10} /> Just now
                        </span>
                     </div>
                  </div>
               </motion.div>
            ))}
         </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
