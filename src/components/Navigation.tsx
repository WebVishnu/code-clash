import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Swords, LogIn, UserPlus, LayoutDashboard, LogOut, User as UserIcon, BookOpen, Library, Trophy } from 'lucide-react';
import { supabase, initializeAuth } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }``
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    const initialize = async () => {
      const user = await initializeAuth();
      setUser(user);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
      ? 'bg-gray-900/95 backdrop-blur-sm shadow-lg shadow-indigo-900/20' 
      : 'bg-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center px-2 text-white">
              <Swords className={`h-6 w-6 ${scrolled ? 'text-indigo-400' : 'text-indigo-500'} transition-colors duration-300`} />
              <span className="ml-2 text-lg font-bold">CodeClash</span>
            </Link>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
                <Link
                  to="/library"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <Library className="h-4 w-4 mr-1" />
                  Library
                </Link>
                <Link
                  to="/practice"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Practice
                </Link>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  Leaderboard
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <UserIcon className="h-4 w-4 mr-1" />
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    scrolled 
                    ? 'bg-indigo-500 hover:bg-indigo-600' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  } transition-colors duration-300`}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    scrolled 
                    ? 'bg-indigo-500 hover:bg-indigo-600' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  } transition-colors duration-300`}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}