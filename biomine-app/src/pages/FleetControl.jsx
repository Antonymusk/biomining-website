import { motion } from "framer-motion";
import { Search, Filter, Truck } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";

const fleetData = [
  { id: "V-001", name: "Excavator EX-01", type: "Excavator", status: "Active", hours: 1450, fuel: 45, efficiency: 92 },
  { id: "V-002", name: "Dumper TR-44", type: "Dumper", status: "Active", hours: 2100, fuel: 80, efficiency: 88 },
  { id: "V-003", name: "Trommel TM-02", type: "Machine", status: "Maintenance", hours: 3200, fuel: 10, efficiency: 0 },
  { id: "V-004", name: "Loader LD-05", type: "Loader", status: "Idle", hours: 850, fuel: 60, efficiency: 45 },
  { id: "V-005", name: "Dumper TR-12", type: "Dumper", status: "Active", hours: 1920, fuel: 55, efficiency: 95 },
  { id: "V-006", name: "Excavator EX-02", type: "Excavator", status: "Active", hours: 1100, fuel: 35, efficiency: 85 },
];

export default function FleetControl() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Fleet Control System</h2>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="Search fleet..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={18} /> Filters
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-dark-card to-dark-bg">
          <div className="p-4 rounded-full bg-primary/20 text-primary">
            <Truck size={28} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Fleet</div>
            <div className="text-3xl font-bold text-white">42</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-gradient-to-br from-dark-card to-dark-bg">
          <div className="p-4 rounded-full bg-success/20 text-success">
            <Truck size={28} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Active Units</div>
            <div className="text-3xl font-bold text-white">35</div>
          </div>
        </Card>
        <Card className="flex items-center gap-4 bg-gradient-to-br from-dark-card to-dark-bg">
          <div className="p-4 rounded-full bg-warning/20 text-warning">
            <Truck size={28} />
          </div>
          <div>
            <div className="text-sm text-gray-400">In Maintenance</div>
            <div className="text-3xl font-bold text-white">3</div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle ID</TableHead>
              <TableHead>Name / Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Running Hours</TableHead>
              <TableHead>Fuel Level</TableHead>
              <TableHead className="text-right">Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fleetData.map((vehicle, index) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium text-gray-300">{vehicle.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-white">{vehicle.name}</div>
                  <div className="text-xs text-gray-400">{vehicle.type}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    vehicle.status === "Active" ? "success" : 
                    vehicle.status === "Idle" ? "warning" : "danger"
                  }>
                    {vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell>{vehicle.hours} hrs</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-dark-bg overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${vehicle.fuel > 50 ? 'bg-success' : vehicle.fuel > 20 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${vehicle.fuel}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{vehicle.fuel}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-bold ${vehicle.efficiency > 80 ? 'text-success' : vehicle.efficiency > 50 ? 'text-warning' : 'text-danger'}`}>
                    {vehicle.efficiency}%
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}
