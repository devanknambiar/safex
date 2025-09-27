// File: app/page.js
// UPDATED: This version now fetches and displays real-time data from your backend.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

// --- COMPONENTS ---
const Navbar = ({ onLogout }) => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
    <div className="mx-4 p-2.5 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-slate-900">W</div>
          <span className="font-semibold text-white">Wearable Monitor</span>
        </div>
        <button onClick={onLogout} className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-1.5 px-4 rounded-full text-sm">
          Logout
        </button>
      </div>
    </div>
  </nav>
);
const StatCard = ({ title, value, unit, icon, color, trend }) => ( <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5 transition-all hover:bg-slate-800/40 hover:border-cyan-400/50"><div className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className={`text-3xl ${color}`}>{icon}</div><h3 className="font-medium text-slate-300">{title}</h3></div><div className={`text-sm font-semibold ${trend === 'up' ? 'text-green-400' : 'text-slate-400'}`}>{trend === 'up' ? '▲' : '▬'}</div></div><div className="text-right mt-4"><p className="text-5xl font-bold text-white">{value ?? '...'}</p><p className="text-lg font-normal text-slate-400 -mt-1">{unit}</p></div></div>);
const DeviceStatus = ({ deviceId, lastUpdate, isOnline }) => ( <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5"><h3 className="font-semibold text-white mb-3">Device Status</h3><div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Status</span><span className={`flex items-center space-x-2 font-semibold text-sm ${isOnline ? 'text-green-400' : 'text-amber-400'}`}><span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`}></span><span>{isOnline ? 'Online' : 'Connected'}</span></span></div><div className="flex items-center justify-between mb-2"><span className="text-slate-400 text-sm">Device ID</span><span className="font-mono text-slate-300 text-sm">{deviceId || 'N/A'}</span></div><div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Last Update</span><span className="text-slate-300 text-sm">{lastUpdate}</span></div></div>);
const AlertPanel = () => ( <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5"><h3 className="font-semibold text-white mb-3">System Alerts</h3><div className="space-y-3"><div className="flex items-start space-x-3 text-sm"><span className="text-red-400 mt-1">●</span><p className="text-slate-300"><span className="font-semibold text-white">High CO Detected:</span> 15 ppm at 09:42 AM</p></div><div className="flex items-start space-x-3 text-sm"><span className="text-amber-400 mt-1">●</span><p className="text-slate-300"><span className="font-semibold text-white">Low SpO₂ Warning:</span> 94% at 09:40 AM</p></div><div className="flex items-start space-x-3 text-sm"><span className="text-green-400 mt-1">●</span><p className="text-slate-300"><span className="font-semibold text-white">System Nominal:</span> All vitals stable.</p></div></div></div>);

// --- MAIN PAGE ---
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();
  const { isAuthenticated, logout, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // --- 1. THIS FUNCTION IS NOW ACTIVE ---
  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/latest-data');
      if (!response.ok) {
        throw new Error(`Network response error: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setError(''); // Clear any previous errors on success
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError('Failed to load data. Is the backend server running?');
    }
  };

  // --- 2. THIS EFFECT NOW RUNS A TIMER FOR REAL-TIME UPDATES ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchData(); // Fetch data immediately when the component loads
      
      // Set up an interval to fetch data every 5 seconds (5000 milliseconds)
      const interval = setInterval(fetchData, 5000);

      // Clean up the interval when the component unmounts to prevent memory leaks
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]); // This effect runs when the user's authentication status changes

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    // --- 3. DYNAMIC DATA IS NOW USED HERE ---
    const lastUpdate = data ? new Date(data.receivedAt).toLocaleString() : 'Waiting for data...';
    
    return (
      <>
        <Navbar onLogout={logout} />
        <main className="min-h-screen text-white p-4 sm:p-8 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
          <div className="max-w-7xl mx-auto pt-24">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                  Live Operation Monitor
                </h1>
                <p className="text-slate-400 mt-2 text-lg">
                  Welcome, {user?.email}!
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link href="/profile" className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors duration-300">
                  View Profile
                </Link>
              </div>
            </header>
            
            {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg mb-6">{error}</p>}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg-col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <StatCard title="Heart Rate" value={data?.vitals?.heartRate} unit="bpm" icon="❤️" color="text-red-400" trend={data?.vitals?.heartRate > 100 ? 'up' : 'stable'} />
                <StatCard title="SpO₂" value={data?.vitals?.spo2} unit="%" icon="💨" color="text-sky-400" trend="stable" />
                <StatCard title="CO Level" value={data?.gas?.co} unit="ppm" icon="🔥" color="text-amber-400" trend={data?.gas?.co > 10 ? 'up' : 'stable'}/>
                <StatCard title="LPG Level" value={data?.gas?.lpg} unit="ppm" icon="🏭" color="text-slate-400" trend="stable" />
              </div>
              <div className="space-y-6">
                <DeviceStatus deviceId={data?.deviceId} lastUpdate={lastUpdate} isOnline={!!data && !error}/>
                <AlertPanel />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return null;
}

