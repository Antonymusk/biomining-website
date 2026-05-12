import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Target, TrendingUp, Fuel, Gauge, AlertTriangle, Building2, Settings } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { useSites } from "../../hooks/useSites";
import toast from "react-hot-toast";

const DEFAULT_TARGETS = {
  dailyDisposal: 350,
  weeklyProduction: 2450,
  monthlyProduction: 10500,
  fuelEfficiency: 0.60,
  fleetUtilization: 85,
  warningThreshold: 75,
  criticalThreshold: 90,
  fuelVarianceTolerance: 5
};

export default function OperationalTargets() {
  const { sites, loading } = useSites();
  const [selectedSite, setSelectedSite] = useState("");
  const [targets, setTargets] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Automatically pick first active site when loading finishes
  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0].name);
    }
  }, [sites, selectedSite]);

  useEffect(() => {
    if (!selectedSite) return;
    const saved = localStorage.getItem(`biomine_targets_${selectedSite}`);
    if (saved) {
      setTargets(JSON.parse(saved));
    } else {
      setTargets({ ...DEFAULT_TARGETS });
    }
  }, [selectedSite]);

  const handleInputChange = (field, value) => {
    setTargets(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Artificial delay for enterprise feel
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (targets.warningThreshold >= targets.criticalThreshold) {
      toast.error("Critical threshold must be higher than warning threshold.");
      setIsSaving(false);
      return;
    }

    localStorage.setItem(`biomine_targets_${selectedSite}`, JSON.stringify(targets));
    toast.success(`Operational targets for ${selectedSite} updated successfully!`, {
      icon: '🎯',
      style: {
        background: '#0f172a',
        color: '#3b82f6',
        border: '1px solid #1e293b'
      }
    });
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        <motion.div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
        Synching with active infrastructure...
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <Card className="border-dashed border-white/10 h-80 flex flex-col items-center justify-center text-center p-6 bg-slate-950/20">
        <div className="bg-slate-900 p-4 rounded-full text-slate-600 mb-4 shadow-inner">
          <Building2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">No Operational Sites Detected</h3>
        <p className="text-slate-400 text-sm max-w-sm mb-6">You must establish valid infrastructure directives before generating operational quota matrices.</p>
        
        <div className="flex gap-3">
           <p className="text-xs text-slate-500 flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-white/5">
             <Settings size={14} /> Navigate to "Site Configuration" tab above.
           </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="text-primary" size={22} />
            Operational Targets
          </h2>
          <p className="text-sm text-slate-400">Configure intelligence thresholds and production quotas.</p>
        </div>
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="bg-slate-900/50 border border-white/10 text-white rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary min-w-[200px]"
        >
          {sites.map(site => (
            <option key={site.id} value={site.name} className="bg-slate-900">{site.name} ({site.zone})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Targets */}
        <Card className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Production Quotas</h3>
              <p className="text-xs text-slate-400">Define site disposal and conversion capacities.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Daily Disposal Target</label>
                <span className="text-primary font-mono">{targets.dailyDisposal} Tons</span>
              </div>
              <input 
                type="number" 
                value={targets.dailyDisposal} 
                onChange={(e) => handleInputChange('dailyDisposal', e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-white outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Weekly Production Target</label>
                <span className="text-primary font-mono">{targets.weeklyProduction} Tons</span>
              </div>
              <input 
                type="number" 
                value={targets.weeklyProduction} 
                onChange={(e) => handleInputChange('weeklyProduction', e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-white outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Monthly Production Target</label>
                <span className="text-primary font-mono">{targets.monthlyProduction} Tons</span>
              </div>
              <input 
                type="number" 
                value={targets.monthlyProduction} 
                onChange={(e) => handleInputChange('monthlyProduction', e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-white outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </Card>

        {/* Efficiency & Utilisation */}
        <Card className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Fuel size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Asset Efficiency</h3>
              <p className="text-xs text-slate-400">Monitor fuel economy and fleet allocation benchmarks.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Fuel Efficiency Limit</label>
                <span className="text-amber-400 font-mono">{targets.fuelEfficiency} L/T</span>
              </div>
              <input 
                type="number" 
                step="0.01"
                value={targets.fuelEfficiency} 
                onChange={(e) => handleInputChange('fuelEfficiency', e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Fleet Utilization Target</label>
                <span className="text-amber-400 font-mono">{targets.fleetUtilization}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100"
                value={targets.fleetUtilization} 
                onChange={(e) => handleInputChange('fleetUtilization', e.target.value)}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <label className="text-slate-300">Fuel Variance Tolerance</label>
                <span className="text-amber-400 font-mono">±{targets.fuelVarianceTolerance}%</span>
              </div>
              <input 
                type="number" 
                value={targets.fuelVarianceTolerance} 
                onChange={(e) => handleInputChange('fuelVarianceTolerance', e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>
        </Card>

        {/* System Thresholds */}
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <Gauge size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Intelligence Monitoring Thresholds</h3>
              <p className="text-xs text-slate-400">Set system-wide alerts trigger points based on target fulfillment divergence.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning Threshold
                  </label>
                  <span className="text-amber-400 font-mono">{targets.warningThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100"
                  value={targets.warningThreshold} 
                  onChange={(e) => handleInputChange('warningThreshold', e.target.value)}
                  className="w-full accent-amber-500"
                />
                <p className="text-[10px] text-slate-500">System will generate passive operational advisory alerts when reached.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Critical Threshold
                  </label>
                  <span className="text-red-500 font-mono">{targets.criticalThreshold}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100"
                  value={targets.criticalThreshold} 
                  onChange={(e) => handleInputChange('criticalThreshold', e.target.value)}
                  className="w-full accent-red-500"
                />
                <p className="text-[10px] text-slate-500">System will initiate active managerial intervention alerts.</p>
              </div>
            </div>
          </div>

          {targets.warningThreshold >= targets.criticalThreshold && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs"
            >
              <AlertTriangle size={16} />
              Configuration logic violation: Critical threshold must exceed warning threshold for valid alert sequence propagation.
            </motion.div>
          )}
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/5">
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={isSaving || targets.warningThreshold >= targets.criticalThreshold}
          className="gap-2"
        >
          <Save size={16} className={isSaving ? "animate-spin" : ""} />
          {isSaving ? "Propagating..." : `Deploy Targets to ${selectedSite}`}
        </Button>
      </div>
    </div>
  );
}
