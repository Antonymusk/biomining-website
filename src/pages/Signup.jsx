import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;
      
      // Assuming email confirmation is off or auto-sign in is handled
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 backdrop-blur-xl bg-dark-card/80 border-dark-border shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
      
      {error && (
        <div className="mb-6 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              id="signup_name"
              name="name"
              autoComplete="name"
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 bg-dark-bg/50 focus:bg-dark-bg" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              id="signup_email"
              name="email"
              autoComplete="email"
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
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <Input 
              id="signup_password"
              name="password"
              autoComplete="new-password"
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-dark-bg/50 focus:bg-dark-bg" 
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">Must be at least 6 characters.</p>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full mt-2 h-12 text-base font-medium"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Create Account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </Card>
  );
}
