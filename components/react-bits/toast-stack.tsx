"use client";

import { AnimatePresence, motion } from "framer-motion";

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "error" | "info";
};

const toneClasses: Record<ToastItem["tone"], string> = {
  success: "border-emerald-400/25 bg-emerald-500/14 text-emerald-50",
  error: "border-rose-400/25 bg-rose-500/14 text-rose-50",
  info: "border-sky-400/25 bg-sky-500/14 text-sky-50",
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 28, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto rounded-[1.4rem] border px-4 py-4 shadow-2xl shadow-black/30 backdrop-blur-xl ${toneClasses[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.02em]">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-6 text-white/78">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full border border-white/12 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
