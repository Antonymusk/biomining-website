import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Archive, Trash2, X, AlertTriangle, FileSignature, Edit, Save, Eye, Truck, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../lib/AuthContext';
import { adminService } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Button } from './Button';
import { requisitionService } from '../../services/requisitionService';

export function AdminActionMenu({ module, recordId, record, onComplete }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'delete' | 'edit' | 'view'
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unified preloaded edit state
  const [editData, setEditData] = useState({});

  // Trigger positioning coordinates
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [confirmAction, setConfirmAction] = useState(null); // 'Reject' | 'Cancel' | 'Archive'

  // Debug Protection Logging
  useEffect(() => {
    console.log(`[AdminActionMenu Debug] Mount for Record: ${recordId}, Module: ${module}`);
  }, [recordId, module]);

  // Temporary Action Debugger Hook
  useEffect(() => {
    console.log(`[AdminActionMenu Event Binding Debug] Menu Open: ${isOpen}, Modal Type: ${modalType}, Active Confirm Action: ${confirmAction}, Active Module: ${module}`);
  }, [isOpen, modalType, confirmAction, module]);

  // Stable Click Outside event registration with macrotask delay (prevents immediate auto-close)
  useEffect(() => {
    let isMounted = true;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      const timer = setTimeout(() => {
        if (isMounted) {
          document.addEventListener('click', handleClickOutside);
          document.addEventListener('keydown', handleEscKey);
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen]);

  // Scroll Lock when any Modal is active
  useEffect(() => {
    if (modalType) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalType]);

  if (!user) return null;

  const handleOpenDropdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const openUp = rect.bottom > window.innerHeight - 180; // Flip upward if near bottom of viewport
      
      // Using absolute positioning relative to document.body (scroll compensated) for 100% parent-transform immunity!
      setCoords({
        top: openUp ? rect.top + window.scrollY - 120 : rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160,
        openUp
      });
    }
    setIsOpen(!isOpen);
  };

  const handleOpenEdit = (e) => {
    e.stopPropagation();
    if (!record) {
      toast.error("Record details could not be preloaded.");
      return;
    }

    setEditData({
      // Fleet Vehicles
      vehicle_name: record.vehicle_name || "",
      vehicle_number: record.vehicle_number || "",
      vehicle_type: record.vehicle_type || "Excavator",
      status: record.status || "Active",
      running_hours: record.running_hours || 0,
      fuel_level: record.fuel_level || 0,
      efficiency: record.efficiency || 0,

      // Inventory Items
      item_name: record.item_name || "",
      category: record.category || "",
      current_stock: record.current_stock || 0,
      trend: record.trend || "up",

      // Maintenance Assets
      machine_name: record.machine_name || "",
      machine_type: record.machine_type || "Excavator",
      machine_id: record.machine_id || "",
      manufacturer: record.manufacturer || "",

      // Procurement Requisitions
      quantity: record.quantity || 1,
      priority: record.priority || "Medium",
      item_description: record.item_description || "",
      delivery_date: record.actual_delivery_date || new Date().toISOString().split('T')[0],
      delivered_by: record.delivered_by || "",
      invoice_reference: record.invoice_reference || "",
      remarks: record.remarks || record.delivery_notes || "",
      vendor_name: record.vendors?.vendor_name || "",

      // Drivers
      full_name: record.full_name || "",
      license_number: record.license_number || "",
      phone: record.phone || "",
      safety_score: record.safety_score || 0,
      efficiency_score: record.efficiency_score || 0
    });

    setModalType('edit');
    setIsOpen(false);
  };

  const handleOpenEditWithStatus = (targetStatus) => {
    if (!record) return;
    setEditData({
      item_name: record.item_name || "",
      category: record.category || "Spare Parts",
      quantity: record.quantity || 1,
      priority: record.priority || "Medium",
      item_description: record.item_description || "",
      status: targetStatus,
      delivery_date: record.actual_delivery_date || new Date().toISOString().split('T')[0],
      delivered_by: record.delivered_by || "",
      invoice_reference: record.invoice_reference || "",
      remarks: record.remarks || record.delivery_notes || "",
      vendor_name: record.vendors?.vendor_name || ""
    });
    setModalType('edit');
    setIsOpen(false);
  };

  const handleConfirmProcurementAction = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    
    setModalType(null);
    let targetStatus = 'Pending';
    if (confirmAction === 'Reject') targetStatus = 'Rejected';
    else if (confirmAction === 'Cancel') targetStatus = 'Cancelled';
    else if (confirmAction === 'Archive') targetStatus = 'Fulfilled';

    console.log(`[AdminActionMenu Confirm Action] Triggering status update to ${targetStatus} with reason: ${reason}`);

    const promise = requisitionService.updateRequisitionWorkflow(
      recordId, 
      record.requisition_number, 
      targetStatus, 
      { name: user?.full_name || user?.email || "Admin User" }, 
      { remarks: reason }
    );

    toast.promise(promise, {
      loading: `Updating requisition state to ${targetStatus}...`,
      success: `Requisition successfully updated to ${targetStatus}`,
      error: `Failed to update requisition status`
    });

    try {
      await promise;
      setReason("");
      setConfirmAction(null);
      if (onComplete) onComplete();
    } catch(err) {
      console.error(err);
    }
  };

  const handleTriggerConfirm = (e, action) => {
    e.stopPropagation();
    console.log(`[AdminActionMenu Trigger Confirm] Selected Action: ${action} for Record ID: ${recordId}`);
    setConfirmAction(action);
    setReason("");
    setModalType('confirm_procurement');
    setIsOpen(false);
  };

  const handleMarkDispatched = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    console.log(`[AdminActionMenu Action Debug] Selected Action: Mark Dispatched, Target Record: ${recordId}`);
    const promise = requisitionService.updateRequisitionWorkflow(
      recordId, 
      record.requisition_number, 
      'Dispatched', 
      { name: user?.full_name || user?.email || "Admin User" }, 
      { remarks: "Marked as Dispatched via Action Menu" }
    );
    toast.promise(promise, {
      loading: `Marking requisition as Dispatched...`,
      success: `Requisition dispatched successfully`,
      error: `Failed to dispatch requisition`
    });
    try {
      await promise;
      if (onComplete) onComplete();
    } catch(err) {
      console.error(err);
    }
  };

  const handleOpenView = (e) => {
    e.stopPropagation();
    setModalType('view');
    setIsOpen(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let tableMap = "";
      let payload = {};

      if (module === "Fleet") {
        tableMap = "fleet_vehicles";
        payload = {
          vehicle_name: editData.vehicle_name,
          vehicle_number: editData.vehicle_number,
          vehicle_type: editData.vehicle_type,
          status: editData.status,
          running_hours: Number(editData.running_hours) || 0,
          fuel_level: Number(editData.fuel_level) || 0,
          efficiency: Number(editData.efficiency) || 0
        };
      } else if (module === "Inventory") {
        tableMap = "inventory_items";
        payload = {
          item_name: editData.item_name,
          category: editData.category,
          current_stock: Number(editData.current_stock) || 0,
          status: editData.status,
          trend: editData.trend
        };
      } else if (module === "Maintenance") {
        tableMap = "maintenance_machines";
        payload = {
          machine_name: editData.machine_name,
          machine_type: editData.machine_type,
          machine_id: editData.machine_id,
          manufacturer: editData.manufacturer,
          status: editData.status
        };
      } else if (module === "Procurement") {
        tableMap = "requisitions";
        if (record.status !== editData.status) {
          await requisitionService.updateRequisitionWorkflow(
            recordId, 
            record.requisition_number, 
            editData.status, 
            { name: user?.full_name || user?.email || "Admin User" }, 
            {
              delivery_date: editData.delivery_date,
              delivered_by: editData.delivered_by,
              invoice_reference: editData.invoice_reference,
              remarks: editData.remarks,
              vendor_name: editData.vendor_name
            }
          );
        }
        payload = {
          item_name: editData.item_name,
          category: editData.category,
          quantity: Number(editData.quantity) || 1,
          priority: editData.priority,
          item_description: editData.item_description,
          status: editData.status
        };
      } else if (module === "Drivers") {
        tableMap = "drivers";
        payload = {
          full_name: editData.full_name,
          license_number: editData.license_number,
          phone: editData.phone,
          status: editData.status,
          safety_score: Number(editData.safety_score) || 0,
          efficiency_score: Number(editData.efficiency_score) || 0
        };
      }

      const { error } = await supabase
        .from(tableMap)
        .update(payload)
        .eq("id", recordId);

      if (error) throw error;

      toast.success(`${module} record updated successfully`);
      setModalType(null);
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update record");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
        toast.error("A reason is strictly required.");
        return;
    }
    
    setIsSubmitting(true);
    try {
        await adminService.softDeleteRecord(module, recordId, reason, user.id);
        toast.success("Record moved to Recycle Bin");
        setIsOpen(false);
        setModalType(null);
        if (onComplete) onComplete();
    } catch (err) {
        toast.error(err.message || `Failed to soft delete`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        ref={triggerRef}
        onClick={handleOpenDropdown}
        aria-label="Actions Menu"
        className="p-2 rounded-lg bg-slate-800/40 border border-white/15 text-white hover:bg-slate-700/60 hover:text-white hover:border-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.15)] focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all cursor-pointer flex items-center justify-center"
      >
        <MoreVertical size={15} />
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              ref={menuRef}
              key="admin-action-dropdown-portal"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'absolute',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 9999
              }}
              className="w-48 bg-slate-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="py-1">
                {module === "Procurement" ? (
                  <>
                    <button 
                      onClick={handleOpenView}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <Eye size={14} className="text-info" /> View Details
                    </button>
                    {['Super Admin', 'Admin'].includes(user?.role) && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); console.log('[AdminActionMenu Click Debug] Edit Priority Selected'); handleOpenEdit(e); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <Edit size={14} className="text-primary" /> Edit Priority
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); console.log('[AdminActionMenu Click Debug] Update Status Selected'); handleOpenEdit(e); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <FileSignature size={14} className="text-warning" /> Update Status
                        </button>
                        <button 
                          onClick={handleMarkDispatched}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <Truck size={14} className="text-blue-400" /> Mark Dispatched
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); console.log('[AdminActionMenu Click Debug] Mark Delivered Selected'); handleOpenEditWithStatus('Delivered'); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <PackageCheck size={14} className="text-success" /> Mark Delivered
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); console.log('[AdminActionMenu Click Debug] Mark Fulfilled Selected'); handleOpenEditWithStatus('Fulfilled'); }}
                          className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <CheckCircle2 size={14} className="text-emerald-400" /> Mark Fulfilled
                        </button>
                        <button 
                          onClick={(e) => { handleTriggerConfirm(e, 'Reject'); }}
                          className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-danger/10 flex items-center gap-2 font-medium"
                        >
                          <XCircle size={14} /> Reject Request
                        </button>
                        <button 
                          onClick={(e) => { handleTriggerConfirm(e, 'Archive'); }}
                          className="w-full text-left px-4 py-2 text-xs text-purple-400 hover:bg-purple-400/10 flex items-center gap-2"
                        >
                          <Archive size={14} /> Archive Request
                        </button>
                      </>
                    )}
                    {user?.role === 'Super Admin' && (
                      <>
                        <div className="h-px bg-white/5 my-1"></div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setModalType('delete'); setIsOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-danger/10 flex items-center gap-2 font-medium"
                        >
                          <Trash2 size={14} /> Delete Request
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleOpenView}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <Eye size={14} className="text-info" /> View Details
                    </button>
                    <button 
                      onClick={handleOpenEdit}
                      className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                    >
                      <Edit size={14} className="text-primary" /> Edit Record
                    </button>
                    <div className="h-px bg-white/5 my-1"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setModalType('delete'); setIsOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-danger hover:bg-danger/10 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={14} /> Delete Record
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {createPortal(
        <>
          {/* VIEW DETAILS MODAL */}
          <AnimatePresence>
            {modalType === 'view' && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[80vh] backdrop-blur-xl text-white"
                >
                  <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold primary-gradient-text uppercase tracking-wider flex items-center gap-2">
                      <Eye size={16} className="text-info" /> View {module} Details
                    </h3>
                    <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {Object.entries(record || {}).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null) return null;
                      return (
                        <div key={key} className="flex justify-between border-b border-white/5 py-2">
                          <span className="text-gray-400 font-semibold capitalize text-xs">{key.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-white text-xs">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                    <Button variant="ghost" onClick={() => setModalType(null)}>Close Details</Button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
 
          {/* PROCUREMENT CRITICAL ACTION CONFIRMATION MODAL */}
          <AnimatePresence>
            {modalType === 'confirm_procurement' && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-white"
                >
                  <div className="flex items-center gap-3 mb-4 text-warning">
                    <AlertTriangle size={20} />
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">{confirmAction} Request?</h3>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-4 font-normal">
                    Are you absolutely sure you want to {confirmAction?.toLowerCase()} requisition <span className="font-mono text-warning font-semibold">#{record?.requisition_number}</span>? This is a critical workflow state mutation.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                        <FileSignature size={12}/> Governance Reason / Remarks
                      </label>
                      <textarea 
                        required rows="3" autoFocus
                        placeholder={`Provide a reason for ${confirmAction?.toLowerCase()}ing this request...`}
                        value={reason} onChange={e => setReason(e.target.value)}
                        className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none resize-none"
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end pt-2">
                      <Button variant="ghost" className="h-9 text-xs" onClick={() => setModalType(null)}>Cancel</Button>
                      <Button 
                        onClick={handleConfirmProcurementAction}
                        className={`h-9 text-xs font-semibold ${confirmAction === 'Reject' ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary/90'}`}
                      >
                        Confirm {confirmAction}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* REASON MODAL (DIGITAL SIGN-OFF) */}
          <AnimatePresence>
            {modalType === 'delete' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)} />
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-xl p-5 shadow-2xl">
                       <div className="flex items-center gap-3 mb-4 text-danger">
                           <AlertTriangle size={20} />
                           <h3 className="text-lg font-bold text-white uppercase tracking-wider">Delete Record?</h3>
                       </div>
                       
                       <p className="text-xs text-gray-400 mb-4">
                           This action will remove the item from active operations and move it to the Recycle Bin.
                       </p>

                       <form onSubmit={handleAction} className="space-y-4">
                           <div>
                               <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-2">
                                 <FileSignature size={12}/> Governance Reason
                               </label>
                               <textarea 
                                 required rows="3" autoFocus
                                 placeholder="e.g., Error in entry, Decommissioned..."
                                 value={reason} onChange={e => setReason(e.target.value)}
                                 className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none resize-none"
                               />
                           </div>
                           
                           <label className="flex items-center gap-2 mt-4 text-xs text-gray-400 cursor-pointer">
                               <input type="checkbox" required className="rounded bg-dark-bg border-dark-border text-danger focus:ring-danger/50" />
                               I understand this can be restored later.
                           </label>
                           
                       <div className="pt-2 flex justify-end gap-2">
                               <Button type="button" variant="ghost" onClick={() => setModalType(null)} disabled={isSubmitting}>Cancel</Button>
                               <Button type="submit" variant="danger" disabled={isSubmitting}>
                                   {isSubmitting ? 'Processing...' : 'Move to Trash'}
                               </Button>
                           </div>
                       </form>
                   </motion.div>
                </div>
            )}
          </AnimatePresence>

          {/* FULL EDIT WORKFLOW MODAL */}
          <AnimatePresence>
            {modalType === 'edit' && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalType(null)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] backdrop-blur-xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 primary-gradient-text uppercase tracking-wider">
                      <Edit size={18} className="text-primary" /> Edit {module} Entry
                    </h3>
                    <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdate} className="space-y-4">
                    {module === "Fleet" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Vehicle Name</label>
                          <input required type="text" value={editData.vehicle_name} onChange={e => setEditData({...editData, vehicle_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Vehicle Number</label>
                            <input required type="text" value={editData.vehicle_number} onChange={e => setEditData({...editData, vehicle_number: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Vehicle Type</label>
                            <select value={editData.vehicle_type} onChange={e => setEditData({...editData, vehicle_type: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option>Excavator</option>
                              <option>Hyva</option>
                              <option>Loader</option>
                              <option>Poclain</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Running Hours</label>
                            <input required type="number" value={editData.running_hours} onChange={e => setEditData({...editData, running_hours: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Fuel Level (%)</label>
                            <input required type="number" min="0" max="100" value={editData.fuel_level} onChange={e => setEditData({...editData, fuel_level: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Efficiency (%)</label>
                            <input required type="number" min="0" max="100" value={editData.efficiency} onChange={e => setEditData({...editData, efficiency: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Operational Status</label>
                          <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                            <option>Active</option>
                            <option>Maintenance</option>
                            <option>Idle</option>
                          </select>
                        </div>
                      </>
                    )}

                    {module === "Inventory" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Item Name</label>
                          <input required type="text" value={editData.item_name} onChange={e => setEditData({...editData, item_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Category</label>
                            <input required type="text" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Current Stock</label>
                            <input required type="number" value={editData.current_stock} onChange={e => setEditData({...editData, current_stock: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Stock Status</label>
                            <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option>Optimal</option>
                              <option>Low Stock</option>
                              <option>Overstock</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Usage Trend</label>
                            <select value={editData.trend} onChange={e => setEditData({...editData, trend: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option value="up">Increasing</option>
                              <option value="down">Decreasing</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {module === "Maintenance" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Machine Name</label>
                          <input required type="text" value={editData.machine_name} onChange={e => setEditData({...editData, machine_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Machine Model/ID</label>
                            <input required type="text" value={editData.machine_id} onChange={e => setEditData({...editData, machine_id: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Manufacturer</label>
                            <input required type="text" value={editData.manufacturer} onChange={e => setEditData({...editData, manufacturer: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Machine Type</label>
                            <select value={editData.machine_type} onChange={e => setEditData({...editData, machine_type: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option>Excavator</option>
                              <option>Poclain</option>
                              <option>Hyva</option>
                              <option>Loader</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Health Status</label>
                            <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option>Optimal</option>
                              <option>Servicing</option>
                              <option>Critical</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {module === "Procurement" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Requested Item</label>
                          <input required type="text" value={editData.item_name} onChange={e => setEditData({...editData, item_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Category</label>
                            <select value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 text-xs">
                              <option>Spare Parts</option>
                              <option>Fuel</option>
                              <option>Consumables</option>
                              <option>Tools</option>
                              <option>Safety Equipment</option>
                              <option>Machinery</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                            <input required type="number" value={editData.quantity} onChange={e => setEditData({...editData, quantity: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Priority</label>
                            <select value={editData.priority} onChange={e => setEditData({...editData, priority: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                              <option>Critical</option>
                              <option>High</option>
                              <option>Medium</option>
                              <option>Low</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Item Description</label>
                          <textarea rows="2" value={editData.item_description} onChange={e => setEditData({...editData, item_description: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Workflow Status</label>
                          <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50">
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>In Procurement</option>
                            <option>Dispatched</option>
                            <option>Delivered</option>
                            <option>Fulfilled</option>
                            <option>Rejected</option>
                            <option>Cancelled</option>
                          </select>
                        </div>
                        
                        {['Delivered', 'Fulfilled'].includes(editData.status) && (
                          <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-3 mt-3">
                            <h4 className="text-xs font-bold text-success flex items-center gap-1">Fulfillment Details</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Delivery Date</label>
                                <input required type="date" value={editData.delivery_date} onChange={e => setEditData({...editData, delivery_date: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary/50 outline-none" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Invoice / PO Ref</label>
                                <input type="text" value={editData.invoice_reference} onChange={e => setEditData({...editData, invoice_reference: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary/50 outline-none font-mono" placeholder="INV-2026-XXXX" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Delivered By</label>
                                <input required type="text" value={editData.delivered_by} onChange={e => setEditData({...editData, delivered_by: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary/50 outline-none" placeholder="Courier or Person" />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1">Vendor Name</label>
                                <input required type="text" value={editData.vendor_name} onChange={e => setEditData({...editData, vendor_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary/50 outline-none" placeholder="e.g. Caterpillar" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-400 mb-1">Delivery Remarks</label>
                              <textarea rows="2" value={editData.remarks} onChange={e => setEditData({...editData, remarks: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary/50 outline-none resize-none" placeholder="Remarks..." />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {module === "Drivers" && (
                      <>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Driver Full Name</label>
                          <input required type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">License Number</label>
                            <input required type="text" value={editData.license_number} onChange={e => setEditData({...editData, license_number: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                            <input required type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Safety Score</label>
                            <input required type="number" min="0" max="100" value={editData.safety_score} onChange={e => setEditData({...editData, safety_score: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Efficiency Score</label>
                            <input required type="number" min="0" max="100" value={editData.efficiency_score} onChange={e => setEditData({...editData, efficiency_score: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Shift Status</label>
                            <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-white outline-none focus:border-primary/50 text-xs">
                              <option value="active">Active Shift</option>
                              <option value="inactive">Off Shift</option>
                              <option value="on_leave">On Leave</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                      <Button type="button" variant="ghost" onClick={() => setModalType(null)} disabled={isSubmitting}>Cancel</Button>
                      <Button type="submit" variant="primary" disabled={isSubmitting} className="flex items-center gap-1.5">
                        <Save size={16} /> {isSubmitting ? 'Saving changes...' : 'Save Configuration'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
