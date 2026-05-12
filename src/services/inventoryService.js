import { supabase } from '../lib/supabase';

export const inventoryService = {
  async getSites() {
    const { data, error } = await supabase
      .from('inventory_sites')
      .select('*')
      .order('name');
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('404')) {
        console.warn("inventory_sites table missing");
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async addSite(name) {
    const { data, error } = await supabase
      .from('inventory_sites')
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getInventoryItems(siteId = null, limit = 50, offset = 0) {
    let query = supabase
      .from('inventory_items')
      .select('*, inventory_sites(name)')
      .neq('is_deleted', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('404')) {
        console.warn("inventory_items table missing");
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async addInventoryItem(item) {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateInventoryItem(id, updates) {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteInventoryItem(id) {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  subscribeToInventoryUpdates(callback) {
    const channel = supabase
      .channel(`inventory_items_changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => callback(payload)
      )
      .subscribe();
    return channel;
  }
};
