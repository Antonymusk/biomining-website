import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast.error("Google Enterprise SSO is disabled for this local cluster. Please sign in with email.", {
      icon: '🔐',
      style: { borderRadius: '12px', background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' }
    });
  };

  return (
    <div className="w-full">
      {/* Page Branding Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-5">
          <span className="text-2xl font-black text-white">B</span>
        </div>
        
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">
          Login to your Account
        </h1>
        <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
          Enter your credentials to access the operational intelligence platform
        </p>
      </div>

      {/* Premium Google Social SignIn mock button */}
      <button 
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full h-12 bg-[#0f172a]/40 hover:bg-[#0f172a]/80 border border-white/5 hover:border-white/10 text-slate-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 font-medium text-xs shadow-sm active:scale-[0.99] select-none cursor-pointer"
      >
        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      {/* Dynamic Divider */}
      <div className="relative flex py-6 items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">or Sign in with Email</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>
      
      {error && (
        <div className="mb-5 bg-danger/10 border border-danger/20 text-danger px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-[11px] font-medium">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input 
              id="login_email"
              name="email"
              autoComplete="username"
              type="email" 
              placeholder="mail@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10.5 h-11 bg-[#0f172a]/50 border-white/5 focus:border-cyan-500/30 text-slate-200 text-sm placeholder-slate-600" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input 
              id="login_password"
              name="password"
              autoComplete="current-password"
              type="password" 
              placeholder="••••••••••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10.5 h-11 bg-[#0f172a]/50 border-white/5 focus:border-cyan-500/30 text-slate-200 text-sm placeholder-slate-600" 
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1.5 select-none">
          <label className="flex items-center gap-2 text-xs text-slate-400 font-medium cursor-pointer">
            <input type="checkbox" className="rounded border-white/10 bg-[#0f172a] text-cyan-600 focus:ring-0 h-3.5 w-3.5 cursor-pointer" />
            Remember Me
          </label>
          <Link to="#" onClick={() => toast("Contact system administrator to reset credentials.", { icon: '🎫' })} className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
            Forgot Password?
          </Link>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-500/90 hover:to-blue-600/90 text-white text-sm font-bold shadow-[0_4px_16px_rgba(6,182,212,0.15)] transition-all active:scale-[0.99]"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Access Dashboard"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <span className="text-xs text-slate-500 font-medium">Not Registered Yet? </span>
        <Link to="/signup" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
          Request Enterprise Access
        </Link>
      </div>
    </div>
  );
}
