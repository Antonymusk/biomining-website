import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import toast from 'react-hot-toast'
import { AuthProvider } from './lib/AuthContext'
import { AppearanceProvider } from './lib/AppearanceContext'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

// Developer Console Utility: Safe Service Worker Unregister Logic
window.unregisterBioMineSW = async () => {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
    }
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
    console.log("[BioMine SW] Successfully unregistered service worker and cleared all caches.");
    toast.success("Service worker unregistered & caches cleared successfully!");
  } catch (err) {
    console.error("[BioMine SW] Failed to unregister:", err);
    toast.error("Failed to unregister service worker.");
  }
};

// Production PWA Service Worker Registration with Hot Update Prompts
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[BioMine SW] Registered successfully with scope:", reg.scope);

        // Detect update availability and trigger explicit manual update toast
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                toast(
                  (t) => (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-white">⚡ New BioMine update is available!</span>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          window.location.reload();
                        }}
                        className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                      >
                        Refresh Now
                      </button>
                    </div>
                  ),
                  { duration: Infinity, position: "bottom-left" }
                );
              }
            };
          }
        };
      })
      .catch((err) => {
        console.error("[BioMine SW] Registration failed:", err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppearanceProvider>
        <App />
        <SpeedInsights />
        <Analytics />
      </AppearanceProvider>
    </AuthProvider>
  </StrictMode>
);
