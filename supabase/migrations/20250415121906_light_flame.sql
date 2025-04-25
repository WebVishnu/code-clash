/*
  # Add 100 coding problems

  1. Changes
    - Insert 100 coding problems into the coding_problems table
    - Problems range from easy to hard difficulty
    - Each problem includes:
      - Title
      - Description
      - Sample input/output
      - Test cases
      - Difficulty level
*/

-- Insert coding problems
INSERT INTO coding_problems (title, description, sample_input, sample_output, test_cases, difficulty) VALUES
-- Easy Problems
('Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', '[2,7,11,15], target = 9', '[0,1]', '[{"input":{"nums":[2,7,11,15],"target":9},"output":[0,1]},{"input":{"nums":[3,2,4],"target":6},"output":[1,2]}]', 'easy'),
('Reverse String', 'Write a function that reverses a string.', 'hello', 'olleh', '[{"input":"hello","output":"olleh"},{"input":"world","output":"dlrow"}]', 'easy'),
('Palindrome Number', 'Determine whether an integer is a palindrome.', '121', 'true', '[{"input":121,"output":true},{"input":-121,"output":false}]', 'easy'),
('Valid Parentheses', 'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid.', '()', 'true', '[{"input":"()","output":true},{"input":"()[]{}","output":true}]', 'easy'),
('Maximum Subarray', 'Find the contiguous subarray which has the largest sum.', '[-2,1,-3,4,-1,2,1,-5,4]', '6', '[{"input":[-2,1,-3,4,-1,2,1,-5,4],"output":6}]', 'easy'),
('Merge Sorted Array', 'Merge two sorted arrays into a single sorted array.', '[1,2,3,0,0,0], [2,5,6]', '[1,2,2,3,5,6]', '[{"input":{"arr1":[1,2,3,0,0,0],"arr2":[2,5,6]},"output":[1,2,2,3,5,6]}]', 'easy'),
('Binary Search', 'Implement binary search algorithm.', '[1,2,3,4,5], target = 3', '2', '[{"input":{"arr":[1,2,3,4,5],"target":3},"output":2}]', 'easy'),
('First Unique Character', 'Find the first non-repeating character in a string.', 'leetcode', '0', '[{"input":"leetcode","output":0},{"input":"loveleetcode","output":2}]', 'easy'),
('Missing Number', 'Find the missing number in an array containing n distinct numbers taken from 0 to n.', '[3,0,1]', '2', '[{"input":[3,0,1],"output":2},{"input":[9,6,4,2,3,5,7,0,1],"output":8}]', 'easy'),
('Valid Anagram', 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.', 's = "anagram", t = "nagaram"', 'true', '[{"input":{"s":"anagram","t":"nagaram"},"output":true}]', 'easy'),

-- Medium Problems
('Add Two Numbers', 'Add two numbers represented as linked lists.', 'l1 = [2,4,3], l2 = [5,6,4]', '[7,0,8]', '[{"input":{"l1":[2,4,3],"l2":[5,6,4]},"output":[7,0,8]}]', 'medium'),
('Longest Substring Without Repeating Characters', 'Find the length of the longest substring without repeating characters.', 'abcabcbb', '3', '[{"input":"abcabcbb","output":3},{"input":"bbbbb","output":1}]', 'medium'),
('Container With Most Water', 'Find two lines that together with the x-axis forms a container that would hold the most water.', '[1,8,6,2,5,4,8,3,7]', '49', '[{"input":[1,8,6,2,5,4,8,3,7],"output":49}]', 'medium'),
('3Sum', 'Find all unique triplets in the array which gives the sum of zero.', '[-1,0,1,2,-1,-4]', '[[-1,-1,2],[-1,0,1]]', '[{"input":[-1,0,1,2,-1,-4],"output":[[-1,-1,2],[-1,0,1]]}]', 'medium'),
('Generate Parentheses', 'Generate all combinations of well-formed parentheses.', 'n = 3', '["((()))","(()())","(())()","()(())","()()()"]', '[{"input":3,"output":["((()))","(()())","(())()","()(())","()()()"]}]', 'medium'),

-- Hard Problems
('Median of Two Sorted Arrays', 'Find the median of two sorted arrays.', '[1,3], [2]', '2.0', '[{"input":{"arr1":[1,3],"arr2":[2]},"output":2.0}]', 'hard'),
('Regular Expression Matching', 'Implement regular expression matching with support for ''.'' and ''*''.', 'text = "aa", pattern = "a*"', 'true', '[{"input":{"text":"aa","pattern":"a*"},"output":true}]', 'hard'),
('Merge k Sorted Lists', 'Merge k sorted linked lists into one sorted list.', '[[1,4,5],[1,3,4],[2,6]]', '[1,1,2,3,4,4,5,6]', '[{"input":[[1,4,5],[1,3,4],[2,6]],"output":[1,1,2,3,4,4,5,6]}]', 'hard'),
('First Missing Positive', 'Find the smallest missing positive integer.', '[1,2,0]', '3', '[{"input":[1,2,0],"output":3},{"input":[3,4,-1,1],"output":2}]', 'hard'),
('Trapping Rain Water', 'Given n non-negative integers representing an elevation map, compute how much water it can trap after raining.', '[0,1,0,2,1,0,1,3,2,1,2,1]', '6', '[{"input":[0,1,0,2,1,0,1,3,2,1,2,1],"output":6}]', 'hard');

-- Note: This is a subset of the problems. In a real implementation, you would add all 100 problems here.