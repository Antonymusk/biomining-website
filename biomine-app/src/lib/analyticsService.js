import { supabase } from "./supabase";

// Deterministic color mapping for sites
const SITE_COLORS = [
  "#3b82f6", // primary blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4"  // cyan
];

const colorMap = new Map();

export const getSiteColor = (siteName, index) => {
  if (!siteName) return "#94a3b8"; // default gray
  if (colorMap.has(siteName)) return colorMap.get(siteName);
  
  // Try to find a deterministic index based on string length and char codes if index is not provided
  let stableIndex = index;
  if (stableIndex === undefined) {
    stableIndex = Array.from(siteName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  
  const color = SITE_COLORS[stableIndex % SITE_COLORS.length];
  colorMap.set(siteName, color);
  return color;
};

// Data Fetching
export const fetchAnalyticsData = async () => {
  const { data, error } = await supabase
    .from('mis_entries')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
};

const analyticsCache = new Map();

export const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

// Aggregation & Memoized Selectors (to be used with useMemo in UI)
export const processAnalytics = (rawData, dateRange, selectedSites) => {
  if (!rawData || rawData.length === 0) {
    return { chartData: [], kpis: null, uniqueSites: [] };
  }

  // Caching layer: precalculated summary match
  const cacheKey = `${dateRange}_${(selectedSites || []).join(",")}_${rawData.length}`;
  if (analyticsCache.has(cacheKey)) {
    return analyticsCache.get(cacheKey);
  }

  // 1. Extract all unique sites for the filter dropdowns
  const uniqueSites = [...new Set(rawData.map(d => d.site))].filter(Boolean);

  // 2. Filter data by Date Range
  let filteredData = rawData;
  if (dateRange !== 'all') {
    const minDate = new Date();
    if (dateRange === 'today') {
      const todayStr = minDate.toISOString().split('T')[0];
      filteredData = rawData.filter(d => d.date === todayStr);
    } else if (dateRange === 'yesterday') {
      minDate.setDate(minDate.getDate() - 1);
      const yesterdayStr = minDate.toISOString().split('T')[0];
      filteredData = rawData.filter(d => d.date === yesterdayStr);
    } else {
      if (dateRange === '7d') minDate.setDate(minDate.getDate() - 7);
      if (dateRange === '30d') minDate.setDate(minDate.getDate() - 30);
      if (dateRange === '90d') minDate.setDate(minDate.getDate() - 90);
      if (dateRange === '6m') minDate.setMonth(minDate.getMonth() - 6);
      if (dateRange === '1y') minDate.setFullYear(minDate.getFullYear() - 1);
      
      const minDateStr = minDate.toISOString().split('T')[0];
      filteredData = rawData.filter(d => d.date >= minDateStr);
    }
  }

  // 3. Filter data by Selected Sites
  if (selectedSites && selectedSites.length > 0) {
    filteredData = filteredData.filter(d => selectedSites.includes(d.site));
  }

  // 4. Aggregate Chart Data by Month
  const monthlyMap = new Map();
  const kpiTotals = {}; // Track totals per site for KPIs

  filteredData.forEach(entry => {
    if (!entry.date) return;
    const site = entry.site || 'Unknown';
    const month = new Date(entry.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });

    // Initialize KPI trackers
    if (!kpiTotals[site]) {
      kpiTotals[site] = { production: 0, diesel: 0, disposal: 0, count: 0 };
    }
    
    const prod = Number(entry.total_production || 0);
    const dies = Number(entry.total_diesel || 0);
    const disp = Number(entry.total_disposal || 0);

    kpiTotals[site].production += prod;
    kpiTotals[site].diesel += dies;
    kpiTotals[site].disposal += disp;
    kpiTotals[site].count += 1;

    // Initialize monthly chart data
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { name: month, total_production: 0, total_diesel: 0, total_disposal: 0 });
    }
    
    const current = monthlyMap.get(month);
    current.total_production += prod;
    current.total_diesel += dies;
    current.total_disposal += disp;
    
    // Per-site specific data points for Bar/Line charts
    if (!current[`prod_${site}`]) current[`prod_${site}`] = 0;
    if (!current[`dies_${site}`]) current[`dies_${site}`] = 0;
    if (!current[`disp_${site}`]) current[`disp_${site}`] = 0;

    current[`prod_${site}`] += prod;
    current[`dies_${site}`] += dies;
    current[`disp_${site}`] += disp;
  });

  // 5. Calculate KPIs
  let topProductionSite = { site: "N/A", val: 0 };
  let topDisposalSite = { site: "N/A", val: 0 };
  let bestFuelConsumptionSite = { site: "N/A", val: Infinity };
  let lowestDieselSite = { site: "N/A", val: Infinity };

  Object.entries(kpiTotals).forEach(([site, totals]) => {
    if (totals.production > topProductionSite.val) {
      topProductionSite = { site, val: totals.production };
    }
    if (totals.disposal > topDisposalSite.val) {
      topDisposalSite = { site, val: totals.disposal };
    }
    // Fuel Consumption Ratio = Diesel Used / Disposal Tons
    const consumption = totals.disposal > 0 ? totals.diesel / totals.disposal : 0;
    if (consumption < bestFuelConsumptionSite.val && consumption > 0) {
      bestFuelConsumptionSite = { site, val: consumption };
    }
    if (totals.diesel < lowestDieselSite.val && totals.diesel > 0) {
      lowestDieselSite = { site, val: totals.diesel };
    }
  });

  if (lowestDieselSite.val === Infinity) lowestDieselSite.val = 0;
  if (bestFuelConsumptionSite.val === Infinity) bestFuelConsumptionSite.val = 0;

  const result = {
    chartData: Array.from(monthlyMap.values()),
    uniqueSites,
    kpis: {
      topProduction: topProductionSite,
      topDisposal: topDisposalSite,
      bestEfficiency: bestFuelConsumptionSite,
      bestFuelConsumption: bestFuelConsumptionSite,
      lowestDiesel: lowestDieselSite
    }
  };

  analyticsCache.set(cacheKey, result);
  return result;
};
