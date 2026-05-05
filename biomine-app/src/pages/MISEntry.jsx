import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Plus, Trash2, CheckCircle2, X } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";

export default function MISEntry() {

  const [date, setDate] = useState("");
  const [site, setSite] = useState("");

  const [vehicles, setVehicles] = useState([{ id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]);
  const [machines, setMachines] = useState([{ id: crypto.randomUUID(), name: "", production: "" }]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addVehicle = () =>
    setVehicles([...vehicles, { id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]);

  const removeVehicle = (id) =>
    setVehicles(vehicles.filter(v => v.id !== id));

  const updateVehicle = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const addMachine = () =>
    setMachines([...machines, { id: crypto.randomUUID(), name: "", production: "" }]);

  const removeMachine = (id) =>
    setMachines(machines.filter(m => m.id !== id));

  const updateMachine = (index, field, value) => {
    const updated = [...machines];
    updated[index][field] = value;
    setMachines(updated);
  };

  const validateForm = () => {
    if (!date) return "Please select a date.";
    if (!site) return "Please select a site.";
    
    const validVehicles = vehicles.filter(v => v.name.trim() !== "");
    const validMachines = machines.filter(m => m.name.trim() !== "");
    
    if (validVehicles.length === 0 && validMachines.length === 0) {
      return "Please add at least one vehicle or machine with a name.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      showToast(errorMsg, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const validVehicles = vehicles.filter(v => v.name.trim() !== "");
      const validMachines = machines.filter(m => m.name.trim() !== "");

      const totalProduction = validMachines.reduce(
        (sum, m) => sum + (Number(m.production) || 0),
        0
      );

      const totalDiesel = validVehicles.reduce(
        (sum, v) => sum + (Number(v.diesel) || 0),
        0
      );

      // Insert Parent First
      const { data: entry, error } = await supabase
        .from("mis_entries")
        .insert([
          {
            date,
            site,
            total_production: totalProduction,
            total_diesel: totalDiesel,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const mis_id = entry.id;

      // Insert Children using mis_id
      if (validVehicles.length > 0) {
        const { error: vehError } = await supabase.from("vehicles").insert(
          validVehicles.map(v => ({
            mis_id,
            name: v.name,
            hours: Number(v.hours) || 0,
            diesel: Number(v.diesel) || 0,
          }))
        );
        if (vehError) throw vehError;
      }

      if (validMachines.length > 0) {
        const { error: macError } = await supabase.from("machines").insert(
          validMachines.map(m => ({
            mis_id,
            name: m.name,
            production: Number(m.production) || 0,
          }))
        );
        if (macError) throw macError;
      }

      // Reset form
      setDate("");
      setSite("");
      setVehicles([{ id: crypto.randomUUID(), name: "", hours: "", diesel: "" }]);
      setMachines([{ id: crypto.randomUUID(), name: "", production: "" }]);
      
      showToast("Data Saved Successfully", "success");

    } catch (err) {
      console.error("ERROR:", err);
      showToast(err.message || "Failed to save data", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // STRICT EXCEL EXPORT FORMAT
  const exportToExcel = () => {
    if (!date || !site) {
      showToast("Please fill Date and Site before exporting", "error");
      return;
    }

    const validVehicles = vehicles.filter(v => v.name.trim() !== "");
    const validMachines = machines.filter(m => m.name.trim() !== "");

    const totalProduction = validMachines.reduce((sum, m) => sum + (Number(m.production) || 0), 0);
    const totalDiesel = validVehicles.reduce((sum, v) => sum + (Number(v.diesel) || 0), 0);

    const data = [
      ["MIS REPORT"],
      ["Date:", date],
      ["Site:", site],
      [],
      ["VEHICLES"],
      ["Name", "Hours", "Diesel"],
      ...validVehicles.map(v => [v.name, Number(v.hours)||0, Number(v.diesel)||0]),
      [],
      ["MACHINES"],
      ["Name", "Production"],
      ...validMachines.map(m => [m.name, Number(m.production)||0]),
      [],
      ["TOTALS"],
      ["Total Production", totalProduction],
      ["Total Diesel", totalDiesel]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Some basic styling (bold headers)
    worksheet["A1"].s = { font: { bold: true, sz: 14 } };
    worksheet["A5"].s = { font: { bold: true } };
    worksheet["A9"].s = { font: { bold: true } };
    worksheet["A13"].s = { font: { bold: true } };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MIS");

    const fileName = `MIS_${date}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto relative"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-success text-white" : "bg-danger text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={20} /> : <X size={20} />}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Daily MIS Entry</h2>

        <div className="flex gap-3">
          <Button type="button" onClick={exportToExcel} variant="outline">
            Export Excel
          </Button>

          <Button 
            type="button" 
            onClick={handleSubmit} 
            variant="primary" 
            className="gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
            ) : (
              <Save size={18} />
            )}
            {isSubmitting ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Date <span className="text-danger">*</span></label>
              <Input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-dark-bg/80" 
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Site Location <span className="text-danger">*</span></label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Site</option>
                <option value="Site A - Northern Zone">Site A - Northern Zone</option>
                <option value="Site B - Southern Zone">Site B - Southern Zone</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Fuel Inventory</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Opening Balance</label>
              <Input type="number" placeholder="0.00" className="bg-dark-bg/80" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">Received Quantity</label>
              <Input type="number" placeholder="0.00" className="bg-dark-bg/80" />
            </div>
          </div>
        </Card>
      </div>

      {/* VEHICLES */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Vehicles Data</h3>
          <Button type="button" variant="outline" size="sm" onClick={addVehicle} className="gap-2 text-xs">
            <Plus size={14} /> Add Row
          </Button>
        </div>

        <div className="space-y-4">
          {vehicles.map((v, index) => (
            <motion.div key={v.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-dark-bg/30 p-3 rounded-xl border border-dark-border">
              <div className="flex-1 w-full">
                <Input placeholder="Vehicle Name" value={v.name} onChange={(e) => updateVehicle(index, "name", e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Input type="number" placeholder="Hours" value={v.hours} onChange={(e) => updateVehicle(index, "hours", e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Input type="number" placeholder="Diesel (L)" value={v.diesel} onChange={(e) => updateVehicle(index, "diesel", e.target.value)} />
              </div>
              <button type="button" onClick={() => removeVehicle(v.id)} className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
          {vehicles.length === 0 && (
             <div className="text-center py-4 text-gray-500 text-sm">No vehicles added. Click 'Add Row' to start.</div>
          )}
        </div>
      </Card>

      {/* MACHINES */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Machines Production</h3>
          <Button type="button" variant="outline" size="sm" onClick={addMachine} className="gap-2 text-xs">
            <Plus size={14} /> Add Row
          </Button>
        </div>

        <div className="space-y-4">
          {machines.map((m, index) => (
            <motion.div key={m.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-dark-bg/30 p-3 rounded-xl border border-dark-border">
              <div className="flex-1 w-full">
                <Input placeholder="Machine Name" value={m.name} onChange={(e) => updateMachine(index, "name", e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Input type="number" placeholder="Production (Tons)" value={m.production} onChange={(e) => updateMachine(index, "production", e.target.value)} />
              </div>
              <button type="button" onClick={() => removeMachine(m.id)} className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
           {machines.length === 0 && (
             <div className="text-center py-4 text-gray-500 text-sm">No machines added. Click 'Add Row' to start.</div>
          )}
        </div>
      </Card>

    </motion.div>
  );
}