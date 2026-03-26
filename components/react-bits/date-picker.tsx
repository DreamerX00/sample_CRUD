"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => value.toString().padStart(2, "0");

const parseDateValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.includes("T") ? value : `${value}T00:00:00Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDateValue = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const monthKeyFromDate = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

const monthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const shiftMonth = (monthKey: string, offset: number) => {
  const [year, month] = monthKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + offset, 1));
  return monthKeyFromDate(next);
};

const buildMonthDays = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstDay.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: Array<{ value: string; day: number } | null> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      value: `${year}-${pad(month)}-${pad(day)}`,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

const todayValue = () => formatDateValue(new Date());

export function DatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const baseDate = parseDateValue(value) ?? new Date();
    return monthKeyFromDate(baseDate);
  });
  const [panelStyle, setPanelStyle] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    openUpward: boolean;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 12;
      const edgePadding = 12;
      const desiredWidth = Math.max(rect.width, 320);
      const width = Math.min(desiredWidth, viewportWidth - edgePadding * 2);
      const belowSpace = viewportHeight - rect.bottom - gap - edgePadding;
      const aboveSpace = rect.top - gap - edgePadding;
      const openUpward = belowSpace < 360 && aboveSpace > belowSpace;
      const availableHeight = Math.max(220, openUpward ? aboveSpace : belowSpace);

      let left = rect.left;
      if (left + width > viewportWidth - edgePadding) {
        left = viewportWidth - width - edgePadding;
      }
      if (left < edgePadding) {
        left = edgePadding;
      }

      const top = openUpward
        ? Math.max(edgePadding, rect.top - Math.min(380, availableHeight) - gap)
        : Math.min(rect.bottom + gap, viewportHeight - edgePadding - 220);

      setPanelStyle({
        left,
        top,
        width,
        maxHeight: Math.min(420, availableHeight),
        openUpward,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const parsedSelectedDate = parseDateValue(value);
  const displayValue = parsedSelectedDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsedSelectedDate)
    : "Pick a date";

  const calendarDays = buildMonthDays(visibleMonth);
  const today = todayValue();

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-left outline-none transition hover:border-sky-300 focus:border-sky-300"
      >
        <span className={`min-w-0 text-sm sm:text-base ${value ? "text-white" : "text-white/48"}`}>
          {displayValue}
        </span>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.26em] text-sky-200/70">Calendar</span>
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && panelStyle ? (
                <motion.div
                  initial={{ opacity: 0, y: panelStyle.openUpward ? 12 : -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: panelStyle.openUpward ? 12 : -12, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    left: panelStyle.left,
                    top: panelStyle.top,
                    width: panelStyle.width,
                    maxHeight: panelStyle.maxHeight,
                  }}
                  className="fixed z-[80] overflow-auto rounded-[1.75rem] border border-white/12 bg-slate-950/96 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/72 transition hover:bg-white/8"
                    >
                      Prev
                    </button>
                    <p className="text-center text-sm font-semibold tracking-[0.08em] text-white">
                      {monthLabel(visibleMonth)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/72 transition hover:bg-white/8"
                    >
                      Next
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="pb-1 text-center text-[11px] uppercase tracking-[0.24em] text-white/35">
                        {label}
                      </div>
                    ))}

                    {calendarDays.map((cell, index) =>
                      cell ? (
                        <button
                          key={cell.value}
                          type="button"
                          onClick={() => {
                            onChange(cell.value);
                            setOpen(false);
                          }}
                          className={`aspect-square min-h-10 rounded-2xl text-sm transition ${
                            value === cell.value
                              ? "bg-[linear-gradient(135deg,#fb923c,#38bdf8)] font-semibold text-slate-950"
                              : cell.value === today
                                ? "border border-sky-300/35 bg-sky-400/10 text-white"
                                : "bg-white/5 text-white/78 hover:bg-white/10"
                          }`}
                        >
                          {cell.day}
                        </button>
                      ) : (
                        <div key={`empty-${index}`} className="aspect-square min-h-10" />
                      ),
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onChange(today);
                        setVisibleMonth(monthKeyFromDate(new Date()));
                        setOpen(false);
                      }}
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/16"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange("");
                        setOpen(false);
                      }}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/68 transition hover:bg-white/8"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
