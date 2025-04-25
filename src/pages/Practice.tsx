import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
import { Play, CheckCircle, XCircle } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  sample_input: string;
  sample_output: string;
  test_cases: any;
  difficulty: string;
}

interface TestResult {
  passed: boolean;
  output: string;
  error: string | null;
  status: {
    id: number;
    description: string;
  };
}

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const problemId = searchParams.get('problem');

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('// Write your solution here');
  const [language, setLanguage] = useState('javascript');
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    const getProblem = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        let query = supabase.from('coding_problems').select('*');

        if (problemId) {
          // If problemId is provided, fetch that specific problem
          query = query.eq('id', problemId);
        } else {
          // Otherwise, fetch a random problem
          const { data: allProblems } = await query;
          if (allProblems && allProblems.length > 0) {
            const randomProblem = allProblems[Math.floor(Math.random() * allProblems.length)];
            setProblem(randomProblem);
            return;
          }
        }

        const { data: problem, error: problemError } = await query.single();

        if (problemError) throw problemError;

        if (!problem) {
          setError('Problem not found');
          return;
        }

        setProblem(problem);
      } catch (error) {
        console.error('Error loading problem:', error);
        setError('Failed to load problem');
      }
    };

    getProblem();
  }, [navigate, problemId]);

  const handleCodeChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);
  };

  const handleSubmit = async () => {
    if (!problem || !code) return;

    try {
      setExecuting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Execute code
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problemId: problem.id,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Code execution failed');
      }

      setTestResults(result.results);

      if (result.allTestsPassed) {
        // Update user rank
        const rankIncrease = problem.difficulty === 'easy' ? 5 : 
                           problem.difficulty === 'medium' ? 10 : 15;

        await supabase.rpc('update_user_rank', {
          user_id: user.id,
          rank_increase: rankIncrease,
        });

        alert(`Congratulations! You've earned ${rankIncrease} rank points!`);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setError(error.message || 'Failed to submit code');
    } finally {
      setExecuting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'hard':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            {problem && (
              <div>
                <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
                <span className={`text-sm font-medium capitalize ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              </div>
            )}
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            {problem && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="prose prose-invert">
                  <p>{problem.description}</p>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Sample Input:</h3>
                    <pre className="bg-gray-900 p-3 rounded">{problem.sample_input}</pre>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Sample Output:</h3>
                    <pre className="bg-gray-900 p-3 rounded">{problem.sample_output}</pre>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="bg-gray-900 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span>Test Case {index + 1}</span>
                      </div>
                      <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
                        {result.passed ? 'Passed' : 'Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-red-400 text-sm">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-[600px] bg-gray-800 rounded-lg overflow-hidden">
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={executing}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5" />
              <span>{executing ? 'Executing...' : 'Submit Solution'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}