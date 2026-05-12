import React, { useState } from "react";
import { UploadCloud, FileText, Trash2, Download, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DocumentManager({ title = "Attached Invoices & Challans", initialAttachments = [] }) {
  const [attachments, setAttachments] = useState([
    { id: "1", name: "challan_DEL_9942.pdf", size: "1.4 MB", type: "pdf", date: "May 06, 2026" },
    { id: "2", name: "fuel_invoice_siliguri.xlsx", size: "380 KB", type: "xlsx", date: "May 05, 2026" },
    ...initialAttachments
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateUpload(files[0].name, files[0].size);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      simulateUpload(files[0].name, files[0].size);
    }
  };

  const simulateUpload = (name, sizeBytes) => {
    setUploadProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setUploadProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const sizeKb = sizeBytes ? `${(sizeBytes / 1024).toFixed(0)} KB` : "150 KB";
          const newAttachment = {
            id: crypto.randomUUID(),
            name,
            size: sizeKb,
            type: name.split('.').pop() || "pdf",
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
          };
          setAttachments(prev => [newAttachment, ...prev]);
          setUploadProgress(null);
        }, 500);
      }
    }, 150);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-300">{title}</h4>

      {/* DRAG AND DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 relative ${
          isDragging 
            ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.01]" 
            : "border-dark-border hover:border-gray-600 bg-dark-bg/20"
        }`}
      >
        <input
          type="file"
          id="file-attachment"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.xlsx,.docx,.jpg,.png"
        />
        <label htmlFor="file-attachment" className="cursor-pointer">
          <UploadCloud className="mx-auto mb-2 text-gray-400 hover:text-primary transition-colors" size={32} />
          <p className="text-xs font-semibold text-gray-200">Drag & drop files here, or <span className="text-primary hover:underline">browse</span></p>
          <p className="text-[10px] text-gray-500 mt-1">Supports PDF, Excel spreadsheets, Challans & photos up to 10MB</p>
        </label>

        {/* UPLOAD PROGRESS COVER */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark-bg/95 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 z-10"
            >
              <div className="w-full max-w-[200px]">
                <p className="text-xs text-gray-300 font-medium mb-1.5 flex justify-between">
                  <span>Uploading attachment...</span>
                  <span>{uploadProgress}%</span>
                </p>
                <div className="w-full h-1.5 bg-dark-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ATTACHMENT LIST */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {attachments.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-between items-center p-3 rounded-xl bg-dark-bg/40 border border-dark-border/40 hover:border-primary/20 transition-all duration-200"
            >
              <div className="flex items-center gap-3 truncate">
                <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-semibold text-gray-200 truncate" title={item.name}>{item.name}</h5>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.size} • Uploaded {item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert(`Downloading file: ${item.name}`); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Download File"
                >
                  <Download size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  className="p-1.5 hover:bg-danger/10 rounded-lg text-gray-500 hover:text-danger transition-colors"
                  title="Delete File"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {attachments.length === 0 && (
          <div className="text-center py-6 border border-dashed border-dark-border/40 rounded-xl text-gray-500 text-xs">
            No active attachments uploaded for this record.
          </div>
        )}
      </div>
    </div>
  );
}
