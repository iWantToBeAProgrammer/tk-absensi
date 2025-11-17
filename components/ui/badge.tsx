import * as React from "react";

import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "secondary",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "secondary" }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700",
        variant === "default" &&
          "border-primary bg-primary text-primary-foreground",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
