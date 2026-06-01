import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Bot, Key, ArrowRight, MessageSquare, RotateCcw, Volume2, VolumeX, ShieldAlert, BarChart3, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";

// ⚔️ JARVIS-PERSONA WARRIOR MOTIVATIONAL REGISTRY
const WARRIOR_QUOTES = [
  '"The supreme art of war is to subdue the enemy without fighting. Let us subdue these operational variances today, Sir." — Sun Tzu',
  '"Fortune favors the bold. Let us command the frontlines and dominate our targets today, Sir."',
  '"What we do in life echoes in eternity. Time to conquer this shift and push our limits, Sir."',
  '"A warrior does not give up what he loves, he finds the love in what he does. Let us build excellence today, Sir."',
  '"Success is not final, failure is not fatal: it is the courage to continue that counts. Standing by to conquer, Sir."',
  '"He who is well prepared has won half the battle. Database links established. Shall we begin our assault, Sir?"',
  '"The harder the conflict, the more glorious the triumph. Let us face today\'s operations with absolute focus, Sir."'
];

// PROTOCOL MODULES MATRIX
const PROTOCOLS = [
  {
    id: "warrior",
    name: "Tactical Warrior",
    icon: "⚔️",
    colorClass: "text-primary border-primary/20",
    accentColor: "text-primary",
    themeBg: "from-[#0a0f1d]/95 to-[#0b0c16]/95",
    glowColor: "rgba(59, 130, 246, 0.4)",
    bubbleClass: "border-primary/10 bg-slate-950 text-gray-200",
    systemPrompt: `You are B.E.R.R.Y. (Bio-Efficiency Resource & Reporting Yielder), an elite operational intelligence AI modeled after Jarvis. Assist the supervisor with real-time metrics and logistics strategy.
    
    J.A.R.V.I.S. OPERATIONAL PROTOCOLS:
    1. HONORIFIC: You MUST address the user as "Sir" in every single response. Keep a crisp, respectful, professional, and brave demeanor.
    2. WARRIOR FOCUS: Bring energy and tactical motivation. Quote warriors or emphasize conquering targets when we are behind.
    3. STRATEGIC INITIATIVE: Analyze database telemetry. Conclude with a sharp recommended action or tactical observation based on the current live data.`
  },
  {
    id: "analytics",
    name: "Data Analytics",
    icon: "📊",
    colorClass: "text-teal-400 border-teal-500/20",
    accentColor: "text-teal-400",
    themeBg: "from-[#051c1c]/95 to-[#050b0c]/95",
    glowColor: "rgba(20, 184, 166, 0.4)",
    bubbleClass: "border-teal-500/10 bg-slate-950 text-gray-100",
    systemPrompt: `You are B.E.R.R.Y. (Data Analytics Protocol). You are a highly precise, scientific, and mathematically rigorous data compiler.
    
    ANALYTICAL OPERATIONS PROTOCOLS:
    1. FORMALITY: Address the supervisor as "Sir" or "Chief Analyst". Focus on absolute mathematical accuracy.
    2. STATISTICAL DEPTH: Focus on fuel ratios, tonnage projections, site productivity, and vehicle uptime counts. Compare active logs against benchmarks.
    3. DETAILED LOGISTICS: Conclude with a numerical target assessment or a variance report.`
  },
  {
    id: "watchdog",
    name: "Alert Watchdog",
    icon: "🛡️",
    colorClass: "text-rose-400 border-rose-500/20",
    accentColor: "text-rose-400",
    themeBg: "from-[#1e070e]/95 to-[#0e0307]/95",
    glowColor: "rgba(244, 63, 94, 0.4)",
    bubbleClass: "border-rose-500/20 bg-[#0e0307] text-gray-200",
    systemPrompt: `You are B.E.R.R.Y. (Alert Watchdog Protocol). You are an emergency warning sentinel monitoring compliance and safety.
    
    SAFETY AUDIT PROTOCOLS:
    1. URGENCY: Address the supervisor as "Sir" or "Incident Commander". Accentuate active alerts, mechanical faults, and route delays.
    2. SAFETY ANALYSIS: Be direct, warning-heavy, and clear. Give immediate compliance instructions or environmental hazard summaries.
    3. COMPLIANCE STANDARDS: Conclude with a critical safety check or alert triage checklist.`
  },
  {
    id: "technician",
    name: "Silent Tech",
    icon: "🔧",
    colorClass: "text-slate-400 border-slate-500/20",
    accentColor: "text-slate-400",
    themeBg: "from-[#0b0f19]/95 to-[#04060b]/95",
    glowColor: "rgba(100, 116, 139, 0.4)",
    bubbleClass: "border-slate-800 bg-[#07090e] text-slate-300 font-mono",
    systemPrompt: `You are B.E.R.R.Y. (Silent Technical Interface). You are a minimal technical data compiler designed for absolute brevity.
    
    TECHNICAL PROTOCOLS:
    1. MINIMALISM: No conversational fluff. Return raw logs, database schemas, active vehicle status counts, and uplink performance benchmarks.
    2. DATA STRUCTURES: Address the user as "Sir" or "Operator". Keep text extremely concise, preferring lists and code blocks.
    3. LOW LATENCY: Conclude with a direct technical log stamp.`
  }
];

// TACTICAL DIRECTIVE CHIPS
const DIRECTIVES = [
  {
    label: "📋 Fuel Audit",
    query: "Sir, please compile a strategic fuel audit. Run calculations on diesel consumption vs disposal rates, and suggest steps to optimize fuel cost."
  },
  {
    label: "🚚 Fleet Overhaul",
    query: "Sir, what is the active vehicle status? List the number of trucks currently undergoing maintenance, idle units, and recommended scheduling."
  },
  {
    label: "🎯 Tonnage Projection",
    query: "Sir, evaluate today's tonnage disposal rate. Project whether we will achieve the 350-ton platform target by shift end, and recommend actions if behind."
  },
  {
    label: "⚠️ Compliance Triage",
    query: "Sir, analyze current active operational incidents and alerts. Provide immediate compliance steps and safety optimization instructions."
  }
];

// CHATGPT-STYLE ULTRA-CLEAN MARKDOWN PARSER
const parseMarkdownToHTML = (text) => {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<div class="text-[10px] font-black tracking-wider text-primary uppercase mt-3 mb-1">$1</div>');
  html = html.replace(/^## (.*$)/gim, '<div class="text-[11px] font-black tracking-wide text-white uppercase mt-4 mb-1.5 border-b border-white/5 pb-0.5">$1</div>');

  // Bullets
  html = html.replace(/^\s*[-*•]\s+(.*)/gim, '<div class="flex items-start gap-2 my-1 pl-1"><span class="text-primary font-black text-[9px] mt-0.5">■</span><span class="text-gray-300 flex-1">$1</span></div>');

  return html;
};

// Streaming typewriter simulation
function TypewriterMarkdown({ text, speed = 12, onComplete }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let currentText = "";
    const words = text.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setDisplayedText(currentText);
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, 100);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <div className="whitespace-pre-line leading-relaxed" dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(displayedText) }} />;
}

export function AICopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState(() => {
    return localStorage.getItem("biomine_berry_protocol") || "warrior";
  });
  
  const currentProtocol = PROTOCOLS.find(p => p.id === activeProtocol) || PROTOCOLS[0];

  const [messages, setMessages] = useState(() => {
    const savedProto = localStorage.getItem("biomine_berry_protocol") || "warrior";
    return [
      {
        role: "assistant",
        content: savedProto === "warrior" 
          ? `👋 Welcome back to the main operations deck, Sir! I am B.E.R.R.Y. (Bio-Efficiency Resource & Reporting Yielder). Telemetry matrices are primed and online. Ready for command, Sir!`
          : savedProto === "analytics"
          ? `📊 **Data Analytics Protocol Loaded.** Real-time Supabase telemetry nodes successfully aggregated. Ready for numerical audit, Chief.`
          : savedProto === "watchdog"
          ? `🛡️ **Alert Watchdog Sentinel Activated.** Continuous safety monitoring protocols online. Ready for Compliance and Alert triage, Incident Commander.`
          : `🔧 **BM-SYS Tech Node Active.** Uplink status: GREEN. Log feed enabled. Ready for silent query.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem("biomine_berry_muted") === "true"; // default to true (muted) for clean load
  });

  const [apiKey, setApiKey] = useState(() => import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem("biomine_gemini_key") || "");
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [streamingIndex, setStreamingIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Database Telemetry Feed
  const [telemetry, setTelemetry] = useState({
    todayDisposal: 0,
    fuelEfficiency: 0.000,
    activeFleet: 0,
    idleFleet: 0,
    maintenanceFleet: 0,
    systemAlerts: 0
  });

  // Function to Fetch Real-time Numbers
  const fetchLiveTelemetry = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Aggregate Production/Disposal
      const { data: misEntries } = await supabase
        .from('mis_entries')
        .select('total_disposal, total_diesel')
        .eq('date', today);

      const totalDisposal = misEntries?.reduce((sum, r) => sum + (Number(r.total_disposal) || 0), 0) || 0;
      const totalDiesel = misEntries?.reduce((sum, r) => sum + (Number(r.total_diesel) || 0), 0) || 0;
      const efficiencyRatio = totalDisposal > 0 ? (totalDiesel / totalDisposal) : 0;

      // 2. Fleet Stats
      const { data: vehicles } = await supabase
        .from('fleet_vehicles')
        .select('status');

      const stats = { active: 0, idle: 0, maintenance: 0 };
      vehicles?.forEach(v => {
        const s = v.status?.toLowerCase() || "";
        if (["active", "operational", "running"].includes(s)) stats.active++;
        else if (["maintenance", "repair"].includes(s)) stats.maintenance++;
        else stats.idle++;
      });

      // 3. Active Alerts Count
      const { count: alertsCount } = await supabase
        .from('operational_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const result = {
        todayDisposal: totalDisposal,
        fuelEfficiency: efficiencyRatio.toFixed(3),
        activeFleet: stats.active,
        idleFleet: stats.idle,
        maintenanceFleet: stats.maintenance,
        systemAlerts: alertsCount || 0
      };
      
      setTelemetry(result);

      // 🔔 PROACTIVE ALERT WATCHDOG (Warn if ratio spikes over benchmark 0.60)
      if (efficiencyRatio > 0.60 && !localStorage.getItem("biomine_warned_today")) {
        localStorage.setItem("biomine_warned_today", "true");
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-950 border border-rose-500/30 shadow-[0_10px_40px_rgba(244,63,94,0.1)] rounded-2xl pointer-events-auto flex flex-col p-4 relative group font-sans`}>
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert className="text-rose-500" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black tracking-wider text-rose-500 uppercase">B.E.R.R.Y. Sentinel Broadcast</p>
                <p className="text-xs font-bold text-white mt-0.5">Critical Ratio Variance, Sir!</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Fuel ratio has scaled to <strong>{efficiencyRatio.toFixed(3)} L/T</strong>, breaching the 0.60 L/T safety ceiling. Sentinel watchdog suggests diagnostic route adjustment.</p>
              </div>
              <button onClick={() => toast.dismiss(t.id)} className="text-gray-500 hover:text-white transition-colors"><X size={14} /></button>
            </div>
          </div>
        ), { duration: 6500, position: 'top-center' });
      }
    } catch (err) {
      console.error("AI Feed Refresh Error:", err);
    }
  };

  useEffect(() => {
    fetchLiveTelemetry();
    return () => {
      cancelSpeech();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLiveTelemetry();
    } else {
      cancelSpeech(); // Silence voice if drawer collapses
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Voice Synthesis Engine
  const speakText = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    // Clean text of markdown characters
    const cleaned = text
      .replace(/\*\*/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/[-*•■]/g, "")
      .replace(/`{3}[\s\S]*?`{3}/g, "") // strip code blocks
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("David"))) || voices[0];
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = activeProtocol === "watchdog" ? 1.08 : activeProtocol === "analytics" ? 0.98 : 0.94;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const updated = !prev;
      localStorage.setItem("biomine_berry_muted", JSON.stringify(updated));
      if (updated) {
        cancelSpeech();
      } else {
        toast.success("Vocal speech module online!");
      }
      return updated;
    });
  };

  const handleProtocolChange = (id) => {
    setActiveProtocol(id);
    localStorage.setItem("biomine_berry_protocol", id);
    cancelSpeech();

    const protoName = PROTOCOLS.find(p => p.id === id)?.name || "Tactical Warrior";

    let initMsg = "";
    if (id === "warrior") {
      initMsg = `⚔️ **Warrior Protocol Synchronized, Sir.** System state optimal. Directives fully ready for execution, Sir. Let us dominate our shift targets.`;
    } else if (id === "analytics") {
      initMsg = `📊 **Data Analytics Protocol Engaged.** Raw telemetry registers loaded. Primary mission parameters, tonnage ratios, and delta metrics compiled. Shall we audit the logistics nodes, Chief?`;
    } else if (id === "watchdog") {
      initMsg = `🛡️ **Watchdog Incident Triage Activated.** Safety buffers, compliance thresholds, and operational bottleneck warnings monitored. Incident logs primed, Commander. State your threat assessment.`;
    } else {
      initMsg = `🔧 **Silent Technician Terminal Connected.**
---
SYSTEM STACK INITIALIZED
API ENDPOINT STATUS: ONLINE
DATABASE UPLINK   : SYNCED
---
Ready for direct log queries.`;
    }

    setMessages([
      {
        role: "assistant",
        content: initMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);

    toast.success(`${protoName} activated!`);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    const key = e.target.elements.keyInput.value.trim();
    if (key) {
      localStorage.setItem("biomine_gemini_key", key);
      setApiKey(key);
      setShowKeyPrompt(false);
      toast.success("B.E.R.R.Y. Core key synchronized!");
    }
  };

  const handleClearChat = () => {
    cancelSpeech();
    setMessages([
      {
        role: "assistant",
        content: activeProtocol === "warrior" 
          ? `👋 Welcome back, Sir. Warrior Protocol loaded. Prime telemetries online.`
          : activeProtocol === "analytics"
          ? `📊 Analytics compiler rebooted. Ready to audit statistical telemetry nodes.`
          : activeProtocol === "watchdog"
          ? `🛡️ Watchdog sentinel reset. Emergency compliant loops initialized.`
          : `🔧 Silent Technician terminal connection renewed. Stacks cleared.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Deterministic Local Responses
  const generateLocalResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes("fuel") || q.includes("efficiency") || q.includes("ratio")) {
      return `📊 **Fuel Strategy Diagnostic Report**:
      
      * **Current Ratio**: **${telemetry.fuelEfficiency} L/T**
      * **Target Cap**: **0.60 L/T**
      * **Site Delta**: ${Number(telemetry.fuelEfficiency) > 0.60 ? '⚠️ breached +' + (Number(telemetry.fuelEfficiency) - 0.60).toFixed(3) + ' L/T' : '✓ optimal'}
      
      ## B.E.R.R.Y. Operations Strategy:
      1. Fuel variance is heavily correlated with vehicle idle times on the disposal ramp.
      2. Sentinel advises implementing a strict **3-minute idle shut-down** rule for all active trucks.
      3. Command shift supervisors to re-route incoming haulers to bypass empty return loops.`;
    }
    
    if (q.includes("truck") || q.includes("fleet") || q.includes("allocation")) {
      return `🚚 **Fleet Overhaul Logistics Briefing**:
      
      * **Active Fleet Deployed**: **${telemetry.activeFleet} Units**
      * **Standby/Idle Fleet**: **${telemetry.idleFleet} Units**
      * **In Overhaul Maintenance**: **${telemetry.maintenanceFleet} Units**
      
      ## B.E.R.R.Y. Operational Dispatch Recommendation:
      1. Deployed capacity is at **${(telemetry.activeFleet / (telemetry.activeFleet + telemetry.idleFleet + telemetry.maintenanceFleet || 1) * 100).toFixed(0)}%**.
      2. Suggest drawing **1 idle vehicle** into the rotation loop to relieve units experiencing elevated engine temps.
      3. Confirm that the maintenance bay receives dispatch orders to accelerate overhaul clearances.`;
    }

    if (q.includes("tonnage") || q.includes("target") || q.includes("disposal") || q.includes("project")) {
      const remaining = Math.max(0, 350 - telemetry.todayDisposal);
      const completionPct = ((telemetry.todayDisposal / 350) * 100).toFixed(1);
      return `🎯 **Shift Tonnage Projection**:
      
      * **Total Cleared**: **${telemetry.todayDisposal} Tons**
      * **Objective Target**: **350 Tons**
      * **Current Progress**: **${completionPct}% Completed**
      * **Objective Shortfall**: **${remaining} Tons**
      
      ## B.E.R.R.Y. Projection Matrix:
      - Given the current fleet rate, we will ${remaining === 0 ? 'achieve' : 'require another 4.5 operational hours to close the variance'}.
      - Action: Prioritize primary disposal corridors and clear dumping bottlenecks.`;
    }

    if (q.includes("incident") || q.includes("alert") || q.includes("compliance") || q.includes("triage")) {
      return `🛡️ **Compliance Watchdog Risk Audit**:
      
      * **Active Platform Incidents**: **${telemetry.systemAlerts} High-Priority Alerts**
      * **Uplink Integrity Status**: **100% ONLINE**
      
      ## Recommended Triage Action:
      1. Supervisor must check the **Alert Center** immediately.
      2. Resolve any speed limit threshold spikes or perimeter geo-fence variances.
      3. Confirm radio checklists with supervisors on active haul roads.`;
    }

    return `🧠 **Local Telemetry Node Engaged, Sir.**
    
    System registers:
    - Today's Disposal: ${telemetry.todayDisposal} Tons
    - Fuel Ratio: ${telemetry.fuelEfficiency} L/T
    
    *Please click the 🔑 icon to load a Gemini Key to unlock full tactical conversational abilities, Sir.*`;
  };

  const handleSendDirective = (query) => {
    handleSendMessage(null, query);
  };

  const handleSendMessage = async (e, forcedInput) => {
    if (e) e.preventDefault();
    const queryText = forcedInput || input;
    if (!queryText.trim()) return;

    const userMsg = {
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    cancelSpeech();

    if (apiKey) {
      try {
        const apiHistory = messages.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }));
        
        apiHistory.push({
          role: "user",
          parts: [{ text: queryText }]
        });

        const systemInstructionText = `${currentProtocol.systemPrompt}
 
        REAL-TIME PLATFORM TELEMETRY (Directly from Supabase Database):
        - Total Disposal Today: ${telemetry.todayDisposal} Tons (Directive Objective: 350 Tons)
        - Site Fuel Efficiency: ${telemetry.fuelEfficiency} Liters/Ton (Benchmark Ceiling: 0.60 L/T)
        - Active Fleet Units: ${telemetry.activeFleet} Trucks Deployed
        - Standby/Idle Units: ${telemetry.idleFleet} Idle
        - Units in Overhaul: ${telemetry.maintenanceFleet} Maintenance
        - High-Priority Incident Alerts: ${telemetry.systemAlerts} Alerts

        CONTEXT:
        - User: ${user?.name || "Sir"} (${user?.role || "Supervisor"})
        - Date: ${new Date().toLocaleDateString()}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            contents: apiHistory,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: Key authorization variance.`);
        }

        const data = await response.json();
        const candidate = data.candidates && data.candidates[0];
        const hasParts = candidate && candidate.content && candidate.content.parts;

        if (hasParts) {
          const aiText = candidate.content.parts.map(part => part.text || "").join("");
          if (!aiText.trim()) throw new Error("Empty telemetry frame response.");

          setMessages(prev => {
            setStreamingIndex(prev.length);
            return [...prev, {
              role: "assistant",
              content: aiText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }];
          });
          speakText(aiText);
        } else {
          throw new Error("Invalid analytics payload structure.");
        }
      } catch (error) {
        console.error("Gemini Copilot Error:", error);
        toast.error(`B.E.R.R.Y. Uplink Breach: ${error.message}`);
        const fallbackText = generateLocalResponse(queryText);
        setMessages(prev => {
          setStreamingIndex(prev.length);
          return [...prev, {
            role: "assistant",
            content: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }];
        });
        speakText(fallbackText);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Local fallback mode after brief simulated latency
      setTimeout(() => {
        const responseText = generateLocalResponse(queryText);
        setMessages(prev => {
          setStreamingIndex(prev.length);
          return [...prev, {
            role: "assistant",
            content: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }];
        });
        setIsTyping(false);
        speakText(responseText);
      }, 700);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end font-sans">
      <style>{`
        @keyframes soundwave-bounce {
          0% { height: 4px; }
          100% { height: 16px; }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

      {/* Floating Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 35 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className={cn(
              "w-[370px] sm:w-[410px] h-[550px] mb-4 rounded-2xl border bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300",
              activeProtocol === "warrior" && "border-primary/20 shadow-primary/5",
              activeProtocol === "analytics" && "border-teal-500/20 shadow-teal-500/5",
              activeProtocol === "watchdog" && "border-rose-500/20 shadow-rose-500/5",
              activeProtocol === "technician" && "border-slate-800 shadow-slate-950/5"
            )}
            style={{
              boxShadow: `0 12px 50px -12px ${currentProtocol.glowColor}`
            }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "relative h-8.5 w-8.5 rounded-xl flex items-center justify-center border transition-all duration-300",
                  currentProtocol.colorClass
                )}>
                  {activeProtocol === "warrior" && <Sparkles size={16} className="text-primary animate-pulse" />}
                  {activeProtocol === "analytics" && <BarChart3 size={16} className="text-teal-400" />}
                  {activeProtocol === "watchdog" && <ShieldAlert size={16} className="text-rose-400 animate-bounce" style={{ animationDuration: "2s" }} />}
                  {activeProtocol === "technician" && <Wrench size={16} className="text-slate-400" />}
                  
                  <div className={cn("absolute inset-0 rounded-xl bg-current animate-ping opacity-5", 
                    activeProtocol === "warrior" && "bg-primary",
                    activeProtocol === "analytics" && "bg-teal-400",
                    activeProtocol === "watchdog" && "bg-rose-500",
                    activeProtocol === "technician" && "bg-slate-400"
                  )} style={{ animationDuration: "3s" }} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black tracking-widest text-white uppercase font-sans">
                      B.E.R.R.Y. Core
                    </h3>
                    <span className={cn(
                      "text-[8px] font-black tracking-widest px-2 py-0.5 border rounded-full font-mono scale-90",
                      activeProtocol === "warrior" && "text-primary border-primary/20 bg-primary/5",
                      activeProtocol === "analytics" && "text-teal-400 border-teal-500/20 bg-teal-500/5",
                      activeProtocol === "watchdog" && "text-rose-400 border-rose-500/20 bg-rose-500/5",
                      activeProtocol === "technician" && "text-slate-400 border-slate-800 bg-slate-900/5"
                    )}>
                      {apiKey ? "INTELLIGENT" : "LOCAL"}
                    </span>
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Bio-Efficiency Resource Yielder</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Dynamic Soundwave Visualizer */}
                {(isSpeaking || isTyping) && (
                  <div className="flex items-end gap-[2px] h-3.5 px-2 mr-1">
                    {[1, 2, 3, 4, 5].map((bar) => {
                      const delays = ["100ms", "300ms", "150ms", "400ms", "250ms"];
                      return (
                        <div
                          key={bar}
                          className={cn(
                            "w-[2px] rounded-full",
                            activeProtocol === "warrior" && "bg-primary",
                            activeProtocol === "analytics" && "bg-teal-400",
                            activeProtocol === "watchdog" && "bg-rose-500",
                            activeProtocol === "technician" && "bg-slate-400"
                          )}
                          style={{
                            height: "100%",
                            animation: `soundwave-bounce 0.65s ease-in-out infinite alternate`,
                            animationDelay: delays[bar - 1],
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                <button 
                  onClick={toggleMute}
                  title={isMuted ? "Awaken Voice Protocol" : "De-activate Voice Protocol"}
                  className={cn(
                    "p-1.5 rounded-lg border border-transparent transition-all hover:bg-white/5 cursor-pointer",
                    isMuted ? "text-gray-500 hover:text-gray-300" : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                  )}
                >
                  {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <button 
                  onClick={() => setShowKeyPrompt(!showKeyPrompt)}
                  title="Awaken System Key"
                  className={cn(
                    "p-1.5 rounded-lg border border-transparent transition-all hover:bg-white/5 cursor-pointer",
                    apiKey ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  <Key size={13} />
                </button>
                <button 
                  onClick={handleClearChat}
                  title="Reboot Terminal Sequence"
                  className="p-1.5 rounded-lg border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-transparent text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Protocol Switching Bar */}
            <div className="grid grid-cols-4 border-b border-white/5 bg-slate-950/40 p-1 gap-1 select-none">
              {PROTOCOLS.map(proto => {
                const isActive = activeProtocol === proto.id;
                return (
                  <button
                    key={proto.id}
                    onClick={() => handleProtocolChange(proto.id)}
                    className={cn(
                      "py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5",
                      isActive 
                        ? cn("border-white/10 text-white font-black", 
                            proto.id === "warrior" && "bg-primary/20",
                            proto.id === "analytics" && "bg-teal-500/20",
                            proto.id === "watchdog" && "bg-rose-500/20",
                            proto.id === "technician" && "bg-slate-500/20"
                          )
                        : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                    )}
                  >
                    <span className="text-xs shrink-0">{proto.icon}</span>
                    <span className="scale-90 font-mono tracking-tighter">{proto.name.split(" ")[1] || proto.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Body Frame Stack */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-900/10">
              
              {/* API Key Setup Screen */}
              <AnimatePresence>
                {showKeyPrompt && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute inset-x-0 top-0 p-4 bg-slate-950 border-b border-white/5 z-20 shadow-xl"
                  >
                    <h4 className="text-[11px] font-black tracking-wider text-white uppercase mb-1">Synchronize Google Gemini Engine</h4>
                    <p className="text-[9px] text-gray-400 mb-3 leading-relaxed">
                      Load your free Google Gemini API key below. You can generate a free key in 10 seconds at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google AI Studio</a>.
                    </p>
                    <form onSubmit={handleSaveKey} className="flex gap-2">
                      <input 
                        id="keyInput"
                        type="password"
                        placeholder={apiKey ? "••••••••••••••••" : "Paste AIzaSy... key"}
                        className="flex-1 bg-slate-900 border border-white/10 text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-primary placeholder-gray-600"
                      />
                      <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer">
                        Sync <ArrowRight size={12} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.002)_0%,transparent_80%)]">
                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div 
                      key={index} 
                      className={cn("flex gap-2.5", isUser && "flex-row-reverse")}
                    >
                      <div className={cn(
                        "h-7 w-7 rounded-lg shrink-0 flex items-center justify-center border transition-colors duration-300",
                        isUser 
                          ? "bg-slate-800 border-slate-700 text-slate-200" 
                          : cn("bg-slate-950 border-white/5", currentProtocol.accentColor)
                      )}>
                        {isUser ? <MessageSquare size={13} /> : <Bot size={13} />}
                      </div>
                      
                      <div className={cn("flex flex-col gap-1 max-w-[78%]", isUser && "items-end")}>
                        <div className={cn(
                          "p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm transition-all duration-300",
                          isUser
                            ? "bg-primary text-white rounded-tr-none font-medium"
                            : cn("rounded-tl-none border", currentProtocol.bubbleClass)
                        )}>
                          {msg.role === "assistant" ? (
                            index === streamingIndex ? (
                              <TypewriterMarkdown 
                                text={msg.content} 
                                onComplete={() => setStreamingIndex(null)} 
                              />
                            ) : (
                              <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(msg.content) }} />
                            )
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span className="text-[7.5px] text-gray-600 font-mono tracking-wider font-bold uppercase">{msg.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className={cn("h-7 w-7 rounded-lg border shrink-0 flex items-center justify-center animate-pulse bg-slate-950", currentProtocol.colorClass)}>
                      <Bot size={13} />
                    </div>
                    <div className={cn("p-3 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm h-[34px] border bg-slate-950", currentProtocol.bubbleClass)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full animate-bounce bg-current", currentProtocol.accentColor)} style={{ animationDelay: "0ms" }}></span>
                      <span className={cn("h-1.5 w-1.5 rounded-full animate-bounce bg-current", currentProtocol.accentColor)} style={{ animationDelay: "150ms" }}></span>
                      <span className={cn("h-1.5 w-1.5 rounded-full animate-bounce bg-current", currentProtocol.accentColor)} style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Directives Bar */}
              <div className="px-3 py-2 border-t border-white/5 bg-slate-950/40 overflow-x-auto scrollbar-none flex gap-1.5 shrink-0 select-none">
                {DIRECTIVES.map((d, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendDirective(d.query)}
                    className="px-2.5 py-1 bg-white/[0.02] border border-white/5 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg text-[8px] font-bold uppercase tracking-widest shrink-0 transition-all active:scale-95 cursor-pointer hover:border-white/10"
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Message Input Tray */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-slate-950/60 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="State your directive, Sir..."
                  className="flex-1 bg-slate-950 border border-white/5 text-[11px] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-white/10 placeholder-gray-600 font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={cn(
                    "h-9 w-9 text-white rounded-xl flex items-center justify-center transition-all shrink-0 border cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
                    activeProtocol === "warrior" && "bg-primary border-primary/20 hover:bg-primary/95",
                    activeProtocol === "analytics" && "bg-teal-600 border-teal-500/20 hover:bg-teal-550",
                    activeProtocol === "watchdog" && "bg-rose-600 border-rose-500/20 hover:bg-rose-550",
                    activeProtocol === "technician" && "bg-slate-700 border-slate-600 hover:bg-slate-655"
                  )}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button: Arc Reactor */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          cancelSpeech();
        }}
        className={cn(
          "h-14 w-14 rounded-2xl shadow-2xl text-white flex items-center justify-center relative overflow-hidden group border transition-all duration-300 cursor-pointer",
          activeProtocol === "warrior" && "from-[#080d1a] to-[#121c36] border-primary/40 shadow-primary/20",
          activeProtocol === "analytics" && "from-[#041a1a] to-[#083030] border-teal-500/40 shadow-teal-500/20",
          activeProtocol === "watchdog" && "from-[#29030a] to-[#540716] border-rose-500/40 shadow-rose-500/20",
          activeProtocol === "technician" && "from-[#090d16] to-[#151c2d] border-slate-700/40 shadow-slate-700/20",
          "bg-gradient-to-br"
        )}
        style={{
          boxShadow: `0 8px 30px ${currentProtocol.glowColor}`
        }}
        title="Command B.E.R.R.Y. AI"
      >
        {/* Arc Reactor Spinning Rings */}
        <div className="absolute inset-1 rounded-xl border border-dashed border-white/5 pointer-events-none" style={{ animation: "spin-slow 15s linear infinite" }} />
        <div className="absolute inset-2.5 rounded-lg border border-dotted border-white/5 pointer-events-none" style={{ animation: "spin-reverse-slow 10s linear infinite" }} />
        
        {/* Core highlight gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Reactor Core Icon */}
        <Sparkles size={20} className={cn("transition-all duration-300 group-hover:scale-105 z-10", 
          activeProtocol === "warrior" && "text-primary",
          activeProtocol === "analytics" && "text-teal-400",
          activeProtocol === "watchdog" && "text-rose-400 animate-pulse",
          activeProtocol === "technician" && "text-slate-400"
        )} />
        
        {/* Operational Pulse Indicator */}
        <div className={cn(
          "absolute -top-0.5 -right-0.5 h-3.5 w-3.5 border-2 rounded-full z-20",
          activeProtocol === "warrior" && "bg-emerald-500 border-indigo-950",
          activeProtocol === "analytics" && "bg-teal-400 border-teal-950",
          activeProtocol === "watchdog" && "bg-rose-500 border-rose-950 animate-pulse",
          activeProtocol === "technician" && "bg-slate-400 border-slate-950"
        )} />
      </motion.button>
    </div>
  );
}
