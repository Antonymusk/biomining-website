import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coins, Search, Plus, Edit3, Trash2, Calculator, 
  TrendingUp, CheckCircle2, TrendingDown, Layers, 
  AlertCircle, Info, Sliders, Globe, Building2, 
  ChevronRight, ArrowRight, ShieldCheck, Download
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";

// Static State Variables (Default values when not present in DB entries)
const STATE_COEFFICIENTS = {
  "Jharkhand": { gst: 18.0, logisticsMultiplier: 120, cess: 2.5, code: "JH" },
  "Odisha": { gst: 18.0, logisticsMultiplier: 130, cess: 4.0, code: "OD" },
  "Chhattisgarh": { gst: 18.0, logisticsMultiplier: 110, cess: 1.5, code: "CG" },
  "Madhya Pradesh": { gst: 18.0, logisticsMultiplier: 125, cess: 2.0, code: "MP" },
  "West Bengal": { gst: 18.0, logisticsMultiplier: 115, cess: 3.0, code: "WB" },
  "Rajasthan": { gst: 18.0, logisticsMultiplier: 140, cess: 1.5, code: "RJ" }
};

// Static initial fallback data for instant transparent onboarding
const SEED_MOCK_PRICES = [
  {
    id: "m-1",
    item_name: "CAT Heavy Excavator",
    model_number: "390D L",
    category: "Machinery",
    state: "Jharkhand",
    base_price: 32000000,
    gst_percent: 18.0,
    freight_cost: 450000,
    state_cess: 2.5,
    specifications: { engine_power: "524 HP", operating_weight: "86275 kg", bucket_capacity: "4.6 m³", warranty: "36 Months" }
  },
  {
    id: "m-2",
    item_name: "CAT Heavy Excavator",
    model_number: "390D L",
    category: "Machinery",
    state: "Odisha",
    base_price: 32000000,
    gst_percent: 18.0,
    freight_cost: 480000,
    state_cess: 4.0,
    specifications: { engine_power: "524 HP", operating_weight: "86275 kg", bucket_capacity: "4.6 m³", warranty: "36 Months" }
  },
  {
    id: "m-3",
    item_name: "CAT Heavy Excavator",
    model_number: "390D L",
    category: "Machinery",
    state: "Chhattisgarh",
    base_price: 32000000,
    gst_percent: 18.0,
    freight_cost: 420000,
    state_cess: 1.5,
    specifications: { engine_power: "524 HP", operating_weight: "86275 kg", bucket_capacity: "4.6 m³", warranty: "36 Months" }
  },
  {
    id: "m-4",
    item_name: "CAT Heavy Excavator",
    model_number: "390D L",
    category: "Machinery",
    state: "Madhya Pradesh",
    base_price: 32000000,
    gst_percent: 18.0,
    freight_cost: 520000,
    state_cess: 2.0,
    specifications: { engine_power: "524 HP", operating_weight: "86275 kg", bucket_capacity: "4.6 m³", warranty: "36 Months" }
  },
  {
    id: "m-5",
    item_name: "CAT Heavy Excavator",
    model_number: "390D L",
    category: "Machinery",
    state: "West Bengal",
    base_price: 32000000,
    gst_percent: 18.0,
    freight_cost: 390000,
    state_cess: 3.0,
    specifications: { engine_power: "524 HP", operating_weight: "86275 kg", bucket_capacity: "4.6 m³", warranty: "36 Months" }
  },
  {
    id: "m-6",
    item_name: "Komatsu Off-Highway Dump Truck",
    model_number: "HD785-7",
    category: "Machinery",
    state: "Jharkhand",
    base_price: 48000000,
    gst_percent: 18.0,
    freight_cost: 600000,
    state_cess: 2.0,
    specifications: { engine_power: "1200 HP", payload_capacity: "91.0 Ton", gross_weight: "166500 kg", max_speed: "65 km/h" }
  },
  {
    id: "m-7",
    item_name: "Komatsu Off-Highway Dump Truck",
    model_number: "HD785-7",
    category: "Machinery",
    state: "Odisha",
    base_price: 48000000,
    gst_percent: 18.0,
    freight_cost: 650000,
    state_cess: 3.5,
    specifications: { engine_power: "1200 HP", payload_capacity: "91.0 Ton", gross_weight: "166500 kg", max_speed: "65 km/h" }
  },
  {
    id: "m-8",
    item_name: "Komatsu Off-Highway Dump Truck",
    model_number: "HD785-7",
    category: "Machinery",
    state: "Chhattisgarh",
    base_price: 48000000,
    gst_percent: 18.0,
    freight_cost: 580000,
    state_cess: 1.5,
    specifications: { engine_power: "1200 HP", payload_capacity: "91.0 Ton", gross_weight: "166500 kg", max_speed: "65 km/h" }
  },
  {
    id: "m-9",
    item_name: "Komatsu Off-Highway Dump Truck",
    model_number: "HD785-7",
    category: "Machinery",
    state: "Madhya Pradesh",
    base_price: 48000000,
    gst_percent: 18.0,
    freight_cost: 720000,
    state_cess: 2.0,
    specifications: { engine_power: "1200 HP", payload_capacity: "91.0 Ton", gross_weight: "166500 kg", max_speed: "65 km/h" }
  },
  {
    id: "m-10",
    item_name: "Sandvik Crawler Drill",
    model_number: "DI550",
    category: "Equipment",
    state: "Jharkhand",
    base_price: 19000000,
    gst_percent: 18.0,
    freight_cost: 250000,
    state_cess: 1.0,
    specifications: { hole_diameter: "90-165 mm", engine: "CAT C13 328 kW", air_delivery: "24.4 m³/min", operating_weight: "24000 kg" }
  },
  {
    id: "m-11",
    item_name: "Sandvik Crawler Drill",
    model_number: "DI550",
    category: "Equipment",
    state: "Odisha",
    base_price: 19000000,
    gst_percent: 18.0,
    freight_cost: 280000,
    state_cess: 2.5,
    specifications: { hole_diameter: "90-165 mm", engine: "CAT C13 328 kW", air_delivery: "24.4 m³/min", operating_weight: "24000 kg" }
  },
  {
    id: "m-12",
    item_name: "Sandvik Crawler Drill",
    model_number: "DI550",
    category: "Equipment",
    state: "Rajasthan",
    base_price: 19000000,
    gst_percent: 18.0,
    freight_cost: 320000,
    state_cess: 1.5,
    specifications: { hole_diameter: "90-165 mm", engine: "CAT C13 328 kW", air_delivery: "24.4 m³/min", operating_weight: "24000 kg" }
  },
  {
    id: "m-13",
    item_name: "CAT Wheel Loader",
    model_number: "966L",
    category: "Equipment",
    state: "Jharkhand",
    base_price: 16500000,
    gst_percent: 18.0,
    freight_cost: 180000,
    state_cess: 1.2,
    specifications: { flywheel_power: "290 HP", operating_weight: "23000 kg", bucket_capacity: "3.8 m³", transmission: "Powershift" }
  },
  {
    id: "m-14",
    item_name: "CAT Wheel Loader",
    model_number: "966L",
    category: "Equipment",
    state: "Odisha",
    base_price: 16500000,
    gst_percent: 18.0,
    freight_cost: 210000,
    state_cess: 2.5,
    specifications: { flywheel_power: "290 HP", operating_weight: "23000 kg", bucket_capacity: "3.8 m³", transmission: "Powershift" }
  },
  {
    id: "m-15",
    item_name: "CAT Wheel Loader",
    model_number: "966L",
    category: "Equipment",
    state: "Chhattisgarh",
    base_price: 16500000,
    gst_percent: 18.0,
    freight_cost: 170000,
    state_cess: 1.0,
    specifications: { flywheel_power: "290 HP", operating_weight: "23000 kg", bucket_capacity: "3.8 m³", transmission: "Powershift" }
  },
  {
    id: "m-16",
    item_name: "Cummins Silent Power DG Set",
    model_number: "500kVA",
    category: "Auxiliary",
    state: "Jharkhand",
    base_price: 4500000,
    gst_percent: 18.0,
    freight_cost: 85000,
    state_cess: 0.5,
    specifications: { power_rating: "500 kVA", engine: "KTA19-G9", fuel_tank: "850 Liters", dimensions: "5200x2000 mm" }
  },
  {
    id: "m-17",
    item_name: "Cummins Silent Power DG Set",
    model_number: "500kVA",
    category: "Auxiliary",
    state: "Odisha",
    base_price: 4500000,
    gst_percent: 18.0,
    freight_cost: 92000,
    state_cess: 1.0,
    specifications: { power_rating: "500 kVA", engine: "KTA19-G9", fuel_tank: "850 Liters", dimensions: "5200x2000 mm" }
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
};

export default function PriceList() {
  const { user } = useAuth();
  
  // 1. App States
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStateFilter, setSelectedStateFilter] = useState("All");
  
  // 2. Interactive Calculator States
  const [calcItem, setCalcItem] = useState("");
  const [calcState, setCalcState] = useState("Jharkhand");
  const [calcDistance, setCalcDistance] = useState(250); // in km

  // 3. Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("Add"); // "Add" or "Edit"
  const [editingItem, setEditingItem] = useState(null);
  
  // 4. Form States
  const [formName, setFormName] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCategory, setFormCategory] = useState("Machinery");
  const [formState, setFormState] = useState("Jharkhand");
  const [formBasePrice, setFormBasePrice] = useState("");
  const [formGst, setFormGst] = useState("18.0");
  const [formFreight, setFormFreight] = useState("");
  const [formCess, setFormCess] = useState("");
  const [formSpecs, setFormSpecs] = useState("");

  // Determine authorized level for feed prices
  const canModifyPrices = useMemo(() => {
    if (!user) return false;
    return ['Super Admin', 'Site Incharge', 'Back Office'].includes(user.role);
  }, [user]);

  // Load prices (Supabase query with robust LocalStorage fallback)
  const fetchPriceList = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("equipment_prices")
        .select("*")
        .order("item_name", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPrices(data);
        setIsLiveConnected(true);
        // Cache to localStorage
        localStorage.setItem("biomine_cached_prices", JSON.stringify(data));
      } else {
        // Table exists but is empty, let's auto-seed mock data
        const { error: seedError } = await supabase
          .from("equipment_prices")
          .insert(SEED_MOCK_PRICES.map(({ id, ...rest }) => rest));
        
        if (seedError) throw seedError;
        
        // Re-fetch
        const { data: refetched } = await supabase.from("equipment_prices").select("*");
        setPrices(refetched || SEED_MOCK_PRICES);
        setIsLiveConnected(true);
      }
    } catch (err) {
      console.warn("⚠️ Supabase equipment_prices table connection unavailable. Switching to Local Storage Sandbox.", err);
      setIsLiveConnected(false);
      
      // Fallback sequence
      const cached = localStorage.getItem("biomine_cached_prices");
      if (cached) {
        setPrices(JSON.parse(cached));
      } else {
        localStorage.setItem("biomine_cached_prices", JSON.stringify(SEED_MOCK_PRICES));
        setPrices(SEED_MOCK_PRICES);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriceList();
  }, [fetchPriceList]);

  // Unique item names for calculator selector
  const uniqueItems = useMemo(() => {
    const names = new Set();
    prices.forEach(p => names.add(p.item_name));
    return Array.from(names);
  }, [prices]);

  // Lock calculator item initially
  useEffect(() => {
    if (uniqueItems.length > 0 && !calcItem) {
      setCalcItem(uniqueItems[0]);
    }
  }, [uniqueItems, calcItem]);

  // Landed cost calculator formula
  const calculatorReceipt = useMemo(() => {
    if (!calcItem) return null;
    
    // Find price matching selected equipment and state, or search for matching item in any state
    let match = prices.find(p => p.item_name === calcItem && p.state === calcState);
    if (!match) {
      match = prices.find(p => p.item_name === calcItem);
    }
    
    if (!match) return null;

    const base = Number(match.base_price);
    const gstPct = Number(match.gst_percent || 18.0);
    const baseFreight = Number(match.freight_cost || 0);
    
    // Grab state dynamic variables
    const stateCoeff = STATE_COEFFICIENTS[calcState] || { gst: 18.0, logisticsMultiplier: 120, cess: 2.0 };
    const gstVal = base * (gstPct / 100);
    const logisticsVal = baseFreight + (calcDistance * stateCoeff.logisticsMultiplier);
    const cessVal = base * ((match.state_cess || stateCoeff.cess) / 100);
    const netLanded = base + gstVal + logisticsVal + cessVal;

    return {
      name: match.item_name,
      model: match.model_number,
      category: match.category,
      state: calcState,
      base,
      gstPct,
      gstVal,
      freightCost: logisticsVal,
      baseFreight,
      kmFreight: calcDistance * stateCoeff.logisticsMultiplier,
      cessPct: match.state_cess || stateCoeff.cess,
      cessVal,
      netLanded
    };
  }, [prices, calcItem, calcState, calcDistance]);

  // Visual comparison data: Selected item across ALL states
  const comparisonData = useMemo(() => {
    if (!calcItem) return [];
    
    return Object.keys(STATE_COEFFICIENTS).map(st => {
      const match = prices.find(p => p.item_name === calcItem && p.state === st);
      const coeff = STATE_COEFFICIENTS[st];
      
      const base = match ? Number(match.base_price) : 25000000; // default for visualization
      const gstVal = base * ((match?.gst_percent || coeff.gst) / 100);
      const baseFreight = match ? Number(match.freight_cost) : 200000;
      const logisticsVal = baseFreight + (calcDistance * coeff.logisticsMultiplier);
      const cessVal = base * ((match?.state_cess || coeff.cess) / 100);
      const landed = base + gstVal + logisticsVal + cessVal;

      return {
        state: st,
        code: coeff.code,
        landed,
        basePrice: base,
        isPresent: !!match
      };
    }).sort((a, b) => a.landed - b.landed);
  }, [prices, calcItem, calcDistance]);

  const priceStats = useMemo(() => {
    if (prices.length === 0) return { count: 0, avg: 0 };
    const total = prices.reduce((acc, row) => acc + Number(row.base_price), 0);
    return {
      count: prices.length,
      avg: Math.round(total / prices.length)
    };
  }, [prices]);

  // Filtered pricing array for the data grid
  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      const matchesSearch = p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.model_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchesState = selectedStateFilter === "All" || p.state === selectedStateFilter;
      return matchesSearch && matchesCategory && matchesState;
    });
  }, [prices, searchTerm, selectedCategory, selectedStateFilter]);

  // Helper formatting currency
  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("Add");
    setEditingItem(null);
    setFormName("");
    setFormModel("");
    setFormCategory("Machinery");
    setFormState("Jharkhand");
    setFormBasePrice("");
    setFormGst("18.0");
    setFormFreight("");
    setFormCess("");
    setFormSpecs("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (item) => {
    setModalMode("Edit");
    setEditingItem(item);
    setFormName(item.item_name);
    setFormModel(item.model_number || "");
    setFormCategory(item.category);
    setFormState(item.state);
    setFormBasePrice(item.base_price.toString());
    setFormGst(item.gst_percent.toString());
    setFormFreight(item.freight_cost.toString());
    setFormCess(item.state_cess.toString());
    
    let specStr = "";
    if (item.specifications) {
      if (typeof item.specifications === "object") {
        specStr = Object.entries(item.specifications).map(([k, v]) => `${k}: ${v}`).join("\n");
      } else {
        specStr = item.specifications.toString();
      }
    }
    setFormSpecs(specStr);
    setIsModalOpen(true);
  };

  // Delete Action
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to retire this price record? This breaks transparency records for this state.")) return;
    
    const resolveDeletion = async () => {
      if (isLiveConnected) {
        const { error } = await supabase.from("equipment_prices").delete().eq("id", id);
        if (error) throw error;
      }
      
      // Update local state / cached array
      const updated = prices.filter(p => p.id !== id);
      setPrices(updated);
      localStorage.setItem("biomine_cached_prices", JSON.stringify(updated));
    };

    toast.promise(resolveDeletion(), {
      loading: "Removing price entry...",
      success: "Price record purged successfully.",
      error: "Error synchronizing delete to backend node."
    });
  };

  // Save/Submit Form Action
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formBasePrice) {
      toast.error("Please insert authoritative item name and base price.");
      return;
    }

    // Convert specs textarea to JSON
    const specsObj = {};
    if (formSpecs.trim()) {
      formSpecs.split("\n").forEach(line => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          specsObj[parts[0].trim()] = parts.slice(1).join(":").trim();
        }
      });
    }

    const payload = {
      item_name: formName,
      model_number: formModel || null,
      category: formCategory,
      state: formState,
      base_price: parseFloat(formBasePrice),
      gst_percent: parseFloat(formGst || 18.0),
      freight_cost: parseFloat(formFreight || 0),
      state_cess: parseFloat(formCess || 0),
      specifications: specsObj,
      updated_at: new Date().toISOString()
    };

    const performSave = async () => {
      let finalItem = null;
      if (modalMode === "Add") {
        if (isLiveConnected) {
          const { data, error } = await supabase
            .from("equipment_prices")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          finalItem = data;
        } else {
          finalItem = { ...payload, id: "m-" + Date.now() };
        }
        
        // Add locally
        const updated = [...prices, finalItem].sort((a, b) => a.item_name.localeCompare(b.item_name));
        setPrices(updated);
        localStorage.setItem("biomine_cached_prices", JSON.stringify(updated));
      } else {
        // Edit Mode
        if (isLiveConnected) {
          const { data, error } = await supabase
            .from("equipment_prices")
            .update(payload)
            .eq("id", editingItem.id)
            .select()
            .single();
          if (error) throw error;
          finalItem = data;
        } else {
          finalItem = { ...payload, id: editingItem.id };
        }

        // Update locally
        const updated = prices.map(p => p.id === editingItem.id ? finalItem : p);
        setPrices(updated);
        localStorage.setItem("biomine_cached_prices", JSON.stringify(updated));
      }
      setIsModalOpen(false);
    };

    toast.promise(performSave(), {
      loading: "Persisting price record...",
      success: `Price sheet updated for ${formName} (${formState})`,
      error: (err) => `Synchronization failed: ${err.message || "Network Timeout"}`
    });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* 1. INTERACTIVE SYSTEM HEADER */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5"
      >
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            <Coins size={12} className="text-cyan-400 animate-pulse" />
            Financial Transparency Infrastructure
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <span className="opacity-60">PRICE INDEX</span>
            <ChevronRight size={20} className="text-gray-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">State-wise Indices</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={`py-1 px-3 gap-1.5 font-bold uppercase tracking-wider text-[9px] ${isLiveConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
            {isLiveConnected ? "Supabase Cluster Live" : "Sandboxed Local Storage Mode"}
          </Badge>
          
          {canModifyPrices && (
            <Button onClick={handleOpenAdd} variant="primary" className="shadow-lg shadow-primary/20 font-black gap-2 text-xs uppercase tracking-wider py-2">
              <Plus size={14} /> Feed Price
            </Button>
          )}
        </div>
      </motion.div>

      {/* 2. ATMOSPHERIC VALUE STRIP */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center justify-between p-5 relative overflow-hidden bg-slate-950/40">
          <div className="absolute right-4 bottom-4 opacity-5 text-white"><Globe size={64} /></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Operational Sectors Linked</span>
            <div className="text-2xl font-black text-white font-mono mt-1">6 States</div>
          </div>
          <Badge variant="primary" className="text-[9px]">JH, OD, CG, MP, WB, RJ</Badge>
        </Card>
        
        <Card className="flex items-center justify-between p-5 relative overflow-hidden bg-slate-950/40">
          <div className="absolute right-4 bottom-4 opacity-5 text-white"><Layers size={64} /></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Tracked Asset Types</span>
            <div className="text-2xl font-black text-white font-mono mt-1">{priceStats.count} Items</div>
          </div>
          <Badge variant="neon" className="text-[9px]">Ex Ex-Factory Index</Badge>
        </Card>

        <Card className="flex items-center justify-between p-5 relative overflow-hidden bg-slate-950/40">
          <div className="absolute right-4 bottom-4 opacity-5 text-white"><Building2 size={64} /></div>
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Average Equipment Base</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatINR(priceStats.avg)}</div>
          </div>
          <Badge variant="success" className="text-[9px] gap-1"><ShieldCheck size={10} /> Certified Audit</Badge>
        </Card>
      </motion.div>

      {/* 3. CORE TRANSPARENCY MODULE: INVOICE CALCULATOR & STATE COMPARATIVE CHART */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* INTERACTIVE INVOICE CALCULATOR: 100% CLEAR DIGITAL BREAKDOWN */}
        <div className="xl:col-span-5 flex flex-col">
          <Card className="h-full bg-slate-950/80 border-cyan-500/10 flex flex-col justify-between p-6 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-40" />
            <div className="absolute -right-16 -bottom-16 opacity-5 text-cyan-400"><Calculator size={200} /></div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="text-cyan-400" size={16} />
                <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Transparency Calculator</h3>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
                Trace real landed capital expenditures down to the single rupee. Compute state taxes, dynamic freight, and environmental cess coefficients instantly.
              </p>

              {/* INPUT PANEL */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Equipment / Machinery</label>
                  <select 
                    value={calcItem}
                    onChange={(e) => setCalcItem(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 hover:border-white/20 text-white rounded-lg p-2.5 text-xs font-bold focus:border-cyan-500 outline-none transition-colors"
                  >
                    {uniqueItems.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destination State</label>
                    <select 
                      value={calcState}
                      onChange={(e) => setCalcState(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 text-xs font-bold focus:border-cyan-500 outline-none"
                    >
                      {Object.keys(STATE_COEFFICIENTS).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shipping Distance</label>
                    <div className="flex items-center bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5">
                      <input 
                        type="number" 
                        value={calcDistance} 
                        onChange={(e) => setCalcDistance(Math.max(0, parseInt(e.target.value) || 0))}
                        className="bg-transparent text-white font-mono text-xs font-bold w-full outline-none"
                      />
                      <span className="text-[9px] font-black text-gray-500 uppercase">KM</span>
                    </div>
                  </div>
                </div>

                {/* DISTANCE SLIDER */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Local (0 km)</span>
                    <span>Mid-haul (500 km)</span>
                    <span>Interstate (1000 km)</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    value={calcDistance} 
                    onChange={(e) => setCalcDistance(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* DETAILED RECEIPT / INVOICE DISPLAY */}
            {calculatorReceipt && (
              <div className="mt-8 bg-slate-900/60 border border-white/5 rounded-xl p-4.5 space-y-3 relative overflow-hidden backdrop-blur-sm">
                {/* Receipt Diagonal Slash Line */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none" />

                <div className="border-b border-dashed border-white/10 pb-2.5">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Transparency Ledger</div>
                  <h4 className="text-sm font-black text-white leading-tight mt-0.5 truncate">{calculatorReceipt.name}</h4>
                  <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400 mt-1">
                    <span>Model: {calculatorReceipt.model || "Standard"}</span>
                    <span>Sector: {calculatorReceipt.state}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>1. Ex-Factory Base Price:</span>
                    <span className="text-white font-bold">{formatINR(calculatorReceipt.base)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>2. State GST ({calculatorReceipt.gstPct}%):</span>
                    <span className="text-white font-bold">+{formatINR(calculatorReceipt.gstVal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span className="flex items-center gap-1">
                      3. Freight Logistics:
                      <span className="group relative cursor-help text-gray-600 hover:text-cyan-400">
                        <Info size={10} />
                        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 bg-slate-950 border border-white/10 text-[8px] leading-relaxed p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                          Base Freight ({formatINR(calculatorReceipt.baseFreight)}) + Transport ({calcDistance} km @ ₹{(STATE_COEFFICIENTS[calculatorReceipt.state] || {}).logisticsMultiplier}/km)
                        </span>
                      </span>
                    </span>
                    <span className="text-white font-bold">+{formatINR(calculatorReceipt.freightCost)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>4. Environmental Cess ({calculatorReceipt.cessPct}%):</span>
                    <span className="text-white font-bold">+{formatINR(calculatorReceipt.cessVal)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-white/15 pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
                    Net Landed Cost:
                  </span>
                  <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 font-mono">
                    {formatINR(calculatorReceipt.netLanded)}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* COMPARATIVE STATE CHART: DYNAMIC VISUAL BAR GRAPHS */}
        <div className="xl:col-span-7 flex flex-col">
          <Card className="h-full p-6 bg-slate-950/40 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-4 top-4 opacity-5 text-white"><TrendingUp size={80} /></div>

            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sliders size={16} className="text-primary" /> Multi-State Landed Cost Arbitrage
              </h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-6">
                Contrast final landed expenses for <strong className="text-white">{calcItem || "Selected Item"}</strong> side-by-side. Dynamic freight calculates using the active <strong className="text-cyan-400">{calcDistance} km</strong> distance parameter.
              </p>

              {/* DYNAMIC CHART RENDER */}
              <div className="space-y-4 pt-2">
                {comparisonData.map((item, idx) => {
                  // Find relative ratio for bar width comparison
                  const maxLanded = Math.max(...comparisonData.map(c => c.landed)) || 1;
                  const minLanded = Math.min(...comparisonData.map(c => c.landed)) || 1;
                  const ratio = (item.landed / maxLanded) * 100;
                  
                  const isCheapest = item.landed === minLanded;
                  const isMostExpensive = item.landed === maxLanded;

                  return (
                    <div key={item.state} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-300 w-28 truncate">{item.state}</span>
                          <span className="text-[9px] font-mono text-gray-500">[{item.code}]</span>
                          
                          {isCheapest && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">
                              Cheapest
                            </span>
                          )}
                          {!item.isPresent && (
                            <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-1.5 py-0.5 font-bold uppercase">
                              Standard Calc
                            </span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-white">
                          {formatINR(item.landed)}
                        </div>
                      </div>
                      
                      {/* Bar Visualizer */}
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div 
                          className={`h-full rounded-full bg-gradient-to-r ${isCheapest ? 'from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : isMostExpensive ? 'from-red-500 to-rose-600' : 'from-blue-600 to-cyan-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          transition={{ duration: 1.0, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 border-t border-white/5 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-[10px] text-gray-500 leading-normal max-w-sm">
                * Transparency analysis factors: State GST + Base Freight + (Distance coefficient * State multiplier) + State Environmental Cess index.
              </div>
              <Button onClick={() => toast.success("Comparative Price PDF compilation active.")} variant="outline" className="text-[10px] py-1.5 px-3 h-8 border-white/10 hover:bg-white/5 text-slate-300 font-bold gap-2">
                <Download size={12} /> Export Index
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* 4. MASTER DATAGRID & DETAILED TABLE */}
      <motion.div variants={itemVariants} className="space-y-4">
        
        {/* FILTERS TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-950/40 p-4 border border-white/5 rounded-xl">
          <div className="relative w-full md:w-80">
            <input 
              type="text"
              placeholder="Search by equipment name or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2 text-xs font-bold focus:border-primary outline-none"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Category tabs */}
            <div className="flex bg-slate-900 border border-white/10 rounded-lg p-1">
              {["All", "Machinery", "Equipment", "Auxiliary"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${selectedCategory === cat ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* State filter */}
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="All">All States</option>
              {Object.keys(STATE_COEFFICIENTS).map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PRICING DATA TABLE */}
        <Card className="p-0 overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/60 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Equipment / Machine Detail</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Operational State</th>
                  <th className="py-4 px-6 text-right">Ex-Factory Base</th>
                  <th className="py-4 px-6 text-right">Tax (GST)</th>
                  <th className="py-4 px-6 text-right">Base Freight</th>
                  <th className="py-4 px-6 text-right">State Cess</th>
                  <th className="py-4 px-6 text-right">Landed Cost*</th>
                  {canModifyPrices && <th className="py-4 px-6 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono text-gray-300">
                {loading ? (
                  <tr>
                    <td colSpan={canModifyPrices ? 9 : 8} className="py-12 text-center text-gray-500 font-sans">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Querying Financial Nodes...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPrices.length === 0 ? (
                  <tr>
                    <td colSpan={canModifyPrices ? 9 : 8} className="py-12 text-center text-gray-500 font-sans">
                      <AlertCircle className="mx-auto mb-2 text-gray-600" size={32} />
                      <p className="font-bold">No authoritative price indices map to active filters.</p>
                      <p className="text-xs text-gray-600 mt-1">Try relaxing your search terms or state filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPrices.map((item) => {
                    const base = Number(item.base_price);
                    const gst = base * ((item.gst_percent || 18.0) / 100);
                    const freight = Number(item.freight_cost || 0);
                    const stateCoeff = STATE_COEFFICIENTS[item.state] || { cess: 2.0 };
                    const cess = base * ((item.state_cess || stateCoeff.cess) / 100);
                    const landed = base + gst + freight + cess;

                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6 font-sans">
                          <div className="font-extrabold text-white text-sm">{item.item_name}</div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">Model: {item.model_number || "Standard"}</div>
                        </td>
                        <td className="py-4 px-6 font-sans">
                          <Badge 
                            variant={item.category === "Machinery" ? "neon" : item.category === "Equipment" ? "primary" : "default"}
                            className="text-[9px]"
                          >
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-sans font-bold text-slate-300">
                          {item.state}
                        </td>
                        <td className="py-4 px-6 text-right text-white font-bold">
                          {formatINR(base)}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-400">
                          <span className="text-[9px] text-gray-600 mr-1.5">[{item.gst_percent}%]</span>
                          {formatINR(gst)}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-400">
                          {formatINR(freight)}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-400">
                          <span className="text-[9px] text-gray-600 mr-1.5">[{item.state_cess || stateCoeff.cess}%]</span>
                          {formatINR(cess)}
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">
                          {formatINR(landed)}
                        </td>
                        
                        {canModifyPrices && (
                          <td className="py-4 px-6 text-center font-sans">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit prices and surcharges"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                                title="Purge price sheet record"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-white/5 bg-slate-950/40 text-[10px] text-gray-500 text-right">
            * Landed Cost computed in table handles local base logistics freight coefficients. For custom dynamic site calculations, use the Calculator above.
          </div>
        </Card>
      </motion.div>

      {/* 5. ADD / EDIT RECORD SLIDE-IN DIALOG MODAL (CRUD) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card max-w-xl w-full p-6 border-white/10 rounded-2xl relative z-10 bg-slate-950 max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                <Coins className="text-primary" size={20} />
                {modalMode === "Add" ? "Feed New Base Price" : "Edit Equipment Price Parameters"}
              </h2>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                
                {/* 1. Item Name and Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Item Name</label>
                    <input 
                      type="text"
                      placeholder="e.g., CAT Heavy Excavator"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Model / Model Number</label>
                    <input 
                      type="text"
                      placeholder="e.g., 390D L"
                      value={formModel}
                      onChange={(e) => setFormModel(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* 2. Category and State Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 font-bold focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Machinery">Machinery</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Auxiliary">Auxiliary</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Target State</label>
                    <select 
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      disabled={modalMode === "Edit"}
                      className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 font-bold focus:border-primary outline-none disabled:opacity-40 cursor-pointer"
                    >
                      {Object.keys(STATE_COEFFICIENTS).map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Base Price and GST */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Base Price (Ex-Factory, INR)</label>
                    <input 
                      type="number"
                      placeholder="e.g., 32000000"
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white font-mono rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">GST Percentage (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      placeholder="e.g., 18.0"
                      value={formGst}
                      onChange={(e) => setFormGst(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white font-mono rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* 4. Base Freight and State Cess */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">Base Freight Cost (INR)</label>
                    <input 
                      type="number"
                      placeholder="e.g., 450000"
                      value={formFreight}
                      onChange={(e) => setFormFreight(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white font-mono rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-400 uppercase tracking-wider">State-Specific Cess (%)</label>
                    <input 
                      type="number"
                      step="0.05"
                      placeholder="e.g., 2.5"
                      value={formCess}
                      onChange={(e) => setFormCess(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white font-mono rounded-lg p-2.5 font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* 5. Specifications list */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Technical Specifications</span>
                    <span className="text-[9px] text-gray-500 lowercase font-normal">Format - property: value (one per line)</span>
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="engine_power: 524 HP&#10;operating_weight: 86275 kg&#10;bucket_capacity: 4.6 m³"
                    value={formSpecs}
                    onChange={(e) => setFormSpecs(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-white rounded-lg p-2.5 font-mono focus:border-primary outline-none resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                    className="py-2.5 px-4 h-9 font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="success"
                    className="py-2.5 px-5 h-9 font-black"
                  >
                    {modalMode === "Add" ? "Create Index Entry" : "Save Specifications"}
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
