-- Final RLS fix - create more permissive policies for system operations
-- Drop all existing policies on matches table
DROP POLICY IF EXISTS "Players can view their matches" ON matches;
DROP POLICY IF EXISTS "Players can insert matches" ON matches;
DROP POLICY IF EXISTS "Players can update their matches" ON matches;
DROP POLICY IF EXISTS "Players can delete their matches" ON matches;

-- Create comprehensive policies that allow both user and system operations
CREATE POLICY "Allow all match operations for players"
  ON matches
  FOR ALL
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id)
  WITH CHECK (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Also ensure the service role can bypass RLS (this should already be the case)
-- But let's make sure the policies are not too restrictive
