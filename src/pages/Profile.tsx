import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Trophy, Mail, Calendar, LogOut, Swords, Shield, Target, Bolt, Activity, Award, BarChart2, Clock } from 'lucide-react';
import type { Profile } from '../lib/supabase';

// Extended profile type to include the new stats fields
interface ExtendedProfile extends Profile {
  wins?: number;
  losses?: number;
  total_matches?: number;
  elo_rating?: number;
  username?: string;
}

// Interface for match history record
interface MatchHistoryRecord {
  id: string;
  match_id: string;
  opponent_id: string;
  result: 'win' | 'loss' | 'draw';
  rating_change: number;
  previous_rating: number;
  new_rating: number;
  created_at: string;
  opponent: {
    username?: string;
    email: string;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/login');
          return;
        }

        setUser(user);

        const { data: profile } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profile);

        if (profile) {
          setUsernameInput(profile.username || '');
          
          // Fetch recent match history
          const { data: matchHistory } = await supabase
            .from('match_history')
            .select(`
              *,
              opponent:opponent_id (username, email)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (matchHistory) {
            setMatchHistory(matchHistory);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const saveUsername = async () => {
    if (!profile || !usernameInput.trim()) return;
    
    setSavingUsername(true);
    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ username: usernameInput.trim() })
        .eq('id', profile.id);
        
      if (error) throw error;
      
      setProfile({ ...profile, username: usernameInput.trim() });
      setEditingUsername(false);
    } catch (err) {
      console.error('Error updating username:', err);
    } finally {
      setSavingUsername(false);
    }
  };

  const getRankIcon = (rank: string | null | undefined) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-xl font-game">Loading profile data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 bg-opacity-80 shadow-2xl rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
          {/* Header */}
          <div className="px-6 py-8 border-b border-indigo-500/30 relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden opacity-20">
              <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-indigo-600 rounded-full mix-blend-overlay filter blur-xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-600 rounded-full mix-blend-overlay filter blur-xl"></div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between relative z-10">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                  {getRankIcon(profile?.rank)}
                </div>
                <div>
                  <div className="flex items-center">
                    {editingUsername ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                          className="bg-gray-800 text-white border border-indigo-500/50 rounded-md px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter username"
                        />
                        <button
                          onClick={saveUsername}
                          disabled={savingUsername || !usernameInput.trim()}
                          className="px-3 py-2 bg-indigo-600 rounded-md text-white disabled:opacity-50"
                        >
                          {savingUsername ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingUsername(false);
                            setUsernameInput(profile?.username || '');
                          }}
                          className="px-3 py-2 ml-2 bg-gray-700 rounded-md text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-white">
                          {profile?.username || 'Anonymous Coder'}
                        </h1>
                        <button
                          onClick={() => setEditingUsername(true)}
                          className="ml-2 p-1 text-indigo-400 hover:text-white"
                          aria-label="Edit username"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-indigo-300">
                    Rank: <span className="text-white capitalize">{profile?.rank || 'Unranked'}</span>
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-red-500 rounded-md text-sm font-bold text-red-400 bg-transparent hover:bg-red-500 hover:text-white transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-5 border border-indigo-500/20 flex items-center">
                <div className="p-3 bg-indigo-900/50 rounded-lg mr-4">
                  <Award className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-indigo-300">ELO Rating</p>
                  <p className="text-2xl font-bold text-white">{profile?.elo_rating || 1000}</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-5 border border-indigo-500/20 flex items-center">
                <div className="p-3 bg-green-900/50 rounded-lg mr-4">
                  <Swords className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-indigo-300">Win/Loss</p>
                  <p className="text-2xl font-bold text-white">
                    <span className="text-green-400">{profile?.wins || 0}</span> / <span className="text-red-400">{profile?.losses || 0}</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-5 border border-indigo-500/20 flex items-center">
                <div className="p-3 bg-blue-900/50 rounded-lg mr-4">
                  <BarChart2 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-indigo-300">Win Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {profile?.total_matches ? Math.round((profile.wins || 0) / profile.total_matches * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-5 border border-indigo-500/20 flex items-center">
                <div className="p-3 bg-purple-900/50 rounded-lg mr-4">
                  <Activity className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-indigo-300">Total Matches</p>
                  <p className="text-2xl font-bold text-white">{profile?.total_matches || 0}</p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-gray-800/30 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-indigo-500/20">
                <h2 className="text-xl font-bold text-white">Account Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <Mail className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-300">Email</p>
                    <p className="text-lg font-medium text-white">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gray-700 rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-300">Member Since</p>
                    <p className="text-lg font-medium text-white">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Match History */}
            <div className="bg-gray-800/30 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gray-800/50 border-b border-indigo-500/20">
                <h2 className="text-xl font-bold text-white">Recent Matches</h2>
              </div>
              
              {matchHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                  <p className="text-lg text-white">No match history yet</p>
                  <p className="text-indigo-300 mt-1">Start competing to see your match history!</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white text-sm font-medium"
                  >
                    Find a Match
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="bg-gray-800/70 text-indigo-300 text-left">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Opponent</th>
                        <th className="px-6 py-3">Result</th>
                        <th className="px-6 py-3">Rating Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchHistory.map((match, index) => (
                        <tr 
                          key={match.id} 
                          className={`${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/50'} hover:bg-indigo-900/30 transition-colors duration-150`}
                        >
                          <td className="px-6 py-4">
                            {new Date(match.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {match.opponent?.username || match.opponent?.email || 'Unknown Opponent'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold uppercase ${
                              match.result === 'win' 
                                ? 'text-green-400' 
                                : match.result === 'loss' 
                                  ? 'text-red-400' 
                                  : 'text-indigo-400'
                            }`}>
                              {match.result}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono">
                            <span className={`font-medium ${match.rating_change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {match.rating_change > 0 ? '+' : ''}{match.rating_change}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}