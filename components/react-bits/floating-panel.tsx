"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type FloatingPanelProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function FloatingPanel({ children, className = "", delay = 0 }: FloatingPanelProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
