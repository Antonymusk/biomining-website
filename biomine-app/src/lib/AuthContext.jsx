import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Mock login by fetching the first user.
      const { data: users, error } = await supabase
        .from("users")
        .select("*, roles(*)")
        .limit(1);
        
      if (error) throw error;
      
      if (users && users.length > 0) {
        setUser(users[0]);
      } else {
        console.warn("No users found in database.");
      }
    } catch (err) {
      console.error("Auth fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const hasPermission = (moduleName) => {
    if (!user || !user.roles || !user.roles.permissions) return false;
    if (user.roles.permissions.includes("All Modules")) return true;
    return user.roles.permissions.includes(moduleName);
  };

  // Allow forcing a refresh (e.g. after changing roles in settings)
  const refreshUser = () => {
    setLoading(true);
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
