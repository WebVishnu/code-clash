-- Add new columns to users_profile table for leaderboard functionality
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000;

-- Create a trigger to automatically update total_matches when wins or losses change
CREATE OR REPLACE FUNCTION update_total_matches()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_matches = NEW.wins + NEW.losses;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_matches_trigger ON users_profile;
CREATE TRIGGER update_total_matches_trigger
BEFORE INSERT OR UPDATE OF wins, losses ON users_profile
FOR EACH ROW
EXECUTE FUNCTION update_total_matches();

-- Create table to track match history for detailed leaderboard stats
CREATE TABLE IF NOT EXISTS match_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id),
    user_id UUID NOT NULL REFERENCES users_profile(id),
    opponent_id UUID NOT NULL REFERENCES users_profile(id),
    result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
    rating_change INTEGER NOT NULL,
    previous_rating INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_profile_elo_rating ON users_profile(elo_rating DESC);

-- Create function to update player ratings after a match
CREATE OR REPLACE FUNCTION update_player_ratings()
RETURNS TRIGGER AS $$
DECLARE
    winner_id UUID;
    loser_id UUID;
    winner_rating INTEGER;
    loser_rating INTEGER;
    rating_change INTEGER;
BEGIN
    -- Only proceed if match status is 'completed'
    IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL THEN
        winner_id := NEW.winner_id;
        
        -- Determine loser
        IF NEW.winner_id = NEW.player1_id THEN
            loser_id := NEW.player2_id;
        ELSE
            loser_id := NEW.player1_id;
        END IF;
        
        -- Get current ratings
        SELECT elo_rating INTO winner_rating FROM users_profile WHERE id = winner_id;
        SELECT elo_rating INTO loser_rating FROM users_profile WHERE id = loser_id;
        
        -- Calculate Elo rating change (simplified version)
        -- K-factor of 32 is used, which is common for casual play
        rating_change := 32 * (1 - 1 / (1 + 10 ^ ((loser_rating - winner_rating) / 400.0)));
        
        -- Update winner stats
        UPDATE users_profile
        SET wins = wins + 1,
            elo_rating = elo_rating + rating_change
        WHERE id = winner_id;
        
        -- Record match history for winner
        INSERT INTO match_history (
            match_id, user_id, opponent_id, result, rating_change, 
            previous_rating, new_rating
        ) VALUES (
            NEW.id, winner_id, loser_id, 'win', rating_change, 
            winner_rating, winner_rating + rating_change
        );
        
        -- Update loser stats
        UPDATE users_profile
        SET losses = losses + 1,
            elo_rating = GREATEST(elo_rating - rating_change, 100) -- Floor of 100 to prevent very negative ratings
        WHERE id = loser_id;
        
        -- Record match history for loser
        INSERT INTO match_history (
            match_id, user_id, opponent_id, result, rating_change, 
            previous_rating, new_rating
        ) VALUES (
            NEW.id, loser_id, winner_id, 'loss', -rating_change, 
            loser_rating, GREATEST(loser_rating - rating_change, 100)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update player ratings when a match is completed
DROP TRIGGER IF EXISTS update_player_ratings_trigger ON matches;
CREATE TRIGGER update_player_ratings_trigger
AFTER UPDATE OF status, winner_id ON matches
FOR EACH ROW
WHEN (OLD.status <> 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_player_ratings(); 