import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qythuogbaudecozcjkss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dGh1b2diYXVkZWNvemNqa3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTg0NjksImV4cCI6MjA4Mzc3NDQ2OX0.pp2T030YkJKVaMJMSVTwaOA4MwNIwvETVsZ5ku1L1-4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our game
export interface Room {
  id: string;
  host_id: string;
  room_code: string;
  num_players: number;
  num_imposters: number;
  category: string[];
  imposter_hint: boolean;
  status: 'waiting' | 'role_reveal' | 'clue_phase' | 'voting' | 'imposter_guess' | 'results' | 'finished';
  current_turn?: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  username: string;
  is_imposter: boolean;
  word: string | null;
  is_alive: boolean;
  score: number;
  turn_order: number;
  created_at: string;
}

export interface Round {
  id: string;
  room_id: string;
  round_number: number;
  secret_word: string;
  hint?: string;
  created_at: string;
}

export interface Clue {
  id: string;
  round_id: string;
  player_id: string;
  clue_text: string;
  turn_order: number;
  created_at: string;
}

export interface Vote {
  id: string;
  round_id: string;
  voter_id: string;
  vote_for_id: string;
  created_at: string;
}

export interface GameSettings {
  id: string;
  room_id: string;
  clue_time_limit: number;
  vote_time_limit: number;
  max_rounds: number;
}

// Helper function to generate room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
