import { useState, useEffect } from "react";
import { Palette, Moon, Sun, Maximize2, Minimize2, Type, LayoutTemplate, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";
import toast from "react-hot-toast";
import { useAppearance } from "../../lib/AppearanceContext";

export default function Appearance() {
  const { settings, updateSettings } = useAppearance();

  const updateSetting = (key, value) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Palette className="text-pink-500" size={22} />
          Visual Appearance Center
        </h2>
        <p className="text-sm text-slate-400">Personalize core ergonomic and performance display vectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode Selector */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <Sun size={14} className="text-amber-400" /> Core Atmosphere
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => updateSetting("theme", "dark")}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                settings.theme === "dark" 
                  ? "bg-blue-600/10 border-blue-500/50 text-white" 
                  : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="w-full aspect-video bg-slate-950 rounded-lg border border-white/10 flex items-center justify-center shadow-inner">
                <Moon className={settings.theme === "dark" ? "text-blue-400" : "text-slate-700"} />
              </div>
              <span className="text-xs font-medium">Deep Dark (Def)</span>
            </button>

            <button 
              onClick={() => updateSetting("theme", "light")}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                settings.theme === "light" 
                  ? "bg-white/10 border-slate-300 text-white" 
                  : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="w-full aspect-video bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center shadow-inner">
                <Sun className={settings.theme === "light" ? "text-amber-600" : "text-slate-400"} />
              </div>
              <span className="text-xs font-medium">Enterprise Light</span>
            </button>
          </div>
        </Card>

        {/* UI Density */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <LayoutTemplate size={14} className="text-indigo-400" /> Informational Density
          </h3>
          
          <div className="space-y-2">
            {[
              { id: "compact", label: "Compact Grid", desc: "Maximized information triage. Minimal padding.", icon: Minimize2 },
              { id: "comfortable", label: "Balanced Comfortable", desc: "Default workspace ergonomics.", icon: Maximize2 }
            ].map((d) => (
              <label key={d.id} className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                settings.density === d.id ? "bg-indigo-600/10 border-indigo-500/40" : "bg-slate-950/30 border-white/5 hover:bg-slate-900/50"
              }`}>
                <input 
                  type="radio" name="density" checked={settings.density === d.id}
                  onChange={() => updateSetting("density", d.id)}
                  className="hidden"
                />
                <div className={`p-2 rounded ${settings.density === d.id ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-500"}`}>
                  <d.icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{d.label}</div>
                  <div className="text-[10px] text-slate-400">{d.desc}</div>
                </div>
                {settings.density === d.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
              </label>
            ))}
          </div>
        </Card>

        {/* Optics */}
        <Card className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-pink-400" /> Rendering Engine
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm text-white font-medium">Atmospheric Motion</div>
                <div className="text-xs text-slate-500">Toggle dynamic layer translations</div>
              </div>
              <button 
                onClick={() => updateSetting("reduceMotion", !settings.reduceMotion)}
                className={`w-10 h-5 rounded-full transition-all relative border border-white/10 ${!settings.reduceMotion ? "bg-blue-600" : "bg-slate-800"}`}
              >
                <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all ${!settings.reduceMotion ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-sm">
                <label className="text-white font-medium">Glass Refraction</label>
                <span className="text-xs font-mono text-pink-400">{settings.glassIntensity}px</span>
              </div>
              <input 
                type="range" min="0" max="40" step="4"
                value={settings.glassIntensity}
                onChange={(e) => updateSetting("glassIntensity", e.target.value)}
                className="w-full accent-pink-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                <span>MATTE</span>
                <span>FROSTED</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
            <Type size={14} className="text-teal-400" /> Typography Matrix
          </h3>
          
          <div className="bg-slate-950/50 rounded-xl p-6 border border-white/5 text-center space-y-3 relative overflow-hidden group">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <p className="text-slate-400 font-medium transition-all relative" style={{ fontSize: `${settings.fontSize}px` }}>
               The quick brown fox jumps over the intelligent dashboard.
             </p>
             <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">Font Scaling Reference</p>
          </div>

          <div className="flex gap-2">
            {["13", "14", "15", "16"].map((size) => (
              <button
                key={size}
                onClick={() => updateSetting("fontSize", size)}
                className={`flex-1 py-2 rounded-lg border text-sm font-bold font-mono transition-all ${
                  settings.fontSize === size 
                    ? "bg-teal-500/10 border-teal-500/40 text-teal-400" 
                    : "bg-slate-950/30 border-white/5 text-slate-500 hover:text-slate-300"
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
