import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

export function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-dark-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
      </div>
    );
  }

  // If already logged in, redirect to dashboard
  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background Animated Gradient Blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[150px]" />
      </div>
      
      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-4">
            <span className="text-3xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white neon-text">BioMine</h1>
          <p className="text-gray-400 mt-2">Operational Intelligence Dashboard</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
