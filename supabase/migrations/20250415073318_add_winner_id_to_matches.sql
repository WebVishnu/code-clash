-- Add winner_id column to matches table for leaderboard functionality
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES users_profile(id) ON DELETE SET NULL;

-- Add index for faster winner lookups
CREATE INDEX IF NOT EXISTS idx_matches_winner_id ON matches(winner_id);
