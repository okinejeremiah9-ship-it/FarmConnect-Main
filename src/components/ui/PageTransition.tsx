// Location: src/components/ui/PageTransition.tsx
// Purpose: Smooth animated transitions between all pages

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  keyId: string | number;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, keyId }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyId}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
