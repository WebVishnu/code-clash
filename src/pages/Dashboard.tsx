import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import { Users, AlertCircle, ArrowLeft, Swords, Trophy, Target, Shield, Bolt, Code } from 'lucide-react';

const RANK_DIFFERENCE_THRESHOLD = 50;
const QUEUE_TIMEOUT_MS = 300000; // 5 minutes

interface MatchFoundInfo {
  opponent: Profile;
  matchId: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inQueue, setInQueue] = useState(false);
  const [inMatch, setInMatch] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueTimer, setQueueTimer] = useState<number | null>(null);
  const [matchChannel, setMatchChannel] = useState<any>(null);
  const [matchFound, setMatchFound] = useState<MatchFoundInfo | null>(null);

  // Handle page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (profile) {
        if (inQueue) {
          // Remove from queue if user refreshes while in queue
          await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', profile.id);
        }
        if (inMatch && matchId) {
          // End match if user refreshes during a match
          await supabase
            .from('matches')
            .update({ status: 'completed' })
            .eq('id', matchId);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Clean up when component unmounts
    };
  }, [profile, inQueue, inMatch, matchId]);

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile) {
          throw new Error('Profile not found');
        }

        setProfile(profile);

        // Check if user is in an active match
        const { data: activeMatch } = await supabase
          .from('matches')
          .select('*, player1:player1_id(*), player2:player2_id(*)')
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .eq('status', 'pending')
          .maybeSingle();

        if (activeMatch) {
          // Redirect to match page if user is in an active match
          navigate(`/match/${activeMatch.id}`);
          return;
        }

        // Check if user is in queue
        const { data: queueEntry } = await supabase
          .from('match_queue')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (queueEntry) {
          // Remove from queue if found (in case of page refresh)
          await supabase
            .from('match_queue')
            .delete()
            .eq('user_id', user.id);
        }

      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    getProfile();

    return () => {
      if (matchChannel) {
        matchChannel.unsubscribe();
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (!profile) return;

    const queueChannel = supabase
      .channel('queue_notifications')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'match_queue',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          console.log('Queue entry deleted');
          setInQueue(false);
          clearQueueTimeout();
        }
      )
      .subscribe();

    return () => {
      queueChannel.unsubscribe();
    };
  }, [profile]);

  const subscribeToMatchNotifications = (userId: string) => {
    console.log('Subscribing to match notifications for user:', userId);
    
    if (matchChannel) {
      console.log('Unsubscribing from existing match channel');
      matchChannel.unsubscribe();
    }

    const channel = supabase
      .channel('match_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          console.log('Match notification received:', payload);
          const match = payload.new;
          
          if (!match || !match.id) {
            console.error('Invalid match data received');
            return;
          }

          // Check if the user is part of this match
          if (match.player1_id === userId || match.player2_id === userId) {
            console.log('Match found:', match);
            
            // Get opponent info
            const { data: matchDetails } = await supabase
              .from('matches')
              .select('*, player1:player1_id(*), player2:player2_id(*)')
              .eq('id', match.id)
              .single();

            if (matchDetails) {
                if (inQueue) {
                  console.log('Leaving queue before showing match found screen');
                  await leaveQueue();
                }

                setInMatch(true);
                setMatchId(match.id);
                // Immediately redirect to match page
                navigate(`/match/${match.id}`);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Match channel subscription status:', status);
      });

    setMatchChannel(channel);
  };

  const calculateUserRank = (profileRank: string | null): number => {
    const numericRank = Number(profileRank);
    if (!isNaN(numericRank)) {
      return numericRank;
    }

    const rankMap: Record<string, number> = {
      'beginner': 1000,
      'intermediate': 1500,
      'advanced': 2000,
      'expert': 2500
    };

    if (!profileRank || !rankMap[profileRank.toLowerCase()]) {
      return rankMap['beginner'];
    }

    return rankMap[profileRank.toLowerCase()];
  };

  const findMatch = async (userRank: number) => {
    try {
      const { data: exactMatches, error: exactMatchError } = await supabase
        .from('match_queue')
        .select('*')
        .neq('user_id', profile?.id)
        .eq('rank', userRank)
        .order('created_at', { ascending: true })
        .limit(1);

      if (exactMatchError) throw exactMatchError;

      if (exactMatches && exactMatches.length > 0) {
        return await createMatch(exactMatches[0]);
      }

      const { data: rankedMatches, error: searchError } = await supabase
        .from('match_queue')
        .select('*')
        .neq('user_id', profile?.id)
        .gte('rank', userRank - RANK_DIFFERENCE_THRESHOLD)
        .lte('rank', userRank + RANK_DIFFERENCE_THRESHOLD)
        .order('created_at', { ascending: true })
        .limit(1);

      if (searchError) throw searchError;

      if (rankedMatches && rankedMatches.length > 0) {
        return await createMatch(rankedMatches[0]);
      }

      return null;
    } catch (error) {
      console.error('Error finding match:', error);
      throw error;
    }
  };

  const createMatch = async (opponent: any) => {
    console.log('Creating match with opponent:', opponent);
    
    const { data: opponentCheck } = await supabase
      .from('match_queue')
      .select('*')
      .eq('user_id', opponent.user_id)
      .single();

    if (!opponentCheck) {
      console.log('Opponent no longer in queue');
      return null;
    }

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        player1_id: profile?.id,
        player2_id: opponent.user_id,
        status: 'pending'
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating match:', matchError);
      throw matchError;
    }

    console.log('Match created successfully:', match);

    const { data: problems, error: problemsError } = await supabase
      .from('coding_problems')
      .select('id');

    if (problemsError) {
      console.error('Error fetching problems:', problemsError);
      throw problemsError;
    }

    if (!problems || problems.length === 0) {
      console.error('No problems found in the database');
      throw new Error('No problems found in the database');
    }

    const randomIndex = Math.floor(Math.random() * problems.length);
    const randomProblemId = problems[randomIndex].id;

    const { error: matchProblemError } = await supabase
      .from('match_problems')
      .insert({
        match_id: match.id,
        problem_id: randomProblemId
      });

    if (matchProblemError) {
      console.error('Error creating match_problem entry:', matchProblemError);
      throw matchProblemError;
    }

    await Promise.all([
      supabase
        .from('match_queue')
        .delete()
        .eq('user_id', profile?.id),
      supabase
        .from('match_queue')
        .delete()
        .eq('user_id', opponent.user_id)
    ]);

    return match;
  };

  const setQueueTimeout = () => {
    const timeoutId = window.setTimeout(async () => {
      if (profile && inQueue) {
        await leaveQueue();
        setError('Match search timed out. Please try again.');
      }
    }, QUEUE_TIMEOUT_MS);
    setQueueTimer(timeoutId);
  };

  const clearQueueTimeout = () => {
    if (queueTimer) {
      window.clearTimeout(queueTimer);
      setQueueTimer(null);
    }
  };

  const joinQueue = async () => {
    if (!profile) return;

    setSearching(true);
    setError(null);
    try {
      const userRank = calculateUserRank(profile.rank);
      
      const { data: existingQueue } = await supabase
        .from('match_queue')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingQueue) {
        console.log('User already in queue');
        setInQueue(true);
        setQueueTimeout();
        subscribeToMatchNotifications(profile.id);
        return;
      }

      console.log('Adding user to queue with rank:', userRank);

      const { error: queueError } = await supabase
        .from('match_queue')
        .insert({
          user_id: profile.id,
          rank: userRank,
        });

      if (queueError) throw queueError;
      
      console.log('Successfully joined queue');
      setInQueue(true);
      setQueueTimeout();
      
      subscribeToMatchNotifications(profile.id);

      const match = await findMatch(userRank);
      if (match) {
        console.log('Match found immediately:', match);
        setInMatch(true);
        setMatchId(match.id);
        // Immediately redirect to match page if match is found
        navigate(`/match/${match.id}`);
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      setError('Failed to join queue');
      setInQueue(false);
    } finally {
      setSearching(false);
    }
  };

  const leaveQueue = async () => {
    if (!profile) return;

    try {
      console.log('Leaving queue');
      const { error } = await supabase
        .from('match_queue')
        .delete()
        .eq('user_id', profile.id);

      if (error) throw error;
      
      console.log('Successfully left queue');
      setInQueue(false);
      clearQueueTimeout();
      setError(null);

      if (matchChannel) {
        console.log('Unsubscribing from match channel');
        matchChannel.unsubscribe();
        setMatchChannel(null);
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
      setError('Failed to leave queue');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-xl font-game">Loading battle arena...</div>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: string | null) => {
    switch (rank?.toLowerCase()) {
      case 'beginner':
        return <Shield className="h-6 w-6 text-green-400" />;
      case 'intermediate':
        return <Trophy className="h-6 w-6 text-blue-400" />;
      case 'advanced':
        return <Target className="h-6 w-6 text-purple-400" />;
      case 'expert':
        return <Bolt className="h-6 w-6 text-yellow-400" />;
      default:
        return <Shield className="h-6 w-6 text-green-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 bg-fixed overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="bg-gray-900 bg-opacity-80 shadow-2xl rounded-2xl border border-indigo-500/30 backdrop-blur-sm p-6">
          {/* Header with player info */}
          <div className="flex justify-between items-center mb-10 border-b border-indigo-500/30 pb-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-900 rounded-full">
                <Code className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">BATTLE ARENA</h1>
                <p className="text-indigo-300">Ready to code and conquer?</p>
              </div>
            </div>
            
            {profile && (
              <div className="flex items-center space-x-3 px-4 py-2 bg-indigo-900/50 rounded-lg border border-indigo-600/50">
                <div className="flex items-center space-x-2">
                  {getRankIcon(profile.rank)}
                  <div className="text-lg font-semibold text-white">
                    {profile.rank ? profile.rank.toUpperCase() : 'BEGINNER'}
                  </div>
                </div>
                <div className="h-8 w-px bg-indigo-600/50"></div>
                <div className="text-indigo-300">
                  <span className="text-xl font-bold text-white">0</span> W / <span className="text-xl font-bold text-white">0</span> L
                </div>
              </div>
            )}
          </div>
          
          {/* Main content area */}
          <div className="flex flex-col items-center justify-center mb-10 py-10">
            {inQueue ? (
              <div className="flex flex-col items-center justify-center text-center p-10">
                <div className="relative mb-10">
                  <div className="absolute inset-0 animate-ping bg-indigo-500 opacity-30 rounded-full"></div>
                  <div className="relative w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Swords className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">SEARCHING FOR OPPONENT</h2>
                <p className="text-indigo-300 mb-8">Matching you with a worthy challenger...</p>
                
                <div className="flex space-x-2 justify-center mt-6">
                  <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce animation-delay-200"></div>
                  <div className="h-3 w-3 bg-indigo-500 rounded-full animate-bounce animation-delay-400"></div>
                </div>
                
                <button
                  onClick={leaveQueue}
                  className="mt-12 px-6 py-3 border-2 border-red-500 rounded-md text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-900"
                >
                  CANCEL SEARCH
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-8 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition duration-1000 group-hover:duration-200"></div>
                  <button
                    onClick={joinQueue}
                    disabled={searching}
                    className="relative px-10 py-10 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-full text-white font-bold text-xl hover:from-indigo-500 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 shadow-xl"
                  >
                    <div className="flex flex-col items-center">
                      <Swords className="h-12 w-12 mb-3" />
                      <span className="text-2xl">FIND A MATCH</span>
                    </div>
                  </button>
                </div>
                <p className="text-indigo-300 mt-4 mb-8 max-w-md">
                  Challenge other coders to a battle of wits and syntax. Show off your coding prowess in real-time matches!
                </p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 rounded-md bg-red-900/50 border border-red-500/50 flex items-center max-w-md">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Stats and options */}
          {!inQueue && profile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-indigo-900/30 rounded-xl p-6 border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 group">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-xl font-bold text-white">LEADERBOARD</h3>
                </div>
                <p className="text-indigo-300 mb-4">See how you rank against other players</p>
                <button onClick={() => navigate('/leaderboard')} className="w-full py-2 bg-indigo-600/50 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200 group-hover:bg-indigo-500">
                  VIEW RANKINGS
                </button>
              </div>
              
              <div className="bg-indigo-900/30 rounded-xl p-6 border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 group">
                <div className="flex items-center space-x-3 mb-4">
                  <Target className="h-6 w-6 text-green-500" />
                  <h3 className="text-xl font-bold text-white">PRACTICE</h3>
                </div>
                <p className="text-indigo-300 mb-4">Hone your skills before the real battle</p>
                <button onClick={() => navigate('/practice')} className="w-full py-2 bg-indigo-600/50 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200 group-hover:bg-indigo-500">
                  START PRACTICE
                </button>
              </div>
              
              <div className="bg-indigo-900/30 rounded-xl p-6 border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 group">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-bold text-white">PROFILE</h3>
                </div>
                <p className="text-indigo-300 mb-4">View your stats and match history</p>
                <button onClick={() => navigate('/profile')} className="w-full py-2 bg-indigo-600/50 hover:bg-indigo-600 text-white rounded-md transition-colors duration-200 group-hover:bg-indigo-500">
                  VIEW PROFILE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}