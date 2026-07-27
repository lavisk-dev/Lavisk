"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { revealUp, viewportOnce } from "@/lib/utils/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const MotionDiv = motion.div;

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <MotionDiv
      className={className}
      variants={revealUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      transition={{ delay }}
    >
      {children}
    </MotionDiv>
  );
}
