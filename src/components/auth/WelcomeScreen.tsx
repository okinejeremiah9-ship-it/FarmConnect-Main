import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Tractor, Users, Shield, ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  user: {
    name: string;
    phone: string;
    role: "farmer" | "provider" | "admin";
  };
  onComplete: () => Promise<void> | void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  user,
  onComplete,
}) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "farmer":
        return {
          icon: Tractor,
          title: "Welcome to FarmConnect!",
          subtitle: "Your farming journey starts here",
          description:
            "Connect with trusted service providers, rent equipment, and grow your farm with confidence.",
          color: "green",
          bgGradient: "from-green-400 to-blue-500",
          features: [
            "Browse verified service providers",
            "Secure escrow payments",
            "GPS-tracked equipment",
            "Real-time service monitoring",
          ],
        };
      case "provider":
        return {
          icon: Users,
          title: "Welcome, Service Provider!",
          subtitle: "Ready to serve farmers in your area",
          description:
            "List your services, connect with farmers, and grow your business on our trusted platform.",
          color: "blue",
          bgGradient: "from-blue-400 to-purple-500",
          features: [
            "List your services and equipment",
            "Reach farmers in your area",
            "Secure payment processing",
            "Build your reputation",
          ],
        };
      case "admin":
        return {
          icon: Shield,
          title: "Welcome, Administrator!",
          subtitle: "Platform management at your fingertips",
          description:
            "Oversee platform operations, manage users, and ensure smooth service delivery.",
          color: "purple",
          bgGradient: "from-purple-400 to-pink-500",
          features: [
            "Monitor platform activity",
            "Manage user accounts",
            "Resolve disputes",
            "Generate reports",
          ],
        };
      default:
        return {
          icon: Tractor,
          title: "Welcome!",
          subtitle: "Let's get started",
          description: "Welcome to FarmConnect platform.",
          color: "gray",
          bgGradient: "from-gray-400 to-gray-600",
          features: [],
        };
    }
  };

  const config = getRoleConfig(user.role);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen bg-gradient-to-br ${config.bgGradient} flex items-center justify-center p-4`}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 md:p-12"
      >
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-8"
        >
          <div
            className={`w-20 h-20 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            <Icon className={`w-10 h-10 text-${config.color}-600`} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>

          <p className="text-xl text-gray-600 mb-4">
            Hello, {user.name}!
          </p>

          <p className="text-lg text-gray-500">{config.subtitle}</p>
        </motion.div>

        {/* DESCRIPTION */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <p className="text-gray-700 text-center leading-relaxed">
            {config.description}
          </p>
        </motion.div>

        {/* FEATURES */}
        {config.features.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              What you can do:
            </h3>

            <div className="grid md:grid-cols-2 gap-3">
              {config.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -15, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center space-x-3"
                >
                  <div
                    className={`w-2 h-2 bg-${config.color}-500 rounded-full flex-shrink-0`}
                  ></div>
                  <span className="text-gray-700 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PHONE INFO */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-gray-50 rounded-lg p-4 mb-8"
        >
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Registered Phone</p>
            <p className="font-mono text-gray-900 font-medium">{user.phone}</p>
          </div>
        </motion.div>

        {/* BUTTON */}
        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          onClick={() => void onComplete()}
          className={`w-full bg-${config.color}-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-${config.color}-700 transition-colors flex items-center justify-center group`}
        >
          Continue to Dashboard
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
