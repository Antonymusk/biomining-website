import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Trash2, 
  DollarSign, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { supabase } from "../lib/supabase";

const StatCard = ({ title, value, change, icon: Icon, colorClass, delay, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className="h-full relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${colorClass.bg}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-dark-bg/50 animate-pulse rounded mt-2"></div>
          ) : (
            <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</h3>
          )}
          <div className="mt-2 flex items-center text-sm">
            <span className={change >= 0 ? "text-success" : "text-danger"}>
              {change >= 0 ? "+" : ""}{change}%
            </span>
            <span className="ml-2 text-gray-500">vs last week</span>
          </div>
        </div>
        <div className={`rounded-xl p-3 ${colorClass.bg} ${colorClass.text} bg-opacity-20`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  </motion.div>
);

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: misData, error: misError } = await supabase
        .from('mis_entries')
        .select(`
          *,
          vehicles (*),
          machines (*)
        `)
        .order('date', { ascending: false });

      if (misError) throw misError;
      setData(misData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculations
  const totalProduction = data.reduce((sum, entry) => sum + (Number(entry.total_production) || 0), 0);
  const totalDiesel = data.reduce((sum, entry) => sum + (Number(entry.total_diesel) || 0), 0);
  const costPerTon = totalProduction > 0 ? ((totalDiesel * 90) / totalProduction).toFixed(2) : 0; // Assuming 90 per liter as dummy cost
  const totalExpense = totalDiesel * 90;

  // Process data for AreaChart (Daily Production)
  const productionMap = new Map();
  data.forEach(entry => {
    const day = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short' });
    const prod = Number(entry.total_production) || 0;
    if (productionMap.has(day)) {
      productionMap.set(day, productionMap.get(day) + prod);
    } else {
      productionMap.set(day, prod);
    }
  });

  const productionData = Array.from(productionMap).map(([name, total]) => ({
    name,
    total,
    inert: total * 0.4, // Mock breakdown since we don't have these fields
    rdf: total * 0.6
  })).reverse();

  // Process efficiency for BarChart (Site wise)
  const siteMap = new Map();
  data.forEach(entry => {
    const site = entry.site || 'Unknown';
    if (!siteMap.has(site)) {
      siteMap.set(site, { count: 0, efficiency: 0 });
    }
    const current = siteMap.get(site);
    siteMap.set(site, {
      count: current.count + 1,
      efficiency: current.efficiency + 85 // Mock efficiency base
    });
  });

  const efficiencyData = Array.from(siteMap).map(([name, val]) => ({
    name: name.split('-')[0].trim(),
    efficiency: Math.min(100, Math.floor(val.efficiency / val.count) + Math.floor(Math.random() * 10))
  }));

  // Flatten operations overview
  const operationsOverview = data.flatMap(entry => 
    (entry.machines || []).map(m => ({
      id: m.id,
      operator: "Operator",
      vehicle: m.name,
      status: "Active",
      efficiency: m.production > 0 ? 90 : 40
    }))
  ).slice(0, 5);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-dark-bg/50 rounded-xl border border-danger/20 p-6">
        <AlertTriangle className="text-danger mb-4" size={48} />
        <h3 className="text-lg font-medium text-white mb-2">Error loading dashboard</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Production" 
          value={`${totalProduction.toLocaleString()} T`} 
          change={8.2} 
          icon={TrendingUp} 
          colorClass={{ bg: "bg-primary", text: "text-primary" }}
          delay={0.1}
          isLoading={loading}
        />
        <StatCard 
          title="Total Diesel" 
          value={`${totalDiesel.toLocaleString()} L`} 
          change={5.1} 
          icon={Trash2} 
          colorClass={{ bg: "bg-accent", text: "text-accent" }}
          delay={0.2}
          isLoading={loading}
        />
        <StatCard 
          title="Total Expense" 
          value={`₹${(totalExpense / 100000).toFixed(2)}L`} 
          change={-2.4} 
          icon={DollarSign} 
          colorClass={{ bg: "bg-warning", text: "text-warning" }}
          delay={0.3}
          isLoading={loading}
        />
        <StatCard 
          title="Cost per Ton" 
          value={`₹${costPerTon}`} 
          change={-1.2} 
          icon={Activity} 
          colorClass={{ bg: "bg-success", text: "text-success" }}
          delay={0.4}
          isLoading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div 
          className="col-span-1 lg:col-span-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="h-[400px] p-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/dataviz-dark/256/0/0/0.png')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-dark-card to-transparent" />
            
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <Badge variant="neon" className="px-3 py-1 text-sm bg-dark-bg/80 backdrop-blur-md">
                Live Network Pulse
              </Badge>
              <div className="flex gap-2">
                <Badge variant="success" className="bg-dark-bg/80 backdrop-blur-md">Active Sync</Badge>
              </div>
            </div>

            <div className="absolute top-1/3 left-1/4 h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(59,130,246,1)] animate-pulse" />
            <div className="absolute top-1/2 left-1/2 h-4 w-4 rounded-full bg-success shadow-[0_0_15px_rgba(16,185,129,1)] animate-pulse" />
            <div className="absolute bottom-1/3 right-1/4 h-4 w-4 rounded-full bg-warning shadow-[0_0_15px_rgba(245,158,11,1)] animate-pulse" />

            <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Entries</span>
                <span className="text-2xl font-bold text-success neon-text">{loading ? "..." : data.length}</span>
              </div>
              <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Vehicles Logged</span>
                <span className="text-2xl font-bold text-warning">{loading ? "..." : data.reduce((acc, curr) => acc + (curr.vehicles?.length || 0), 0)}</span>
              </div>
              <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Machines Logged</span>
                <span className="text-2xl font-bold text-primary neon-text">{loading ? "..." : data.reduce((acc, curr) => acc + (curr.machines?.length || 0), 0)}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div 
          className="col-span-1 flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="flex-1 flex flex-col">
            <h3 className="text-lg font-medium text-white mb-4">Site Efficiency</h3>
            <div className="flex-1 min-h-[150px]">
              {loading ? (
                <div className="w-full h-full bg-dark-bg/50 animate-pulse rounded"></div>
              ) : efficiencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="efficiency" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No site data</div>
              )}
            </div>
          </Card>

          <Card className="flex-1">
            <h3 className="text-lg font-medium text-white mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-success/20 p-1 text-success">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Database Connected</p>
                  <p className="text-xs text-gray-400">Realtime subscription active</p>
                </div>
              </div>
              {data.length === 0 && !loading && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-warning/20 p-1 text-warning">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">No MIS Entries Found</p>
                    <p className="text-xs text-gray-400">Add data from MIS Entry</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card>
            <h3 className="text-lg font-medium text-white mb-4">Production Trend (Weekly)</h3>
            <div className="h-[300px]">
              {loading ? (
                <div className="w-full h-full bg-dark-bg/50 animate-pulse rounded"></div>
              ) : productionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRdf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInert" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="total" name="Total Prod." stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRdf)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No trend data</div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Recent Operations</h3>
              <Badge variant="default" className="cursor-pointer hover:bg-dark-border">View All</Badge>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-dark-bg/50 animate-pulse rounded"></div>)}
              </div>
            ) : operationsOverview.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Machine</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operationsOverview.map((op, i) => (
                      <TableRow key={op.id || i}>
                        <TableCell className="font-medium text-gray-300">{op.vehicle}</TableCell>
                        <TableCell>
                          <Badge variant={op.status === "Active" ? "success" : "warning"}>
                            {op.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 rounded-full bg-dark-bg overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full ${op.efficiency > 80 ? 'bg-success' : 'bg-warning'}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${op.efficiency}%` }}
                                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                              />
                            </div>
                            <span className="text-sm font-medium">{op.efficiency}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">No recent operations</div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
