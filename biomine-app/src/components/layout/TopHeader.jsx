import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, Menu, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { Input } from "../ui/Input";
import { useAuth } from "../../lib/AuthContext";
import { useNotifications } from "../../lib/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, AlertCircle, Info, CheckCircle2 } from "lucide-react";

export const TopHeader = React.memo(function TopHeader({ setIsMobileOpen, title = "Dashboard", subtitle = "Overview" }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("biomine_theme") || "dark");

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("biomine_theme", theme);
  }, [theme]);

  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-dark-border bg-dark-bg/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white cursor-pointer"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold metallic-gradient-text sm:text-2xl">{title}</h1>
          <p className="hidden text-xs text-gray-400 sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden relative w-64 md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search operations..." 
            className="pl-10 h-10 bg-dark-card/50 border-transparent focus:border-primary/50" 
          />
        </div>

        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 h-9 rounded-lg bg-slate-800/40 border border-white/15 px-3 text-xs font-semibold text-white hover:bg-slate-700/60 hover:text-white hover:border-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all cursor-pointer mr-1"
          >
            📥 Install App
          </button>
        )}

        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white cursor-pointer group"
          >
            <Bell size={20} className={`group-hover:rotate-12 transition-transform ${unreadCount > 0 ? 'animate-pulse-subtle text-white' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-3.5 min-w-[14px] px-1 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-black text-white border border-slate-950 shadow-lg shadow-red-500/30">
                 {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl z-[100] flex flex-col max-h-[28rem] overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5">
                  <h3 className="font-black text-xs text-white uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                     Operational Feeds
                  </h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase"
                    >
                      Seal All
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center">
                       <Bell size={32} className="text-slate-800 mb-2" />
                       <p className="text-xs text-gray-500 font-bold uppercase">No Pending Vector Logs</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`group relative p-3 rounded-xl text-sm transition-all border ${
                           notif.is_read 
                             ? 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:border-white/5 hover:bg-white/5' 
                             : 'bg-slate-900 border-white/5 shadow-sm hover:bg-slate-800'
                        } cursor-pointer overflow-hidden`}
                      >
                        <div className="flex gap-3">
                           <div className="shrink-0 mt-0.5">
                              {notif.severity === 'CRITICAL' ? <ShieldAlert size={16} className="text-red-500" /> :
                               notif.severity === 'WARNING' ? <AlertCircle size={16} className="text-amber-500" /> :
                               notif.severity === 'SUCCESS' ? <CheckCircle2 size={16} className="text-emerald-500" /> :
                               <Info size={16} className="text-blue-400" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-1">
                                 <div className={`font-black text-[11px] uppercase tracking-wide truncate ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                                    {notif.title}
                                 </div>
                                 {!notif.is_read && <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />}
                              </div>
                              <div className="text-gray-400 text-xs mt-0.5 line-clamp-2 font-medium leading-relaxed">{notif.message}</div>
                              <div className="flex items-center justify-between mt-2">
                                 {notif.site_name ? (
                                    <span className="text-[9px] font-bold bg-white/10 px-1.5 py-0.5 rounded uppercase text-gray-300">{notif.site_name}</span>
                                 ) : <div />}
                                 <span className="text-[9px] font-mono text-gray-600">
                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2.5 border-t border-white/5 bg-slate-950">
                  <button onClick={() => { setIsNotificationsOpen(false); navigate("/notifications"); }} className="w-full py-2 rounded-lg border border-white/10 hover:border-white/20 text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-colors">
                    Open Control Center
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-px bg-dark-border"></div>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium text-white group-hover:text-slate-200 transition-colors">{user?.name || "Guest User"}</span>
              <span className="text-[10px] uppercase font-bold text-primary/80">{user?.role || "No Role"}</span>
            </div>
            <img 
              src={user?.avatar_url || "https://i.pravatar.cc/150?u=guest"} 
              alt="User avatar" 
              className="h-9 w-9 rounded-md border border-white/5 object-cover shadow-sm transition-transform group-hover:scale-105"
            />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="absolute right-0 mt-2 w-48 rounded-lg border border-white/5 bg-slate-950/95 backdrop-blur-xl shadow-xl z-[100] p-1 profile-dropdown"
              >
                <div className="p-2 border-b border-white/5 sm:hidden">
                  <p className="text-sm font-medium text-white">{user?.name || "Guest User"}</p>
                  <p className="text-[10px] uppercase font-bold text-primary">{user?.role || "No Role"}</p>
                </div>
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-all duration-150 cursor-pointer group"
                  >
                    <User size={14} className="transition-transform group-hover:scale-105" /> Profile
                  </button>
                  <button 
                    onClick={() => { setIsProfileOpen(false); navigate("/settings"); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-all duration-150 cursor-pointer group"
                  >
                    <SettingsIcon size={14} className="transition-transform group-hover:rotate-12" /> Settings
                  </button>
                  <div className="h-px w-full bg-white/5 my-1"></div>
                  
                  {/* Premium Segmented Theme Toggle */}
                  <div className="px-1.5 py-1">
                    <div className="flex items-center justify-between gap-1 rounded-md bg-slate-900/60 p-0.5 border border-white/5">
                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                          theme === "dark"
                            ? "bg-primary/25 text-primary border border-primary/20 shadow-sm"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">🌙</span> Dark
                      </button>
                      <button
                        onClick={() => setTheme("light")}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded transition-all cursor-pointer ${
                          theme === "light"
                            ? "bg-slate-200 text-slate-800 border border-slate-300 shadow-sm"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs">☀️</span> Light
                      </button>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/5 my-1"></div>
                  <button 
                    onClick={() => { setIsProfileOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 rounded-md transition-all duration-150 cursor-pointer"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
});
