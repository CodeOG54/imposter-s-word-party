import { motion } from 'framer-motion';
import { User, Crown, Skull, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  username: string;
  isHost?: boolean;
  isImposter?: boolean;
  isAlive?: boolean;
  isCurrentTurn?: boolean;
  isRevealed?: boolean;
  votes?: number;
  showVotes?: boolean;
  onVote?: () => void;
  selected?: boolean;
  clue?: string;
}

export function PlayerCard({
  username,
  isHost = false,
  isImposter = false,
  isAlive = true,
  isCurrentTurn = false,
  isRevealed = false,
  votes = 0,
  showVotes = false,
  onVote,
  selected = false,
  clue
}: PlayerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: isRevealed && isImposter ? [1, 1.02, 1] : 1
      }}
      transition={isRevealed && isImposter ? {
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      } : undefined}
      whileHover={onVote && isAlive ? { scale: 1.03 } : undefined}
      whileTap={onVote && isAlive ? { scale: 0.97 } : undefined}
      onClick={onVote && isAlive ? onVote : undefined}
      className={cn(
        "player-card relative cursor-default transition-colors",
        !isAlive && "opacity-50",
        isCurrentTurn && "border-primary glow-primary",
        isRevealed && isImposter && "border-accent glow-accent imposter",
        onVote && isAlive && "cursor-pointer hover:border-primary/70",
        selected && "border-warning ring-2 ring-warning/50"
      )}
    >
      {/* Status badges */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {isHost && (
          <span className="bg-warning text-warning-foreground p-1 rounded-full">
            <Crown className="w-3 h-3" />
          </span>
        )}
        {!isAlive && (
          <span className="bg-destructive text-destructive-foreground p-1 rounded-full">
            <Skull className="w-3 h-3" />
          </span>
        )}
        {selected && (
          <span className="bg-warning text-warning-foreground p-1 rounded-full">
            <Check className="w-3 h-3" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isRevealed && isImposter 
            ? "bg-accent/20 text-accent" 
            : "bg-primary/20 text-primary"
        )}>
          <User className="w-5 h-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-semibold truncate",
            isRevealed && isImposter && "text-accent"
          )}>
            {username}
          </p>
          {clue && (
            <p className="text-sm text-muted-foreground truncate">"{clue}"</p>
          )}
          {isRevealed && isImposter && (
            <p className="text-xs text-accent font-medium">IMPOSTER</p>
          )}
        </div>

        {/* Votes */}
        {showVotes && votes > 0 && (
          <div className="bg-destructive/20 text-destructive px-2 py-1 rounded-full text-sm font-bold">
            {votes}
          </div>
        )}
      </div>

      {/* Current turn indicator */}
      {isCurrentTurn && (
        <motion.div
          layoutId="turn-indicator"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full glow-primary"
        />
      )}
    </motion.div>
  );
}
