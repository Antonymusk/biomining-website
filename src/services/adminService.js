import { supabase } from "../lib/supabase";

// Map frontend module names to backend table names
const TABLE_MAP = {
  'Inventory': 'inventory_items',
  'Fleet': 'fleet_vehicles',
  'Drivers': 'drivers',
  'Procurement': 'requisitions',
  'Maintenance': 'maintenance_machines',
  'MIS': 'mis_entries'
};

export const adminService = {
  
  _logAudit: async (action_type, module, record_id, performed_by, reason) => {
    try {
      await supabase.from('audit_logs').insert([{
        action_type, module, record_id, performed_by, reason
      }]);
    } catch (err) {
      console.error("Audit log failed:", err);
    }
  },

  archiveRecord: async (module, recordId, reason, performedBy) => {
    const table = TABLE_MAP[module];
    if (!table) throw new Error("Invalid module");

    const { error } = await supabase.from(table).update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: performedBy,
      deletion_reason: reason
    }).eq('id', recordId);

    if (error) throw error;
    
    await adminService._logAudit('Archive', module, recordId, performedBy, reason);
    
    await supabase.from('operational_timeline').insert([{
        event_type: 'alert',
        message: `Admin archived ${module} record ${recordId.substring(0,8)}`,
        severity: 'info'
    }]);

    return true;
  },

  softDeleteRecord: async (module, recordId, reason, performedBy) => {
    const table = TABLE_MAP[module];
    if (!table) throw new Error("Invalid module");

    const { error } = await supabase.from(table).update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: performedBy,
      deletion_reason: reason
    }).eq('id', recordId);

    if (error) throw error;
    
    await adminService._logAudit('Soft Delete', module, recordId, performedBy, reason);

    await supabase.from('operational_timeline').insert([{
        event_type: 'alert',
        message: `Admin moved ${module} record ${recordId.substring(0,8)} to Recycle Bin`,
        severity: 'warning'
    }]);

    return true;
  },

  restoreRecord: async (module, recordId, performedBy) => {
    const table = TABLE_MAP[module];
    if (!table) throw new Error("Invalid module");

    const { error } = await supabase.from(table).update({
      is_deleted: false,
      is_archived: false,
      deletion_reason: null
    }).eq('id', recordId);

    if (error) throw error;
    
    await adminService._logAudit('Restore', module, recordId, performedBy, 'Restored from Recycle Bin');
    return true;
  },

  hardDeleteRecord: async (module, recordId, performedBy) => {
    const table = TABLE_MAP[module];
    if (!table) throw new Error("Invalid module");

    // Dependency Locks
    if (module === 'Maintenance') {
        const { count } = await supabase.from('maintenance_logs').select('*', { count: 'exact', head: true }).eq('machine_id', recordId);
        if (count > 0) throw new Error("Dependency Lock: Cannot permanently delete machine with existing service history.");
    }
    
    if (module === 'Fleet') {
        const { count } = await supabase.from('fleet_trips').select('*', { count: 'exact', head: true }).eq('vehicle_id', recordId);
        if (count > 0) throw new Error("Dependency Lock: Cannot permanently delete vehicle with existing trip logs.");
    }

    const { error } = await supabase.from(table).delete().eq('id', recordId);
    if (error) throw error;
    
    await adminService._logAudit('Hard Delete', module, recordId, performedBy, 'Permanently Destroyed');
    return true;
  },

  getRecycleBinRecords: async () => {
    // Note: In a real enterprise app, we might use a materialized view or unified search index.
    // For this UI, we will run parallel queries for `is_deleted = true`.
    const tables = Object.entries(TABLE_MAP);
    const promises = tables.map(async ([mod, tbl]) => {
        const { data } = await supabase.from(tbl).select('*').eq('is_deleted', true);
        return (data || []).map(row => ({ ...row, module: mod }));
    });

    const results = await Promise.all(promises);
    return results.flat().sort((a,b) => new Date(b.deleted_at) - new Date(a.deleted_at));
  }
};
