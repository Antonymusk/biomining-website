import { useState } from "react";
import { Search, Bell, Menu, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { Input } from "../ui/Input";
import { useAuth } from "../../lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function TopHeader({ setIsMobileOpen, title = "Dashboard", subtitle = "Overview" }) {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-dark-border bg-dark-bg/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{title}</h1>
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

        <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-dark-border hover:text-white">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
        </button>

        <div className="h-8 w-px bg-dark-border"></div>

        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium text-white">{user?.name || "Guest User"}</span>
              <span className="text-xs text-primary">{user?.roles?.name || "No Role"}</span>
            </div>
            <img 
              src={user?.avatar_url || "https://i.pravatar.cc/150?u=guest"} 
              alt="User avatar" 
              className="h-10 w-10 rounded-xl border border-dark-border object-cover"
            />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-dark-border bg-dark-card shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-dark-border sm:hidden">
                    <p className="text-sm font-medium text-white">{user?.name || "Guest User"}</p>
                    <p className="text-xs text-primary">{user?.roles?.name || "No Role"}</p>
                  </div>
                  <div className="p-1">
                    <button 
                      onClick={() => { setIsProfileOpen(false); /* Profile modal can go here */ }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-border/50 rounded-lg transition-colors"
                    >
                      <User size={16} /> Profile
                    </button>
                    <button 
                      onClick={() => { setIsProfileOpen(false); navigate("/settings"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-border/50 rounded-lg transition-colors"
                    >
                      <SettingsIcon size={16} /> Settings
                    </button>
                    <div className="h-px w-full bg-dark-border my-1"></div>
                    <button 
                      onClick={() => { setIsProfileOpen(false); alert("Logout clicked"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
