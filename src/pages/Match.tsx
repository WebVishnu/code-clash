import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MonacoEditor from '@monaco-editor/react';
import { Play, Clock, CheckCircle, XCircle, ArrowLeft, AlertTriangle, Copy, RotateCcw, Settings, Download, Upload } from 'lucide-react';
import Toast from '../components/Toast';

interface Problem {
  id: string;
  title: string;
  description: string;
  sample_input: string;
  sample_output: string;
  test_cases: Record<string, unknown>;
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

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  status: 'pending' | 'active' | 'completed';
  winner_id?: string;
  created_at: string;
  updated_at: string;
  winner?: {
    email: string;
  };
}

interface MatchChannel {
  unsubscribe: () => void;
}

// Code templates for different languages
const CODE_TEMPLATES = {
  javascript: `// Write your solution here
function solution(input) {
    // Your code here
    return input;
}

// Example usage:
// console.log(solution("test"));
`,
  python: `# Write your solution here
def solution(input):
    # Your code here
    return input

# Example usage:
# print(solution("test"))
`
};

export default function Match() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
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
  const [matchChannel, setMatchChannel] = useState<MatchChannel | null>(null);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(CODE_TEMPLATES[newLanguage as keyof typeof CODE_TEMPLATES]);
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({ message: 'Code copied to clipboard!', type: 'success', isVisible: true });
    } catch (err) {
      console.error('Failed to copy code:', err);
      setToast({ message: 'Failed to copy code', type: 'error', isVisible: true });
    }
  };

  // Reset code to template
  const handleResetCode = () => {
    setCode(CODE_TEMPLATES[language as keyof typeof CODE_TEMPLATES]);
  };

  // Download code as file
  const handleDownloadCode = () => {
    const extension = language === 'javascript' ? 'js' : 'py';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solution.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Upload code from file
  const handleUploadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const getMatchDetails = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

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
           setError('No problem found for this match. Please try creating a new match.');
           // Show a button to go back to dashboard
           setTimeout(() => {
             navigate('/dashboard');
           }, 3000);
         } else {
           setProblem(matchProblems[0].problem as unknown as Problem);
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
              const updatedMatch = payload.new as Match;
              
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
      setError((error as Error).message || 'Failed to submit code');
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
       // Get current user to ensure authentication
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         throw new Error('User not authenticated');
       }

       // Unsubscribe from match channel
       if (matchChannel) {
         await matchChannel.unsubscribe();
         setMatchChannel(null);
       }

       // Only try to update match if we have match data
       if (match?.id) {
         try {
           // Update match status - ensure user is one of the players
           const { error: updateError } = await supabase
             .from('matches')
             .update({ 
               status: 'completed',
               winner_id: match.player1_id === user.id ? match.player2_id : match.player1_id
             })
             .eq('id', match.id)
             .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);

           if (updateError) {
             console.error('Error updating match:', updateError);
             // Don't throw error here, just log it and continue
           }
         } catch (updateError) {
           console.error('Error updating match:', updateError);
           // Don't throw error here, just log it and continue
         }
       }

       // Clear match state
       setMatch(null);
       setProblem(null);
       setSubmissions([]);
       setTestResults([]);
       setWinner(null);
       setShowWinMessage(false);
       setShowPlayerLeftPopup(false);
       setError(null);

       // Navigate to dashboard
       navigate('/dashboard', { replace: true });
     } catch (error) {
       console.error('Error leaving match:', error);
       // Even if there's an error, try to navigate to dashboard
       navigate('/dashboard', { replace: true });
     }
   };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.focus();
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
         <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md">
           <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
           <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
           <p className="text-red-400 mb-6">{error}</p>
           <div className="flex space-x-4 justify-center">
             <button
               onClick={() => navigate('/dashboard')}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
             >
               Go to Dashboard
             </button>
             {match && (
               <button
                 onClick={handleLeaveMatch}
                 className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
               >
                 Leave Match
               </button>
             )}
           </div>
         </div>
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-xl font-mono">{elapsedTime}</span>
            </div>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
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
            {/* Editor Toolbar */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Code Editor</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyCode}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleResetCode}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Reset to template"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Download code"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <label className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer" title="Upload code">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept=".js,.py,.txt"
                      onChange={handleUploadCode}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              {/* Settings Panel */}
              {showSettings && (
                <div className="bg-gray-900 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium mb-3">Editor Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Theme</label>
                      <select
                        value={editorTheme}
                        onChange={(e) => setEditorTheme(e.target.value as 'vs-dark' | 'vs-light')}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value="vs-dark">Dark</option>
                        <option value="vs-light">Light</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Font Size</label>
                      <select
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                      >
                        <option value={12}>12px</option>
                        <option value={14}>14px</option>
                        <option value={16}>16px</option>
                        <option value={18}>18px</option>
                        <option value={20}>20px</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div className="h-[600px] bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                theme={editorTheme}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: true },
                  fontSize: fontSize,
                  wordWrap: 'on',
                  automaticLayout: true,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  cursorStyle: 'line',
                                     tabSize: 2,
                   insertSpaces: true,
                   detectIndentation: true,
                   trimAutoWhitespace: true,
                   largeFileOptimizations: true,
                  suggest: {
                    showKeywords: true,
                    showSnippets: true,
                    showClasses: true,
                    showFunctions: true,
                    showVariables: true,
                    showModules: true,
                    showProperties: true,
                    showEvents: true,
                    showOperators: true,
                    showUnits: true,
                    showValues: true,
                    showConstants: true,
                    showEnums: true,
                    showEnumMembers: true,
                    showColors: true,
                    showFiles: true,
                    showReferences: true,
                    showFolders: true,
                    showTypeParameters: true,
                    showWords: true,
                    showUsers: true,
                    showIssues: true,
                  },
                  quickSuggestions: {
                    other: true,
                    comments: true,
                    strings: true,
                  },
                  parameterHints: {
                    enabled: true,
                  },
                  hover: {
                    enabled: true,
                  },
                  contextmenu: true,
                  mouseWheelZoom: true,
                  bracketPairColorization: {
                    enabled: true,
                  },
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                    highlightActiveIndentation: true,
                  },
                }}
              />
            </div>
            
            {/* Submit Button */}
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
      
      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}