import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Truck, Wrench, Activity, Filter, X } from "lucide-react";
import { Card } from "./Card";

export function OperationalTimeline({ data = [], loading = false, heightClass = "h-[350px]" }) {
  const [filter, setFilter] = useState("all");

  const filteredData = data.filter(event => {
    if (filter === "all") return true;
    if (filter === "critical" && event.severity === "critical") return true;
    if (filter === "warning" && event.severity === "warning") return true;
    if (filter === "info" && event.severity === "info") return true;
    return false;
  });

  return (
    <Card className={`border-dark-border/60 flex flex-col ${heightClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock size={16} className="text-gray-400" /> Operational Timeline
        </h3>
        
        {/* Simple Filter Toggle */}
        <div className="flex gap-1">
          <button onClick={() => setFilter("all")} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${filter === "all" ? "bg-primary/20 text-primary" : "text-gray-500 hover:text-gray-300"}`}>All</button>
          <button onClick={() => setFilter("warning")} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${filter === "warning" ? "bg-warning/20 text-warning" : "text-gray-500 hover:text-gray-300"}`}>Warnings</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-dark-bg/50 animate-pulse shrink-0"></div>
                <div className="h-10 w-full bg-dark-bg/50 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="relative border-l border-dark-border/50 ml-3 space-y-6 pb-4">
            <AnimatePresence>
              {filteredData.map((event, idx) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                  className="relative pl-6"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full border-4 border-[#0B1120] flex items-center justify-center ${
                    event.severity === 'critical' ? 'bg-danger' : event.severity === 'warning' ? 'bg-warning' : event.severity === 'success' ? 'bg-success' : 'bg-primary'
                  }`}>
                    {event.event_type === 'movement' ? <Truck size={8} className="text-white" /> :
                     event.event_type === 'maintenance' ? <Wrench size={8} className="text-white" /> :
                     <Activity size={8} className="text-white" />}
                  </div>
                  
                  {/* Content */}
                  <div>
                    <p className="text-xs text-gray-200 font-medium leading-snug">{event.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        event.severity === 'critical' ? 'bg-danger/10 text-danger' : 
                        event.severity === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                      }`}>
                        {event.site || 'System'}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">{new Date(event.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Clock size={24} className="text-gray-600 mb-2" />
            <p className="text-xs">No matching events</p>
          </div>
        )}
      </div>
    </Card>
  );
}
