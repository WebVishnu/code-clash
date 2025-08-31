-- Add sample coding problems to the database
INSERT INTO coding_problems (id, title, description, sample_input, sample_output, test_cases, difficulty) VALUES
(
  gen_random_uuid(),
  'Reverse String',
  'Write a function that takes a string as input and returns the string reversed.',
  '"hello"',
  '"olleh"',
  '[
    {"input": "hello", "output": "olleh"},
    {"input": "world", "output": "dlrow"},
    {"input": "code", "output": "edoc"},
    {"input": "test", "output": "tset"}
  ]',
  'easy'
),
(
  gen_random_uuid(),
  'Find Maximum',
  'Write a function that takes an array of numbers and returns the maximum value.',
  '[1, 5, 3, 9, 2]',
  '9',
  '[
    {"input": [1, 5, 3, 9, 2], "output": 9},
    {"input": [10, 20, 30, 40], "output": 40},
    {"input": [-5, -10, -2, -8], "output": -2},
    {"input": [0, 0, 0, 0], "output": 0}
  ]',
  'easy'
),
(
  gen_random_uuid(),
  'Palindrome Check',
  'Write a function that checks if a given string is a palindrome (reads the same forwards and backwards). Return true if it is a palindrome, false otherwise.',
  '"racecar"',
  'true',
  '[
    {"input": "racecar", "output": true},
    {"input": "hello", "output": false},
    {"input": "anna", "output": true},
    {"input": "level", "output": true},
    {"input": "python", "output": false}
  ]',
  'medium'
),
(
  gen_random_uuid(),
  'Fibonacci Sequence',
  'Write a function that returns the nth number in the Fibonacci sequence. The Fibonacci sequence starts with 0, 1, and each subsequent number is the sum of the two preceding ones.',
  '5',
  '5',
  '[
    {"input": 0, "output": 0},
    {"input": 1, "output": 1},
    {"input": 5, "output": 5},
    {"input": 7, "output": 13},
    {"input": 10, "output": 55}
  ]',
  'medium'
),
(
  gen_random_uuid(),
  'Array Sum',
  'Write a function that takes an array of numbers and returns the sum of all elements.',
  '[1, 2, 3, 4, 5]',
  '15',
  '[
    {"input": [1, 2, 3, 4, 5], "output": 15},
    {"input": [10, 20, 30], "output": 60},
    {"input": [-1, -2, -3], "output": -6},
    {"input": [0, 0, 0], "output": 0}
  ]',
  'easy'
),
(
  gen_random_uuid(),
  'Count Vowels',
  'Write a function that counts the number of vowels (a, e, i, o, u) in a given string.',
  '"hello world"',
  '3',
  '[
    {"input": "hello world", "output": 3},
    {"input": "programming", "output": 3},
    {"input": "aeiou", "output": 5},
    {"input": "xyz", "output": 0},
    {"input": "HELLO", "output": 2}
  ]',
  'easy'
),
(
  gen_random_uuid(),
  'Prime Number Check',
  'Write a function that checks if a given number is prime. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.',
  '7',
  'true',
  '[
    {"input": 2, "output": true},
    {"input": 7, "output": true},
    {"input": 4, "output": false},
    {"input": 13, "output": true},
    {"input": 1, "output": false},
    {"input": 15, "output": false}
  ]',
  'medium'
),
(
  gen_random_uuid(),
  'Factorial',
  'Write a function that calculates the factorial of a given number. The factorial of a number n is the product of all positive integers less than or equal to n.',
  '5',
  '120',
  '[
    {"input": 0, "output": 1},
    {"input": 1, "output": 1},
    {"input": 5, "output": 120},
    {"input": 3, "output": 6},
    {"input": 4, "output": 24}
  ]',
  'medium'
);
