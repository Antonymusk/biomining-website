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
    } 
    else if (newStatus === 'In Procurement') {
        // Just status update
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
