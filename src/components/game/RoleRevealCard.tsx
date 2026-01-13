import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Skull, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoleRevealCardProps {
  isImposter: boolean;
  word?: string;
  hint?: string;
  onContinue: () => void;
}

export function RoleRevealCard({ isImposter, word, hint, onContinue }: RoleRevealCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  const handleFlip = () => {
    if (!hasRevealed) {
      setIsFlipped(true);
      setHasRevealed(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4">
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground"
      >
        {!hasRevealed ? "Tap to reveal your role" : "Remember your role!"}
      </motion.p>

      {/* Flip Card */}
      <div 
        className="w-full aspect-[3/4] cursor-pointer perspective-1000"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <motion.div 
          className="w-full h-full relative"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Back */}
          <div 
            className="absolute inset-0 game-card flex flex-col items-center justify-center border-2 border-primary/30"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4"
            >
              <HelpCircle className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="font-display text-xl text-muted-foreground">TAP TO REVEAL</p>
          </div>

          {/* Card Front */}
          <div 
            className={cn(
              "absolute inset-0 game-card flex flex-col items-center justify-center border-2",
              isImposter ? "border-accent/50" : "border-primary/50"
            )}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center text-center p-6"
                >
                  {/* Role Icon */}
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-6",
                    isImposter 
                      ? "bg-accent/20 glow-accent" 
                      : "bg-primary/20 glow-primary"
                  )}>
                    {isImposter ? (
                      <Skull className="w-12 h-12 text-accent" />
                    ) : (
                      <Eye className="w-12 h-12 text-primary" />
                    )}
                  </div>

                  {/* Role Title */}
                  <h2 className={cn(
                    "font-display text-2xl md:text-3xl font-bold mb-4",
                    isImposter ? "text-accent glow-text-accent" : "text-primary glow-text-primary"
                  )}>
                    {isImposter ? "YOU ARE THE IMPOSTER" : "YOU ARE INNOCENT"}
                  </h2>

                  {/* Word or Hint */}
                  {isImposter ? (
                    hint && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Category Hint:</p>
                        <p className="text-xl font-semibold text-accent">{hint}</p>
                      </div>
                    )
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">The secret word is:</p>
                      <p className="text-3xl font-display font-bold text-primary glow-text-primary">
                        {word}
                      </p>
                    </div>
                  )}

                  {/* Instructions */}
                  <p className="text-sm text-muted-foreground mt-6 max-w-xs">
                    {isImposter 
                      ? "Blend in with your clues. Try to figure out the word!"
                      : "Give clues that are subtle but not too obvious!"
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Continue Button */}
      <AnimatePresence>
        {hasRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button 
              variant={isImposter ? "imposter" : "hero"} 
              size="lg"
              onClick={onContinue}
            >
              I'm Ready!
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
