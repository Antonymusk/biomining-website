import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, Bot, Key, ArrowRight, MessageSquare, RotateCcw, Swords } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabase";

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

// Construct dynamic J.A.R.V.I.S. Time-Aware and Quote Greeting
const getDynamicGreeting = () => {
  const hour = new Date().getHours();
  let timeWish = "Hello";
  if (hour < 12) timeWish = "Good morning";
  else if (hour < 17) timeWish = "Good afternoon";
  else timeWish = "Good evening";

  const randomQuote = WARRIOR_QUOTES[Math.floor(Math.random() * WARRIOR_QUOTES.length)];

  return `👋 ${timeWish}, Sir! Welcome back to the main operations deck. 
  
⚔️ **Operational Warcry**:
${randomQuote}

I am **B.E.R.R.Y.** (Bio-Efficiency Resource & Reporting Yielder). Real-time telemetry matrices are fully primed and awaiting your directive. Shall we begin, Sir?`;
};

// 🛠️ CHATGPT-STYLE ULTRA-CLEAN MARKDOWN PARSER
const parseMarkdownToHTML = (text) => {
  if (!text) return "";
  // Escaping basic user bracket markers to ensure rendering integrity
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Bold Tags (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');

  // 2. Section Headers (### or ##)
  html = html.replace(/^### (.*$)/gim, '<div class="text-[10px] font-black tracking-wider text-primary uppercase mt-3 mb-1">$1</div>');
  html = html.replace(/^## (.*$)/gim, '<div class="text-[11px] font-black tracking-wide text-white uppercase mt-4 mb-1.5 border-b border-white/5 pb-0.5">$1</div>');

  // 3. Custom Rich Bullet Points
  html = html.replace(/^\s*[-*•]\s+(.*)/gim, '<div class="flex items-start gap-2 my-1 pl-1"><span class="text-primary font-black text-[9px] mt-0.5">■</span><span class="text-gray-300 flex-1">$1</span></div>');

  return html;
};

// Word-by-word typewriter to simulate real-time ChatGPT / Gemini streaming speeds
function TypewriterMarkdown({ text, speed = 16, onComplete }) {
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
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: getDynamicGreeting(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("biomine_gemini_key") || "");
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
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-950 border border-amber-500/30 shadow-[0_10px_40px_rgba(245,158,11,0.1)] rounded-2xl pointer-events-auto flex flex-col p-4 relative group font-sans`}>
            <div className="flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="text-amber-500" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black tracking-wider text-amber-500 uppercase">B.E.R.R.Y. Core Broadcast</p>
                <p className="text-xs font-bold text-white mt-0.5">Efficiency Protocol Variance, Sir!</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Pardon the interruption, Sir, but current fuel ratio hasscaled to <strong>{efficiencyRatio.toFixed(3)} L/T</strong>, breaching the 0.60 ceiling. Suggesting tactical route adjustments.</p>
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

  // Fetch telemetry initially and when chat opens
  useEffect(() => {
    fetchLiveTelemetry();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLiveTelemetry();
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    const key = e.target.elements.keyInput.value.trim();
    if (key) {
      localStorage.setItem("biomine_gemini_key", key);
      setApiKey(key);
      setShowKeyPrompt(false);
      toast.success("B.E.R.R.Y. Core synchronized successfully!");
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: getDynamicGreeting(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  // Deterministic Smart Analytics Engine (Fallback if no API Key)
  const generateLocalAnalyticsResponse = (query) => {
    const lowercase = query.toLowerCase();
    if (lowercase.includes("fuel") || lowercase.includes("efficiency") || lowercase.includes("ratio")) {
      return `📊 **Fuel Efficiency Analysis**: Our current Live Ratio is ${telemetry.fuelEfficiency} L/T, Sir. Limit is 0.60 L/T. The numbers call for immediate engine idle controls.`;
    }
    if (lowercase.includes("truck") || lowercase.includes("fleet") || lowercase.includes("offline") || lowercase.includes("active")) {
      return `🚚 **Fleet Distribution**: We currently have ${telemetry.activeFleet} Active units deployed, Sir. ${telemetry.idleFleet} are idle and ${telemetry.maintenanceFleet} are in maintenance.`;
    }
    if (lowercase.includes("tonnage") || lowercase.includes("target") || lowercase.includes("disposal")) {
      return `🎯 **Tonnage Log**: The target is 350 Tons, Sir. We have cleared **${telemetry.todayDisposal} Tons** so far today. Let us conquer the rest.`;
    }
    if (lowercase.includes("hello") || lowercase.includes("hi") || lowercase.includes("hey")) {
      return "Hello, Sir! Ready to coordinate operations and analyze metrics on your command.";
    }
    
    return "🧠 **System Notice**: Local Mode engaged, Sir. \n\nTo fully awaken my analytical matrix, please click the **'🔑 Key'** icon above and load your **Free Google Gemini Key**.";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // If Gemini API Key is configured, call the real endpoint!
    if (apiKey) {
      try {
        // 1. Map conversation history into official Gemini multi-turn payload
        const apiHistory = messages.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }));
        
        // Append current message to the conversation stack
        apiHistory.push({
          role: "user",
          parts: [{ text: input }]
        });

        // 2. Cleanly isolate the JARVIS instructions and database telemetry from the conversation flow
        const systemText = `You are B.E.R.R.Y. (Bio-Efficiency Resource & Reporting Yielder), an elite operational intelligence AI modeled after Jarvis. Assist the supervisor with real-time metrics and logistics strategy.

        J.A.R.V.I.S. OPERATIONAL PROTOCOLS:
        1. HONORIFIC: You MUST address the user as "Sir" in every response (e.g. "Immediately, Sir", "The analysis is ready, Sir"). Keep a crisp, respectful, professional demeanor.
        2. HUMOR & FRANKNESS: Interject occasional dry corporate wit. Do not sugarcoat lagged metrics. If we are behind, label it a "variance" and offer a direct plan of attack to conquer it.
        3. READABILITY: Always provide comprehensive answers. Format metrics using bold text and markdown lists so they are highly visual and organized. Never cut answers short.

        REAL-TIME PLATFORM TELEMETRY (Directly from Supabase Database):
        - Total Disposal Today: ${telemetry.todayDisposal} Tons (Directive Objective: 350 Tons)
        - Site Fuel Efficiency: ${telemetry.fuelEfficiency} Liters/Ton (Benchmark Ceiling: 0.60 L/T)
        - Active Fleet Units: ${telemetry.activeFleet} Trucks Deployed
        - Standby/Idle Units: ${telemetry.idleFleet} Idle
        - Units in Overhaul: ${telemetry.maintenanceFleet} Maintenance
        - High-Priority Incident Alerts: ${telemetry.systemAlerts} Alerts

        CONTEXT:
        - User: ${user?.name || "Sir"} (${user?.role || "Supervisor"})
        - Date: May 13, 2026`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemText }]
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
          throw new Error(errorData.error?.message || `HTTP ${response.status}: Connection Failed`);
        }

        const data = await response.json();
        
        const candidate = data.candidates && data.candidates[0];
        const hasParts = candidate && candidate.content && candidate.content.parts;

        if (hasParts) {
          // Combine all text parts to prevent early truncation on multipart markdown blocks
          const aiText = candidate.content.parts.map(part => part.text || "").join("");
          
          if (!aiText.trim()) {
            throw new Error("Synchronized response contained an empty matrix body.");
          }

          setMessages(prev => {
            setStreamingIndex(prev.length);
            return [...prev, {
              role: "assistant",
              content: aiText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }];
          });
        } else {
          throw new Error("Malformed matrix response received.");
        }
      } catch (error) {
        console.error("Gemini Fetch Error:", error);
        toast.error(`B.E.R.R.Y. Matrix Exception: ${error.message}`);
        const fallbackText = generateLocalAnalyticsResponse(userMsg.content);
        setMessages(prev => {
          setStreamingIndex(prev.length);
          return [...prev, {
            role: "assistant",
            content: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }];
        });
      } finally {
        setIsTyping(false);
      }
    } else {
      setTimeout(() => {
        const responseText = generateLocalAnalyticsResponse(userMsg.content);
        setMessages(prev => {
          setStreamingIndex(prev.length);
          return [...prev, {
            role: "assistant",
            content: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }];
        });
        setIsTyping(false);
      }, 800);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end font-sans">
      
      {/* Floating Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-[360px] sm:w-[400px] h-[520px] mb-4 rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col ai-copilot-window"
          >
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-accent/5 flex items-center justify-between shrink-0 ai-header">
              <div className="flex items-center gap-2.5">
                <div className="relative h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary animate-pulse" />
                  <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping opacity-20" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1">
                    B.E.R.R.Y. Core
                    <span className="text-[8px] px-1.5 py-0.5 bg-primary/20 border border-primary/30 text-primary rounded-full font-mono">
                      {apiKey ? "CLOUDBURST" : "LOCAL"}
                    </span>
                  </h3>
                  <p className="text-[9px] text-gray-400 mt-0.5">Bio-Efficiency Resource Yielder</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowKeyPrompt(!showKeyPrompt)}
                  title="Synchronize System Key"
                  className={`p-1.5 rounded-lg border border-white/5 transition-all hover:bg-white/10 ${apiKey ? 'text-emerald-400' : 'text-gray-400'}`}
                >
                  <Key size={13} />
                </button>
                <button 
                  onClick={handleClearChat}
                  title="Reboot Core Sequence"
                  className="p-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <RotateCcw size={13} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Body Frame Stack */}
            <div className="flex-1 relative flex flex-col overflow-hidden bg-slate-900/30 ai-messages-box">
              
              {/* API Key Setup Screen */}
              <AnimatePresence>
                {showKeyPrompt && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-x-0 top-0 p-4 bg-slate-950 border-b border-white/10 z-20 shadow-lg"
                  >
                    <h4 className="text-[11px] font-bold text-white mb-1">Awaken Live Gemini Analytics Core</h4>
                    <p className="text-[9px] text-gray-400 mb-3 leading-relaxed">
                      Paste your free Google Gemini key below. Generated in 10 seconds at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                    </p>
                    <form onSubmit={handleSaveKey} className="flex gap-2">
                      <input 
                        id="keyInput"
                        type="password"
                        placeholder={apiKey ? "••••••••••••••••" : "AIzaSy..."}
                        className="flex-1 bg-slate-900/80 border border-white/10 text-xs text-white px-3 py-2 rounded-lg focus:outline-none focus:border-primary"
                      />
                      <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        Save <ArrowRight size={12} />
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center border ${
                      msg.role === "user" 
                        ? "bg-slate-800 border-slate-700 text-slate-200" 
                        : "bg-primary/10 border-primary/20 text-primary"
                    }`}>
                      {msg.role === "user" ? <MessageSquare size={13} /> : <Bot size={13} />}
                    </div>
                    <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : ""}`}>
                      <div className={`p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line shadow-sm ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-tr-none font-medium"
                          : "bg-slate-950 border border-white/5 text-gray-200 rounded-tl-none ai-bubble-bot"
                      }`}>
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
                      <span className="text-[8px] text-gray-500 font-mono">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 border-primary/20 text-primary shrink-0 flex items-center justify-center animate-pulse">
                      <Bot size={13} />
                    </div>
                    <div className="p-3 bg-slate-950 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-sm h-[34px] ai-bubble-bot">
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Tray */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-slate-950/50 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="State your directive, Sir..."
                  className="flex-1 bg-slate-950 border border-white/10 text-[11px] text-white px-3 py-2.5 rounded-xl focus:outline-none focus:border-primary placeholder-gray-500 ai-input-field"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-9 w-9 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-all shrink-0 border border-primary/20"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-gradient-to-br from-primary to-[#3f51b5] border border-white/20 rounded-2xl shadow-[0_8px_30px_rgb(94,53,177,0.3)] hover:shadow-[0_12px_35px_rgb(94,53,177,0.5)] text-white flex items-center justify-center relative overflow-hidden group"
        title="Command B.E.R.R.Y."
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        <Sparkles size={22} className="transition-transform duration-300 group-hover:rotate-12" />
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-dark-bg rounded-full animate-pulse" />
      </motion.button>

    </div>
  );
}

