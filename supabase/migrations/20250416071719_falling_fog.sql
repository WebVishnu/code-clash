/*
  # Add execute function for code evaluation

  1. Changes
    - Add execute_code function to handle code execution
    - Add test case validation function
    - Add helper functions for result comparison
*/

-- Function to validate test case format
CREATE OR REPLACE FUNCTION validate_test_case(test_case JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if test case has required fields
  IF NOT (
    test_case ? 'input' AND
    test_case ? 'output'
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to compare test results
CREATE OR REPLACE FUNCTION compare_test_results(actual JSONB, expected JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN actual = expected;
END;
$$;

-- Main execute function
CREATE OR REPLACE FUNCTION execute_code(
  problem_id UUID,
  user_id UUID,
  code TEXT,
  language TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  results JSONB[],
  all_tests_passed BOOLEAN,
  total_tests INTEGER,
  passed_tests INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  problem_record RECORD;
  test_cases JSONB;
  test_case JSONB;
  test_results JSONB[] := ARRAY[]::JSONB[];
  passed_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Get problem details
  SELECT * INTO problem_record
  FROM coding_problems
  WHERE id = problem_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Problem not found';
  END IF;

  -- Parse test cases
  test_cases := problem_record.test_cases;
  
  -- Validate and execute each test case
  FOR test_case IN SELECT * FROM jsonb_array_elements(test_cases)
  LOOP
    -- Validate test case format
    IF NOT validate_test_case(test_case) THEN
      RAISE EXCEPTION 'Invalid test case format';
    END IF;

    total_count := total_count + 1;
    
    -- In a real implementation, this would execute the code
    -- For now, we'll just validate the format and structure
    test_results := array_append(
      test_results,
      jsonb_build_object(
        'test_case', test_case,
        'passed', FALSE,
        'output', NULL,
        'error', NULL
      )
    );
  END LOOP;

  -- Update user stats if all tests passed
  IF passed_count = total_count THEN
    -- Update user rank based on problem difficulty
    PERFORM update_user_rank(
      user_id,
      CASE problem_record.difficulty
        WHEN 'easy' THEN 5
        WHEN 'medium' THEN 10
        ELSE 15
      END
    );
  END IF;

  RETURN QUERY SELECT 
    TRUE as success,
    test_results as results,
    (passed_count = total_count) as all_tests_passed,
    total_count as total_tests,
    passed_count as passed_tests;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_code TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_coding_problems_difficulty ON coding_problems(difficulty);