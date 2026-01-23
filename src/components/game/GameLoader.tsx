import { motion } from "framer-motion";
import { Skull } from "lucide-react";

interface GameLoaderProps {
  message?: string;
}

export function GameLoader({ message = "Loading..." }: GameLoaderProps) {
  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center gap-6">
      {/* Animated skull with orbiting rings */}
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-[-20px] rounded-full border-2 border-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-[-10px] rounded-full border border-accent/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Orbiting dot */}
        <motion.div
          className="absolute inset-[-20px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary glow-primary" />
        </motion.div>
        
        {/* Center icon */}
        <motion.div
          className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Skull className="w-8 h-8 text-accent" />
          </motion.div>
        </motion.div>
      </div>

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <motion.p
          className="text-muted-foreground font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
      </motion.div>

      {/* Loading bar */}
      <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
      </div>
    </div>
  );
}
