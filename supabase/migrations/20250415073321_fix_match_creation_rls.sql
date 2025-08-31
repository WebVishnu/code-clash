-- Fix match creation RLS policy to allow system-level operations
-- Drop existing policies
DROP POLICY IF EXISTS "Players can view their matches" ON matches;
DROP POLICY IF EXISTS "Players can insert matches" ON matches;
DROP POLICY IF EXISTS "Players can update their matches" ON matches;
DROP POLICY IF EXISTS "Players can delete their matches" ON matches;

-- Create simple, effective policies for matches table
CREATE POLICY "Players can view their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can insert matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can update their matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can delete their matches"
  ON matches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);
