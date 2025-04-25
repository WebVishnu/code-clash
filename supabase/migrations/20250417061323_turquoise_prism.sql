/*
  # Add more coding problems

  1. Changes
    - Add a diverse set of coding problems across all difficulty levels
    - Each problem includes:
      - Title
      - Description
      - Sample input/output
      - Test cases
      - Difficulty level
*/

-- Insert more coding problems
INSERT INTO coding_problems (title, description, sample_input, sample_output, test_cases, difficulty) VALUES
-- Easy Problems
('FizzBuzz', 'Write a function that returns "Fizz" for numbers divisible by 3, "Buzz" for numbers divisible by 5, and "FizzBuzz" for numbers divisible by both 3 and 5. Otherwise, return the number as a string.', '15', '"FizzBuzz"', '[{"input": {"n": 15}, "output": "FizzBuzz"}, {"input": {"n": 3}, "output": "Fizz"}, {"input": {"n": 5}, "output": "Buzz"}, {"input": {"n": 7}, "output": "7"}]', 'easy'),

('Array Sum', 'Write a function that calculates the sum of all numbers in an array.', '[1, 2, 3, 4, 5]', '15', '[{"input": {"arr": [1, 2, 3, 4, 5]}, "output": 15}, {"input": {"arr": [-1, -2, 3, 4]}, "output": 4}]', 'easy'),

('Count Vowels', 'Write a function that counts the number of vowels in a string. Consider a, e, i, o, u as vowels.', '"hello world"', '3', '[{"input": {"s": "hello world"}, "output": 3}, {"input": {"s": "AEIOU"}, "output": 5}]', 'easy'),

('Find Maximum', 'Write a function that finds the maximum number in an array.', '[1, 3, 2, 5, 4]', '5', '[{"input": {"arr": [1, 3, 2, 5, 4]}, "output": 5}, {"input": {"arr": [-1, -5, -2]}, "output": -1}]', 'easy'),

-- Medium Problems
('Valid Sudoku', 'Write a function that determines if a 9x9 Sudoku board is valid. Only filled cells need to be validated.', '9x9 grid', 'true', '[{"input": {"board": [[5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],[8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],[0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]]}, "output": true}]', 'medium'),

('Group Anagrams', 'Write a function that groups anagrams together from an array of strings.', '["eat","tea","tan","ate","nat","bat"]', '[["eat","tea","ate"],["tan","nat"],["bat"]]', '[{"input": {"words": ["eat","tea","tan","ate","nat","bat"]}, "output": [["eat","tea","ate"],["tan","nat"],["bat"]]}]', 'medium'),

('Spiral Matrix', 'Write a function that returns all elements of an n x n matrix in spiral order.', '[[1,2,3],[4,5,6],[7,8,9]]', '[1,2,3,6,9,8,7,4,5]', '[{"input": {"matrix": [[1,2,3],[4,5,6],[7,8,9]]}, "output": [1,2,3,6,9,8,7,4,5]}]', 'medium'),

('LRU Cache', 'Implement a Least Recently Used (LRU) cache with get and put operations in O(1) time complexity.', 'LRUCache cache = new LRUCache(2); cache.put(1, 1); cache.put(2, 2); cache.get(1);', '1', '[{"input": {"operations": ["LRUCache","put","put","get","put","get","put","get","get","get"], "values": [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]}, "output": [null,null,null,1,null,-1,null,-1,3,4]}]', 'medium'),

-- Hard Problems
('Word Break II', 'Given a string s and a dictionary of strings wordDict, return all possible sentences that can be formed by adding spaces between words.', 's = "catsanddog", wordDict = ["cat","cats","and","sand","dog"]', '["cats and dog","cat sand dog"]', '[{"input": {"s": "catsanddog", "wordDict": ["cat","cats","and","sand","dog"]}, "output": ["cats and dog","cat sand dog"]}]', 'hard'),

('N-Queens', 'Place N queens on an N×N chessboard such that no two queens threaten each other.', '4', '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', '[{"input": {"n": 4}, "output": [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]}]', 'hard'),

('Longest Valid Parentheses', 'Given a string containing just "(" and ")", find the length of the longest valid parentheses substring.', '")()())"', '4', '[{"input": {"s": ")()())"}, "output": 4}, {"input": {"s": "(()"}, "output": 2}]', 'hard'),

('Merge K Sorted Lists', 'Merge k sorted linked lists into one sorted list.', '[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', '[{"input": {"lists": [[1,4,5],[1,3,4],[2,6]]}, "output": [1,1,2,3,4,4,5,6]}]', 'hard'),

-- More Easy Problems
('Reverse Words', 'Write a function that reverses the words in a string.', '"the sky is blue"', '"blue is sky the"', '[{"input": {"s": "the sky is blue"}, "output": "blue is sky the"}, {"input": {"s": "  hello world  "}, "output": "world hello"}]', 'easy'),

('Power of Two', 'Write a function that determines if a given integer is a power of two.', '16', 'true', '[{"input": {"n": 16}, "output": true}, {"input": {"n": 3}, "output": false}]', 'easy'),

('Valid Palindrome', 'Write a function that checks if a string is a valid palindrome, considering only alphanumeric characters and ignoring case.', '"A man, a plan, a canal: Panama"', 'true', '[{"input": {"s": "A man, a plan, a canal: Panama"}, "output": true}, {"input": {"s": "race a car"}, "output": false}]', 'easy'),

-- More Medium Problems
('Search in Rotated Array', 'Write a function to search for a target value in a rotated sorted array.', '[4,5,6,7,0,1,2], target = 0', '4', '[{"input": {"nums": [4,5,6,7,0,1,2], "target": 0}, "output": 4}]', 'medium'),

('Longest Palindromic Substring', 'Write a function to find the longest palindromic substring in a string.', '"babad"', '"bab"', '[{"input": {"s": "babad"}, "output": "bab"}, {"input": {"s": "cbbd"}, "output": "bb"}]', 'medium'),

('Jump Game', 'Given an array of non-negative integers nums, you are initially positioned at the first index. Each element represents your maximum jump length at that position. Determine if you can reach the last index.', '[2,3,1,1,4]', 'true', '[{"input": {"nums": [2,3,1,1,4]}, "output": true}, {"input": {"nums": [3,2,1,0,4]}, "output": false}]', 'medium'),

-- More Hard Problems
('Regular Expression Matching', 'Implement regular expression matching with support for "." and "*".', '"aa", p = "a*"', 'true', '[{"input": {"s": "aa", "p": "a*"}, "output": true}, {"input": {"s": "ab", "p": ".*"}, "output": true}]', 'hard'),

('Median of Two Sorted Arrays', 'Find the median of two sorted arrays.', '[1,3], [2]', '2.0', '[{"input": {"nums1": [1,3], "nums2": [2]}, "output": 2.0}, {"input": {"nums1": [1,2], "nums2": [3,4]}, "output": 2.5}]', 'hard'),

('Edit Distance', 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.', '"horse", "ros"', '3', '[{"input": {"word1": "horse", "word2": "ros"}, "output": 3}, {"input": {"word1": "intention", "word2": "execution"}, "output": 5}]', 'hard');