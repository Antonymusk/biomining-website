import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend 
} from "recharts";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { 
  AlertTriangle, RefreshCw, Download, Filter, 
  TrendingUp, Droplets, Zap, Activity, Plus, Search, X, Check, ChevronDown,
  Sparkles, BrainCircuit, CheckSquare, Truck, FileSignature, Settings, ShieldAlert 
} from "lucide-react";
import { fetchAnalyticsData, processAnalytics, getSiteColor } from "../lib/analyticsService";
import * as XLSX from "xlsx";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useSites } from "../hooks/useSites";
import { siteService } from "../services/siteService";

export default function Analytics() {
  const [rawData, setRawData] = useState([]);
  const { sites: unifiedSites, loading: isSitesLoading, refetch: refetchUnifiedSites } = useSites();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State (with Local Storage Persistence)
  const [dateRange, setDateRange] = useState(() => localStorage.getItem("analyticsDateRange") || "all");
  const [selectedSites, setSelectedSites] = useState(() => {
    try {
      const saved = localStorage.getItem("analyticsSelectedSites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dropdown UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [siteSearch, setSiteSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Add Site Modal State
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [isSubmittingSite, setIsSubmittingSite] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview"); // 'overview' | 'fuel' | 'disposal' | 'fleet' | 'procurement'

  // Persist Filters
  useEffect(() => {
    localStorage.setItem("analyticsDateRange", dateRange);
    localStorage.setItem("analyticsSelectedSites", JSON.stringify(selectedSites));
  }, [dateRange, selectedSites]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus search when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsData();
      setRawData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Unified sites normalization
  const inventorySites = useMemo(() => {
    return unifiedSites.map(s => s.name);
  }, [unifiedSites]);

  // Auto-select all sites if none selected once loading concludes
  useEffect(() => {
    if (!isSitesLoading && selectedSites.length === 0 && inventorySites.length > 0) {
      setSelectedSites(inventorySites);
    }
  }, [isSitesLoading, inventorySites, selectedSites.length]);

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeSubscription('mis_entries', loadData);

  // Memoized Aggregation
  const { chartData, kpis } = useMemo(() => {
    return processAnalytics(rawData, dateRange, selectedSites);
  }, [rawData, dateRange, selectedSites]);

  const toggleSite = (site) => {
    setSelectedSites(prev => 
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    );
  };

  const selectAllSites = () => setSelectedSites(inventorySites);
  const clearAllSites = () => setSelectedSites([]);

  const handleAddSite = async (e) => {
    e.preventDefault();
    if (!newSiteName.trim()) return toast.error("Site name is required");
    if (inventorySites.includes(newSiteName.trim())) return toast.error("Site already exists");

    try {
      setIsSubmittingSite(true);
      await siteService.saveSite({ name: newSiteName.trim(), status: "Active", zone: "Unassigned" });
      
      toast.success("Operational site profile provisioned.");
      setShowSiteModal(false);
      setNewSiteName("");
      // Refresh unified hook list across app
      window.dispatchEvent(new Event("biomine_sites_updated"));
    } catch (err) {
      console.error(err);
      toast.error("Failed to configure node profile.");
    } finally {
      setIsSubmittingSite(false);
    }
  };

  const exportToExcel = () => {
    if (chartData.length === 0) return toast.error("No data to export");
    const worksheet = XLSX.utils.json_to_sheet(chartData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analytics");
    XLSX.writeFile(workbook, `Analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredDropdownSites = inventorySites.filter(site => 
    site.toLowerCase().includes(siteSearch.toLowerCase())
  );

  // Chip Collapse Logic for embedded chips
  const MAX_VISIBLE_CHIPS = 2;
  const visibleChips = selectedSites.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenChipsCount = selectedSites.length - MAX_VISIBLE_CHIPS;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-dark-bg/50 rounded-xl border border-danger/20 p-6">
        <AlertTriangle className="text-danger mb-4" size={48} />
        <h3 className="text-lg font-medium text-white mb-2">Error loading analytics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Operational Analytics</h2>
          <p className="text-gray-400 text-sm">Dynamic insights and site comparisons</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button onClick={() => setShowSiteModal(true)} variant="outline" className="flex-1 md:flex-none whitespace-nowrap">
            <Plus size={16} className="mr-2" /> Add Site
          </Button>
          <Button onClick={exportToExcel} disabled={loading || chartData.length === 0} variant="primary" className="flex-1 md:flex-none whitespace-nowrap">
            <Download size={16} className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* ENTERPRISE INTELLIGENCE TABS */}
      <div className="flex flex-wrap gap-2 bg-dark-bg/40 p-1.5 rounded-xl border border-dark-border/50 backdrop-blur-md">
        {[
          { id: "overview", label: "Executive Overview", count: "KPIs" },
          { id: "fuel", label: "Fuel Intelligence", count: "L/T" },
          { id: "disposal", label: "Disposal Productivity", count: "Tons" },
          { id: "fleet", label: "Fleet & Maintenance", count: "SLA" },
          { id: "procurement", label: "Procurement & SLA", count: "99%" },
          { id: "comparison", label: "Executive Site Comparison", count: "VS" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
              currentTab === tab.id 
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-primary/40' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${currentTab === tab.id ? 'bg-white/20 text-white' : 'bg-dark-border text-gray-500'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <Card className="flex flex-col xl:flex-row items-start xl:items-center gap-4 p-4 z-10 relative bg-dark-bg/40 backdrop-blur-md border-dark-border/60">
        <div className="flex items-center gap-2 min-w-max">
          <Filter size={16} className="text-primary/80" />
          <span className="text-gray-300 font-medium text-sm tracking-wide">Filters:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {/* Date Range Selector */}
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 rounded-lg border border-dark-border bg-dark-bg/60 px-3 py-1 text-xs text-gray-200 focus:outline-none focus:border-primary/60 focus:shadow-[0_0_10px_rgba(59,130,246,0.15)] transition-all min-w-[130px] cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days (Weekly)</option>
            <option value="30d">Last 30 Days (Monthly)</option>
            <option value="90d">Last 90 Days (Quarterly)</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year (Yearly)</option>
          </select>

          {/* Compact Tech-Style Site Selector */}
          <div className="relative flex-1 max-w-[420px]" ref={dropdownRef}>
            <div 
              className={`h-9 rounded-lg border bg-dark-bg/60 px-2.5 flex items-center justify-between cursor-pointer transition-all duration-200 w-full ${isDropdownOpen ? 'border-primary/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]' : 'border-dark-border hover:border-gray-600'}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {selectedSites.length === 0 ? (
                <span className="text-xs text-gray-500 flex-1 px-1">Select sites...</span>
              ) : (
                <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                  {/* Collapsed view logic: show chips, or summarize if many */}
                  {!isDropdownOpen && selectedSites.length > 2 ? (
                    <div className="text-xs text-gray-300 font-medium px-1">
                      {selectedSites.length} Sites Selected
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <AnimatePresence>
                        {visibleChips.map((site, idx) => {
                          const color = getSiteColor(site, idx);
                          return (
                            <motion.div
                              key={site}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                              className="flex items-center gap-1 px-2 py-[2px] rounded border whitespace-nowrap"
                              style={{ 
                                backgroundColor: `${color}15`, 
                                borderColor: `${color}30`,     
                                color: color
                              }}
                              onClick={(e) => { e.stopPropagation(); toggleSite(site); }}
                            >
                              <span className="text-[10px] font-semibold tracking-wide truncate max-w-[80px]" title={site}>{site}</span>
                              <X size={10} className="hover:opacity-100 opacity-60 transition-opacity ml-0.5" />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {hiddenChipsCount > 0 && (
                        <div 
                          className="px-1.5 py-[2px] rounded text-[10px] font-semibold bg-dark-border/40 text-gray-400 whitespace-nowrap shrink-0 border border-dark-border/50 cursor-help"
                          title={`${hiddenChipsCount} additional site(s) selected`}
                        >
                          +{hiddenChipsCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-dark-border/40 shrink-0">
                {selectedSites.length > 0 && (
                  <div 
                    className="p-0.5 hover:bg-white/10 rounded-md transition-colors cursor-pointer opacity-50 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); clearAllSites(); }}
                    title="Clear All"
                  >
                    <X size={12} className="text-white" />
                  </div>
                )}
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
              </div>
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -4, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: -4, scale: 0.98 }} 
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[260px] bg-[#151b28] border border-dark-border/80 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-dark-border/50 bg-black/20">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Search sites..." 
                        value={siteSearch}
                        onChange={(e) => setSiteSearch(e.target.value)}
                        className="w-full bg-dark-bg/60 border border-dark-border/50 rounded-md pl-7 pr-3 py-1.5 text-xs text-gray-200 outline-none focus:border-primary/50 focus:bg-dark-bg transition-colors"
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    {filteredDropdownSites.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-xs">No sites found</div>
                    ) : (
                      filteredDropdownSites.map(site => {
                        const isSelected = selectedSites.includes(site);
                        return (
                          <div 
                            key={site} 
                            onClick={() => toggleSite(site)}
                            className={`flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/5'}`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'border-gray-600'}`}>
                              {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <span className={`text-xs truncate ${isSelected ? 'text-primary font-medium' : 'text-gray-300'}`} title={site}>{site}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="p-1.5 border-t border-dark-border/50 flex justify-between bg-black/20">
                    <button onClick={selectAllSites} className="px-2 py-1 text-[10px] text-gray-400 hover:text-white rounded transition-colors font-medium">Select All</button>
                    <button onClick={clearAllSites} className="px-2 py-1 text-[10px] text-danger/80 hover:text-danger rounded transition-colors font-medium">Clear</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* KPI CARDS & CHARTS BY TAB */}
      {currentTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard loading={loading} title="Highest Production" data={kpis?.topProduction} unit="Tons" icon={<TrendingUp size={20} className="text-primary"/>} colorClass="primary" />
            <KPICard loading={loading} title="Lowest Diesel Usage" data={kpis?.lowestDiesel} unit="L" icon={<Droplets size={20} className="text-emerald-500"/>} colorClass="emerald-500" />
            <KPICard loading={loading} title="Highest Disposal" data={kpis?.topDisposal} unit="Tons" icon={<Activity size={20} className="text-amber-500"/>} colorClass="amber-500" />
            <KPICard loading={loading} title="Best Fuel Consumption" data={kpis?.bestFuelConsumption} unit="L/T" icon={<Zap size={20} className="text-violet-500"/>} colorClass="violet-500" isFloat />
          </div>

          {/* AI-Style Predictive Insights Box */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5 p-5 relative overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.05)]">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit size={120} className="text-primary" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-primary animate-pulse" size={20} />
              <h3 className="text-lg font-bold text-white">AI Predictive Insights & Anomaly Detections</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border/60 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase mb-1">
                  <Activity size={14} /> Site Production Risk
                </div>
                <p className="text-sm text-gray-200 font-medium">Delhi site is projected to miss its weekly disposal target by <span className="text-danger font-bold">8.4%</span> based on 3-day output dip.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border/60 hover:border-violet-500/30 transition-colors">
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs uppercase mb-1">
                  <Zap size={14} /> Fuel Efficiency Drop
                </div>
                <p className="text-sm text-gray-200 font-medium">Siliguri fuel consumption rate dropped by <span className="text-warning font-bold">12%</span> over the last 7 days due to rainy weather delays.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border/60 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase mb-1">
                  <Truck size={14} /> Anomalous Fleet Usage
                </div>
                <p className="text-sm text-gray-200 font-medium">Excavator <span className="text-emerald-400 font-semibold">PC140-02</span> exceeded benchmark fuel consumption rate for 5 consecutive days.</p>
              </div>
            </div>
          </Card>

          {/* Production Chart */}
          <Card className="min-w-0 overflow-hidden">
            <h3 className="text-lg font-medium text-white mb-4">Production Trend by Site</h3>
            <SafeChartContainer height="350px" minHeight="300px">
              {(width, height) => chartData.length > 0 ? (
                <ResponsiveContainer width={width} height={height}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{fill: '#1e293b', opacity: 0.4}} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {selectedSites.map((site, idx) => (
                      <Bar key={`prod_${site}`} dataKey={`prod_${site}`} name={`${site}`} fill={getSiteColor(site, idx)} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </SafeChartContainer>
          </Card>
        </div>
      )}

      {currentTab === "fuel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-primary flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-xl">
                <Droplets className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Fuel Logged</p>
                <h4 className="text-lg font-bold text-white">45,280 Liters</h4>
                <p className="text-xs text-primary font-medium">Across active operational centers</p>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500 flex items-start gap-4">
              <div className="bg-amber-500/20 p-3 rounded-xl">
                <AlertTriangle className="text-amber-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Avg Model Fuel Variance</p>
                <h4 className="text-lg font-bold text-white">+3.8% Deviation</h4>
                <p className="text-xs text-amber-500 font-medium">Against benchmark consumption profiles</p>
              </div>
            </Card>
          </div>

          <Card className="min-w-0 overflow-hidden">
            <h3 className="text-lg font-medium text-white mb-4">Diesel Consumption Trends</h3>
            <SafeChartContainer height="350px" minHeight="300px">
              {(width, height) => chartData.length > 0 ? (
                <ResponsiveContainer width={width} height={height}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {selectedSites.map((site, idx) => (
                      <Line key={`dies_${site}`} type="monotone" dataKey={`dies_${site}`} name={`${site}`} stroke={getSiteColor(site, idx)} strokeWidth={3} dot={{ fill: getSiteColor(site, idx), strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </SafeChartContainer>
          </Card>
        </div>
      )}

      {currentTab === "disposal" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-emerald-500 flex items-start gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl">
                <Activity className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Disposal Target Achievement</p>
                <h4 className="text-lg font-bold text-white">92.4% Achieved</h4>
                <p className="text-xs text-emerald-500 font-medium">Average across 12 monitoring sites</p>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-violet-500 flex items-start gap-4">
              <div className="bg-violet-500/20 p-3 rounded-xl">
                <TrendingUp className="text-violet-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Top Performing Site</p>
                <h4 className="text-lg font-bold text-white">{kpis?.topDisposal?.site || "Siliguri"}</h4>
                <p className="text-xs text-violet-500 font-medium">{kpis?.topDisposal?.val?.toLocaleString() || "3,200"} Tons Disposed</p>
              </div>
            </Card>
          </div>

          <Card className="min-w-0 overflow-hidden">
            <h3 className="text-lg font-medium text-white mb-4">Disposal Performance Area</h3>
            <SafeChartContainer height="350px" minHeight="300px">
              {(width, height) => chartData.length > 0 ? (
                <ResponsiveContainer width={width} height={height}>
                  <AreaChart data={chartData}>
                    <defs>
                      {selectedSites.map((site, idx) => (
                        <linearGradient key={`grad_${site}`} id={`color_${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getSiteColor(site, idx)} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={getSiteColor(site, idx)} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    {selectedSites.map((site, idx) => (
                      <Area key={`disp_${site}`} type="monotone" dataKey={`disp_${site}`} name={`${site}`} stroke={getSiteColor(site, idx)} fillOpacity={1} fill={`url(#color_${idx})`} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : <EmptyState />}
            </SafeChartContainer>
          </Card>
        </div>
      )}

      {currentTab === "fleet" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/20 text-primary rounded-xl shrink-0">
                <Truck size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Active Operating Fleet</p>
                <h4 className="text-lg font-bold text-white">48 Vehicles</h4>
                <p className="text-[10px] text-emerald-500 font-medium">94% Fleet Utilization Rate</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-xl shrink-0">
                <Settings size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Maintenance Backlog</p>
                <h4 className="text-lg font-bold text-white">3 Pending Servicing</h4>
                <p className="text-[10px] text-amber-500 font-medium">Overdue limit within 72 hrs</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 text-violet-500 rounded-xl shrink-0">
                <CheckSquare size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Average Running Hours</p>
                <h4 className="text-lg font-bold text-white">7.4 Hrs/Day</h4>
                <p className="text-[10px] text-violet-400 font-medium">Optimal operating efficiency zone</p>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-lg font-bold text-white mb-4">Predicted Service & Maintenance Backlog Checklist</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-dark-bg/40 border border-dark-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                  <div>
                    <h5 className="text-sm font-semibold text-gray-200">Excavator PC210-04</h5>
                    <p className="text-xs text-gray-500">Hydraulic filter change due (exceeded 250 operational hours)</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-danger/10 text-danger border border-danger/20 font-bold">Overdue 8 hrs</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-dark-bg/40 border border-dark-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
                  <div>
                    <h5 className="text-sm font-semibold text-gray-200">Tata Dumper MH14-9932</h5>
                    <p className="text-xs text-gray-500">Engine oil change scheduled (projected operational target in 3 days)</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">Due 3 Days</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {currentTab === "procurement" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-primary flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-xl">
                <FileSignature className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Average Purchase Delivery Time</p>
                <h4 className="text-lg font-bold text-white">4.2 Days</h4>
                <p className="text-xs text-primary font-medium">99.2% on-time delivery metric</p>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-500 flex items-start gap-4">
              <div className="bg-emerald-500/20 p-3 rounded-xl">
                <ShieldAlert className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Procurement SLA Breaches</p>
                <h4 className="text-lg font-bold text-white">0 Active Breaches</h4>
                <p className="text-xs text-emerald-500 font-medium">Zero contract deviations active</p>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-lg font-bold text-white mb-3">Procurement SLA Contract & Vendor Metrics</h3>
            <p className="text-sm text-gray-400 mb-4">Detailed tracking of parts orders and fulfillment efficiency across primary active material yards.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-border text-gray-400">
                    <th className="py-2.5 font-semibold">Vendor Name</th>
                    <th className="py-2.5 font-semibold">Ordered Part</th>
                    <th className="py-2.5 font-semibold">SLA Standard</th>
                    <th className="py-2.5 font-semibold">Delivery Performance</th>
                    <th className="py-2.5 font-semibold text-right">SLA Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-gray-300">
                  <tr>
                    <td className="py-3 font-semibold text-white">Eastern Spares Ltd</td>
                    <td className="py-3">Excavator Tracks (PC200)</td>
                    <td className="py-3">5 Days Max</td>
                    <td className="py-3 text-emerald-400 font-semibold">3.2 Days</td>
                    <td className="py-3 text-right text-emerald-500 font-bold">99.4%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">BioSolutions Fuel Corp</td>
                    <td className="py-3">AdBlue / DEF Additive</td>
                    <td className="py-3">2 Days Max</td>
                    <td className="py-3 text-emerald-400 font-semibold">1.5 Days</td>
                    <td className="py-3 text-right text-emerald-500 font-bold">100.0%</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-white">Metro Hydraulics</td>
                    <td className="py-3">Hydraulic Piston Seals</td>
                    <td className="py-3">4 Days Max</td>
                    <td className="py-3 text-warning font-semibold">3.9 Days</td>
                    <td className="py-3 text-right text-amber-500 font-bold">94.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {currentTab === "comparison" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-l-primary">
              <p className="text-xs text-gray-400 font-semibold uppercase">Total Disposal Comparison</p>
              <h4 className="text-xl font-bold text-white mt-1">Siliguri vs. Delhi Hub</h4>
              <p className="text-xs text-emerald-400 mt-0.5">★ Siliguri leading by +14.2% output</p>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-l-amber-500">
              <p className="text-xs text-gray-400 font-semibold uppercase">Fuel Efficiency Benchmark</p>
              <h4 className="text-xl font-bold text-white mt-1">Noida vs. Delhi Hub</h4>
              <p className="text-xs text-amber-500 mt-0.5">⚡ Noida optimized consumption profile</p>
            </Card>
            <Card className="p-4 bg-gradient-to-r from-violet-500/10 to-transparent border-l-4 border-l-violet-500">
              <p className="text-xs text-gray-400 font-semibold uppercase">Average Maintenance Downtime</p>
              <h4 className="text-xl font-bold text-white mt-1">East Yard vs. Siliguri</h4>
              <p className="text-xs text-violet-400 mt-0.5">🔧 East Yard lower downtime (-2.4 Hrs)</p>
            </Card>
          </div>

          <Card className="p-5 border-dark-border/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Executive Site Comparison Matrix</h3>
                <p className="text-xs text-gray-400 mt-1">Side-by-side performance comparison with corporate branded export options.</p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  const wsData = [
                    ["BioMine Industrial Operations Intelligence OS"],
                    ["EXECUTIVE SITE COMPARISON SUMMARY REPORT"],
                    ["Generated On", new Date().toLocaleString()],
                    [],
                    ["Site Name", "Total Disposal (Tons)", "Fuel Efficiency (L/T)", "Vehicle Utilization Rate", "Maintenance Downtime", "SLA Fulfillment Score"],
                    ["Siliguri Hub", "3,200 Tons", "0.42 L/T", "94.2%", "14.2 Hours", "99.4%"],
                    ["Delhi Hub", "2,800 Tons", "0.58 L/T", "88.5%", "24.5 Hours", "92.8%"],
                    ["Noida Plant", "2,450 Tons", "0.39 L/T", "91.8%", "11.0 Hours", "98.5%"],
                    ["Eastern Yard", "1,980 Tons", "0.45 L/T", "85.0%", "18.2 Hours", "94.2%"]
                  ];
                  const ws = XLSX.utils.aoa_to_sheet(wsData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Site Comparison Matrix");
                  XLSX.writeFile(wb, "BioMine_Executive_Site_Comparison.xlsx");
                  toast.success("Executive Comparison Export Generated successfully!");
                }}
                variant="primary"
                className="text-xs font-semibold"
              >
                📥 Export Branded Comparison Report (.xlsx)
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-border text-gray-400 uppercase tracking-wider">
                    <th className="py-3 font-semibold">Site Name</th>
                    <th className="py-3 font-semibold">Total Disposal</th>
                    <th className="py-3 font-semibold">Fuel Efficiency</th>
                    <th className="py-3 font-semibold">Vehicle Utilization</th>
                    <th className="py-3 font-semibold">Maintenance Downtime</th>
                    <th className="py-3 font-semibold text-right">SLA Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 text-gray-300">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white">Siliguri Hub</td>
                    <td className="py-3.5 font-medium text-emerald-400">3,200 Tons</td>
                    <td className="py-3.5">0.42 L/T</td>
                    <td className="py-3.5 font-semibold">94.2%</td>
                    <td className="py-3.5 text-gray-400">14.2 Hours</td>
                    <td className="py-3.5 text-right font-bold text-emerald-500">99.4%</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white">Delhi Hub</td>
                    <td className="py-3.5 font-medium text-amber-500">2,800 Tons</td>
                    <td className="py-3.5">0.58 L/T</td>
                    <td className="py-3.5 font-semibold">88.5%</td>
                    <td className="py-3.5 text-gray-400">24.5 Hours</td>
                    <td className="py-3.5 text-right font-bold text-amber-500">92.8%</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white">Noida Plant</td>
                    <td className="py-3.5 font-medium text-emerald-400">2,450 Tons</td>
                    <td className="py-3.5">0.39 L/T</td>
                    <td className="py-3.5 font-semibold">91.8%</td>
                    <td className="py-3.5 text-gray-400">11.0 Hours</td>
                    <td className="py-3.5 text-right font-bold text-emerald-500">98.5%</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 font-bold text-white">Eastern Yard</td>
                    <td className="py-3.5 font-medium text-gray-400">1,980 Tons</td>
                    <td className="py-3.5">0.45 L/T</td>
                    <td className="py-3.5 font-semibold">85.0%</td>
                    <td className="py-3.5 text-gray-400">18.2 Hours</td>
                    <td className="py-3.5 text-right font-bold text-gray-400">94.2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ADD SITE MODAL */}
      <AnimatePresence>
        {showSiteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-bg border border-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add New Site</h3>
                <button onClick={() => setShowSiteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-1 block">Site Name</label>
                  <Input 
                    autoFocus
                    placeholder="e.g. Eastern Hub Facility"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowSiteModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={isSubmittingSite}>
                    {isSubmittingSite ? "Adding..." : "Add Site"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

// ---------------- Helper Components ----------------

function KPICard({ loading, title, data, unit, icon, colorClass, isFloat }) {
  const borderColorMap = {
    'primary': 'border-l-primary',
    'emerald-500': 'border-l-emerald-500',
    'amber-500': 'border-l-amber-500',
    'violet-500': 'border-l-violet-500',
  };
  
  const textColorMap = {
    'primary': 'text-primary',
    'emerald-500': 'text-emerald-500',
    'amber-500': 'text-amber-500',
    'violet-500': 'text-violet-500',
  };

  const bgMap = {
    'primary': 'bg-primary/20',
    'emerald-500': 'bg-emerald-500/20',
    'amber-500': 'bg-amber-500/20',
    'violet-500': 'bg-violet-500/20',
  };

  if (loading) {
    return (
      <Card className={`p-4 border-l-4 ${borderColorMap[colorClass]} flex items-start gap-4 h-[90px]`}>
        <div className={`w-11 h-11 rounded-xl animate-pulse ${bgMap[colorClass]}`}></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-dark-bg/50 rounded animate-pulse w-24"></div>
          <div className="h-5 bg-dark-bg/50 rounded animate-pulse w-full"></div>
          <div className="h-3 bg-dark-bg/50 rounded animate-pulse w-16"></div>
        </div>
      </Card>
    );
  }

  const value = isFloat 
    ? (data?.val || 0).toFixed(2) 
    : (data?.val || 0).toLocaleString();

  return (
    <Card className={`p-4 border-l-4 ${borderColorMap[colorClass]} flex items-start gap-4 h-[90px] overflow-hidden`}>
      <div className={`${bgMap[colorClass]} p-3 rounded-xl shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-xs sm:text-sm text-gray-400 truncate" title={title}>{title}</p>
        <h4 className="text-base sm:text-lg font-bold text-white truncate w-full block overflow-hidden text-ellipsis whitespace-nowrap" title={data?.site || "N/A"}>
          {data?.site || "N/A"}
        </h4>
        <p className={`text-xs ${textColorMap[colorClass]} font-medium truncate`} title={`${value} ${unit}`}>
          {value} {unit}
        </p>
      </div>
    </Card>
  );
}

function SkeletonChart() {
  return (
    <div className="w-full h-full flex flex-col justify-end gap-2 p-4 border border-dark-border/50 rounded-xl bg-dark-bg/30">
      <div className="w-full flex justify-between h-full items-end gap-2 opacity-20">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-full bg-primary/50 animate-pulse rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-dark-bg/20 rounded-xl border border-dashed border-dark-border">
      <Filter size={32} className="text-gray-600 mb-3" />
      <p className="font-medium text-gray-400">No Data Available</p>
      <p className="text-sm">Try adjusting your selected filters or date range.</p>
    </div>
  );
}

function SafeChartContainer({ height, minHeight = "250px", children }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let resizeTimer = null;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      if (resizeTimer) clearTimeout(resizeTimer);
      
      resizeTimer = setTimeout(() => {
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          setIsReady(true);
        } else {
          setIsReady(false);
        }
      }, 150); // debounce resize events
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full min-w-0 min-h-0 overflow-hidden relative" 
      style={{ height, minHeight }}
    >
      {!isReady ? (
        <SkeletonChart />
      ) : dimensions.width <= 0 || dimensions.height <= 0 ? (
        <SkeletonChart />
      ) : (
        children(dimensions.width, dimensions.height)
      )}
    </div>
  );
}
