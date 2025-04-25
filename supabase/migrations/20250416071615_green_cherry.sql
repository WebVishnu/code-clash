/*
  # Fix test cases format for coding problems

  1. Changes
    - Update test cases format to use proper input object structure
    - Ensure consistency across all problems
*/

UPDATE coding_problems
SET test_cases = '[
  {"input": {"s": "leetcode"}, "output": 0},
  {"input": {"s": "loveleetcode"}, "output": 2}
]'::jsonb
WHERE title = 'First Unique Character';

-- Update other problems to use consistent format
UPDATE coding_problems
SET test_cases = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'input',
      CASE
        WHEN jsonb_typeof(elem->'input') = 'string' THEN 
          jsonb_build_object('s', elem->'input')
        ELSE 
          elem->'input'
      END,
      'output',
      elem->'output'
    )
  )
  FROM jsonb_array_elements(test_cases) elem
)
WHERE jsonb_typeof(test_cases) = 'array';