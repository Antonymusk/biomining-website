import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy load heavy page modules
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MISEntry = lazy(() => import("./pages/MISEntry"));
const Operations = lazy(() => import("./pages/Operations"));
const FleetControl = lazy(() => import("./pages/FleetControl"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const AlertCenter = lazy(() => import("./pages/AlertCenter"));
const DriverManagement = lazy(() => import("./pages/DriverManagement"));
const RequisitionCenter = lazy(() => import("./pages/RequisitionCenter"));
const MaintenanceCenter = lazy(() => import("./pages/MaintenanceCenter"));
const RecycleBin = lazy(() => import("./pages/RecycleBin"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Manpower = lazy(() => import("./pages/Manpower"));
const Notifications = lazy(() => import("./pages/Notifications"));
import { AuthProvider } from "./lib/AuthContext";
import { NotificationProvider } from "./lib/NotificationContext";
import ConnectionStatus from "./components/layout/ConnectionStatus";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [dismissOffline, setDismissOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissOffline(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
      <ErrorBoundary>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#1e293b', 
            color: '#f8fafc', 
            border: '1px solid #334155' 
          } 
        }} 
      />
      <ConnectionStatus />

      {!isOnline && !dismissOffline && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6 text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-6 animate-pulse border border-warning/20">
            <span className="text-warning text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">BioMine is Offline</h2>
          <p className="text-gray-400 text-sm max-w-md mb-6">
            Uplink connection compromised. Your local operational entries and logs are being securely buffered locally and will automatically synchronize once connection is restored.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setDismissOffline(true)}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg"
            >
              Continue Offline
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 border border-white/10 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen w-full bg-dark-bg text-primary">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<ProtectedRoute module="Dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="mis-entry" element={<ProtectedRoute module="MIS Entry"><MISEntry /></ProtectedRoute>} />
              <Route path="operations" element={<ProtectedRoute module="Operations"><Operations /></ProtectedRoute>} />
              <Route path="fleet-control" element={<ProtectedRoute module="Fleet Control"><FleetControl /></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute module="Inventory"><Inventory /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute module="Analytics"><Analytics /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute module="Reports"><Reports /></ProtectedRoute>} />
              <Route path="alert-center" element={<ProtectedRoute module="Alert Center"><AlertCenter /></ProtectedRoute>} />
              <Route path="drivers" element={<ProtectedRoute module="Drivers"><DriverManagement /></ProtectedRoute>} />
              <Route path="manpower" element={<ProtectedRoute module="Manpower"><Manpower /></ProtectedRoute>} />
              <Route path="requisition-center" element={<ProtectedRoute module="Procurement"><RequisitionCenter /></ProtectedRoute>} />
              <Route path="maintenance" element={<ProtectedRoute module="Maintenance"><MaintenanceCenter /></ProtectedRoute>} />
              <Route path="recycle-bin" element={<ProtectedRoute module="Recycle Bin"><RecycleBin /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute module="Settings"><Settings /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute module="Profile"><Profile /></ProtectedRoute>} />
              <Route path="user-management" element={<ProtectedRoute module="User Management"><UserManagement /></ProtectedRoute>} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <SpeedInsights />
      </ErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
