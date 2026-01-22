import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Room, Player, Round, Clue, Vote, GameSettings, generateRoomCode } from '@/lib/supabase';
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
  isHost: boolean;
  gameSettings: GameSettings | null;
  phaseStartTime: number | null;
  
  // Actions
  createRoom: (hostName: string, numPlayers: number, numImposters: number, categories: string[], imposterHint: boolean, clueTimeLimit?: number) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  startGame: () => Promise<void>;
  startCluePhase: () => Promise<void>;
  startVotingPhase: () => Promise<void>;
  submitClue: (clueText: string) => Promise<void>;
  submitVote: (voteForId: string) => Promise<void>;
  nextRound: () => Promise<void>;
  leaveRoom: () => void;
  restartRound: () => Promise<void>;
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
  const [sessionRestored, setSessionRestored] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const playerId = localStorage.getItem('playerId');
      const roomCode = localStorage.getItem('roomCode');
      
      if (!playerId || !roomCode) {
        setSessionRestored(true);
        return;
      }

      try {
        // Fetch player
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', playerId)
          .single();

        if (playerError || !playerData) {
          // Player not found, clear localStorage
          localStorage.removeItem('playerId');
          localStorage.removeItem('roomCode');
          setSessionRestored(true);
          return;
        }

        // Fetch room
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', playerData.room_id)
          .single();

        if (roomError || !roomData) {
          localStorage.removeItem('playerId');
          localStorage.removeItem('roomCode');
          setSessionRestored(true);
          return;
        }

        // Fetch all players in room
        const { data: playersData } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData.id)
          .order('turn_order');

        // Fetch current round
        const { data: roundData } = await supabase
          .from('rounds')
          .select('*')
          .eq('room_id', roomData.id)
          .order('round_number', { ascending: false })
          .limit(1);

        setRoom(roomData);
        setCurrentPlayer(playerData);
        setPlayers(playersData || []);
        if (roundData?.[0]) {
          setCurrentRound(roundData[0]);
        }
        
        // Fetch game settings
        const { data: settingsData } = await supabase
          .from('game_settings')
          .select('*')
          .eq('room_id', roomData.id)
          .single();
        if (settingsData) {
          setGameSettings(settingsData);
        }
      } catch (err) {
        console.error('Session restore error:', err);
        localStorage.removeItem('playerId');
        localStorage.removeItem('roomCode');
      } finally {
        setSessionRestored(true);
      }
    };

    restoreSession();
  }, []);

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

  // Polling fallback for game state sync
  useEffect(() => {
    if (!room?.id) return;

    const interval = setInterval(async () => {
      // Fetch players
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('turn_order');
        
      if (playersData) {
        setPlayers(prev => {
          if (prev.length !== playersData.length || JSON.stringify(prev) !== JSON.stringify(playersData)) {
            return playersData;
          }
          return prev;
        });
        
        // Update current player data
        if (currentPlayer) {
          const updated = playersData.find(p => p.id === currentPlayer.id);
          if (updated && JSON.stringify(updated) !== JSON.stringify(currentPlayer)) {
            setCurrentPlayer(updated);
          }
        }
      }

      // Fetch room status
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', room.id)
        .single();
      
      if (roomData && JSON.stringify(roomData) !== JSON.stringify(room)) {
        setRoom(roomData);
      }

      // Fetch current round
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*')
        .eq('room_id', room.id)
        .order('round_number', { ascending: false })
        .limit(1);
      
      if (roundData?.[0] && (!currentRound || roundData[0].id !== currentRound.id)) {
        setCurrentRound(roundData[0]);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [room?.id, room?.status, currentPlayer?.id, currentRound?.id]);

  // Subscribe to clues and votes when round changes + polling fallback
  useEffect(() => {
    if (!currentRound?.id) return;

    // Initial fetch
    const fetchCluesAndVotes = async () => {
      const { data: cluesData } = await supabase
        .from('clues')
        .select('*')
        .eq('round_id', currentRound.id)
        .order('turn_order');
      if (cluesData) setClues(cluesData);

      const { data: votesData } = await supabase
        .from('votes')
        .select('*')
        .eq('round_id', currentRound.id);
      if (votesData) setVotes(votesData);
    };

    fetchCluesAndVotes();

    // Polling for clues and votes
    const interval = setInterval(fetchCluesAndVotes, 1500);

    const roundChannel = supabase
      .channel(`round:${currentRound.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clues', filter: `round_id=eq.${currentRound.id}` }, fetchCluesAndVotes)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `round_id=eq.${currentRound.id}` }, fetchCluesAndVotes)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(roundChannel);
    };
  }, [currentRound?.id]);

  const createRoom = async (hostName: string, numPlayers: number, numImposters: number, categories: string[], imposterHint: boolean, clueTimeLimit: number = 30): Promise<string> => {
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
          is_alive: true
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Create game settings with custom clue time
      const { data: settingsData } = await supabase.from('game_settings').insert({
        room_id: roomData.id,
        clue_time_limit: clueTimeLimit,
        vote_time_limit: 20,
        max_rounds: 5
      }).select().single();
      
      if (settingsData) {
        setGameSettings(settingsData);
      }

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
          is_alive: true
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
        
        // If imposter hint is enabled, give imposters the hint, otherwise null
        const imposterWord = room.imposter_hint ? hint : null;
        
        await supabase
          .from('players')
          .update({
            is_imposter: isImposter,
            word: isImposter ? imposterWord : word
          })
          .eq('id', player.id);
      }
      
      // Create round with hint stored
      await supabase.from('rounds').insert({
        room_id: room.id,
        round_number: 1,
        secret_word: word,
        hint: hint
      });

      // Clear chat messages for the new game
      await supabase.from('chat_messages').delete().eq('room_id', room.id);
      
      // Update room status
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ status: 'role_reveal' })
        .eq('id', room.id);

      if (updateError) throw updateError;

      // Manually update local state to trigger navigation immediately for host
      setRoom(prev => prev ? ({ ...prev, status: 'role_reveal' }) : null);
        
    } catch (err: any) {
      console.error("Start game error:", err);
      setError(err.message);
    }
  };

  const submitClue = async (clueText: string) => {
    if (!currentRound || !currentPlayer || !room) return;
    
    try {
      await supabase.from('clues').insert({
        round_id: currentRound.id,
        player_id: currentPlayer.id,
        clue_text: clueText,
        turn_order: clues.length
      });
      
      // Check if all alive players have submitted clues
      const alivePlayers = players.filter(p => p.is_alive);
      const { data: allClues } = await supabase
        .from('clues')
        .select('*')
        .eq('round_id', currentRound.id);
      
      // Removed automatic transition to voting
      // The host will manually trigger the voting phase
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startVotingPhase = async () => {
    if (!room) return;
    try {
      await supabase.from('rooms').update({ status: 'voting' }).eq('id', room.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const submitVote = async (voteForId: string) => {
    if (!currentRound || !currentPlayer || !room) return;
    
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
          // Mark player as eliminated
          await supabase.from('players').update({ is_alive: false }).eq('id', eliminatedId);
          
          // Fetch updated players list to check win conditions
          const { data: updatedPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', room.id);
          
          if (updatedPlayers) {
            const aliveImposters = updatedPlayers.filter(p => p.is_imposter && p.is_alive);
            const aliveInnocents = updatedPlayers.filter(p => !p.is_imposter && p.is_alive);
            
            // Win conditions:
            // - Innocents win if all imposters are eliminated
            // - Imposters win if they equal or outnumber innocents
            if (aliveImposters.length === 0 || aliveImposters.length >= aliveInnocents.length) {
              await supabase.from('rooms').update({ status: 'results' }).eq('id', room.id);
            } else {
              // Game continues - go to results to show who was eliminated, then next round
              await supabase.from('rooms').update({ status: 'results' }).eq('id', room.id);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Removed submitImposterGuess - no longer used

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
      
      // If imposter hint is enabled, give imposters the hint, otherwise null
      const imposterWord = room.imposter_hint ? hint : null;
      
      await supabase
        .from('players')
        .update({
          is_imposter: isImposter,
          word: isImposter ? imposterWord : word,
          is_alive: true
        })
        .eq('id', player.id);
    }
    
    // Create new round with hint stored
    await supabase.from('rounds').insert({
      room_id: room.id,
      round_number: nextRoundNumber,
      secret_word: word,
      hint: hint
    });

    // Clear chat messages for the new game
    await supabase.from('chat_messages').delete().eq('room_id', room.id);
    
    setClues([]);
    setVotes([]);
    
    await supabase.from('rooms').update({ status: 'role_reveal' }).eq('id', room.id);
  };

  const startCluePhase = async () => {
    if (!room) return;
    await supabase.from('rooms').update({ status: 'clue_phase' }).eq('id', room.id);
  };

  const leaveRoom = () => {
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setCurrentRound(null);
    setClues([]);
    setVotes([]);
    setGameSettings(null);
    localStorage.removeItem('playerId');
    localStorage.removeItem('roomCode');
  };

  const restartRound = async () => {
    if (!room || !currentRound) return;
    
    // Clear clues for current round
    await supabase.from('clues').delete().eq('round_id', currentRound.id);
    
    // Reset room status back to clue_phase
    await supabase.from('rooms').update({ status: 'clue_phase' }).eq('id', room.id);
    
    setClues([]);
  };

  const isHost = room?.host_id === currentPlayer?.id;

  return (
    <GameContext.Provider value={{
      room,
      players,
      currentPlayer,
      currentRound,
      clues,
      votes,
      loading: loading || !sessionRestored,
      error,
      isHost,
      gameSettings,
      phaseStartTime: null,
      createRoom,
      joinRoom,
      startGame,
      startCluePhase,
      startVotingPhase,
      submitClue,
      submitVote,
      nextRound,
      leaveRoom,
      restartRound
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
