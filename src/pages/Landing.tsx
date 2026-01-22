import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Settings, ArrowRight, Sparkles } from 'lucide-react';
import { GameLogo } from '@/components/game/GameLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = () => {
    if (joinCode.trim().length >= 4) {
      navigate(`/join/${joinCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * -500],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <GameLogo />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 flex flex-col gap-4 w-full max-w-xs"
      >
        <Button 
          variant="hero" 
          size="xl" 
          onClick={() => navigate('/create')}
          className="w-full"
        >
          <Sparkles className="w-5 h-5" />
          Create Game
        </Button>

        {!showJoin ? (
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowJoin(true)}
            className="w-full"
          >
            <Users className="w-5 h-5" />
            Join Game
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col gap-3"
          >
            <Input
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-xl tracking-[0.3em] font-display uppercase"
              autoFocus
            />
            <Button 
              variant="default" 
              size="lg"
              onClick={handleJoin}
              disabled={joinCode.length < 4}
              className="w-full"
            >
              Join Room
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 text-muted-foreground text-sm"
      >
        A party game of deception. Created by <a href="https://github.com/kxngzero329" target="_blank" rel="noopener noreferrer">Mogamat Smith</a>.
      </motion.p>
    </div>
  );
}
