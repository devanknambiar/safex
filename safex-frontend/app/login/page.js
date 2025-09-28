// File: app/login/page.js
// IMPROVED: Added the "SafeX" brand title to the login card.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const user = login(email, password); 
      
      if (user) {
        router.push('/'); 
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center text-white p-4 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-8">
          
          {/* --- THIS IS THE UPDATED HEADER SECTION --- */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-slate-300 tracking-wider mb-2">
              SafeX
            </h2>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
              Welcome Back
            </h1>
            <p className="text-slate-400 mt-2">
              Log in to access the Live Monitor
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            {error && (
              <p className="text-center text-sm text-red-400 bg-red-900/30 p-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-3 rounded-lg transition-all"
            >
              Log In
            </button>
          </form>
        </div>
        <div className="text-center mt-6">
          <Link href="/signup" className="text-sm text-slate-400 hover:text-cyan-300">
            Don't have an account? Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

