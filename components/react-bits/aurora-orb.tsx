"use client";

import { motion } from "framer-motion";

type AuroraOrbProps = {
  className: string;
  delay?: number;
};

export function AuroraOrb({ className, delay = 0 }: AuroraOrbProps) {
  return (
    <motion.div
      aria-hidden
      className={className}
      animate={{
        x: [0, 24, -18, 0],
        y: [0, -32, 18, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{
        duration: 16,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}
