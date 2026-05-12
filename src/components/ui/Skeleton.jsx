import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "skeleton-shimmer-container rounded-md h-4 w-full",
        className
      )}
      {...props}
    />
  );
}
