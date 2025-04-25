import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MonacoEditor from '@monaco-editor/react';
import { Play, Clock, CheckCircle, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  sample_input: string;
  sample_output: string;
  test_cases: any;
  difficulty: string;
}

interface CodeSubmission {
  id: string;
  user_id: string;
  code: string;
  language: string;
  status: string;
  created_at: string;
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

export default function Match() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('// Write your solution here');
  const [language, setLanguage] = useState('javascript');
  const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [testStats, setTestStats] = useState({ passed: 0, total: 0 });
  const [showPlayerLeftPopup, setShowPlayerLeftPopup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matchChannel, setMatchChannel] = useState<any>(null);

  useEffect(() => {
    const getMatchDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        setCurrentUserId(user.id);

        // Get match details
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*, winner:winner_id(email)')
          .eq('id', id)
          .single();

        if (matchError) throw matchError;
        if (!match) {
          setError('Match not found');
          navigate('/dashboard');
          return;
        }

        // If match is already completed, redirect to dashboard
        if (match.status === 'completed') {
          navigate('/dashboard');
          return;
        }

        setMatch(match);
        if (match.winner) {
          setWinner(match.winner.email);
        }
        setStartTime(new Date(match.created_at));

        // Get problem for this match
        const { data: matchProblems, error: problemError } = await supabase
          .from('match_problems')
          .select('problem:problem_id(*)')
          .eq('match_id', id);

        if (problemError) throw problemError;

        if (!matchProblems || matchProblems.length === 0) {
          setError('No problem found for this match');
        } else {
          setProblem(matchProblems[0].problem);
        }

        // Get existing submissions
        const { data: existingSubmissions, error: submissionsError } = await supabase
          .from('code_submissions')
          .select('*')
          .eq('match_id', id)
          .order('created_at', { ascending: false });

        if (submissionsError) throw submissionsError;

        if (existingSubmissions) {
          setSubmissions(existingSubmissions);
        }

        // Subscribe to match updates
        const channel = supabase
          .channel(`match-${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'matches',
              filter: `id=eq.${id}`,
            },
            (payload) => {
              const updatedMatch = payload.new;
              
              if (!updatedMatch) return;

              // If match is completed, handle accordingly
              if (updatedMatch.status === 'completed') {
                if (!updatedMatch.winner_id) {
                  setShowPlayerLeftPopup(true);
                } else if (updatedMatch.winner_id === user.id) {
                  setShowWinMessage(true);
                } else {
                  alert('Your opponent has won the match.');
                }
                return;
              }

              setMatch(updatedMatch);
            }
          )
          .subscribe();

        setMatchChannel(channel);

      } catch (error) {
        console.error('Error loading match:', error);
        setError('Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    getMatchDetails();

    return () => {
      // Cleanup function
      if (matchChannel) {
        matchChannel.unsubscribe();
      }
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!startTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleCodeChange = (value: string | undefined) => {
    if (!value) return;
    setCode(value);
  };

  const handleSubmit = async () => {
    if (!match || !code) return;

    try {
      setExecuting(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('code_submissions')
        .insert({
          match_id: match.id,
          user_id: user.id,
          code,
          language,
          status: 'pending'
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      setSubmissions([submission, ...submissions]);

      // Execute code
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: match.id,
          userId: user.id,
          code,
          language,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Code execution failed');
      }

      setTestResults(result.results);
      setTestStats({
        passed: result.passedTests,
        total: result.totalTests
      });

      if (result.allTestsPassed) {
        setShowWinMessage(true);
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setError(error.message || 'Failed to submit code');
    } finally {
      setExecuting(false);
    }
  };

  const handleFindNewMatch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user's profile for rank
      const { data: profile } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Calculate numeric rank
      const rankMap: Record<string, number> = {
        'beginner': 1000,
        'intermediate': 1500,
        'advanced': 2000,
        'expert': 2500
      };

      const numericRank = rankMap[profile.rank.toLowerCase()] || 1000;

      // Add user to match queue
      await supabase
        .from('match_queue')
        .insert({
          user_id: user.id,
          rank: numericRank
        });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error finding new match:', error);
      setError('Failed to find new match');
    }
  };

  const handleLeaveMatch = async () => {
    try {
      if (!match?.id) return;

      // Unsubscribe from match channel
      if (matchChannel) {
        await matchChannel.unsubscribe();
        setMatchChannel(null);
      }

      // Update match status
      await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', match.id);

      // Clear match state
      setMatch(null);
      setProblem(null);
      setSubmissions([]);
      setTestResults([]);
      setWinner(null);
      setShowWinMessage(false);
      setShowPlayerLeftPopup(false);

      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error leaving match:', error);
      setError('Failed to leave match');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading match...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showPlayerLeftPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Opponent Left</h2>
            <p className="text-lg mb-6">
              Your opponent has left the match. Would you like to:
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={handleFindNewMatch}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Find New Match
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showWinMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
            <p className="text-lg mb-4">
              You've won the match! 🎉<br />
              You passed {testStats.passed} out of {testStats.total} test cases.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLeaveMatch}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Match
            </button>
            {winner && (
              <div className="text-green-400">
                Winner: {winner}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-xl font-mono">{elapsedTime}</span>
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
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            {problem && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
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

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Submissions</h2>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between bg-gray-900 p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {submission.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : submission.status === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                      )}
                      <span>Submission at {new Date(submission.created_at).toLocaleTimeString()}</span>
                    </div>
                    <span className="capitalize text-sm px-3 py-1 rounded-full bg-gray-700">
                      {submission.status}
                    </span>
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
              disabled={executing || !!winner}
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