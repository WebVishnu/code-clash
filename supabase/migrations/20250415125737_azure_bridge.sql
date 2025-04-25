CREATE OR REPLACE FUNCTION update_user_rank(user_id UUID, rank_increase INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users_profile
  SET rank = CASE 
    WHEN rank::integer + rank_increase < 1000 THEN 'beginner'
    WHEN rank::integer + rank_increase < 1500 THEN 'intermediate'
    WHEN rank::integer + rank_increase < 2000 THEN 'advanced'
    ELSE 'expert'
  END
  WHERE id = user_id;
END;
$$;

-- Add winner_id column to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES users_profile(id);