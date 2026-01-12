import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Room, Player, Round, Clue, Vote, generateRoomCode } from '@/lib/supabase';
import { getRandomWord } from '@/lib/words';

interface GameContextType {
  room: Room | null;
  players: Player[];
  currentPlayer: Player | null;
  currentRound: Round | null;
  clues: Clue[];
  votes: Vote[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createRoom: (hostName: string, numPlayers: number, numImposters: number, categories: string[], imposterHint: boolean) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  startGame: () => Promise<void>;
  submitClue: (clueText: string) => Promise<void>;
  submitVote: (voteForId: string) => Promise<void>;
  submitImposterGuess: (guess: string) => Promise<boolean>;
  nextRound: () => Promise<void>;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to room changes
  useEffect(() => {
    if (!room?.id) return;

    const roomChannel = supabase
      .channel(`room:${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (payload) => {
        if (payload.new) {
          setRoom(payload.new as Room);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` }, async () => {
        const { data } = await supabase.from('players').select('*').eq('room_id', room.id).order('turn_order');
        if (data) setPlayers(data);
        if (currentPlayer) {
          const updated = data?.find(p => p.id === currentPlayer.id);
          if (updated) setCurrentPlayer(updated);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_id=eq.${room.id}` }, async () => {
        const { data } = await supabase.from('rounds').select('*').eq('room_id', room.id).order('round_number', { ascending: false }).limit(1);
        if (data?.[0]) setCurrentRound(data[0]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [room?.id, currentPlayer?.id]);

  // Polling fallback for players in lobby (in case Realtime is disabled)
  useEffect(() => {
    if (!room?.id || room.status !== 'waiting') return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('turn_order');
        
      if (data) {
        setPlayers(prev => {
          // Simple check to avoid unnecessary re-renders
          if (prev.length !== data.length || JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.id, room?.status]);

  // Subscribe to clues and votes when round changes
  useEffect(() => {
    if (!currentRound?.id) return;

    const roundChannel = supabase
      .channel(`round:${currentRound.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clues', filter: `round_id=eq.${currentRound.id}` }, async () => {
        const { data } = await supabase.from('clues').select('*').eq('round_id', currentRound.id).order('turn_order');
        if (data) setClues(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `round_id=eq.${currentRound.id}` }, async () => {
        const { data } = await supabase.from('votes').select('*').eq('round_id', currentRound.id);
        if (data) setVotes(data);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roundChannel);
    };
  }, [currentRound?.id]);

  const createRoom = async (hostName: string, numPlayers: number, numImposters: number, categories: string[], imposterHint: boolean): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const roomCode = generateRoomCode();
      const hostId = crypto.randomUUID();
      
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          host_id: hostId,
          room_code: roomCode,
          num_players: numPlayers,
          num_imposters: numImposters,
          category: categories,
          imposter_hint: imposterHint,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) throw roomError;
      
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          id: hostId, // Explicitly set ID to match room.host_id
          room_id: roomData.id,
          username: hostName,
          is_imposter: false,
          is_alive: true,
          score: 0,
          turn_order: 0
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Create game settings
      await supabase.from('game_settings').insert({
        room_id: roomData.id,
        clue_time_limit: 30,
        vote_time_limit: 20,
        max_rounds: 5
      });

      setRoom(roomData);
      setCurrentPlayer(playerData);
      setPlayers([playerData]);
      
      // Store player ID in localStorage for reconnection
      localStorage.setItem('playerId', playerData.id);
      localStorage.setItem('roomCode', roomCode);
      
      return roomCode;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomCode: string, playerName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (roomError || !roomData) {
        setError('Room not found');
        return false;
      }

      const { data: existingPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id);

      const turnOrder = existingPlayers?.length || 0;

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          username: playerName,
          is_imposter: false,
          is_alive: true,
          score: 0,
          turn_order: turnOrder
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom(roomData);
      setCurrentPlayer(playerData);
      setPlayers([...(existingPlayers || []), playerData]);
      
      localStorage.setItem('playerId', playerData.id);
      localStorage.setItem('roomCode', roomCode);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!room || !currentPlayer) return;
    
    try {
      // Get all players and shuffle them
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      
      // Assign imposters
      const imposterCount = Math.min(room.num_imposters, shuffledPlayers.length - 1);
      const imposterIds = shuffledPlayers.slice(0, imposterCount).map(p => p.id);
      
      // Get random word
      const { word, hint } = getRandomWord(room.category);
      
      // Update players with roles and words
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const player = shuffledPlayers[i];
        const isImposter = imposterIds.includes(player.id);
        
        await supabase
          .from('players')
          .update({
            is_imposter: isImposter,
            word: isImposter ? null : word,
            turn_order: i
          })
          .eq('id', player.id);
      }
      
      // Create round
      await supabase.from('rounds').insert({
        room_id: room.id,
        round_number: 1,
        secret_word: word,
        hint: room.imposter_hint ? hint : null
      });
      
      // Update room status
      await supabase
        .from('rooms')
        .update({ status: 'role_reveal', current_turn: 0 })
        .eq('id', room.id);
        
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitClue = async (clueText: string) => {
    if (!currentRound || !currentPlayer) return;
    
    try {
      await supabase.from('clues').insert({
        round_id: currentRound.id,
        player_id: currentPlayer.id,
        clue_text: clueText,
        turn_order: clues.length
      });
      
      // Move to next turn or voting phase
      const alivePlayers = players.filter(p => p.is_alive);
      const nextTurn = (room?.current_turn || 0) + 1;
      
      if (nextTurn >= alivePlayers.length) {
        await supabase.from('rooms').update({ status: 'voting', current_turn: 0 }).eq('id', room!.id);
      } else {
        await supabase.from('rooms').update({ current_turn: nextTurn }).eq('id', room!.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitVote = async (voteForId: string) => {
    if (!currentRound || !currentPlayer) return;
    
    try {
      await supabase.from('votes').insert({
        round_id: currentRound.id,
        voter_id: currentPlayer.id,
        vote_for_id: voteForId
      });
      
      // Check if all alive players have voted
      const alivePlayers = players.filter(p => p.is_alive);
      const { data: allVotes } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', currentRound.id);
      
      if ((allVotes?.length || 0) >= alivePlayers.length) {
        // Count votes and eliminate player with most votes
        const voteCounts: Record<string, number> = {};
        allVotes?.forEach(v => {
          voteCounts[v.vote_for_id] = (voteCounts[v.vote_for_id] || 0) + 1;
        });
        
        const maxVotes = Math.max(...Object.values(voteCounts));
        const eliminatedId = Object.entries(voteCounts).find(([_, count]) => count === maxVotes)?.[0];
        
        if (eliminatedId) {
          await supabase.from('players').update({ is_alive: false }).eq('id', eliminatedId);
          
          // Check if eliminated player was imposter
          const eliminatedPlayer = players.find(p => p.id === eliminatedId);
          const remainingImposters = players.filter(p => p.is_imposter && p.is_alive && p.id !== eliminatedId);
          
          if (remainingImposters.length === 0) {
            // All imposters eliminated - non-imposters win
            await supabase.from('rooms').update({ status: 'results' }).eq('id', room!.id);
          } else if (eliminatedPlayer?.is_imposter) {
            // Continue game with remaining imposter(s)
            await supabase.from('rooms').update({ status: 'imposter_guess' }).eq('id', room!.id);
          } else {
            // Non-imposter eliminated, imposter gets to guess
            await supabase.from('rooms').update({ status: 'imposter_guess' }).eq('id', room!.id);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitImposterGuess = async (guess: string): Promise<boolean> => {
    if (!currentRound) return false;
    
    const isCorrect = guess.toLowerCase().trim() === currentRound.secret_word.toLowerCase().trim();
    
    // Update scores
    if (isCorrect) {
      // Imposter wins - give points to imposters
      const imposters = players.filter(p => p.is_imposter);
      for (const imp of imposters) {
        await supabase.from('players').update({ score: imp.score + 3 }).eq('id', imp.id);
      }
    } else {
      // Non-imposters win
      const nonImposters = players.filter(p => !p.is_imposter);
      for (const player of nonImposters) {
        await supabase.from('players').update({ score: player.score + 2 }).eq('id', player.id);
      }
    }
    
    await supabase.from('rooms').update({ status: 'results' }).eq('id', room!.id);
    
    return isCorrect;
  };

  const nextRound = async () => {
    if (!room || !currentRound) return;
    
    const nextRoundNumber = currentRound.round_number + 1;
    const { word, hint } = getRandomWord(room.category);
    
    // Reset all players
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const imposterCount = Math.min(room.num_imposters, shuffledPlayers.length - 1);
    const imposterIds = shuffledPlayers.slice(0, imposterCount).map(p => p.id);
    
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      const isImposter = imposterIds.includes(player.id);
      
      await supabase
        .from('players')
        .update({
          is_imposter: isImposter,
          word: isImposter ? null : word,
          is_alive: true,
          turn_order: i
        })
        .eq('id', player.id);
    }
    
    // Create new round
    await supabase.from('rounds').insert({
      room_id: room.id,
      round_number: nextRoundNumber,
      secret_word: word,
      hint: room.imposter_hint ? hint : null
    });
    
    setClues([]);
    setVotes([]);
    
    await supabase.from('rooms').update({ status: 'role_reveal', current_turn: 0 }).eq('id', room.id);
  };

  const leaveRoom = () => {
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setCurrentRound(null);
    setClues([]);
    setVotes([]);
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomCode');
  };

  return (
    <GameContext.Provider value={{
      room,
      players,
      currentPlayer,
      currentRound,
      clues,
      votes,
      loading,
      error,
      createRoom,
      joinRoom,
      startGame,
      submitClue,
      submitVote,
      submitImposterGuess,
      nextRound,
      leaveRoom
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
