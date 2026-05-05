import { motion } from "framer-motion";
import { Activity, AlertTriangle, Battery, Settings2, Wind } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const sites = [
  { id: "S1", name: "Northern Zone - Sector 12", status: "Optimal", production: "450T", uptime: "98%" },
  { id: "S2", name: "Southern Zone - Sector 4", status: "Warning", production: "210T", uptime: "82%" },
];

export default function Operations() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Live Site Monitoring</h2>
        <div className="flex gap-2">
          <Badge variant="success" className="animate-pulse">System Live</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sites.map((site, index) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">{site.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">Real-time telematics</p>
                </div>
                <Badge variant={site.status === "Optimal" ? "success" : "warning"}>{site.status}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
                  <div className="text-gray-400 text-sm mb-1">Current Production</div>
                  <div className="text-2xl font-bold text-white">{site.production}</div>
                </div>
                <div className="bg-dark-bg/50 rounded-xl p-4 border border-dark-border">
                  <div className="text-gray-400 text-sm mb-1">System Uptime</div>
                  <div className="text-2xl font-bold text-white">{site.uptime}</div>
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-300 mb-3">Active Machinery</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 text-primary"><Settings2 size={18} /></div>
                    <div>
                      <div className="font-medium text-sm text-white">Trommel TM-01</div>
                      <div className="text-xs text-gray-400">Processing RDF</div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Load</div>
                      <div className="text-sm font-medium text-white">78%</div>
                    </div>
                    <Badge variant="success" className="h-6">Running</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg border border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/20 text-warning"><Battery size={18} /></div>
                    <div>
                      <div className="font-medium text-sm text-white">Excavator EX-04</div>
                      <div className="text-xs text-gray-400">Fuel Level Low</div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Fuel</div>
                      <div className="text-sm font-medium text-warning">15%</div>
                    </div>
                    <Badge variant="warning" className="h-6">Warning</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-danger" size={24} />
          <h3 className="text-lg font-medium text-white">Active Alerts</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-danger">Machine Downtime Alert</h4>
              <p className="text-sm text-gray-300 mt-1">Trommel TM-02 at Southern Zone has been idle for 45 minutes.</p>
            </div>
            <span className="text-xs text-gray-500">10 mins ago</span>
          </div>
          <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-warning">Overfuel Usage</h4>
              <p className="text-sm text-gray-300 mt-1">Excavator EX-01 fuel consumption exceeds baseline by 15%.</p>
            </div>
            <span className="text-xs text-gray-500">1 hour ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
