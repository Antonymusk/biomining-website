import { supabase } from '../lib/supabase';

export const fleetService = {
  async getVehicles(siteId = null, vehicleType = null, search = '', limit = 50, offset = 0) {
    let query = supabase
      .from('fleet_vehicles')
      .select('*, inventory_sites(name)')
      .neq('is_deleted', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }
    if (vehicleType && vehicleType !== 'All') {
      query = query.eq('vehicle_type', vehicleType);
    }
    if (search) {
      query = query.ilike('vehicle_name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('404')) {
        console.warn("fleet_vehicles table missing");
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async addVehicle(vehicle) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .insert([vehicle])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVehicle(id, updates) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVehicle(id) {
    const { error } = await supabase
      .from('fleet_vehicles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribeToFleetUpdates(callback) {
    const channel = supabase
      .channel(`fleet_vehicles_changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fleet_vehicles' },
        (payload) => callback(payload)
      )
      .subscribe();
    return channel;
  }
};
