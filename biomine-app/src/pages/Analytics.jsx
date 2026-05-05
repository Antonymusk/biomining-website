import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "../components/ui/Card";
import { supabase } from "../lib/supabase";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Analytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: misData, error: misError } = await supabase
        .from('mis_entries')
        .select('*')
        .order('date', { ascending: true });

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
      .channel('schema-db-changes-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mis_entries' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Aggregate data by Month
  const monthlyDataMap = new Map();
  
  data.forEach(entry => {
    if (!entry.date) return;
    
    const dateObj = new Date(entry.date);
    const month = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const site = entry.site || 'Unknown';
    
    if (!monthlyDataMap.has(month)) {
      monthlyDataMap.set(month, { name: month, total_production: 0, total_diesel: 0, SiteA: 0, SiteB: 0 });
    }
    
    const current = monthlyDataMap.get(month);
    current.total_production += Number(entry.total_production || 0);
    current.total_diesel += Number(entry.total_diesel || 0);
    
    if (site.includes('Site A')) {
      current.SiteA += Number(entry.total_production || 0);
    } else if (site.includes('Site B')) {
      current.SiteB += Number(entry.total_production || 0);
    }
  });

  const chartData = Array.from(monthlyDataMap.values());

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-dark-bg/50 rounded-xl border border-danger/20 p-6">
        <AlertTriangle className="text-danger mb-4" size={48} />
        <h3 className="text-lg font-medium text-white mb-2">Error loading analytics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Monthly Production Trend</h3>
          <div className="h-[300px]">
            {loading ? (
              <div className="w-full h-full bg-dark-bg/50 animate-pulse rounded"></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="total_production" name="Total Production" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SiteA" name="Site A" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SiteB" name="Site B" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Diesel Consumption Trend</h3>
          <div className="h-[300px]">
            {loading ? (
              <div className="w-full h-full bg-dark-bg/50 animate-pulse rounded"></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total_diesel" name="Total Diesel (L)" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
