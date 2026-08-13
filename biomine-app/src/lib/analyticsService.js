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

  // 5. Calculate Peak Operational Benchmarks & KPIs across ALL historical entries for selected sites
  let kpiSourceData = rawData;
  if (selectedSites && selectedSites.length > 0) {
    const lowerSelected = selectedSites.map(s => String(s).trim().toLowerCase());
    kpiSourceData = rawData.filter(d => d.site && lowerSelected.includes(String(d.site).trim().toLowerCase()));
  }

  let totalFuelLogged = 0;
  let totalDisposalLogged = 0;
  filteredData.forEach(entry => {
    totalFuelLogged += Number(entry.total_diesel ?? entry.diesel ?? 0);
    totalDisposalLogged += Number(entry.total_disposal ?? entry.disposal ?? 0);
  });

  const allTimeKpiTotals = {};
  kpiSourceData.forEach(entry => {
    const site = entry.site || 'Unknown';
    if (!allTimeKpiTotals[site]) {
      allTimeKpiTotals[site] = { production: 0, diesel: 0, disposal: 0, maxProd: 0, maxDisp: 0, minBurn: Infinity, minDiesel: Infinity };
    }
    const prod = Number(entry.total_production ?? entry.production ?? 0);
    const dies = Number(entry.total_diesel ?? entry.diesel ?? 0);
    const disp = Number(entry.total_disposal ?? entry.disposal ?? 0);

    allTimeKpiTotals[site].production += prod;
    allTimeKpiTotals[site].diesel += dies;
    allTimeKpiTotals[site].disposal += disp;
    if (prod > allTimeKpiTotals[site].maxProd) allTimeKpiTotals[site].maxProd = prod;
    if (disp > allTimeKpiTotals[site].maxDisp) allTimeKpiTotals[site].maxDisp = disp;
    if (disp > 0 && dies > 0) {
      const burn = dies / disp;
      if (burn < allTimeKpiTotals[site].minBurn) allTimeKpiTotals[site].minBurn = burn;
    }
    if (dies > 0 && dies < allTimeKpiTotals[site].minDiesel) allTimeKpiTotals[site].minDiesel = dies;
  });

  let topProductionSite = { site: "N/A", val: 0 };
  let topDisposalSite = { site: "N/A", val: 0 };
  let bestFuelConsumptionSite = { site: "N/A", val: Infinity };
  let lowestDieselSite = { site: "N/A", val: Infinity };

  Object.entries(allTimeKpiTotals).forEach(([site, totals]) => {
    const maxP = Math.max(totals.production, totals.maxProd);
    if (maxP > topProductionSite.val) {
      topProductionSite = { site, val: maxP };
    }
    const maxD = Math.max(totals.disposal, totals.maxDisp);
    if (maxD > topDisposalSite.val) {
      topDisposalSite = { site, val: maxD };
    }
    if (totals.minBurn < bestFuelConsumptionSite.val && totals.minBurn > 0) {
      bestFuelConsumptionSite = { site, val: Number(totals.minBurn.toFixed(2)) };
    }
    if (totals.minDiesel < lowestDieselSite.val && totals.minDiesel > 0) {
      lowestDieselSite = { site, val: totals.minDiesel };
    }
  });

  if (lowestDieselSite.val === Infinity) lowestDieselSite.val = 0;
  if (bestFuelConsumptionSite.val === Infinity) bestFuelConsumptionSite.val = 0;

  const overallAvgBurn = totalDisposalLogged > 0 ? (totalFuelLogged / totalDisposalLogged) : 0;
  const avgFuelVariance = overallAvgBurn > 0 ? Number((((overallAvgBurn - 0.6) / 0.6) * 100).toFixed(1)) : 0;

  // Dynamic AI Insights Generation
  const siteEntries = Object.entries(kpiTotals);
  const aiInsights = [];

  // Insight 1: Site Production / Output Risk
  if (siteEntries.length > 0 && topProductionSite.val > 0) {
    const lowProd = siteEntries.find(([s, t]) => s !== topProductionSite.site && t.production > 0 && t.production < topProductionSite.val * 0.7);
    if (lowProd) {
      const dropPct = Math.round(((topProductionSite.val - lowProd[1].production) / topProductionSite.val) * 100);
      aiInsights.push({
        title: "SITE PRODUCTION RISK",
        type: "production",
        text: `${lowProd[0]} site output is ${dropPct}% below top producer (${topProductionSite.site}: ${topProductionSite.val.toLocaleString()} Tons). Target output gap detected.`,
        iconColor: "text-primary",
        badgeColor: "text-danger font-bold"
      });
    } else {
      aiInsights.push({
        title: "SITE PRODUCTION TRAJECTORY",
        type: "production",
        text: `${topProductionSite.site} site is leading operations with ${topProductionSite.val.toLocaleString()} Tons yield. Production trajectory is currently stable.`,
        iconColor: "text-primary",
        badgeColor: "text-emerald-400 font-bold"
      });
    }
  } else {
    aiInsights.push({
      title: "SITE PRODUCTION RISK",
      type: "production",
      text: "Awaiting active site MIS logs to run dynamic production trend projections.",
      iconColor: "text-primary",
      badgeColor: "text-gray-400 font-bold"
    });
  }

  // Insight 2: Fuel Efficiency Anomaly / Drop
  let maxBurnSite = null;
  let maxBurnRatio = 0;
  siteEntries.forEach(([s, t]) => {
    if (t.disposal > 0) {
      const ratio = t.diesel / t.disposal;
      if (ratio > maxBurnRatio) {
        maxBurnRatio = ratio;
        maxBurnSite = s;
      }
    }
  });

  if (maxBurnSite && maxBurnRatio > 0) {
    const isAboveBench = maxBurnRatio > 0.6;
    const devPct = Math.round(Math.abs(maxBurnRatio - 0.6) / 0.6 * 100);
    aiInsights.push({
      title: isAboveBench ? "FUEL EFFICIENCY DROP" : "OPTIMAL FUEL EFFICIENCY",
      type: "fuel",
      text: `${maxBurnSite} fuel consumption rate is ${maxBurnRatio.toFixed(2)} L/T (${isAboveBench ? `${devPct}% above benchmark rate` : 'optimal fuel burn rate'}).`,
      iconColor: "text-violet-400",
      badgeColor: isAboveBench ? "text-warning font-bold" : "text-emerald-400 font-bold"
    });
  } else {
    aiInsights.push({
      title: "FUEL EFFICIENCY MONITOR",
      type: "fuel",
      text: "Fuel intelligence matrix operating within expected baseline consumption parameters.",
      iconColor: "text-violet-400",
      badgeColor: "text-gray-400 font-bold"
    });
  }

  // Insight 3: Anomalous Fleet Usage
  let anomalousVehicle = null;
  filteredData.forEach(entry => {
    if (entry.vehicles && Array.isArray(entry.vehicles)) {
      entry.vehicles.forEach(v => {
        const h = Number(v.hours) || 0;
        const d = Number(v.diesel) || 0;
        const burn = h > 0 ? d / h : 0;
        if (burn > 10) {
          anomalousVehicle = { name: v.name, site: entry.site, burn: burn.toFixed(1), hours: h };
        }
      });
    }
  });

  if (anomalousVehicle) {
    aiInsights.push({
      title: "ANOMALOUS FLEET USAGE",
      type: "fleet",
      text: `${anomalousVehicle.name} at ${anomalousVehicle.site} logged ${anomalousVehicle.hours} hrs with a high burn rate of ${anomalousVehicle.burn} L/Hr.`,
      iconColor: "text-emerald-400",
      badgeColor: "text-emerald-400 font-semibold"
    });
  } else {
    const totalVehiclesCount = filteredData.reduce((s, e) => s + (e.vehicles?.length || 0) + (e.machines?.length || 0), 0);
    aiInsights.push({
      title: "FLEET & ASSET INTELLIGENCE",
      type: "fleet",
      text: totalVehiclesCount > 0 
        ? `${totalVehiclesCount} asset operational tracks analyzed across monitored site streams.`
        : "Fleet assets across monitored sites are operating within benchmark efficiency thresholds.",
      iconColor: "text-emerald-400",
      badgeColor: "text-emerald-400 font-semibold"
    });
  }

  const filteredDataVehiclesCount = filteredData.reduce((s, e) => s + (e.vehicles?.length || 0) + (e.machines?.length || 0), 0);

  const result = {
    chartData: Array.from(monthlyMap.values()),
    uniqueSites,
    kpis: {
      topProduction: topProductionSite,
      topDisposal: topDisposalSite,
      bestEfficiency: bestFuelConsumptionSite,
      bestFuelConsumption: bestFuelConsumptionSite,
      lowestDiesel: lowestDieselSite
    },
    aiInsights,
    totalFuelLogged,
    avgFuelVariance,
    totalDisposalLogged,
    filteredDataVehiclesCount
  };

  analyticsCache.set(cacheKey, result);
  return result;
};
