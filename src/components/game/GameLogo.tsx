import { motion } from 'framer-motion';
import { MessageCircleQuestion, Users, Sparkles } from 'lucide-react';

interface GameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function GameLogo({ size = 'lg', animate = true }: GameLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl md:text-7xl'
  };

  const iconSizes = {
    sm: 24,
    md: 36,
    lg: 48
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center gap-4"
    >
      {/* Logo Icon */}
      <motion.div
        initial={animate ? { scale: 0, rotate: -180 } : false}
        animate={animate ? { scale: 1, rotate: 0 } : false}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
        className="relative"
      >
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          {/* Outer ring */}
          <motion.div
            animate={animate ? { rotate: 360 } : false}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
          />
          
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl" />
          
          {/* Center icon container */}
          <div className="absolute inset-4 rounded-full bg-card border-2 border-primary/50 flex items-center justify-center glow-primary">
            <motion.div
              animate={animate ? { 
                scale: [1, 1.1, 1],
              } : false}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MessageCircleQuestion className="w-10 h-10 md:w-14 md:h-14 text-primary" />
            </motion.div>
          </div>
          
          {/* Orbiting elements */}
          <motion.div
            animate={animate ? { rotate: -360 } : false}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Title */}
      <div className="text-center">
        <motion.h1
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`font-display font-bold ${sizeClasses[size]} tracking-wider`}
        >
          <span className="text-gradient-primary">WORD</span>
          <br />
          <span className="text-gradient-accent">IMPOSTER</span>
        </motion.h1>
        
        <motion.p
          initial={animate ? { opacity: 0 } : false}
          animate={animate ? { opacity: 1 } : false}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-muted-foreground mt-2 text-sm md:text-base tracking-wide"
        >
          Blend in. Deceive. Survive.
        </motion.p>
      </div>
    </motion.div>
  );
}
