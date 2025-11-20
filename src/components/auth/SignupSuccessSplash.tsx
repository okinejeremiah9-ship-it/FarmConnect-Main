import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";

interface SignupSuccessSplashProps {
  onComplete: () => Promise<void> | void;
}

export const SignupSuccessSplash: React.FC<SignupSuccessSplashProps> = ({
  onComplete,
}) => {
  useEffect(() => {
    const t = setTimeout(() => {
      void onComplete();
    }, 2200);

    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="text-center text-white max-w-md mx-auto"
      >
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 12,
          }}
          className="mb-8 relative"
        >
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>

          {/* Sparkles */}
          <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-4 animate-ping" />
          <Sparkles
            className="w-6 h-6 text-yellow-300 absolute top-10 -left-6 animate-ping"
            style={{ animationDelay: "0.4s" }}
          />
        </motion.div>

        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Signup Successful!
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-lg text-white/90"
        >
          Your account has been created.
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.7, ease: "easeInOut", delay: 0.3 }}
          className="h-1 bg-white/40 rounded-full mt-10 overflow-hidden"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.7, ease: "easeOut" }}
            className="h-full bg-white rounded-full"
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
