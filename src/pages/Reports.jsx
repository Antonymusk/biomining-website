import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, FileText, AlertCircle, X, Download, Sliders, Calendar, MapPin, CheckCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/supabase";
import * as XLSX from "xlsx";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("all");
  const [format, setFormat] = useState("excel");
  const [reportMode, setReportMode] = useState("consolidated");
  
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error: siteError } = await supabase.from("inventory_sites").select("name").order("name");
        if (data) {
          setSites(data.map(d => d.name));
        }
      } catch (err) {
        console.error("Error fetching sites:", err);
      }
    };
    fetchSites();
  }, []);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      setTimeout(() => setError(null), 3500);
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      setTimeout(() => setError(null), 3500);
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
        setTimeout(() => setError(null), 3500);
        setIsExporting(false);
        return;
      }

      // PDF Generator
      if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        
        let reportHtml = `
          <html>
            <head>
              <title>MIS Report - ${selectedSite === 'all' ? 'All Sites' : selectedSite}</title>
              <style>
                body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; background-color: #ffffff; color: #1e293b; line-height: 1.5; }
                h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 5px; font-size: 24px; text-transform: uppercase; letter-spacing: 0.5px; }
                .meta { margin-bottom: 30px; font-size: 13px; color: #64748b; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
                .meta p { margin: 4px 0; }
                .site-header { font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #1e3a8a; text-transform: uppercase; border-bottom: 1px solid #bfdbfe; padding-bottom: 6px; }
                .section-title { font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; color: #3b82f6; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
                th { background-color: #f1f5f9; font-weight: 600; color: #334155; }
                .totals { font-weight: bold; background-color: #f8fafc; }
                .page-break { page-break-after: always; }
              </style>
            </head>
            <body>
              <h1>BIOMINE OPERATIONAL INTELLIGENCE REPORT</h1>
              <div class="meta">
                <p><strong>Site Mode:</strong> ${selectedSite === 'all' ? 'Consolidated (All Sites)' : selectedSite}</p>
                <p><strong>Date Range:</strong> ${startDate} to ${endDate}</p>
                <p><strong>Exported On:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
        `;

        if (selectedSite === "all") {
          const siteGroups = {};
          data.forEach(entry => {
            const siteName = entry.site || "Other";
            if (!siteGroups[siteName]) siteGroups[siteName] = [];
            siteGroups[siteName].push(entry);
          });

          Object.entries(siteGroups).forEach(([siteName, entries], idx) => {
            reportHtml += `
              <div class="${idx > 0 ? 'page-break' : ''}">
                <div class="site-header">Site: ${siteName}</div>
            `;

            entries.forEach(entry => {
              reportHtml += `
                <div class="section-title">Date Log: ${entry.date}</div>
              `;

              if (entry.vehicles && entry.vehicles.length > 0) {
                reportHtml += `
                  <table>
                    <thead>
                      <tr><th>Vehicle Name</th><th>Hours</th><th>Diesel (L)</th></tr>
                    </thead>
                    <tbody>
                      ${entry.vehicles.map(v => `<tr><td>${v.name}</td><td>${v.hours}</td><td>${v.diesel}</td></tr>`).join("")}
                    </tbody>
                  </table>
                `;
              }

              if (entry.machines && entry.machines.length > 0) {
                reportHtml += `
                  <table>
                    <thead>
                      <tr><th>Machine Name</th><th>Production (Tons)</th><th>Diesel Used (L)</th></tr>
                    </thead>
                    <tbody>
                      ${entry.machines.map(m => `<tr><td>${m.name}</td><td>${m.production}</td><td>${m.diesel || 0}</td></tr>`).join("")}
                    </tbody>
                  </table>
                `;
              }

              reportHtml += `
                <table style="width: 50%; float: right;">
                  <tr class="totals"><td>Total Production:</td><td>${entry.total_production || 0} Tons</td></tr>
                  <tr class="totals"><td>Total Diesel Used:</td><td>${entry.total_diesel || 0} L</td></tr>
                </table>
                <div style="clear: both; height: 10px;"></div>
              `;
            });

            reportHtml += `</div>`;
          });
        } else {
          const siteEntries = data.filter(d => d.site === selectedSite);
          reportHtml += `<div class="site-header">Site: ${selectedSite}</div>`;
          
          siteEntries.forEach(entry => {
            reportHtml += `
              <div class="section-title">Date Log: ${entry.date}</div>
            `;

            if (entry.vehicles && entry.vehicles.length > 0) {
              reportHtml += `
                <table>
                  <thead>
                    <tr><th>Vehicle Name</th><th>Hours</th><th>Diesel (L)</th></tr>
                  </thead>
                  <tbody>
                    ${entry.vehicles.map(v => `<tr><td>${v.name}</td><td>${v.hours}</td><td>${v.diesel}</td></tr>`).join("")}
                  </tbody>
                </table>
              `;
            }

            if (entry.machines && entry.machines.length > 0) {
              reportHtml += `
                <table>
                  <thead>
                    <tr><th>Machine Name</th><th>Production (Tons)</th><th>Diesel Used (L)</th></tr>
                  </thead>
                  <tbody>
                    ${entry.machines.map(m => `<tr><td>${m.name}</td><td>${m.production}</td><td>${m.diesel || 0}</td></tr>`).join("")}
                  </tbody>
                </table>
              `;
            }

            reportHtml += `
              <table style="width: 50%; float: right;">
                <tr class="totals"><td>Total Production:</td><td>${entry.total_production || 0} Tons</td></tr>
                <tr class="totals"><td>Total Diesel Used:</td><td>${entry.total_diesel || 0} L</td></tr>
              </table>
              <div style="clear: both; height: 10px;"></div>
            `;
          });
        }

        reportHtml += `
            </body>
          </html>
        `;

        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.print();
        
        setSuccess("PDF Report Generated Successfully!");
        setTimeout(() => setSuccess(null), 3000);
        setIsModalOpen(false);
        return;
      }

      // FLAT TABULAR INDUSTRIAL EXCEL EXPORT
      const rows = [];
      const filteredData = selectedSite === "all" ? data : data.filter(d => d.site === selectedSite);

      filteredData.forEach(entry => {
        const vehiclesList = entry.vehicles && entry.vehicles.length > 0 ? entry.vehicles : [];
        const mismatchDetected = Math.abs(entry.mismatch_difference || 0) > 5;
        const validationStatusText = mismatchDetected ? "Fuel Mismatch" : "Verified";
        const disposal = Number(entry.total_disposal) || 0;
        const totalProd = Number(entry.total_production) || 0;
        const opening = Number(entry.fuel_opening) || 0;

        if (vehiclesList.length > 0) {
          vehiclesList.forEach(v => {
            const usage = Number(v.diesel) || 0;
            rows.push({
              Date: entry.date,
              Site: entry.site || "N/A",
              Vehicle: v.name || "N/A",
              "Diesel Purchased": Number(entry.fuel_received) || 0,
              "Diesel Usage": usage,
              "Diesel Balance": opening - usage,
              "Running Hours": Number(v.hours) || 0,
              "Total Production": totalProd,
              RDF: Number((disposal * 0.4).toFixed(2)),
              Inert: Number((disposal * 0.3).toFixed(2)),
              Soil: Number((disposal * 0.3).toFixed(2)),
              "Total Disposal": disposal,
              "Lt. per Ton": disposal > 0 ? Number((usage / disposal).toFixed(4)) : 0,
              "Validation Status": validationStatusText
            });
          });
        } else {
          const usage = Number(entry.total_diesel) || 0;
          rows.push({
            Date: entry.date,
            Site: entry.site || "N/A",
            Vehicle: "N/A",
            "Diesel Purchased": Number(entry.fuel_received) || 0,
            "Diesel Usage": usage,
            "Diesel Balance": opening - usage,
            "Running Hours": 0,
            "Total Production": totalProd,
            RDF: Number((disposal * 0.4).toFixed(2)),
            Inert: Number((disposal * 0.3).toFixed(2)),
            Soil: Number((disposal * 0.3).toFixed(2)),
            "Total Disposal": disposal,
            "Lt. per Ton": disposal > 0 ? Number((usage / disposal).toFixed(4)) : 0,
            "Validation Status": validationStatusText
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // Auto column widths & frozen headers
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 15 }, // Site
        { wch: 18 }, // Vehicle
        { wch: 16 }, // Diesel Purchased
        { wch: 14 }, // Diesel Usage
        { wch: 15 }, // Diesel Balance
        { wch: 14 }, // Running Hours
        { wch: 16 }, // Total Production
        { wch: 10 }, // RDF
        { wch: 10 }, // Inert
        { wch: 10 }, // Soil
        { wch: 15 }, // Total Disposal
        { wch: 12 }, // Lt. per Ton
        { wch: 18 }, // Validation Status
      ];
      worksheet["!cols"] = colWidths;
      worksheet["!views"] = [{ state: 'frozen', ySplit: 1 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, selectedSite === "all" ? "All Sites MIS" : selectedSite.substring(0, 31));

      const filename = selectedSite === "all" 
        ? `Consolidated_Report_${startDate}_to_${endDate}.xlsx` 
        : `MIS_Report_${selectedSite}_${startDate}_to_${endDate}.xlsx`;

      XLSX.writeFile(workbook, filename);

      setSuccess("Flat industrial report exported successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setIsModalOpen(false);

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
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="gap-2 bg-primary text-white hover:bg-primary/90 h-11 px-6 shadow-lg shadow-primary/20 transition-all duration-300 cursor-pointer"
        >
          <Sliders size={18} /> Configure Export
        </Button>
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

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-xl flex items-center gap-2"
          >
            <CheckCircle size={18} />
            <span className="text-sm font-medium">{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <h3 className="text-lg font-medium text-white mb-6">Quick Consolidated Excel Report</h3>
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
              className="w-full md:w-auto gap-2 bg-success text-white hover:bg-success/90 h-12 px-8 transition-all duration-200 cursor-pointer"
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

      {/* EXPORT CONFIGURATION GLASSMORPHIC MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121824]/95 border border-dark-border p-6 rounded-2xl w-full max-w-lg shadow-2xl relative backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-5 bg-primary rounded-full"></span>
                  Configure Site-Wise Export
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Site Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                    <MapPin size={14} className="text-primary" /> Site Location
                  </label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">Consolidated (All Sites)</option>
                    {sites.map(siteName => (
                      <option key={siteName} value={siteName}>{siteName}</option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                      <Calendar size={14} className="text-primary" /> Start Date
                    </label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                      <Calendar size={14} className="text-primary" /> End Date
                    </label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex h-11 w-full rounded-xl border border-dark-border bg-dark-bg/80 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                    />
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">Export Format</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormat("excel")}
                      className={`flex items-center justify-center gap-2 h-12 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                        format === "excel"
                          ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/10"
                          : "border-dark-border bg-dark-bg/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      <FileSpreadsheet size={18} /> Excel Worksheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat("pdf")}
                      className={`flex items-center justify-center gap-2 h-12 rounded-xl border font-medium text-sm transition-all cursor-pointer ${
                        format === "pdf"
                          ? "bg-primary/20 border-primary text-white shadow-lg shadow-primary/10"
                          : "border-dark-border bg-dark-bg/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      <FileText size={18} /> Printable PDF Report
                    </button>
                  </div>
                </div>

                {/* Report Mode */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">Report Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setReportMode("daily")}
                      className={`flex items-center justify-center h-11 rounded-xl border font-medium text-xs transition-all cursor-pointer ${
                        reportMode === "daily"
                          ? "bg-success/20 border-success text-success"
                          : "border-dark-border bg-dark-bg/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      Daily Segregated logs
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMode("consolidated")}
                      className={`flex items-center justify-center h-11 rounded-xl border font-medium text-xs transition-all cursor-pointer ${
                        reportMode === "consolidated"
                          ? "bg-success/20 border-success text-success"
                          : "border-dark-border bg-dark-bg/40 text-gray-400 hover:text-white"
                      }`}
                    >
                      Consolidated Totals
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-dark-border flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="h-11 px-5 border-dark-border text-gray-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="gap-2 bg-primary text-white hover:bg-primary/90 h-11 px-6 shadow-lg shadow-primary/20 cursor-pointer"
                  >
                    {isExporting ? (
                      <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                    ) : (
                      <Download size={16} />
                    )}
                    {isExporting ? "Generating..." : "Generate Report"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
