/*
  # Add coding problems and submissions tables

  1. New Tables
    - `coding_problems`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `sample_input` (text)
      - `sample_output` (text)
      - `test_cases` (jsonb)
      - `difficulty` (text)
      - `created_at` (timestamp)
    
    - `match_problems`
      - `id` (uuid, primary key)
      - `match_id` (uuid, references matches)
      - `problem_id` (uuid, references coding_problems)
      - `created_at` (timestamp)

    - `code_submissions`
      - `id` (uuid, primary key)
      - `match_id` (uuid, references matches)
      - `user_id` (uuid, references users_profile)
      - `code` (text)
      - `language` (text)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create coding_problems table
CREATE TABLE IF NOT EXISTS coding_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  sample_input text,
  sample_output text,
  test_cases jsonb NOT NULL,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

-- Create match_problems table
CREATE TABLE IF NOT EXISTS match_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES coding_problems(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create code_submissions table
CREATE TABLE IF NOT EXISTS code_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  language text CHECK (language IN ('javascript', 'python')) NOT NULL,
  status text CHECK (status IN ('pending', 'running', 'completed', 'error')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for coding_problems
CREATE POLICY "Anyone can view coding problems"
  ON coding_problems
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for match_problems
CREATE POLICY "Players can view their match problems"
  ON match_problems
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

-- Policies for code_submissions
CREATE POLICY "Players can insert their own submissions"
  ON code_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can view match submissions"
  ON code_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

-- Insert some sample problems
INSERT INTO coding_problems (title, description, sample_input, sample_output, test_cases, difficulty) VALUES
(
  'Two Sum',
  'Given an array of integers nums and an integer target, return indices of the two numbers in nums such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
  '[2, 7, 11, 15]\ntarget = 9',
  '[0, 1]',
  '[{"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]}, {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]}]',
  'easy'
),
(
  'Reverse String',
  'Write a function that reverses a string. The input string is given as an array of characters s.',
  '["h","e","l","l","o"]',
  '["o","l","l","e","h"]',
  '[{"input": {"s": ["h","e","l","l","o"]}, "output": ["o","l","l","e","h"]}, {"input": {"s": ["H","a","n","n","a","h"]}, "output": ["h","a","n","n","a","H"]}]',
  'easy'
);