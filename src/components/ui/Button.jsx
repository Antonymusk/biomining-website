import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "md", children, ...props }) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold tracking-wider uppercase transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-40 disabled:pointer-events-none text-center select-none cursor-pointer active:scale-[0.97] group";
  
  const variants = {
    primary: "bg-blue-600/10 hover:bg-blue-600/18 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_2px_12px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.25)]",
    secondary: "bg-slate-900/40 hover:bg-slate-800/50 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    outline: "bg-transparent hover:bg-white/2 border border-white/5 hover:border-white/10 text-slate-400 hover:text-white",
    ghost: "text-slate-400 hover:text-white hover:bg-white/2 border border-transparent",
    danger: "bg-red-500/10 hover:bg-red-500/18 border border-red-500/20 hover:border-red-500/40 text-red-400 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.03),_0_2px_12px_rgba(239,68,68,0.05)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.15)]",
    success: "bg-emerald-500/10 hover:bg-emerald-500/18 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.03),_0_2px_12px_rgba(16,185,129,0.05)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
  };

  const sizes = {
    sm: "h-8 px-3 text-[10px] gap-1.5",
    md: "h-9 px-4 text-[11px] gap-2",
    lg: "h-10 px-5 text-xs gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
