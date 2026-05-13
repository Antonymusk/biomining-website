import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { motion } from "framer-motion";

// Cinematic Spinning Turbine Illustration matching design
const AtmosphericGraphic = () => (
  <div className="relative w-72 h-72 flex items-center justify-center">
    {/* Concentric orbit rings */}
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 border border-dashed border-primary/20 rounded-full"
    />
    <motion.div 
      animate={{ rotate: -360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute inset-8 border border-cyan-500/10 rounded-full"
    />
    
    {/* Dynamic Floating Particles */}
    <motion.div 
      animate={{ y: [0, -12, 0], opacity: [0.3, 0.8, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-6 left-16 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
    />
    <motion.div 
      animate={{ x: [0, 15, 0], opacity: [0.2, 0.6, 0.2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      className="absolute bottom-16 right-12 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
    />
    <motion.div 
      className="absolute top-28 right-6 w-4 h-4 rounded-full border border-cyan-500/20 flex items-center justify-center"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="w-1.5 h-1.5 bg-cyan-500/30 rounded-full" />
    </motion.div>

    {/* Rotating Turbine blades */}
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      className="relative z-10 w-48 h-48 flex items-center justify-center"
    >
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-[0_0_30px_rgba(6,182,212,0.25)]">
        <defs>
          <linearGradient id="turbineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* The central axis disc */}
        <circle cx="100" cy="100" r="14" fill="#0891b2" className="animate-pulse" />
        <circle cx="100" cy="100" r="6" fill="#ffffff" />

        {/* Curved Aerodynamic Blades resembling reference image */}
        <g transform="rotate(0 100 100)">
          <path d="M100,86 C95,70 80,42 100,16 C120,42 105,70 100,86 Z" fill="url(#turbineGrad)" />
        </g>
        <g transform="rotate(90 100 100)">
          <path d="M100,86 C95,70 80,42 100,16 C120,42 105,70 100,86 Z" fill="url(#turbineGrad)" />
        </g>
        <g transform="rotate(180 100 100)">
          <path d="M100,86 C95,70 80,42 100,16 C120,42 105,70 100,86 Z" fill="url(#turbineGrad)" />
        </g>
        <g transform="rotate(270 100 100)">
          <path d="M100,86 C95,70 80,42 100,16 C120,42 105,70 100,86 Z" fill="url(#turbineGrad)" />
        </g>
      </svg>
    </motion.div>
  </div>
);

export function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-dark-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 md:p-8 relative overflow-hidden auth-layout-root">
      {/* Global Atmospheric Background Mesh Motion */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-80">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[140px] animate-ambient-1" />
        <div className="absolute -bottom-40 -right-40 h-[700px] w-[700px] rounded-full bg-accent/10 blur-[160px] animate-ambient-2" />
      </div>
      
      {/* Massive Premium Split Panel Box */}
      <div className="w-full max-w-5xl bg-[#131b2e]/90 border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row z-10 min-h-[620px] backdrop-blur-2xl auth-card">
        
        {/* LEFT: Interactive Cinematic Atmospheric Space */}
        <div className="hidden lg:flex lg:w-[48%] flex-col items-center justify-between p-14 relative bg-slate-950/40 border-r border-white/5 overflow-hidden auth-left-panel">
          {/* Decorative background grid light */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.005)_35%,rgba(255,255,255,0.02)_40%,rgba(255,255,255,0.005)_45%,transparent_60%)] pointer-events-none" />
          
          {/* Logo Header placeholder top-left for balance */}
          <div className="w-full flex items-center gap-2 opacity-75 scale-90 origin-left">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black">
              B
            </div>
            <span className="text-xs font-bold tracking-[0.3em] text-slate-200 uppercase">BioMine</span>
          </div>

          {/* Central graphic */}
          <div className="my-auto flex items-center justify-center w-full">
            <AtmosphericGraphic />
          </div>

          {/* Cinematic Bold Tagline */}
          <div className="w-full text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-[1.25] tracking-tight text-white">
              Turning <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Environmental</span> Challenges into Intelligent Opportunities.
            </h2>
          </div>
        </div>

        {/* RIGHT: Authentic Form Container */}
        <div className="w-full lg:w-[52%] flex flex-col justify-center items-center p-8 sm:p-14 md:p-16 relative auth-right-panel">
          {/* Renders actual dynamic input forms (Login.jsx / Signup.jsx) */}

          {/* Renders actual input forms (Login.jsx / Signup.jsx) */}
          <div className="w-full max-w-sm z-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
