import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Users, Play, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerCard } from '@/components/game/PlayerCard';
import { useGame } from '@/contexts/GameContext';
import { supabase } from '@/lib/supabase';

export default function Lobby() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { room, players, currentPlayer, joinRoom, startGame, loading, error } = useGame();
  
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Check if already in room
  useEffect(() => {
    const checkExistingSession = async () => {
      const storedPlayerId = localStorage.getItem('playerId');
      const storedRoomCode = localStorage.getItem('roomCode');
      
      if (storedPlayerId && storedRoomCode === roomCode) {
        // Reconnect to existing session
        const { data: playerData } = await supabase
          .from('players')
          .select('*, rooms(*)')
          .eq('id', storedPlayerId)
          .single();
          
        if (playerData) {
          setHasJoined(true);
        }
      }
    };
    
    checkExistingSession();
  }, [roomCode]);

  // Navigate when game starts
  useEffect(() => {
    if (room?.status === 'role_reveal') {
      navigate(`/game/${roomCode}`);
    }
  }, [room?.status, roomCode, navigate]);

  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode) return;
    
    setJoining(true);
    const success = await joinRoom(roomCode, playerName.trim());
    if (success) {
      setHasJoined(true);
    }
    setJoining(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = currentPlayer?.id && room?.host_id === currentPlayer.id;
  const canStart = players.length >= 3 && isHost;

  // Show join form if not joined yet
  if (!hasJoined && !room) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-card w-full max-w-sm"
        >
          <h1 className="font-display text-2xl font-bold text-center mb-2">
            Join Game
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            Room: <span className="text-primary font-mono">{roomCode}</span>
          </p>
          
          <div className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            
            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}
            
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={joining || !playerName.trim()}
            >
              {joining ? 'Joining...' : 'Join Room'}
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">Game Lobby</h1>
          <div className="w-10" />
        </motion.div>

        {/* Room Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-card mb-6"
        >
          <p className="text-sm text-muted-foreground mb-2 text-center">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-3xl tracking-[0.3em] text-primary glow-text-primary">
              {roomCode}
            </span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Share this code with your friends to join!
          </p>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold">Players ({players.length})</span>
            {room && (
              <span className="text-sm text-muted-foreground">
                / {room.num_players} expected
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <PlayerCard
                  username={player.username}
                  isHost={player.id === room?.host_id}
                />
              </motion.div>
            ))}
            
            {/* Waiting for players */}
            {players.length < 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <div className="animate-bounce-subtle inline-block">
                  <Users className="w-8 h-8 mb-2 mx-auto opacity-50" />
                </div>
                <p>Waiting for more players...</p>
                <p className="text-sm">Need at least 3 players to start</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Game Settings Summary */}
        {room && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="game-card mb-6"
          >
            <p className="text-sm text-muted-foreground mb-2">Game Settings</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                {room.num_imposters} Imposter{room.num_imposters > 1 ? 's' : ''}
              </span>
              {room.imposter_hint && (
                <span className="px-3 py-1 bg-warning/20 text-warning rounded-full text-sm">
                  Hints On
                </span>
              )}
              {room.category.slice(0, 3).map(cat => (
                <span key={cat} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                  {cat}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Start Game Button (Host Only) */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={startGame}
              disabled={!canStart || loading}
            >
              <Play className="w-5 h-5" />
              {loading ? 'Starting...' : 'Start Game'}
            </Button>
            {!canStart && players.length < 3 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Need at least 3 players to start
              </p>
            )}
          </motion.div>
        )}

        {/* Waiting message for non-hosts */}
        {!isHost && hasJoined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="animate-pulse-glow inline-block p-4 rounded-full bg-primary/10 mb-3">
              <Crown className="w-8 h-8 text-warning" />
            </div>
            <p className="text-muted-foreground">Waiting for host to start the game...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
