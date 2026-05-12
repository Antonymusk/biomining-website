import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PackageSearch, Plus, Search, Filter, AlertTriangle, Clock, 
  CheckCircle2, Package, ShoppingCart, X, Upload, MoreVertical, 
  Truck, CheckSquare, XCircle, ArrowRight, FileText
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { requisitionService } from "../services/requisitionService";
import { inventoryService } from "../services/inventoryService";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { AdminActionMenu } from "../components/ui/AdminActionMenu";
import { DataTable } from "../ui/DataTable";
import { useDebounce } from "../hooks/useDebounce";
import { useRealtimeSubscription } from "../hooks/useRealtimeSubscription";
import { useAuth } from "../lib/AuthContext";
import { DocumentManager } from "../components/ui/DocumentManager";

// --- Subcomponents ---

const WorkflowProgress = ({ status }) => {
  const stages = ['Pending', 'Approved', 'In Procurement', 'Dispatched', 'Delivered', 'Fulfilled'];
  
  // Handle edge cases
  if (status === 'Rejected' || status === 'Cancelled') {
    return <Badge variant="danger" className="text-[10px]">{status}</Badge>;
  }

  const currentIndex = stages.indexOf(status);
  if (currentIndex === -1) return <Badge variant="outline">{status}</Badge>;

  return (
    <div className="flex items-center gap-1 w-full max-w-[210px] pr-2 py-1">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        return (
          <React.Fragment key={stage}>
            <div className={`relative flex items-center justify-center w-3.5 h-3.5 rounded-full shrink-0 border z-10 transition-all duration-300 ${
              isCompleted ? 'bg-success border-success' : 
              isActive ? 'bg-primary border-primary shadow-[0_0_5px_1px_rgba(59,130,246,0.4)] scale-105' : 
              'bg-dark-bg/60 border-dark-border'
            }`} title={stage}>
              {isCompleted && <CheckCircle2 size={8} className="text-dark-bg stroke-[3px]" />}
              {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </div>
            {idx < stages.length - 1 && (
              <div className={`h-[1.5px] flex-1 min-w-[6px] transition-all duration-300 ${
                isCompleted ? 'bg-success' : 'bg-dark-border/60'
              }`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- Main Component ---

export default function RequisitionCenter() {
  const [requisitions, setRequisitions] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isActionAllowed } = useAuth();
  const isAdmin = isActionAllowed('PROCUREMENT_APPROVAL');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals & Drawers
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  
  // Fulfillment Modal
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [activeReqId, setActiveReqId] = useState(null);
  const [activeReqNum, setActiveReqNum] = useState("");
  const [fulfillTargetStatus, setFulfillTargetStatus] = useState("Delivered");
  const [fulfillData, setFulfillData] = useState({ 
    delivery_date: new Date().toISOString().split('T')[0], 
    delivered_by: "",
    invoice_reference: "", 
    remarks: "",
    vendor_name: "" 
  });

  // Drawer
  const [selectedReq, setSelectedReq] = useState(null);
  const [reqHistory, setReqHistory] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // New Request State
  const [formData, setFormData] = useState({ site_id: "", item_name: "", category: "Spare Parts", quantity: 1, priority: "Medium", item_description: "", expected_delivery_date: "" });

  useEffect(() => {
    fetchSites();
    fetchRequisitions();
  }, [filterStatus]);

  useRealtimeSubscription('requisitions', fetchRequisitions);

  async function fetchSites() {
    try {
      const data = await inventoryService.getSites();
      setSites(data);
    } catch (err) { console.error(err); }
  }

  async function fetchRequisitions() {
    setLoading(true);
    try {
      const data = await requisitionService.getRequisitions({ status: filterStatus });
      setRequisitions(data);
    } catch (err) {
      toast.error("Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  }

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    try {
      await requisitionService.createRequisition(formData);
      toast.success("Requisition Raised Successfully");
      setIsRaiseModalOpen(false);
      setFormData({ site_id: "", item_name: "", category: "Spare Parts", quantity: 1, priority: "Medium", item_description: "", expected_delivery_date: "" });
      fetchRequisitions();
    } catch (err) {
      toast.error("Failed to raise requisition");
    }
  };

  const handleAdminAction = async (id, reqNumber, newStatus) => {
    if (newStatus === 'Delivered' || newStatus === 'Fulfilled') {
      setActiveReqId(id);
      setActiveReqNum(reqNumber);
      setFulfillTargetStatus(newStatus);
      setIsFulfillModalOpen(true);
      return;
    }
    
    // Direct status updates (Approve, Dispatch, Cancel)
    const promise = requisitionService.updateRequisitionWorkflow(id, reqNumber, newStatus, { name: "Admin User" });
    toast.promise(promise, {
      loading: `Updating ${reqNumber}...`,
      success: `${reqNumber} moved to ${newStatus}`,
      error: "Failed to update workflow"
    });
    try {
      await promise;
      fetchRequisitions(); // optimistic update could be used, but rely on fetch for safety
    } catch(e) {}
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    const promise = requisitionService.updateRequisitionWorkflow(activeReqId, activeReqNum, fulfillTargetStatus, { name: "Admin User" }, fulfillData);
    toast.promise(promise, {
      loading: `Processing fulfillment for ${activeReqNum}...`,
      success: `Successfully updated ${activeReqNum}`,
      error: "Fulfillment failed"
    });
    
    try {
      await promise;
      setIsFulfillModalOpen(false);
      setFulfillData({ 
        delivery_date: new Date().toISOString().split('T')[0], 
        delivered_by: "",
        invoice_reference: "", 
        remarks: "",
        vendor_name: "" 
      });
      fetchRequisitions();
      if (selectedReq?.id === activeReqId) openDrawer(requisitions.find(r => r.id === activeReqId) || selectedReq);
    } catch(e) {}
  };

  const openDrawer = async (req) => {
    setSelectedReq(req);
    setIsDrawerOpen(true);
    try {
      const history = await requisitionService.getRequisitionHistory(req.id);
      setReqHistory(history);
    } catch(err) {
      toast.error("Failed to load timeline history");
    }
  };

  const filteredData = useMemo(() => {
    return requisitions.filter(r => 
      (r.item_name || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (r.requisition_number || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [requisitions, debouncedSearchQuery]);

  const reqColumns = useMemo(() => [
    {
      title: 'Req. Number',
      width: '15%',
      render: (req) => (
        <div onClick={() => openDrawer(req)} className="cursor-pointer font-mono text-xs font-bold text-primary">
          {req.requisition_number}
          <div className="text-[9px] text-gray-500 mt-0.5 font-sans font-normal">{new Date(req.created_at).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      title: 'Item Details',
      width: '30%',
      render: (req) => (
        <div onClick={() => openDrawer(req)} className="cursor-pointer">
          <div className="font-semibold text-gray-200 text-sm flex items-center gap-2">
            {req.item_name} <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{req.quantity}x</Badge>
          </div>
          <div className="text-[10px] text-gray-500 truncate max-w-[200px] uppercase font-mono mt-0.5">{req.category}</div>
        </div>
      )
    },
    {
      title: 'Site Location',
      width: '15%',
      render: (req) => <span onClick={() => openDrawer(req)} className="text-xs text-gray-300 cursor-pointer">{req.inventory_sites?.name || "Unknown"}</span>
    },
    {
      title: 'Priority',
      width: '10%',
      render: (req) => (
        <Badge onClick={() => openDrawer(req)} variant={
          req.priority === 'Critical' ? 'danger' : req.priority === 'High' ? 'warning' : 'primary'
        } className={`text-[9px] cursor-pointer ${req.priority==='Critical' ? 'animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]' : ''}`}>
          {req.priority}
        </Badge>
      )
    },
    {
      title: 'Order Status',
      width: '20%',
      render: (req) => <div onClick={() => openDrawer(req)} className="cursor-pointer"><WorkflowProgress status={req.status} /></div>
    },
    {
      title: 'Actions',
      width: '10%',
      render: (req) => (
        <div className="flex justify-end pr-2" onClick={e => e.stopPropagation()}>
          <AdminActionMenu module="Procurement" recordId={req.id} record={req} onComplete={fetchRequisitions} />
        </div>
      )
    }
  ], [isAdmin, fetchRequisitions, openDrawer]);

  const kpis = {
    activeOrders: requisitions.filter(r => ['Approved', 'In Procurement', 'Dispatched'].includes(r.status)).length,
    delayed: requisitions.filter(r => r.sla_breached || (r.sla_deadline && new Date(r.sla_deadline) < new Date() && r.status !== 'Fulfilled')).length,
    deliveredToday: requisitions.filter(r => r.status === 'Delivered' || r.status === 'Fulfilled').filter(r => r.delivered_at && new Date(r.delivered_at).toDateString() === new Date().toDateString()).length,
    avgFulfillment: "3.2 Days" // Simulated metric
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/60 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-primary" /> Procurement Control
          </h2>
          <p className="text-gray-400 text-sm mt-1">Enterprise Admin Workflow & Intelligence</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input 
              id="req_search"
              name="search"
              autoComplete="off"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items or REQ#..." 
              className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
          <Button onClick={() => setIsRaiseModalOpen(true)} variant="primary" className="whitespace-nowrap h-9">
            <Plus size={16} className="mr-2" /> Raise Requirement
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary group bg-gradient-to-br from-dark-card to-dark-bg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Orders</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-white">{kpis.activeOrders}</h3>
            <PackageSearch className="text-primary/30 group-hover:scale-110 transition-transform" />
          </div>
        </Card>
        <Card className={`p-4 border-l-4 ${kpis.delayed > 0 ? 'border-l-danger bg-danger/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-l-gray-600'} group`}>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delayed / SLA Breach</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className={`text-2xl font-bold ${kpis.delayed > 0 ? 'text-danger animate-pulse' : 'text-gray-500'}`}>{kpis.delayed}</h3>
            <AlertTriangle className={`${kpis.delayed > 0 ? 'text-danger/50' : 'text-gray-600'}`} />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-success group bg-gradient-to-br from-dark-card to-dark-bg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Delivered Today</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-success">{kpis.deliveredToday}</h3>
            <Truck className="text-success/30 group-hover:scale-110 transition-transform" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-info group bg-gradient-to-br from-dark-card to-dark-bg">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Fulfillment</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-2xl font-bold text-info">{kpis.avgFulfillment}</h3>
            <Clock className="text-info/30 group-hover:scale-110 transition-transform" />
          </div>
        </Card>
      </div>

      {/* REQUISITION WORKFLOW TABLE */}
      <Card className="p-0 border-dark-border/60 overflow-hidden min-h-[400px]">
        <div className="flex items-center gap-4 p-3 border-b border-dark-border/50 bg-dark-bg/20">
          <Filter size={14} className="text-gray-500 ml-2" />
          <div className="flex gap-2">
            {['All', 'Pending', 'Approved', 'In Procurement', 'Dispatched', 'Delivered', 'Fulfilled'].map(s => (
              <button 
                key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${filterStatus === s ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <DataTable 
          data={filteredData} 
          columns={reqColumns} 
          isLoading={loading} 
          emptyTitle="No Orders Found" 
          emptyDescription="Adjust your filters or raise a new requirement." 
          height={500} 
        />
      </Card>

      {/* FULFILLMENT MODAL */}
      <AnimatePresence>
        {isFulfillModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsFulfillModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl">
              <button onClick={() => setIsFulfillModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              
              <h3 className="text-xl font-bold text-white mb-1">Fulfillment Details</h3>
              <p className="text-xs text-gray-400 mb-6 font-mono text-primary">{activeReqNum} → {fulfillTargetStatus}</p>
              
              <form onSubmit={handleFulfillSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Actual Delivery Date *</label>
                    <input id="req_fulfill_date" name="delivery_date" autoComplete="off" required type="date" value={fulfillData.delivery_date} onChange={e => setFulfillData({...fulfillData, delivery_date: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Invoice / PO Reference</label>
                    <input id="req_fulfill_invoice" name="invoice_reference" autoComplete="off" type="text" value={fulfillData.invoice_reference} onChange={e => setFulfillData({...fulfillData, invoice_reference: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none font-mono" placeholder="INV-2026-XXXX" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Delivered By *</label>
                    <input id="req_fulfill_by" name="delivered_by" autoComplete="off" required type="text" value={fulfillData.delivered_by} onChange={e => setFulfillData({...fulfillData, delivered_by: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none" placeholder="Courier or Person" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Vendor Name *</label>
                    <input id="req_fulfill_vendor" name="vendor_name" autoComplete="off" required type="text" value={fulfillData.vendor_name} onChange={e => setFulfillData({...fulfillData, vendor_name: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none" placeholder="e.g. Caterpillar Inc" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Delivery Notes / Remarks</label>
                  <textarea id="req_fulfill_remarks" name="remarks" autoComplete="off" rows="2" value={fulfillData.remarks} onChange={e => setFulfillData({...fulfillData, remarks: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-xs text-white focus:border-primary/50 outline-none resize-none" placeholder="Any issues with delivery? Partial fulfillment?"></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsFulfillModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="bg-success hover:bg-success/90">Confirm {fulfillTargetStatus}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULFILLMENT HISTORY DRAWER */}
      <AnimatePresence>
        {isDrawerOpen && selectedReq && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-dark-card border-l border-dark-border shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-bg/50">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedReq.item_name} 
                  </h3>
                  <p className="text-xs font-mono text-primary mt-1">{selectedReq.requisition_number}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-lg bg-dark-bg hover:bg-white/10 text-gray-400 transition-colors"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                
                {/* Status Summary */}
                <div className="bg-dark-bg/60 rounded-xl p-4 border border-dark-border/50">
                   <div className="flex items-center justify-between mb-3">
                     <span className="text-[10px] text-gray-400 uppercase font-bold">Current Status</span>
                     <Badge variant={selectedReq.status === 'Fulfilled' ? 'success' : 'primary'} className="text-[10px]">{selectedReq.status}</Badge>
                   </div>
                   <WorkflowProgress status={selectedReq.status} />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Requested By</p>
                    <p className="text-xs text-white mt-0.5">{selectedReq.requested_by || 'Operator'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Target Site</p>
                    <p className="text-xs text-white mt-0.5">{selectedReq.inventory_sites?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Priority</p>
                    <p className={`text-xs font-bold mt-0.5 ${selectedReq.priority === 'Critical' ? 'text-danger' : 'text-primary'}`}>{selectedReq.priority}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Quantity</p>
                    <p className="text-xs text-white mt-0.5">{selectedReq.quantity} Units</p>
                  </div>
                </div>

                {selectedReq.item_description && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Description & Justification</p>
                    <p className="text-xs text-gray-300 bg-dark-bg/50 p-3 rounded-lg border border-dark-border/30">{selectedReq.item_description}</p>
                  </div>
                )}

                {/* Delivery Info if available */}
                {selectedReq.delivered_at && (
                  <div className="bg-success/5 border border-success/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-success mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Fulfillment Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Delivered:</span> <span className="text-gray-200">{new Date(selectedReq.delivered_at).toLocaleDateString()}</span></div>
                      <div><span className="text-gray-500">Invoice:</span> <span className="text-gray-200 font-mono">{selectedReq.invoice_reference || 'N/A'}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span className="text-gray-200">{selectedReq.delivery_notes || 'None'}</span></div>
                    </div>
                  </div>
                )}

                {/* Procurement Documents Attachment */}
                <div className="border-t border-dark-border/40 pt-4">
                  <DocumentManager title="Procurement Challans & Quotes" />
                </div>

                {/* Timeline History */}
                <div>
                  <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider flex items-center gap-2 border-b border-dark-border pb-2">
                    <Clock size={14} className="text-gray-400" /> Workflow Audit Trail
                  </h4>
                  {reqHistory.length > 0 ? (
                    <div className="space-y-4 relative border-l border-dark-border/50 ml-2 pl-4 py-2">
                      {reqHistory.map((log, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-[#0B1120]"></div>
                          <p className="text-xs text-gray-200 font-medium">{log.comment_text}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                            <span className="text-[9px] text-gray-400">• {log.user_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No audit trail available.</p>
                  )}
                </div>

              </div>
              <div className="p-4 border-t border-dark-border bg-dark-bg/80 backdrop-blur-md">
                 <Button onClick={() => setIsDrawerOpen(false)} className="w-full" variant="outline">Close Drawer</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RAISE REQUIREMENT MODAL (Hidden logic unchanged, omitted from visual density for brevity) */}
      <AnimatePresence>
        {isRaiseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRaiseModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <button onClick={() => setIsRaiseModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18} /></button>
              
              <h3 className="text-xl font-bold text-white mb-2">Raise Requirement</h3>
              <p className="text-sm text-gray-400 mb-6">Submit a new procurement request for operational parts or supplies.</p>
              
              <form onSubmit={handleRaiseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Target Site *</label>
                    <select id="req_raise_site" name="site_id" autoComplete="off" required value={formData.site_id} onChange={e => setFormData({...formData, site_id: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option value="">Select a site...</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Category *</label>
                    <select id="req_raise_category" name="category" autoComplete="off" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none">
                      <option>Motors</option><option>Gearboxes</option><option>Conveyor Belts</option><option>Fuel</option><option>Spare Parts</option><option>Safety Equipment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Item Name *</label>
                    <input id="req_raise_item_name" name="item_name" autoComplete="off" required type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} placeholder="e.g. 50HP Induction Motor" className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Quantity *</label>
                    <input id="req_raise_quantity" name="quantity" autoComplete="off" required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Priority Level</label>
                    <select id="req_raise_priority" name="priority" autoComplete="off" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${formData.priority === 'Critical' ? 'bg-danger/10 border-danger text-danger' : 'bg-dark-bg/80 border-dark-border text-white'}`}>
                      <option className="bg-dark-bg text-white">Low</option>
                      <option className="bg-dark-bg text-white">Medium</option>
                      <option className="bg-dark-bg text-white">High</option>
                      <option className="bg-dark-bg text-danger font-bold">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Expected Date</label>
                    <input id="req_raise_expected_date" name="expected_delivery_date" autoComplete="off" type="date" value={formData.expected_delivery_date} onChange={e => setFormData({...formData, expected_delivery_date: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-primary/50 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Additional Specifications / Justification</label>
                  <textarea id="req_raise_description" name="item_description" autoComplete="off" rows="3" value={formData.item_description} onChange={e => setFormData({...formData, item_description: e.target.value})} className="w-full bg-dark-bg/80 border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none resize-none" placeholder="Provide part numbers, machine details, or reason for requirement..."></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsRaiseModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Submit Requisition</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
