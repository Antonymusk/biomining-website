import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { AlertTriangle, Clock, ShieldAlert, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export function ProtectedRoute({ children, module }) {
  const { session, user, loading, hasPermission, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-dark-bg z-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-gray-400 font-medium">Authenticating BioMine OS...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // ABSOLUTE SUPER ADMIN BYPASS
  // Prevents governance deadlock by immediately fulfilling traversal if role elevates to master controller.
  if (user && user.role === 'Super Admin') {
    return children;
  }

  // Intercept Pending Approval State
  if (user && user.approval_status === "Pending") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-dark-bg p-6 relative overflow-hidden">
        {/* Background Ambient Pulsing Backdrops */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[130px] animate-pulse" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card max-w-lg w-full text-center p-8 rounded-2xl border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.05)] z-10"
        >
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
            <Clock className="text-amber-500 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Pending Approval</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Your registration is successful. However, new accounts enter a <strong className="text-amber-500">Pending Approval</strong> state. A BioMine Administrator must manually approve your account and assign your operational site and role.
          </p>
          <div className="bg-dark-bg/40 border border-dark-border/40 rounded-xl p-4 mb-6 text-left text-xs space-y-2">
            <p className="text-gray-400">User Email: <span className="text-white font-mono">{user.email}</span></p>
            <p className="text-gray-400">Status: <span className="text-amber-500 font-semibold uppercase">Pending System Admin Review</span></p>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 rounded-lg font-medium transition-all duration-150 cursor-pointer text-sm"
          >
            <LogOut size={16} /> Disconnect Session
          </button>
        </motion.div>
      </div>
    );
  }

  // Intercept Suspended State
  if (user && (user.suspended || user.approval_status === "Rejected")) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-dark-bg p-6 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card max-w-lg w-full text-center p-8 rounded-2xl border border-danger/20 shadow-[0_0_30px_rgba(239,68,68,0.05)] z-10"
        >
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-danger/30">
            <ShieldAlert className="text-danger" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Account Suspended</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Access restricted. Your account has been suspended or access has been revoked by a BioMine administrator. Please contact your operations supervisor.
          </p>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-2 h-10 px-4 bg-danger/15 hover:bg-danger/25 text-danger border border-danger/40 rounded-lg font-medium transition-all duration-150 cursor-pointer text-sm"
          >
            <LogOut size={16} /> Disconnect Session
          </button>
        </motion.div>
      </div>
    );
  }

  // Handle Module Restriction
  if (module && !hasPermission(module)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center bg-dark-card/50 rounded-2xl border border-dark-border m-4 p-8">
        <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-danger" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Access Restricted</h2>
        <p className="text-gray-400 max-w-md text-sm">
          Your current role (<span className="text-white font-medium">{user?.role || "None"}</span>) does not have permission to view the <span className="text-primary font-medium">{module}</span> module.
        </p>
      </div>
    );
  }

  return children;
}
