import { supabase } from '../lib/supabase';

const STORAGE_KEY = "biomine_manpower_fallback";

// Seed data for realistic initial interaction on developer installs or clean environments
const MOCK_MANPOWER = [
  { id: "m1", employee_id: "EMP-001", name: "Arjun Mehta", designation: "Site Incharge", department: "Operations", site: "Delhi Site", phone: "+91 9876543210", description: "Oversees node infrastructure & daily MIS pipelines.", status: "Active", joined_at: "2024-01-15T10:00:00Z", created_at: new Date().toISOString() },
  { id: "m2", employee_id: "EMP-002", name: "Vikram Singh", designation: "Excavator Operator", department: "Heavy Machinery", site: "Mumbai Hub", phone: "+91 9876543211", description: "Senior Poclain handler for morning shift rotations.", status: "Active", joined_at: "2024-02-01T10:00:00Z", created_at: new Date().toISOString() },
  { id: "m3", employee_id: "EMP-003", name: "Priya Sharma", designation: "MIS Operator", department: "Intelligence", site: "Delhi Site", phone: "+91 9876543212", description: "Primary verification officer for all inbound gate entries.", status: "Active", joined_at: "2024-03-10T10:00:00Z", created_at: new Date().toISOString() },
  { id: "m4", employee_id: "EMP-004", name: "Sunil Kumar", designation: "Helper", department: "General Logistics", site: "Kolkata Unit", phone: "+91 9876543213", description: "Sorting yard support specialist.", status: "Leave", joined_at: "2024-04-05T10:00:00Z", created_at: new Date().toISOString() }
];

const getFallbackData = () => {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (!local) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_MANPOWER));
      return MOCK_MANPOWER;
    }
    return JSON.parse(local);
  } catch (e) {
    return MOCK_MANPOWER;
  }
};

const setFallbackData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const manpowerService = {
  async getAll(site = null) {
    try {
      let query = supabase.from('manpower').select('*').order('created_at', { ascending: false });
      
      if (site) {
        query = query.eq('site', site);
      }
      
      const { data, error } = await query;
      
      // Handle error code for missing table by dynamically downgrading to robust cached abstraction
      if (error && (error.code === 'PGRST204' || error.message?.includes('relation "manpower" does not exist') || error.code === '42P01')) {
        console.warn("[ManpowerService] Primary table inaccessible. Engaging virtualized local cluster fallback.");
        let locals = getFallbackData();
        if (site) {
          locals = locals.filter(x => x.site === site);
        }
        return locals;
      }
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      // Network or generic fail safe
      let localData = getFallbackData();
      if (site) localData = localData.filter(x => x.site === site);
      return localData;
    }
  },

  async create(payload) {
    try {
      const newRow = {
        ...payload,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('manpower').insert(newRow).select().single();
      
      if (error && (error.code === 'PGRST204' || error.message?.includes('does not exist') || error.code === '42P01')) {
        const locals = getFallbackData();
        const mockRow = { ...newRow, id: `gen_${Math.random().toString(36).slice(2, 9)}` };
        locals.unshift(mockRow);
        setFallbackData(locals);
        window.dispatchEvent(new Event("manpower_updated"));
        return mockRow;
      }

      if (error) throw error;
      window.dispatchEvent(new Event("manpower_updated"));
      return data;
    } catch (err) {
      const locals = getFallbackData();
      const mockRow = { ...payload, id: `gen_${Math.random().toString(36).slice(2, 9)}`, created_at: new Date().toISOString() };
      locals.unshift(mockRow);
      setFallbackData(locals);
      window.dispatchEvent(new Event("manpower_updated"));
      return mockRow;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabase.from('manpower').update(updates).eq('id', id).select().single();
      
      if (error && (error.code === 'PGRST204' || error.message?.includes('does not exist') || error.code === '42P01')) {
        const locals = getFallbackData();
        const idx = locals.findIndex(l => l.id === id);
        if (idx > -1) {
          locals[idx] = { ...locals[idx], ...updates };
          setFallbackData(locals);
          window.dispatchEvent(new Event("manpower_updated"));
          return locals[idx];
        }
      }
      
      if (error) throw error;
      window.dispatchEvent(new Event("manpower_updated"));
      return data;
    } catch (err) {
       const locals = getFallbackData();
       const idx = locals.findIndex(l => l.id === id);
       if (idx > -1) {
         locals[idx] = { ...locals[idx], ...updates };
         setFallbackData(locals);
         window.dispatchEvent(new Event("manpower_updated"));
         return locals[idx];
       }
    }
  },

  async delete(id) {
    try {
      const { error } = await supabase.from('manpower').delete().eq('id', id);
      
      if (error && (error.code === 'PGRST204' || error.message?.includes('does not exist') || error.code === '42P01')) {
         const locals = getFallbackData();
         const filtered = locals.filter(x => x.id !== id);
         setFallbackData(filtered);
         window.dispatchEvent(new Event("manpower_updated"));
         return;
      }
      if (error) throw error;
      window.dispatchEvent(new Event("manpower_updated"));
    } catch (err) {
       const locals = getFallbackData();
       const filtered = locals.filter(x => x.id !== id);
       setFallbackData(filtered);
       window.dispatchEvent(new Event("manpower_updated"));
    }
  }
};
