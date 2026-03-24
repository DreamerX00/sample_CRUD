"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (value: number) => value.toString().padStart(2, "0");

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
    const baseDate = value ? new Date(`${value}T00:00:00Z`) : new Date();
    return monthKeyFromDate(baseDate);
  });
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  const displayValue = value
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value}T00:00:00Z`))
    : "Pick a date";

  const calendarDays = buildMonthDays(visibleMonth);
  const today = todayValue();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-left outline-none transition hover:border-sky-300 focus:border-sky-300"
      >
        <span className={value ? "text-white" : "text-white/48"}>{displayValue}</span>
        <span className="text-xs uppercase tracking-[0.26em] text-sky-200/70">Calendar</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-[calc(100%+0.75rem)] z-30 w-full min-w-[18rem] rounded-[1.75rem] border border-white/12 bg-slate-950/96 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => (current ? shiftMonth(current, -1) : current))}
                className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/72 transition hover:bg-white/8"
              >
                Prev
              </button>
              <p className="text-sm font-semibold tracking-[0.08em] text-white">{monthLabel(visibleMonth)}</p>
              <button
                type="button"
                onClick={() => setVisibleMonth((current) => (current ? shiftMonth(current, 1) : current))}
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
                    className={`aspect-square rounded-2xl text-sm transition ${
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
                  <div key={`empty-${index}`} className="aspect-square" />
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
      </AnimatePresence>
    </div>
  );
}
