import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import MISEntry from "./pages/MISEntry";
import Operations from "./pages/Operations";
import FleetControl from "./pages/FleetControl";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import { AuthProvider } from "./lib/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ProtectedRoute module="Dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="mis-entry" element={<ProtectedRoute module="MIS Entry"><MISEntry /></ProtectedRoute>} />
            <Route path="operations" element={<ProtectedRoute module="Operations"><Operations /></ProtectedRoute>} />
            <Route path="fleet-control" element={<ProtectedRoute module="Fleet Control"><FleetControl /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute module="Inventory"><Inventory /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute module="Analytics"><Analytics /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute module="Reports"><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute module="Settings"><Settings /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
