import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimerBarProps {
  duration: number; // in seconds
  onComplete?: () => void;
  paused?: boolean;
  className?: string;
}

export function TimerBar({ duration, onComplete, paused = false, className }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const percentage = (timeLeft / duration) * 100;

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (paused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paused, onComplete, timeLeft]);

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
