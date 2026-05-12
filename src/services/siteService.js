import { supabase } from "../lib/supabase";

export const siteService = {
  
  /**
   * Strictly fetches sites from dynamic Supabase endpoint.
   * Implements silent retry/fallback cache mechanism ONLY for offline availability, not data persistence logic.
   */
  getSites: async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Synchronize client-side offline cache snapshot
      if (data) {
        localStorage.setItem("biomine_sites_cache_snapshot", JSON.stringify(data));
        return data;
      }
      return [];
    } catch (err) {
      console.warn("CRITICAL DATABASE LINK FAILURE: Falling back to static snapshot.", err);
      const cache = localStorage.getItem("biomine_sites_cache_snapshot");
      return cache ? JSON.parse(cache) : [];
    }
  },

  /**
   * Writes a record directly to the main enterprise site registry.
   */
  saveSite: async (siteData) => {
    const isNew = !siteData.id;
    
    const payload = {
       name: siteData.name,
       zone: siteData.zone || 'Central',
       location: siteData.location || '',
       capacity: Number(siteData.capacity) || 500,
       status: siteData.status || 'Active',
       hours: siteData.hours || '24 Hours',
       manager: siteData.manager || 'N/A'
    };

    let query;
    if (isNew) {
       query = supabase.from('sites').insert([payload]);
    } else {
       query = supabase.from('sites').update(payload).eq('id', siteData.id);
    }

    const { error } = await query;

    if (error) {
       console.error("Site Transaction Matrix Broken:", error);
       throw new Error(error.message || "Failed to execute node write operation.");
    }
    
    // Re-fetch total system list to satisfy absolute UX bind conformity
    return this.getSites();
  },

  /**
   * Deletes a site instance from deployment records.
   */
  deleteSite: async (siteId) => {
    const { error } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);
      
    if (error) {
      throw new Error(`Registry Drop Failure: ${error.message}`);
    }
    return this.getSites();
  }
};
