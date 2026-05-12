import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch, ArrowUpRight, ArrowDownRight, AlertCircle, Plus, X, Loader2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { inventoryService } from "../services/inventoryService";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { AdminActionMenu } from "../components/ui/AdminActionMenu";
import { useAuth } from "../lib/AuthContext";

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    site_id: "",
    item_name: "",
    category: "",
    current_stock: "",
    status: "Optimal",
    trend: "up"
  });

  useEffect(() => {
    fetchItems();

    const channel = inventoryService.subscribeToInventoryUpdates((payload) => {
      fetchItems(); // refresh on any change
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchSites();
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const data = await inventoryService.getSites();
      let filtered = data || [];
      if (user && user.assigned_site) {
        filtered = filtered.filter(s => s.name === user.assigned_site);
      }
      setSites(filtered);
      if (user && user.assigned_site) {
        const matched = filtered.find(s => s.name === user.assigned_site);
        if (matched) setSelectedSite(matched.id);
      }
    } catch (error) {
      toast.error("Failed to load sites");
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventoryItems(selectedSite || null, 50);
      setItems(data);
    } catch (error) {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.addSite(newSiteName);
      toast.success("Site added successfully");
      setIsAddSiteOpen(false);
      setNewSiteName("");
      fetchSites();
    } catch (error) {
      console.error("Add site error:", error);
      toast.error(error.message || "Failed to add site");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      if (!newItem.site_id) return toast.error("Please select a site");
      await inventoryService.addInventoryItem({
        ...newItem,
        current_stock: Number(newItem.current_stock) || 0
      });
      toast.success("Item added successfully");
      setIsAddItemOpen(false);
      setNewItem({ site_id: "", item_name: "", category: "", current_stock: "", status: "Optimal", trend: "up" });
      fetchItems();
    } catch (error) {
      console.error("Add item error:", error);
      toast.error(error.message || "Failed to add item");
    }
  };

  // Stats calculation
  const totalItems = items.length;
  const lowStock = items.filter(i => i.status === 'Low Stock').length;
  const overStock = items.filter(i => i.status === 'Overstock').length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Inventory Management</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddSiteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-border text-white rounded-xl hover:bg-dark-border/80 transition-colors"
          >
            <Plus size={18} /> Add Site
          </button>
          <button 
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
            <PackageSearch size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Total Items Tracked</div>
          <div className="mt-2 text-3xl font-bold text-white">{totalItems}</div>
        </Card>
        <Card className="relative overflow-hidden border border-danger/30 hover-lift">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-danger">
            <AlertCircle size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Low Stock Alerts</div>
          <div className="mt-2 text-3xl font-bold text-danger">{lowStock}</div>
        </Card>
        <Card className="relative overflow-hidden border border-warning/30 hover-lift">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-warning">
            <AlertCircle size={48} />
          </div>
          <div className="text-sm font-medium text-gray-400">Overstock Alerts</div>
          <div className="mt-2 text-3xl font-bold text-warning">{overStock}</div>
        </Card>
        <Card className="relative overflow-hidden hover-lift">
          <div className="text-sm font-medium text-gray-400">Value Held</div>
          <div className="mt-2 text-3xl font-bold text-white">Dynamic</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-medium text-white">Stock Overview</h3>
          <select 
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-primary/50 transition-colors"
          >
            <option value="">All Sites</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No inventory items found. Add an item to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Trend</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-dark-border/20 transition-colors">
                  <TableCell className="font-medium text-white">{item.item_name}</TableCell>
                  <TableCell className="text-gray-400">{item.inventory_sites?.name || 'Unknown'}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-medium">{item.current_stock}</TableCell>
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
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <AdminActionMenu module="Inventory" recordId={item.id} record={item} onComplete={fetchItems} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Add Site Modal */}
      <AnimatePresence>
        {isAddSiteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAddSiteOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl"
            >
              <button onClick={() => setIsAddSiteOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold text-white mb-4">Add New Site</h3>
              <form onSubmit={handleAddSite} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Site Name</label>
                  <input 
                    required autoFocus
                    type="text" 
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                    placeholder="e.g. Okhla Phase 1"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium">
                    Save Site
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {isAddItemOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsAddItemOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <button onClick={() => setIsAddItemOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold text-white mb-4">Add Inventory Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Site *</label>
                  <select 
                    required
                    value={newItem.site_id}
                    onChange={(e) => setNewItem({...newItem, site_id: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                  >
                    <option value="">Select a site...</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Item Name *</label>
                  <input 
                    required type="text" value={newItem.item_name} onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                    placeholder="e.g. Diesel"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <input 
                      type="text" value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                      placeholder="e.g. Fuel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Current Stock</label>
                    <input 
                      type="number" value={newItem.current_stock} onChange={(e) => setNewItem({...newItem, current_stock: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                      placeholder="e.g. 1000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                    <select 
                      value={newItem.status} onChange={(e) => setNewItem({...newItem, status: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                    >
                      <option>Optimal</option>
                      <option>Low Stock</option>
                      <option>Overstock</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Trend</label>
                    <select 
                      value={newItem.trend} onChange={(e) => setNewItem({...newItem, trend: e.target.value})}
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white focus:border-primary/50 outline-none"
                    >
                      <option value="up">Up (Increasing)</option>
                      <option value="down">Down (Decreasing)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium">
                    Save Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
