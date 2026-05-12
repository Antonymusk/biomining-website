import { cn } from "../../lib/utils";

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-white/5 bg-slate-950/40 backdrop-blur-md">
      <table className={cn("w-full caption-bottom text-xs", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("[&_tr]:border-b border-white/5 bg-slate-950/20", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        "border-b border-white/5 transition-colors hover:bg-white/2 data-[state=selected]:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "h-8 px-3 text-left align-middle font-semibold text-slate-500 text-[10px] uppercase tracking-wider [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn("p-2 px-3 align-middle text-slate-300 tracking-wide [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  );
}
