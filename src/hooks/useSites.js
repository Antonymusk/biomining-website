import { useState, useEffect, useCallback } from "react";
import { siteService } from "../services/siteService";

/**
 * Unified hook for all BioMine modules requiring site data lists.
 * @param {Object} options - filter options
 * @param {boolean} options.onlyActive - only returns 'Active' and 'Maintenance' sites. Default true.
 */
export function useSites(options = { onlyActive: true }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await siteService.getSites();
      
      if (options.onlyActive) {
        // Filter out 'Inactive' and only keep those operational
        data = data.filter(s => s.status === 'Active' || s.status === 'Maintenance');
      }
      
      setSites(data);
    } catch (err) {
      setError(err);
      console.error("Error in useSites hook:", err);
    } finally {
      setLoading(false);
    }
  }, [options.onlyActive]);

  useEffect(() => {
    loadSites();
    
    // Setup easy communication listener so when SiteConfiguration updates it tells everyone to refetch
    window.addEventListener("biomine_sites_updated", loadSites);
    return () => {
      window.removeEventListener("biomine_sites_updated", loadSites);
    };
  }, [loadSites]);

  return { sites, loading, error, refetch: loadSites };
}
