import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

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
      
      // Navigate to home. AuthContext will handle session change.
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 backdrop-blur-xl bg-dark-card/80 border-dark-border shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Sign In</h2>
      
      {error && (
        <div className="mb-6 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              id="login_email"
              name="email"
              autoComplete="username"
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-dark-bg/50 focus:bg-dark-bg" 
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-400">Password</label>
            <Link to="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              id="login_password"
              name="password"
              autoComplete="current-password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-dark-bg/50 focus:bg-dark-bg" 
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-2 h-12 text-base font-medium"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <Link to="/signup" className="text-primary hover:underline font-medium">
          Create account
        </Link>
      </p>
    </Card>
  );
}
