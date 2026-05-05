import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", size = "md", children, ...props }) {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "glass-button text-white hover:opacity-90 focus:ring-primary",
    secondary: "bg-dark-border text-white hover:bg-dark-border/80 focus:ring-dark-border",
    outline: "border border-dark-border text-white hover:bg-dark-border focus:ring-dark-border",
    ghost: "text-gray-300 hover:text-white hover:bg-dark-border focus:ring-dark-border",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg",
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
