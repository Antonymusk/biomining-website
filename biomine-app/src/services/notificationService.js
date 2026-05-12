import { supabase } from '../lib/supabase';

export const notificationService = {
  async getNotifications(limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(0, limit - 1);
    
    if (error) {
      if (error.code === 'PGRST205' || error.code === '404' || error.message?.includes('404')) {
        console.warn("Notifications table missing");
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) {
      if (error.code === 'PGRST205') return;
      throw error;
    }
  },

  async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);
    
    if (error) {
      if (error.code === 'PGRST205') return;
      throw error;
    }
  },

  subscribeToNotifications(callback) {
    const channel = supabase
      .channel(`notifications_changes_${Date.now()}_${Math.random()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => callback(payload)
      )
      .subscribe();
    return channel;
  }
};
