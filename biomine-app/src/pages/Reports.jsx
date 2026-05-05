import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, AlertCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Fetch relational data within date range
      const { data, error: fetchError } = await supabase
        .from('mis_entries')
        .select(`
          *,
          vehicles (*),
          machines (*)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setError("No records found in this date range.");
        setTimeout(() => setError(null), 3000);
        setIsExporting(false);
        return;
      }

      // Generate complex Excel grouping multiple MIS entries
      let excelData = [
        ["CONSOLIDATED MIS REPORT"],
        ["Period:", `${startDate} to ${endDate}`],
        [],
      ];

      data.forEach(entry => {
        excelData.push(["----------------------------------------------------------------"]);
        excelData.push(["Date:", entry.date, "Site:", entry.site]);
        excelData.push(["----------------------------------------------------------------"]);
        
        if (entry.vehicles && entry.vehicles.length > 0) {
          excelData.push(["VEHICLES"]);
          excelData.push(["Name", "Hours", "Diesel (L)"]);
          entry.vehicles.forEach(v => {
            excelData.push([v.name, v.hours, v.diesel]);
          });
          excelData.push([]);
        }

        if (entry.machines && entry.machines.length > 0) {
          excelData.push(["MACHINES"]);
          excelData.push(["Name", "Production (Tons)"]);
          entry.machines.forEach(m => {
            excelData.push([m.name, m.production]);
          });
          excelData.push([]);
        }

        excelData.push(["TOTALS FOR THE DAY"]);
        excelData.push(["Total Production:", entry.total_production || 0]);
        excelData.push(["Total Diesel:", entry.total_diesel || 0]);
        excelData.push([]);
      });

      // Overall Totals
      const grandTotalProd = data.reduce((sum, entry) => sum + (Number(entry.total_production) || 0), 0);
      const grandTotalDiesel = data.reduce((sum, entry) => sum + (Number(entry.total_diesel) || 0), 0);

      excelData.push(["================================================================"]);
      excelData.push(["GRAND TOTALS"]);
      excelData.push(["Total Production:", grandTotalProd]);
      excelData.push(["Total Diesel:", grandTotalDiesel]);

      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidated Report");

      XLSX.writeFile(workbook, `Consolidated_Report_${startDate}_to_${endDate}.xlsx`);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Reports & Exports</h2>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <h3 className="text-lg font-medium text-white mb-6">Generate Consolidated Excel Report</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-dark-border">
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="w-full md:w-auto gap-2 bg-success text-white hover:bg-success/90 h-12 px-8"
            >
              {isExporting ? (
                <span className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></span>
              ) : (
                <FileSpreadsheet size={20} />
              )}
              {isExporting ? "Generating Report..." : "Export Consolidated Excel"}
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="bg-dark-bg/30 border-dashed">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/20 text-primary rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h4 className="text-white font-medium mb-1">About Consolidated Reports</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              This will generate a comprehensive Excel workbook containing all MIS entries within the selected date range. Data is grouped by Date and Site, detailing individual vehicle and machine performances, alongside daily and grand totals.
            </p>
          </div>
        </div>
      </Card>

    </motion.div>
  );
}
