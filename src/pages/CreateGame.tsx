import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Skull, Lightbulb, Play, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '@/contexts/GameContext';
import { getAllCategories } from '@/lib/words';
import { cn } from '@/lib/utils';

export default function CreateGame() {
  const navigate = useNavigate();
  const { createRoom, loading, error } = useGame();
  
  const [hostName, setHostName] = useState('');
  const [numPlayers, setNumPlayers] = useState(4);
  const [numImposters, setNumImposters] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Objects', 'Places']);
  const [imposterHint, setImposterHint] = useState(true);
  const [clueTimeLimit, setClueTimeLimit] = useState(30);

  const categories = getAllCategories();

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleCreate = async () => {
    if (!hostName.trim()) return;
    if (selectedCategories.length === 0) return;
    
    try {
      const roomCode = await createRoom(
        hostName.trim(),
        numPlayers,
        numImposters,
        selectedCategories,
        imposterHint,
        clueTimeLimit
      );
      navigate(`/lobby/${roomCode}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className="min-h-screen animated-bg p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-gradient-primary">
            Create Game
          </h1>
        </motion.div>

        <div className="space-y-6">
          {/* Host Name */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="game-card"
          >
            <label className="block text-sm text-muted-foreground mb-2">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={20}
            />
          </motion.div>

          {/* Number of Players */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="game-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <label className="text-sm text-muted-foreground">Expected Players</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[3, 4, 5, 6, 7, 8, 10, 12].map(num => (
                <Button
                  key={num}
                  variant={numPlayers === num ? "default" : "muted"}
                  size="sm"
                  onClick={() => setNumPlayers(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Number of Imposters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="game-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <Skull className="w-5 h-5 text-accent" />
              <label className="text-sm text-muted-foreground">Number of Imposters</label>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(num => (
                <Button
                  key={num}
                  variant={numImposters === num ? "imposter" : "muted"}
                  size="sm"
                  onClick={() => setNumImposters(Math.min(num, numPlayers - 1))}
                  disabled={num >= numPlayers}
                >
                  {num}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="game-card"
          >
            <label className="block text-sm text-muted-foreground mb-3">Word Categories</label>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "muted"}
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="relative"
                >
                  {selectedCategories.includes(category) && (
                    <Check className="w-3 h-3 mr-1" />
                  )}
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Clue Time Limit */}
          {/* <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="game-card"
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-primary" />
              <label className="text-sm text-muted-foreground">Clue Time (seconds)</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[15, 20, 30, 45, 60, 90].map(time => (
                <Button
                  key={time}
                  variant={clueTimeLimit === time ? "default" : "muted"}
                  size="sm"
                  onClick={() => setClueTimeLimit(time)}
                >
                  {time}s
                </Button>
              ))}
            </div>
          </motion.div> */}

          {/* Imposter Hint Toggle */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="game-card"
          >
            <button
              onClick={() => setImposterHint(!imposterHint)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Lightbulb className={cn("w-5 h-5", imposterHint ? "text-warning" : "text-muted-foreground")} />
                <div className="text-left">
                  <p className="font-medium">Imposter Hint</p>
                  <p className="text-sm text-muted-foreground">
                    Give imposters a category hint
                  </p>
                </div>
              </div>
              <div className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                imposterHint ? "bg-warning" : "bg-muted"
              )}>
                <div className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-foreground transition-transform",
                  imposterHint ? "translate-x-6" : "translate-x-1"
                )} />
              </div>
            </button>
          </motion.div>

          {/* Error */}
          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          {/* Create Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={handleCreate}
              disabled={loading || !hostName.trim() || selectedCategories.length === 0}
            >
              <Play className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
