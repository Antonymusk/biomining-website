import { supabase } from "../lib/supabase";

export const requisitionService = {
  
  /**
   * Generates a unique requisition number (e.g. REQ-202605-1A2B)
   */
  generateRequisitionNumber: () => {
    const date = new Date();
    const ym = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REQ-${ym}-${random}`;
  },

  /**
   * Fetch requisitions with optional filters
   */
  getRequisitions: async (filters = {}) => {
    let query = supabase
      .from('requisitions')
      .select(`
        *,
        inventory_sites (name),
        vendors (vendor_name)
      `)
      .neq('is_deleted', true)
      .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }
    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  getVendors: async () => {
    try {
      const { data, error } = await supabase.from('vendors').select('*').order('vendor_name');
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn("Failed to fetch vendors from DB, using mock fallback:", err);
    }
    
    return [
      { id: "v1-eastern-spares", vendor_name: "Eastern Spares Ltd", contact_person: "Aman Gupta", email: "aman@easternspares.com", phone: "+91 9876543211", performance_score: 99.4, reliability_score: 98, specialties: ["Motors", "Gearboxes", "Conveyor Belts", "Spare Parts"], price_index: 0.95, delivery_sla: "3.2 Days" },
      { id: "v2-caterpillar-corp", vendor_name: "Caterpillar Industrial Corp", contact_person: "Sarah Jenkins", email: "procure@caterpillar.com", phone: "+1 800 555 0199", performance_score: 98.9, reliability_score: 99, specialties: ["Motors", "Gearboxes", "Spare Parts", "Heavy Machinery"], price_index: 1.10, delivery_sla: "2.1 Days" },
      { id: "v3-biosolutions-fuel", vendor_name: "BioSolutions Fuel Corp", contact_person: "Rajesh Kumar", email: "orders@biosolutionsfuel.com", phone: "+91 9988776655", performance_score: 100.0, reliability_score: 100, specialties: ["Fuel", "DEF Additive", "Motors", "Spare Parts"], price_index: 0.90, delivery_sla: "1.5 Days" },
      { id: "v4-metro-hydraulics", vendor_name: "Metro Hydraulics & Belts", contact_person: "Vipul Mehta", email: "contact@metrohydraulics.in", phone: "+91 8877665544", performance_score: 94.8, reliability_score: 92, specialties: ["Conveyor Belts", "Safety Equipment", "Motors", "Spare Parts"], price_index: 1.00, delivery_sla: "3.9 Days" },
      { id: "v5-reliance-fuels", vendor_name: "Reliance Industrial Fuels", contact_person: "Dinesh Amin", email: "sales@reliancefuels.com", phone: "+91 9001122334", performance_score: 96.5, reliability_score: 95, specialties: ["Fuel"], price_index: 1.05, delivery_sla: "2.5 Days" },
      { id: "v6-safetyfirst-supplies", vendor_name: "SafetyFirst Supplies", contact_person: "Manoj Singh", email: "support@safetyfirst.in", phone: "+91 7001122334", performance_score: 91.2, reliability_score: 90, specialties: ["Safety Equipment"], price_index: 0.85, delivery_sla: "4.5 Days" }
    ];
  },
  
  getRequisitionHistory: async (reqId) => {
    const { data, error } = await supabase
      .from('requisition_comments')
      .select('*')
      .eq('requisition_id', reqId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new requisition request
   */
  createRequisition: async (payload) => {
    const reqNumber = requisitionService.generateRequisitionNumber();
    
    // Auto-calculate SLA deadline for critical items (e.g. 48 hours)
    let sla_deadline = null;
    if (payload.priority === 'Critical') {
        const d = new Date();
        d.setHours(d.getHours() + 48);
        sla_deadline = d.toISOString();
    }

    const { data, error } = await supabase.from('requisitions').insert([{
      ...payload,
      requisition_number: reqNumber,
      status: 'Pending',
      sla_deadline
    }]).select().single();

    if (error) throw error;
    
    // Log Audit
    await requisitionService.logAudit('CREATE_REQUISITION', 'requisitions', data.id, `Created requisition ${reqNumber}`);
    await requisitionService.logComment(data.id, 'System', `Requisition raised by operator. Priority: ${payload.priority}`);
    
    // Push to operational timeline if critical
    if (payload.priority === 'Critical') {
        await supabase.from('operational_timeline').insert([{
            event_type: 'alert',
            message: `Critical requisition raised: ${payload.item_name} (${reqNumber})`,
            severity: 'critical'
        }]);
    }

    return data;
  },

  /**
   * Update requisition status and trigger workflows
   */
  updateRequisitionWorkflow: async (id, reqNumber, newStatus, userDetails = {}, extraPayload = {}) => {
    const updates = { status: newStatus };
    const userName = userDetails.name || 'Admin';
    let timelineMessage = `${reqNumber} moved to ${newStatus}`;
    let timelineSeverity = 'info';

    if (newStatus === 'Approved') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = userName;
        timelineMessage = `${reqNumber} approved by ${userName}`;
        if (extraPayload.vendor_id && extraPayload.vendor_id.length > 10) {
            updates.vendor_id = extraPayload.vendor_id;
        }
        if (extraPayload.estimated_cost) {
            updates.estimated_cost = Number(extraPayload.estimated_cost) || 0;
        }
    } 
    else if (newStatus === 'In Procurement') {
        if (extraPayload.vendor_id && extraPayload.vendor_id.length > 10) {
            updates.vendor_id = extraPayload.vendor_id;
        }
        if (extraPayload.estimated_cost) {
            updates.estimated_cost = Number(extraPayload.estimated_cost) || 0;
        }
        if (extraPayload.vendor_name) {
            timelineMessage = `${reqNumber} moved to procurement. Vendor matched: ${extraPayload.vendor_name}.`;
        }
    }
    else if (newStatus === 'Dispatched') {
        updates.dispatched_at = new Date().toISOString();
        updates.dispatched_by = userName;
        timelineMessage = `${reqNumber} dispatched to site`;
    }
    else if (newStatus === 'Delivered') {
        updates.delivered_at = extraPayload.delivery_date || new Date().toISOString();
        updates.delivered_by = extraPayload.delivered_by || userName;
        updates.delivery_notes = `Vendor: ${extraPayload.vendor_name || 'N/A'}. Notes: ${extraPayload.remarks || 'None'}`;
        updates.invoice_reference = extraPayload.invoice_reference;
        timelineMessage = `${reqNumber} delivered at site. Handler: ${extraPayload.delivered_by || userName}. Vendor: ${extraPayload.vendor_name || 'N/A'}.`;
    }
    else if (newStatus === 'Fulfilled') {
        updates.fulfilled_at = new Date().toISOString();
        updates.fulfilled_by = userName;
        
        // If passing fulfillment data directly here instead of Delivered
        if (extraPayload.delivery_date) {
             updates.delivered_at = extraPayload.delivery_date;
             updates.delivered_by = extraPayload.delivered_by || userName;
             updates.delivery_notes = `Vendor: ${extraPayload.vendor_name || 'N/A'}. Notes: ${extraPayload.remarks || 'None'}`;
             updates.invoice_reference = extraPayload.invoice_reference;
        }

        timelineSeverity = 'success';
        timelineMessage = `Requirement fulfilled for ${reqNumber}. Verified by ${userName}.`;
        
        await supabase.from('operational_timeline').insert([{
            event_type: 'movement',
            message: timelineMessage,
            severity: timelineSeverity
        }]);
    }
    else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
        updates.rejected_reason = extraPayload.remarks || 'Cancelled by Admin';
        timelineSeverity = 'warning';
        timelineMessage = `${reqNumber} was ${newStatus.toLowerCase()}`;
    }

    const { error } = await supabase.from('requisitions').update(updates).eq('id', id);
    if (error) throw error;

    await requisitionService.logAudit('UPDATE_WORKFLOW', 'requisitions', id, timelineMessage);
    await requisitionService.logComment(id, userName, timelineMessage);
  },

  logComment: async (reqId, userName, commentText) => {
    try {
      await supabase.from('requisition_comments').insert([{
        requisition_id: reqId,
        user_name: userName,
        comment_text: commentText
      }]);
    } catch(err) {
      console.error(err);
    }
  },

  /**
   * Generic audit log creation
   */
  logAudit: async (action, targetTable, targetId, description) => {
    try {
        await supabase.from('audit_logs').insert([{
            action,
            target_table: targetTable,
            target_id: targetId,
            description
        }]);
    } catch(err) {
        console.error("Failed to log audit", err);
    }
  }

};
