import { useAuth } from "../../lib/AuthContext";
import { AlertTriangle } from "lucide-react";

export function ProtectedRoute({ children, module }) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // If no user exists in DB yet, allow access so the app isn't completely locked out during initial setup
  if (!user) {
    return children;
  }

  if (module && !hasPermission(module)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center bg-dark-card/50 rounded-2xl border border-dark-border m-4 p-8">
        <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="text-danger" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Access Restricted</h2>
        <p className="text-gray-400 max-w-md">
          Your current role (<span className="text-white font-medium">{user.roles?.name}</span>) does not have permission to view the <span className="text-primary font-medium">{module}</span> module.
        </p>
      </div>
    );
  }

  return children;
}
