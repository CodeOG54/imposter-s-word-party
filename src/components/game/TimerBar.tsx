import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimerBarProps {
  duration: number; // in seconds
  onComplete?: () => void;
  paused?: boolean;
  className?: string;
}

export function TimerBar({ duration, onComplete, paused = false, className }: TimerBarProps) {
  // Initialize with duration - this runs on every mount (when key changes)
  const [timeLeft, setTimeLeft] = useState(() => duration);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  const initializedRef = useRef(false);
  
  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset everything on mount - this ensures fresh state when key changes
  useEffect(() => {
    setTimeLeft(duration);
    hasCompletedRef.current = false;
    initializedRef.current = true;
    
    return () => {
      initializedRef.current = false;
    };
  }, []); // Only run on mount/unmount

  // Timer countdown effect
  useEffect(() => {
    if (paused || !initializedRef.current) return;
    
    if (timeLeft <= 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      // Delay callback to avoid state conflicts
      setTimeout(() => onCompleteRef.current?.(), 50);
      return;
    }

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            setTimeout(() => onCompleteRef.current?.(), 50);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paused, timeLeft]);

  const percentage = (timeLeft / duration) * 100;

  const getColor = () => {
    if (percentage > 50) return 'bg-primary';
    if (percentage > 25) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">Time remaining</span>
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={cn(
            "text-lg font-display font-bold",
            percentage > 50 && "text-primary",
            percentage <= 50 && percentage > 25 && "text-warning",
            percentage <= 25 && "text-destructive"
          )}
        >
          {timeLeft}s
        </motion.span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors duration-500", getColor())}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
