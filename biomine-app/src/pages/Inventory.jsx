import { motion } from "framer-motion";
import { PackageSearch, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";

const inventoryData = [
  { id: "INV-01", item: "Diesel", category: "Fuel", stock: "12,450 L", status: "Optimal", trend: "down" },
  { id: "INV-02", item: "RDF", category: "Output", stock: "4,200 T", status: "Overstock", trend: "up" },
  { id: "INV-03", item: "Inert Material", category: "Output", stock: "1,100 T", status: "Optimal", trend: "up" },
  { id: "INV-04", item: "Good Earth", category: "Output", stock: "8,500 T", status: "Optimal", trend: "up" },
  { id: "INV-05", item: "Excavator Tracks", category: "Spares", stock: "2 Units", status: "Low Stock", trend: "down" },
  { id: "INV-06", item: "Engine Oil", category: "Consumables", stock: "150 L", status: "Optimal", trend: "down" },
];

export default function Inventory() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <PackageSearch size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Total Items Tracked</div>
          <div className="mt-2 text-3xl font-bold text-white">1,204</div>
        </Card>
        <Card className="relative overflow-hidden border border-danger/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-danger">
            <AlertCircle size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Low Stock Alerts</div>
          <div className="mt-2 text-3xl font-bold text-danger">12</div>
        </Card>
        <Card className="relative overflow-hidden border border-warning/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-warning">
            <AlertCircle size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Overstock Alerts</div>
          <div className="mt-2 text-3xl font-bold text-warning">5</div>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="text-sm font-medium text-gray-400">Value Held</div>
          <div className="mt-2 text-3xl font-bold text-white">₹1.2Cr</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Stock Overview</h3>
          <select className="bg-dark-bg border border-dark-border rounded-xl px-3 py-1.5 text-sm text-white outline-none">
            <option>All Sites</option>
            <option>Site A</option>
            <option>Site B</option>
          </select>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item ID</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="text-gray-400">{item.id}</TableCell>
                <TableCell className="font-medium text-white">{item.item}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell className="font-medium">{item.stock}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === "Optimal" ? "success" : 
                    item.status === "Low Stock" ? "danger" : "warning"
                  }>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    {item.trend === "up" ? (
                      <ArrowUpRight className="text-success" size={20} />
                    ) : (
                      <ArrowDownRight className="text-danger" size={20} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}
