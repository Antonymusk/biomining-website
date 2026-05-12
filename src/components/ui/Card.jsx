import { cn } from "../../lib/utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4.5 border border-white/5 transition-all duration-300 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.12),_0_8px_32px_rgba(0,0,0,0.4)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
