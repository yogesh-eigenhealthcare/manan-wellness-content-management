"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

/**
 * Accessible native <dialog> wrapper using showModal(), closedby="any",
 * and a pointerdown/pointerup backdrop fallback for browsers lacking closedBy.
 */
export function ModalDialog({
  open,
  onClose,
  titleId,
  title,
  subtitle,
  maxWidthClass = "max-w-2xl",
  children,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Fallback light-dismiss when browser lacks HTMLDialogElement.prototype.closedBy
    let cleanupFallback: (() => void) | undefined;
    if (
      typeof HTMLDialogElement !== "undefined" &&
      !("closedBy" in HTMLDialogElement.prototype)
    ) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupFallback = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      cleanupFallback?.();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: "any" } as Record<string, string>)}
      className={`${maxWidthClass} w-[95vw] rounded-2xl shadow-2xl`}
    >
      {open ? (
        <div className="studio-surface flex max-h-[90dvh] flex-col overflow-hidden rounded-2xl border">
          <div className="studio-deep flex items-start justify-between gap-4 border-b px-5 py-4">
            <div className="min-w-0">
              <h1
                id={titleId}
                className="truncate text-base font-medium text-[var(--text-primary)]"
              >
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close dialog"
              className="studio-raised inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
