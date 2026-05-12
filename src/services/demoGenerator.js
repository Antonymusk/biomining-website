import { supabase } from '../lib/supabase';

const FAKE_SITES = ["Northern Hub", "Delhi Plant", "Siliguri Facility", "Western Open Cast"];
const FAKE_ALERTS = [
  { title: "Conveyor Belt A Jam", desc: "Detected unexpected resistance on primary belt.", severity: "critical" },
  { title: "Excavator EX-04 Fuel Low", desc: "Fuel level critically low (12%).", severity: "warning" },
  { title: "Trommel 2 Efficiency Drop", desc: "Throughput dropped by 15% in last hour.", severity: "info" }
];

export const demoGenerator = {
  activeIntervals: [],

  startSimulation: () => {
    console.log("[Demo Mode] Starting Operational Simulation...");
    
    // Simulate Fleet Movement
    const fleetInterval = setInterval(async () => {
      // Pick a random vehicle and update its fuel and efficiency slightly
      const { data } = await supabase.from('fleet_vehicles').select('id, fuel_level, efficiency').limit(5);
      if (data && data.length > 0) {
        const target = data[Math.floor(Math.random() * data.length)];
        const newFuel = Math.max(0, target.fuel_level - Math.floor(Math.random() * 3));
        const newEff = Math.min(100, Math.max(50, target.efficiency + (Math.random() > 0.5 ? 2 : -2)));
        
        await supabase.from('fleet_vehicles')
          .update({ fuel_level: newFuel, efficiency: newEff })
          .eq('id', target.id);
      }
    }, 15000); // Every 15s

    // Simulate Random Alerts
    const alertInterval = setInterval(async () => {
      if (Math.random() > 0.7) { // 30% chance every 30s
        const alert = FAKE_ALERTS[Math.floor(Math.random() * FAKE_ALERTS.length)];
        await supabase.from('operational_alerts').insert([{
          title: alert.title,
          description: alert.desc,
          severity: alert.severity,
          status: 'active'
        }]);
      }
    }, 30000);

    // Simulate Timeline Activity
    const timelineInterval = setInterval(async () => {
      if (Math.random() > 0.6) { // 40% chance every 20s
        const site = FAKE_SITES[Math.floor(Math.random() * FAKE_SITES.length)];
        await supabase.from('operational_timeline').insert([{
          event_type: 'logistics',
          title: 'Fleet Movement',
          description: `Truck dispatched from ${site}`,
          status: 'info'
        }]);
      }
    }, 20000);

    demoGenerator.activeIntervals.push(fleetInterval, alertInterval, timelineInterval);
  },

  stopSimulation: () => {
    console.log("[Demo Mode] Stopping Simulation...");
    demoGenerator.activeIntervals.forEach(clearInterval);
    demoGenerator.activeIntervals = [];
  }
};
