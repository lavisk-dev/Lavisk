"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavShell } from "@/components/layout/nav-shell";

interface NavbarProps {
  /** When true, the nav is hidden by default and slides in only after
   *  the user scrolls past `revealAtScrollY`. Used on the home page,
   *  where the hero already renders its own internal nav. */
  hideUntilScrolled?: boolean;
  revealAtScrollY?: number;
}

export function Navbar({ hideUntilScrolled = false, revealAtScrollY = 520 }: NavbarProps = {}) {
  const [visible, setVisible] = useState(!hideUntilScrolled);

  useEffect(() => {
    if (!hideUntilScrolled) return;
    const onScroll = () => setVisible(window.scrollY > revealAtScrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideUntilScrolled, revealAtScrollY]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          initial={hideUntilScrolled ? { y: -80, opacity: 0 } : { y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-bg/85 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-[1440px] px-5 py-4 md:px-8">
            <NavShell tone="solid" />
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
