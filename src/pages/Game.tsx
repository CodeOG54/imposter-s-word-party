import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Clock, Vote, Trophy, RotateCcw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerCard } from '@/components/game/PlayerCard';
import { RoleRevealCard } from '@/components/game/RoleRevealCard';
import { TimerBar } from '@/components/game/TimerBar';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type GamePhase = 'role_reveal' | 'clue_phase' | 'voting' | 'results';

export default function Game() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { 
    room, 
    players, 
    currentPlayer, 
    currentRound,
    clues,
    votes,
    isHost,
    submitClue,
    submitVote,
    nextRound,
    leaveRoom,
    startCluePhase,
    gameSettings,
    restartRound
  } = useGame();

  const [phase, setPhase] = useState<GamePhase>('role_reveal');
  const [hasRevealedRole, setHasRevealedRole] = useState(false);
  const [clueInput, setClueInput] = useState('');
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasSubmittedClue, setHasSubmittedClue] = useState(false);
  const [hasSubmittedVote, setHasSubmittedVote] = useState(false);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const [clueTimerKey, setClueTimerKey] = useState(0); // Key to reset clue timer for all players
  const [votingTimerKey, setVotingTimerKey] = useState(0); // Key to reset voting timer for all players

  // Sync phase with room status
  useEffect(() => {
    if (room?.status) {
      setPhase(room.status as GamePhase);
    }
  }, [room?.status]);

  // Reset states on new round or when phase changes
  useEffect(() => {
    if (currentRound) {
      setHasSubmittedClue(false);
      setHasSubmittedVote(false);
      setSelectedVote(null);
      setClueInput('');
      setHasRevealedRole(false);
      setShowTimeoutDialog(false);
      setVotingTimerKey(prev => prev + 1); // Reset voting timer for new round
    }
  }, [currentRound?.id]);

  // Reset timers when phase changes (sync all players)
  useEffect(() => {
    if (phase === 'voting') {
      setVotingTimerKey(prev => prev + 1);
    }
    if (phase === 'clue_phase') {
      setClueTimerKey(prev => prev + 1);
    }
  }, [phase]);

  // Close timeout dialog when phase changes (e.g., host restarted)
  useEffect(() => {
    if (phase === 'clue_phase' && clues.length === 0) {
      setShowTimeoutDialog(false);
    }
  }, [phase, clues.length]);

  const alivePlayers = players.filter(p => p.is_alive);
  const myClue = clues.find(c => c.player_id === currentPlayer?.id);
  const hasSubmittedMyClue = !!myClue;
  const myVote = votes.find(v => v.voter_id === currentPlayer?.id);
  const isImposter = currentPlayer?.is_imposter;

  const handleSubmitClue = async () => {
    if (!clueInput.trim()) return;
    await submitClue(clueInput.trim());
    setHasSubmittedClue(true);
    setClueInput('');
  };

  const handleSubmitVote = async () => {
    if (!selectedVote) return;
    await submitVote(selectedVote);
    setHasSubmittedVote(true);
  };

  const handleNextRound = async () => {
    await nextRound();
  };

  const handleGoHome = () => {
    leaveRoom();
    navigate('/');
  };

  // Calculate vote counts
  const voteCounts: Record<string, number> = {};
  votes.forEach(v => {
    voteCounts[v.vote_for_id] = (voteCounts[v.vote_for_id] || 0) + 1;
  });

  // Render different phases
  const renderPhase = () => {
    switch (phase) {
      case 'role_reveal':
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            {!hasRevealedRole ? (
              <RoleRevealCard
                isImposter={currentPlayer?.is_imposter || false}
                word={currentPlayer?.is_imposter ? undefined : currentPlayer?.word || undefined}
                hint={currentPlayer?.is_imposter && currentPlayer?.word ? currentPlayer.word : undefined}
                onContinue={() => setHasRevealedRole(true)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="animate-pulse-glow inline-block p-6 rounded-full bg-primary/10 mb-4">
                  <Clock className="w-12 h-12 text-primary" />
                </div>
                <h2 className="font-display text-xl mb-2">Role Revealed!</h2>
                <p className="text-muted-foreground mb-4">
                  Waiting for host to start clue phase...
                </p>
                {isHost && (
                  <Button variant="hero" size="lg" onClick={startCluePhase}>
                    Start Clue Phase
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        );

      case 'clue_phase':
        const clueTimeLimit = gameSettings?.clue_time_limit || 30;
        
        const handleClueTimeout = () => {
          // Show timeout dialog for everyone when time runs out
          if (!hasSubmittedMyClue) {
            setShowTimeoutDialog(true);
          }
        };
        
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Clue Phase</h2>
              <p className="text-muted-foreground">Give a subtle clue about the word!</p>
            </motion.div>

            {/* Clue input */}
            {!hasSubmittedMyClue ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="game-card text-center border-primary glow-primary"
              >
                <p className="text-primary font-semibold mb-2">Enter your clue!</p>
                <TimerBar 
                  key={clueTimerKey}
                  duration={clueTimeLimit} 
                  onComplete={() => {
                    if (clueInput.trim()) {
                      handleSubmitClue();
                    } else {
                      handleClueTimeout();
                    }
                  }} 
                />
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Enter your clue..."
                    value={clueInput}
                    onChange={(e) => setClueInput(e.target.value)}
                    maxLength={30}
                    disabled={hasSubmittedClue}
                    autoFocus
                  />
                  <Button 
                    onClick={handleSubmitClue}
                    disabled={!clueInput.trim() || hasSubmittedClue}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="game-card text-center"
              >
                <p className="text-muted-foreground mb-2">Waiting for others...</p>
                <p className="text-sm text-primary">
                  {clues.length} / {alivePlayers.length} clues submitted
                </p>
              </motion.div>
            )}

            {/* Submitted clues */}
            {clues.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Submitted clues:</p>
                {clues.map((clue, index) => {
                  const player = players.find(p => p.id === clue.player_id);
                  return (
                    <motion.div
                      key={clue.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <PlayerCard
                        username={player?.username || 'Unknown'}
                        clue={clue.clue_text}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'voting':
        const voteTimeLimit = gameSettings?.vote_time_limit || 20;
        
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="font-display text-2xl font-bold mb-2">
                <Vote className="w-6 h-6 inline mr-2" />
                Vote Phase
              </h2>
              <p className="text-muted-foreground">Who is the imposter?</p>
            </motion.div>

            {!hasSubmittedVote ? (
              <>
                <TimerBar 
                  key={votingTimerKey}
                  duration={voteTimeLimit} 
                  onComplete={() => {
                    if (selectedVote) {
                      handleSubmitVote();
                    }
                  }} 
                />
                
                <div className="space-y-3">
                  {alivePlayers
                    .filter(p => p.id !== currentPlayer?.id)
                    .map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <PlayerCard
                          username={player.username}
                          clue={clues.find(c => c.player_id === player.id)?.clue_text}
                          onVote={() => setSelectedVote(player.id)}
                          selected={selectedVote === player.id}
                        />
                      </motion.div>
                    ))}
                </div>

                <Button
                  variant="imposter"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitVote}
                  disabled={!selectedVote}
                >
                  Confirm Vote
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="animate-pulse-glow inline-block p-6 rounded-full bg-accent/10 mb-4">
                  <Vote className="w-12 h-12 text-accent" />
                </div>
                <p className="text-muted-foreground">
                  Waiting for other votes... ({votes.length}/{alivePlayers.length})
                </p>
              </motion.div>
            )}
          </div>
        );

      case 'results':
        const imposters = players.filter(p => p.is_imposter);
        // Innocents win if all imposters are eliminated (not alive)
        const innocentsWon = imposters.every(i => !i.is_alive);
        
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className={cn(
                "inline-block p-6 rounded-full mb-4",
                innocentsWon ? "bg-primary/20 glow-primary" : "bg-accent/20 glow-accent"
              )}>
                <Trophy className={cn(
                  "w-16 h-16",
                  innocentsWon ? "text-primary" : "text-accent"
                )} />
              </div>
              
              <h2 className={cn(
                "font-display text-3xl font-bold mb-2",
                innocentsWon ? "text-primary glow-text-primary" : "text-accent glow-text-accent"
              )}>
                {innocentsWon ? "INNOCENTS WIN!" : "IMPOSTER WINS!"}
              </h2>
            </motion.div>

            {/* Reveal info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="game-card"
            >
              <p className="text-muted-foreground mb-2">The secret word was:</p>
              <p className="font-display text-2xl text-primary glow-text-primary">
                {currentRound?.secret_word}
              </p>
            </motion.div>

            {/* Imposters reveal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                The imposter{imposters.length > 1 ? 's were' : ' was'}:
              </p>
              {imposters.map(imp => (
                <PlayerCard
                  key={imp.id}
                  username={imp.username}
                  isImposter
                  isRevealed
                />
              ))}
            </motion.div>

            {/* Scoreboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="game-card"
            >
              <p className="text-sm text-muted-foreground mb-3">Scoreboard</p>
              <div className="space-y-2">
                {players
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((player, index) => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 && "bg-warning text-warning-foreground",
                          index === 1 && "bg-muted text-muted-foreground",
                          index > 1 && "bg-secondary text-secondary-foreground"
                        )}>
                          {index + 1}
                        </span>
                        <span className={player.is_imposter ? "text-accent" : ""}>
                          {player.username}
                        </span>
                      </div>
                      <span className="font-display font-bold">{player.score || 0}</span>
                    </div>
                  ))}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3"
            >
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={handleGoHome}
              >
                <Home className="w-4 h-4" />
                Leave
              </Button>
              <Button
                variant="hero"
                size="lg"
                className="flex-1"
                onClick={handleNextRound}
              >
                <RotateCcw className="w-4 h-4" />
                Next Round
              </Button>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  const { loading } = useGame();

  if (loading || !room || !currentPlayer) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow inline-block mb-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Round indicator - removed role tag to preserve game secrecy */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-6"
        >
          <span className="text-sm text-muted-foreground">
            Round {currentRound?.round_number || 1}
          </span>
        </motion.div>
        
        {/* Out of Time Dialog */}
        <Dialog open={showTimeoutDialog} onOpenChange={(open) => {
          // Only allow closing via the button, not by clicking outside
          if (!open && isHost) setShowTimeoutDialog(false);
        }}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-accent">
                <AlertTriangle className="w-6 h-6" />
                Out of Time!
              </DialogTitle>
              <DialogDescription>
                {isHost 
                  ? "Time ran out before all clues were submitted. Restart the round to try again."
                  : "Time ran out! Waiting for the host to restart the round..."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-4">
              {isHost ? (
                <Button
                  variant="hero"
                  size="lg"
                  onClick={async () => {
                    setShowTimeoutDialog(false);
                    await restartRound();
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart Round
                </Button>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="animate-pulse mb-2">
                    <Clock className="w-8 h-8 mx-auto text-primary" />
                  </div>
                  <p>Waiting for host...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
