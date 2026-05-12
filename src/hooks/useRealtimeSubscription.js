import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Global registry for channel deduplication and StrictMode stabilization
const activeChannelsRegistry = new Map();

export const debugCounters = {
  activeChannels: 0,
  reconnectAttempts: 0,
  duplicateBlocked: 0
};

/**
 * Custom hook to manage Supabase Realtime subscriptions with global deduplication,
 * reference-counted lifecycle, and automatic cleanup.
 */
export const useRealtimeSubscription = (table, callback, event = '*', filter = null, debounceMs = 150) => {
  const callbackRef = useRef(callback);
  
  // Keep callback reference fresh without triggering effect runs
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // 4. Memoize channel identifier as a stable string key
    const filterStr = filter ? (typeof filter === 'object' ? JSON.stringify(filter) : filter) : '';
    const channelName = `realtime:${table}:${event}:${filterStr}`;
    
    let timeoutId = null;
    const pendingPayloads = [];

    // Throttling logic to guard against event storms
    const handlePayload = (payload) => {
      if (debounceMs > 0) {
        pendingPayloads.push(payload);
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
          if (pendingPayloads.length > 0) {
            callbackRef.current(pendingPayloads[pendingPayloads.length - 1]);
            pendingPayloads.length = 0; // Clear queue
          }
        }, debounceMs);
      } else {
        callbackRef.current(payload);
      }
    };

    // 6 & 8. Internal Subscription Deduplication & Cleanup Guards
    let registryEntry = activeChannelsRegistry.get(channelName);

    if (registryEntry) {
      // Channel already exists, reuse it and register this listener
      registryEntry.refCount++;
      registryEntry.listeners.add(handlePayload);
      debugCounters.duplicateBlocked++;
      
      console.log(`[Realtime] Reusing channel: ${channelName}. Total refCount: ${registryEntry.refCount}. Blocked duplicates: ${debugCounters.duplicateBlocked}`);
    } else {
      // 5. Create new channel on first initialization
      const listeners = new Set();
      listeners.add(handlePayload);

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: event, 
            schema: 'public', 
            table: table,
            ...(filter && { filter: filter }) 
          },
          (payload) => {
            const entry = activeChannelsRegistry.get(channelName);
            if (entry) {
              entry.listeners.forEach((listener) => listener(payload));
            }
          }
        );

      registryEntry = {
        channel,
        refCount: 1,
        listeners,
        isSubscribed: false
      };

      activeChannelsRegistry.set(channelName, registryEntry);
      debugCounters.activeChannels++;

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          registryEntry.isSubscribed = true;
          console.log(`[Realtime] SUBSCRIBED to ${channelName}. Active channels count: ${debugCounters.activeChannels}`);
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          debugCounters.reconnectAttempts++;
          console.warn(`[Realtime] Channel reconnecting for ${channelName}. Total reconnect attempts: ${debugCounters.reconnectAttempts}`);
        }
      });
    }

    // Return reference-counting cleanup handler
    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      const entry = activeChannelsRegistry.get(channelName);
      if (entry) {
        entry.listeners.delete(handlePayload);
        entry.refCount--;

        if (entry.refCount <= 0) {
          // Zero active consumers left, safe to dismantle the channel
          console.log(`[Realtime] Removing unused channel: ${channelName}`);
          try {
            supabase.removeChannel(entry.channel);
          } catch (err) {
            console.error(`[Realtime] Error removing channel ${channelName}:`, err);
          }
          activeChannelsRegistry.delete(channelName);
          debugCounters.activeChannels = Math.max(0, debugCounters.activeChannels - 1);
        } else {
          console.log(`[Realtime] Retaining active channel: ${channelName}. Remaining refCount: ${entry.refCount}`);
        }
      }
    };
  }, [table, event, filter, debounceMs]);
};
