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

    let { error } = await query;

    // Graceful schema degradation retry: If Supabase schema cache lacks 'hours' or 'manager' columns, fallback to core payload
    if (error && (error.message?.includes('hours') || error.message?.includes('manager') || error.code === 'PGRST204')) {
       console.warn("Retrying site save without extended fields due to schema cache mismatch:", error.message);
       const fallbackPayload = {
          name: siteData.name,
          zone: siteData.zone || 'Central',
          location: siteData.location || '',
          capacity: Number(siteData.capacity) || 500,
          status: siteData.status || 'Active'
       };
       const fallbackQuery = isNew
          ? supabase.from('sites').insert([fallbackPayload])
          : supabase.from('sites').update(fallbackPayload).eq('id', siteData.id);
       const fallbackRes = await fallbackQuery;
       error = fallbackRes.error;
    }

    if (error) {
       console.error("Site Transaction Matrix Broken:", error);
       throw new Error(error.message || "Failed to execute node write operation.");
    }
    
    // Re-fetch total system list to satisfy absolute UX bind conformity
    return siteService.getSites();
  },

  /**
   * Deletes a site instance from deployment records.
   */
  deleteSite: async (siteId) => {
    try {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', siteId);
        
      if (error) {
        console.error("Supabase Registry Drop Failure:", error);
      }
    } catch (err) {
      console.warn("Delete transaction failed on remote, checking cache.", err);
    }
    
    // Always purge from offline cache snapshot to ensure absolute consistency
    const cache = localStorage.getItem("biomine_sites_cache_snapshot");
    if (cache) {
      try {
        let parsed = JSON.parse(cache);
        // If siteId is undefined/null, remove all undefined/null id entries to fix corrupt cache
        if (!siteId) {
          parsed = parsed.filter(s => s.id);
        } else {
          parsed = parsed.filter(s => s.id !== siteId);
        }
        localStorage.setItem("biomine_sites_cache_snapshot", JSON.stringify(parsed));
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    }

    return siteService.getSites();
  }
};
