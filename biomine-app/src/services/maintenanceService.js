import { supabase } from "../lib/supabase";

export const maintenanceService = {
  
  generateWorkOrderNumber: () => {
    const date = new Date();
    const ym = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WO-${ym}-${random}`;
  },

  getMachines: async (filters = {}) => {
    let query = supabase
      .from('maintenance_machines')
      .select(`
        *,
        inventory_sites (name),
        maintenance_logs (service_date, next_service_date)
      `)
      .neq('is_deleted', true)
      .order('health_score', { ascending: true }); // Lowest health first

    if (filters.site_id) query = query.eq('site_id', filters.site_id);
    if (filters.status && filters.status !== 'All') query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  },

  getMachineHistory: async (machineId) => {
    const [logsRes, woRes] = await Promise.all([
      supabase.from('maintenance_logs').select('*').eq('machine_id', machineId).order('service_date', { ascending: false }),
      supabase.from('maintenance_work_orders').select('*').eq('machine_id', machineId).order('created_at', { ascending: false })
    ]);

    if (logsRes.error) throw logsRes.error;
    if (woRes.error) throw woRes.error;

    return {
      logs: logsRes.data || [],
      workOrders: woRes.data || []
    };
  },

  createMachine: async (payload) => {
    const { data, error } = await supabase.from('maintenance_machines').insert([payload]).select().single();
    if (error) throw error;
    return data;
  },

  logService: async (payload) => {
    // 1. Insert Log
    const { data: logData, error: logError } = await supabase.from('maintenance_logs').insert([{
      machine_id: payload.machine_id,
      work_order_id: payload.work_order_id,
      service_type: payload.service_type,
      service_notes: payload.service_notes,
      parts_changed: payload.parts_changed,
      technician_name: payload.technician_name,
      downtime_hours: payload.downtime_hours,
      service_cost: payload.service_cost,
      next_service_date: payload.next_service_date,
      ...(payload.service_date && { service_date: payload.service_date })
    }]).select().single();

    if (logError) throw logError;

    // 2. Intelligence: Update Machine Health & Status
    // Basic logic: high downtime or 'Breakdown' drops score. 
    // Preventative maintenance boosts score.
    const { data: machine } = await supabase.from('maintenance_machines').select('health_score').eq('id', payload.machine_id).single();
    
    let newScore = machine?.health_score || 100;
    if (payload.service_type === 'Breakdown') newScore = Math.max(0, newScore - 20);
    if (payload.service_type === 'Preventative') newScore = Math.min(100, newScore + 15);
    
    let newStatus = newScore < 50 ? 'Warning' : 'Operational';

    await supabase.from('maintenance_machines').update({
      health_score: newScore,
      status: newStatus,
      runtime_hours: payload.new_runtime_hours // Assume passed if updated
    }).eq('id', payload.machine_id);

    // 3. Operational Alerts Integration
    if (payload.service_type === 'Breakdown') {
      await supabase.from('operational_timeline').insert([{
        event_type: 'alert',
        message: `Breakdown logged for Machine ID: ${payload.machine_id}. Downtime: ${payload.downtime_hours}h`,
        severity: 'critical'
      }]);
    }

    return logData;
  },

  createWorkOrder: async (payload) => {
    const woNum = maintenanceService.generateWorkOrderNumber();
    const { data, error } = await supabase.from('maintenance_work_orders').insert([{
      ...payload,
      wo_number: woNum
    }]).select().single();

    if (error) throw error;
    
    if (payload.priority === 'Critical') {
        await supabase.from('operational_timeline').insert([{
            event_type: 'alert',
            message: `Critical Maintenance Work Order generated: ${woNum}`,
            severity: 'warning'
        }]);
    }

    return data;
  },
  
  // Scans for overdue maintenance to generate alerts (can be triggered on load)
  checkOverdueMaintenance: async () => {
     // Fetch the latest log for all machines to check next_service_date
     // In a real app, this would be a CRON job.
     // For now, we rely on UI-level checks or a lightweight query.
     const { data, error } = await supabase.rpc('check_overdue_maintenance'); // Assuming an RPC if implemented, otherwise handled in UI
     return data;
  }
};
