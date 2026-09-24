import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export function SheetContent({
  children,
  title,
  side = "right",
}: {
  children: ReactNode;
  title: string;
  side?: "right" | "bottom";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-bg/80" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 border-line bg-surface p-4",
          side === "right" && "inset-y-0 right-0 w-[min(100vw,360px)] border-l",
          side === "bottom" && "inset-x-0 bottom-0 max-h-[80vh] rounded-t-xl border-t",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <DialogPrimitive.Title className="font-display text-lg">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close className="rounded-sm p-1 text-muted hover:bg-raised">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
