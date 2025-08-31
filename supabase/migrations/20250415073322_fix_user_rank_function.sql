-- Fix update_user_rank function to properly bypass RLS
CREATE OR REPLACE FUNCTION update_user_rank(user_id UUID, rank_increase INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable RLS for this operation
  ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
  
  UPDATE users_profile
  SET rank = CASE 
    WHEN rank::integer + rank_increase < 1000 THEN 'beginner'
    WHEN rank::integer + rank_increase < 1500 THEN 'intermediate'
    WHEN rank::integer + rank_increase < 2000 THEN 'advanced'
    ELSE 'expert'
  END
  WHERE id = user_id;
  
  -- Re-enable RLS
  ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
END;
$$;
