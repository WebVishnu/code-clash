-- Fix RLS policies for matches table
-- Drop existing policies
DROP POLICY IF EXISTS "Players can view their matches" ON matches;
DROP POLICY IF EXISTS "Players can update their matches" ON matches;

-- Create comprehensive policies for matches table
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

-- Also fix match_queue policies to be more permissive
DROP POLICY IF EXISTS "Users can view queue entries" ON match_queue;
CREATE POLICY "Users can view queue entries"
  ON match_queue
  FOR SELECT
  TO authenticated
  USING (true);
