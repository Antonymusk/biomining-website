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
  
  let stableIndex = index;
  if (stableIndex === undefined) {
    stableIndex = Array.from(siteName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  
  const color = SITE_COLORS[stableIndex % SITE_COLORS.length];
  colorMap.set(siteName, color);
  return color;
};

export const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const analyticsCache = new Map();

export const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

// Data Fetching
export const fetchAnalyticsData = async () => {
  clearAnalyticsCache();
  try {
    const { data, error } = await supabase
      .from('mis_entries')
      .select('*')
      .order('date', { ascending: true });

    if (!error && data && data.length > 0) {
      localStorage.setItem("biomine_mis_entries_cache", JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn("Analytics fetch error, falling back to local storage cache:", err);
  }

  // Fallback to local storage cache if database returns empty or fails
  try {
    const cache = localStorage.getItem("biomine_mis_entries_cache");
    if (cache) {
      const parsed = JSON.parse(cache);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Local MIS cache read error:", e);
  }
  return [];
};

// Aggregation & Memoized Selectors (to be used with useMemo in UI)
export const processAnalytics = (rawData, dateRange, selectedSites) => {
  if (!rawData || rawData.length === 0) {
    return { chartData: [], kpis: null, uniqueSites: [] };
  }

  // Caching layer: include rawData summary match
  const contentHash = rawData.map(d => `${d.site}_${d.date}_${d.total_production || d.production || 0}_${d.total_disposal || d.disposal || 0}`).join('|');
  const cacheKey = `${dateRange}_${(selectedSites || []).join(",")}_${rawData.length}_${contentHash.length}`;
  if (analyticsCache.has(cacheKey)) {
    return analyticsCache.get(cacheKey);
  }

  // 1. Extract all unique sites for the filter dropdowns
  const uniqueSites = [...new Set(rawData.map(d => d.site))].filter(Boolean);

  // 2. Filter data by Date Range (using local date strings)
  let filteredData = rawData;
  if (dateRange !== 'all') {
    const now = new Date();
    if (dateRange === 'today') {
      const todayStr = getLocalDateStr(now);
      filteredData = rawData.filter(d => d.date === todayStr);
    } else if (dateRange === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalDateStr(yesterday);
      filteredData = rawData.filter(d => d.date === yesterdayStr);
    } else {
      const minDate = new Date(now);
      if (dateRange === '7d') minDate.setDate(minDate.getDate() - 7);
      if (dateRange === '30d') minDate.setDate(minDate.getDate() - 30);
      if (dateRange === '90d') minDate.setDate(minDate.getDate() - 90);
      if (dateRange === '6m') minDate.setMonth(minDate.getMonth() - 6);
      if (dateRange === '1y') minDate.setFullYear(minDate.getFullYear() - 1);
      
      const minDateStr = getLocalDateStr(minDate);
      filteredData = rawData.filter(d => d.date >= minDateStr);
    }
  }

  // 3. Filter data by Selected Sites (case-insensitive & trimmed matching)
  if (selectedSites && selectedSites.length > 0) {
    const lowerSelected = selectedSites.map(s => String(s).trim().toLowerCase());
    filteredData = filteredData.filter(d => d.site && lowerSelected.includes(String(d.site).trim().toLowerCase()));
  }

  // 4. Aggregate Chart Data by Month
  const monthlyMap = new Map();
  const kpiTotals = {}; // Track totals per site for KPIs

  filteredData.forEach(entry => {
    if (!entry.date) return;
    const site = entry.site || 'Unknown';
    const month = new Date(entry.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });

    if (!kpiTotals[site]) {
      kpiTotals[site] = { production: 0, diesel: 0, disposal: 0, count: 0 };
    }
    
    const prod = Number(entry.total_production ?? entry.production ?? 0);
    const dies = Number(entry.total_diesel ?? entry.diesel ?? 0);
    const disp = Number(entry.total_disposal ?? entry.disposal ?? 0);

    kpiTotals[site].production += prod;
    kpiTotals[site].diesel += dies;
    kpiTotals[site].disposal += disp;
    kpiTotals[site].count += 1;

    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { name: month, total_production: 0, total_diesel: 0, total_disposal: 0 });
    }
    
    const current = monthlyMap.get(month);
    current.total_production += prod;
    current.total_diesel += dies;
    current.total_disposal += disp;
    
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
