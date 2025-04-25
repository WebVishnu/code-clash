import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Code, Users, Trophy, ArrowRight, Terminal, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="text-center">
                <div className="flex justify-center items-center space-x-3 mb-6">
                  <Swords className="h-12 w-12 text-indigo-500" />
                  <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
                    Code<span className="text-indigo-500">Clash</span>
                  </h1>
                </div>
                <p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl">
                  Battle other developers in real-time coding challenges. Improve your skills, climb the ranks, and become a coding champion.
                </p>
                <div className="mt-8 flex justify-center space-x-4">
                  {user ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/signup')}
                      className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:text-lg"
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-800 bg-opacity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Why Choose CodeClash?
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Experience coding challenges like never before
            </p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Real-time Battles */}
              <div className="pt-6">
                <div className="flow-root bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Real-time Battles</h3>
                    <p className="mt-5 text-base text-gray-400">
                      Compete against other developers in real-time coding battles. Solve problems faster and better than your opponents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Skill-based Matchmaking */}
              <div className="pt-6">
                <div className="flow-root bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Skill-based Matchmaking</h3>
                    <p className="mt-5 text-base text-gray-400">
                      Get matched with opponents of similar skill level. Progress through ranks as you improve.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rich Problem Library */}
              <div className="pt-6">
                <div className="flow-root bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                        <Code className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-white tracking-tight">Rich Problem Library</h3>
                    <p className="mt-5 text-base text-gray-400">
                      Hundreds of coding challenges across different difficulty levels and topics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to become a champion?</span>
            <span className="block text-indigo-500">Join CodeClash today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              {user ? (
                <button
                  onClick={() => navigate('/library')}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Go to Library
                </button>
              ) : (
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Get started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}