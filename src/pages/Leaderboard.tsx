import React, { useEffect, useState } from 'react';
import { Trophy, Shield, Target, Bolt, Users, Award, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Define the structure of leaderboard user data
interface LeaderboardUser {
  id: string;
  username: string;
  rank: string;
  wins: number;
  losses: number;
  total_matches: number;
  win_rate: number;
  elo_rating: number;
}

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof LeaderboardUser>('elo_rating');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch users with their stats
        const { data, error } = await supabase
          .from('users_profile')
          .select('id, username, rank, wins, losses, total_matches, elo_rating')
          .order(sortField, { ascending: sortDirection === 'asc' });
          
        if (error) throw error;
        
        if (data) {
          // Calculate win rate for each user
          const usersWithWinRate = data.map(user => ({
            ...user,
            win_rate: user.total_matches > 0 ? Math.round((user.wins / user.total_matches) * 100) : 0
          }));
          
          setUsers(usersWithWinRate);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [sortField, sortDirection]);

  const handleSort = (field: keyof LeaderboardUser) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank?.toLowerCase()) {
      case 'beginner':
        return <Shield className="h-5 w-5 text-green-400" />;
      case 'intermediate':
        return <Trophy className="h-5 w-5 text-blue-400" />;
      case 'advanced':
        return <Target className="h-5 w-5 text-purple-400" />;
      case 'expert':
        return <Bolt className="h-5 w-5 text-yellow-400" />;
      default:
        return <Shield className="h-5 w-5 text-green-400" />;
    }
  };

  const getSortIcon = (field: keyof LeaderboardUser) => {
    if (field !== sortField) return null;
    
    return sortDirection === 'asc' 
      ? <span className="ml-1">↑</span> 
      : <span className="ml-1">↓</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-xl font-game">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900 bg-opacity-80 shadow-2xl rounded-2xl border border-indigo-500/30 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-8 border-b border-indigo-500/30 pb-4">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-400 mr-3" />
              <h1 className="text-3xl font-bold text-white">GLOBAL LEADERBOARD</h1>
            </div>
            <div className="text-indigo-300">
              Top coders ranked by performance
            </div>
          </div>
          
          {error ? (
            <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-4 rounded-md">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-white text-lg">No ranking data available yet</p>
              <p className="text-indigo-300 mt-2">Start competing to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-white">
                <thead className="bg-indigo-900/50 border-b border-indigo-600/30">
                  <tr>
                    <th className="px-6 py-3 text-indigo-300 text-center">#</th>
                    <th className="px-6 py-3 text-indigo-300">Coder</th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('rank')}
                    >
                      Rank {getSortIcon('rank')}
                    </th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('elo_rating')}
                    >
                      Rating {getSortIcon('elo_rating')}
                    </th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('wins')}
                    >
                      Wins {getSortIcon('wins')}
                    </th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('losses')}
                    >
                      Losses {getSortIcon('losses')}
                    </th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('win_rate')}
                    >
                      Win Rate {getSortIcon('win_rate')}
                    </th>
                    <th 
                      className="px-6 py-3 text-indigo-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('total_matches')}
                    >
                      Matches {getSortIcon('total_matches')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`${index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/50'} 
                        ${index < 3 ? 'border-l-4' : ''}
                        ${index === 0 ? 'border-yellow-400' : index === 1 ? 'border-gray-400' : index === 2 ? 'border-amber-700' : ''} 
                        hover:bg-indigo-900/30 transition-colors duration-150`}
                    >
                      <td className="px-6 py-4 text-center">
                        {index === 0 ? (
                          <Crown className="h-6 w-6 text-yellow-400 mx-auto" />
                        ) : (
                          <span className={`${index < 3 ? 'font-bold' : ''} ${index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : ''}`}>
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {user.username || `User ${index + 1}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getRankIcon(user.rank)}
                          <span className="ml-2">
                            {user.rank || 'Beginner'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {user.elo_rating || 1000}
                      </td>
                      <td className="px-6 py-4 text-green-400 font-medium">
                        {user.wins || 0}
                      </td>
                      <td className="px-6 py-4 text-red-400">
                        {user.losses || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
                          <div 
                            className="bg-indigo-500 h-2.5 rounded-full" 
                            style={{ width: `${user.win_rate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-indigo-300">{user.win_rate}%</div>
                      </td>
                      <td className="px-6 py-4 text-indigo-300">
                        {user.total_matches || 0}
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
  );
} 