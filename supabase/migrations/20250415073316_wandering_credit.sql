/*
  # Create matchmaking tables

  1. New Tables
    - `match_queue`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `rank` (integer)
      - `created_at` (timestamp)
    - `matches`
      - `id` (uuid, primary key)
      - `player1_id` (uuid, references users)
      - `player2_id` (uuid, references users)
      - `status` (text: 'pending', 'active', 'completed')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create match_queue table
CREATE TABLE IF NOT EXISTS match_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  rank integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  player2_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies for match_queue
CREATE POLICY "Users can insert their own queue entry"
  ON match_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view queue entries"
  ON match_queue
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their own queue entry"
  ON match_queue
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for matches
CREATE POLICY "Players can view their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "Players can update their matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);