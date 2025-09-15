import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

// Read Judge0 configuration from environment
const JUDGE0_API_URL = Deno.env.get('JUDGE0_API_URL') || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = Deno.env.get('JUDGE0_API_KEY') || '';
const JUDGE0_API_HOST = Deno.env.get('JUDGE0_API_HOST') || 'judge0-ce.p.rapidapi.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info',
};

interface SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
}

interface TestCase {
  input: any;
  output: any;
}

async function createSubmission(data: SubmissionRequest) {
  console.log('Creating submission with data:', data);
  
  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': JUDGE0_API_KEY,
      'X-RapidAPI-Host': JUDGE0_API_HOST,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Judge0 API error: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('Judge0 API response:', result);
  return result;
}

function wrapCodeWithTestCase(code: string, language: string, testCase: TestCase): string {
  const inputJson = JSON.stringify(testCase.input);

  if (language === 'javascript') {
    // Expect user code to define a function named `solution(input)`
    return `${code}\n\n(() => {\n  const __input = ${inputJson};\n  try {\n    const __res = typeof solution === 'function' ? solution(__input) : null;\n    console.log(JSON.stringify(__res));\n  } catch (e) {\n    console.error(String(e));\n  }\n})();\n`;
  } else if (language === 'python') {
    // Expect user code to define a function named `solution(input)`
    return `${code}\n\nimport json\n__input = ${inputJson}\ntry:\n    __res = solution(__input)\n    print(json.dumps(__res))\nexcept Exception as e:\n    print(str(e))\n`;
  }

  throw new Error('Unsupported language');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { matchId, userId, code, language, problemId } = await req.json();
    console.log('Request payload:', { matchId, userId, language, problemId });

    let problem = null;

    if (matchId) {
      // Match mode - fetch problem from match_problems
      console.log('Fetching problem from match');
      const { data: matchProblem, error: matchProblemError } = await supabaseClient
        .from('match_problems')
        .select('problem:problem_id(*)')
        .eq('match_id', matchId)
        .single();

      if (matchProblemError) {
        console.error('Match problem error:', matchProblemError);
        throw new Error('Match problem not found');
      }

      problem = matchProblem.problem;
    } else {
      // Practice mode - fetch problem directly from coding_problems
      console.log('Fetching problem from coding_problems');
      const { data: practiceProblem, error: problemError } = await supabaseClient
        .from('coding_problems')
        .select('*')
        .eq('id', problemId)
        .single();

      if (problemError) {
        console.error('Problem error:', problemError);
        throw new Error('Practice problem not found');
      }

      problem = practiceProblem;
    }

    if (!problem) {
      throw new Error('Problem not found');
    }

    console.log('Found problem:', problem);
    
    let testCases: TestCase[];
    try {
      testCases = typeof problem.test_cases === 'string' 
        ? JSON.parse(problem.test_cases) 
        : problem.test_cases;
      
      console.log('Parsed test cases:', testCases);
    } catch (error) {
      console.error('Error parsing test cases:', error);
      throw new Error('Invalid test cases format');
    }

    // Run code against all test cases
    const results = await Promise.all(
      testCases.map(async (testCase, index) => {
        console.log(`Running test case ${index + 1}:`, testCase);
        
        const wrappedCode = wrapCodeWithTestCase(code, language, testCase);
        console.log('Wrapped code:', wrappedCode);
        
        const languageId = language === 'javascript' ? 63 : 71; // 63 for JS, 71 for Python
        
        const submission = await createSubmission({
          source_code: wrappedCode,
          language_id: languageId,
        });

        let output = submission.stdout?.trim() || '';
        let expectedOutput = JSON.stringify(testCase.output);
        
        // Try to parse the output if it's JSON
        try {
          output = JSON.parse(output);
          output = JSON.stringify(output);
        } catch (e) {
          // If parsing fails, use the raw output
        }

        console.log('Test case result:', {
          output,
          expectedOutput,
          error: submission.stderr,
          status: submission.status,
        });

        return {
          passed: output === expectedOutput,
          output,
          expectedOutput,
          error: submission.stderr,
          status: submission.status,
        };
      })
    );

    const allTestsPassed = results.every((result) => result.passed);
    const totalTests = results.length;
    const passedTests = results.filter((result) => result.passed).length;
    
    console.log('All test results:', results);
    console.log(`Tests passed: ${passedTests}/${totalTests}`);
    console.log('All tests passed:', allTestsPassed);

    // Update submission status if in a match
    if (matchId) {
      await supabaseClient
        .from('code_submissions')
        .update({
          status: allTestsPassed ? 'completed' : 'error',
        })
        .eq('match_id', matchId)
        .eq('user_id', userId);

      // If all tests passed, update match and user rank
      if (allTestsPassed) {
        // Get match details
        const { data: match } = await supabaseClient
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (match) {
          // Update match status
          await supabaseClient
            .from('matches')
            .update({
              status: 'completed',
              winner_id: userId,
            })
            .eq('id', matchId);
        }
      }
    }

    // Update user rank if all tests passed
    if (allTestsPassed) {
      const rankIncrease = problem.difficulty === 'easy' ? 5 : 
                         problem.difficulty === 'medium' ? 10 : 15;

      await supabaseClient.rpc('update_user_rank', {
        user_id: userId,
        rank_increase: rankIncrease,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        allTestsPassed,
        totalTests,
        passedTests,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});