// File: app/page.js
// FINAL UPDATE: This version adds animations, a 1-minute offline check, and an improved error display.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

// --- ICONS (for new components) ---
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// UPDATED: Replaced the 'cute' animation with a more aggressive, dangerous-looking one.
const AnimationStyles = () => (
  <style jsx global>{`
    @keyframes critical-alert-flash {
      0%, 49% {
        background-color: rgba(220, 38, 38, 0.5); /* Bright Red background */
        border-color: rgba(248, 113, 113, 1);     /* Bright red border */
      }
      50%, 100% {
        background-color: rgba(15, 23, 42, 0.3); /* Default background */
        border-color: rgba(255, 255, 255, 0.1);
      }
    }
    .animate-critical-alert {
      animation: critical-alert-flash 0.8s infinite step-end;
    }
  `}</style>
);


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

// UPDATED: StatCard now uses the new 'animate-critical-alert' class
const StatCard = ({ title, value, unit, icon, color, trend, isOnline, isAlerting }) => (
    <div className={`backdrop-blur-xl border rounded-2xl shadow-lg p-5 transition-all duration-300 ${!isOnline && 'opacity-50'} ${isAlerting ? 'animate-critical-alert' : 'bg-slate-900/30 border-white/10'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`text-3xl ${color}`}>{icon}</div>
                <h3 className="font-medium text-slate-300">{title}</h3>
            </div>
            {isOnline && trend !== 'stable' && (
              <div className={`text-sm font-semibold ${trend === 'up' ? 'text-red-400' : 'text-red-400'}`}>
                {trend === 'up' ? '▲' : '▼'}
              </div>
            )}
             {isOnline && trend === 'stable' && (
              <div className="text-sm font-semibold text-slate-400">▬</div>
            )}
        </div>
        <div className="text-right mt-4">
            {isOnline ? (
                <p className="text-5xl font-bold text-white transition-colors duration-500">{value ?? '...'}</p>
            ) : (
                <p className="text-4xl font-bold text-amber-400 transition-colors duration-500">---</p>
            )}
            <p className="text-lg font-normal text-slate-400 -mt-1">{isOnline ? unit : 'No Signal'}</p>
        </div>
    </div>
);

const DeviceStatus = ({ deviceId, lastUpdate, isOnline }) => (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5">
        <h3 className="font-semibold text-white mb-3">Device Status</h3>
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Status</span>
            <span className={`flex items-center space-x-2 font-semibold text-sm ${isOnline ? 'text-green-400' : 'text-red-500'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></span>
                <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
        </div>
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Device ID</span>
            <span className="font-mono text-slate-300 text-sm">{deviceId || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Last Update</span>
            <span className="text-slate-300 text-sm">{lastUpdate}</span>
        </div>
    </div>
);

// UPDATED: AlertPanel logic now matches the new thresholds
const AlertPanel = ({ data, isOnline }) => {
    const highCO = isOnline && data?.mq7_volt > 0.6;
    const lowSpo2 = isOnline && data?.spo2_percent < 95 && data?.spo2_percent > 0;
    const criticalHeartRate = isOnline && (data?.heart_rate_bpm < 70 || data?.heart_rate_bpm > 130);
    
    return (
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold text-white mb-3">System Alerts</h3>
            <div className="space-y-3">
                {criticalHeartRate && (
                     <div className="flex items-start space-x-3 text-sm">
                        <span className="text-red-400 mt-1 animate-pulse">●</span>
                        <p className="text-slate-300"><span className="font-semibold text-white">Critical Heart Rate:</span> {data.heart_rate_bpm} bpm</p>
                    </div>
                )}
                {highCO && (
                    <div className="flex items-start space-x-3 text-sm">
                        <span className="text-red-400 mt-1 animate-pulse">●</span>
                        <p className="text-slate-300"><span className="font-semibold text-white">High CO Detected:</span> {data.mq7_volt.toFixed(2)} V</p>
                    </div>
                )}
                {lowSpo2 && (
                    <div className="flex items-start space-x-3 text-sm">
                        <span className="text-amber-400 mt-1 animate-pulse">●</span>
                        <p className="text-slate-300"><span className="font-semibold text-white">Low SpO₂ Warning:</span> {data.spo2_percent}%</p>
                    </div>
                )}
                {!highCO && !lowSpo2 && !criticalHeartRate && isOnline && (
                    <div className="flex items-start space-x-3 text-sm">
                        <span className="text-green-400 mt-1">●</span>
                        <p className="text-slate-300"><span className="font-semibold text-white">System Nominal:</span> All vitals stable.</p>
                    </div>
                )}
                {!isOnline && (
                     <div className="flex items-start space-x-3 text-sm">
                        <span className="text-red-500 mt-1">●</span>
                        <p className="text-slate-300"><span className="font-semibold text-white">Device Offline:</span> No new data.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// NEW: A prominent, dismissible error banner
const ErrorBanner = ({ message, onClose }) => (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-red-500/30 backdrop-blur-lg border border-red-500/50 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <AlertTriangleIcon />
            <span className="font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <XIcon />
        </button>
    </div>
);


// --- MAIN PAGE ---
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const { isAuthenticated, logout, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/latest-data');
      if (!response.ok) {
        throw new Error(`Network response error: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setError('');
    } catch (e) {
      console.error("Failed to fetch data:", e);
      setError('Failed to load data. Is the backend server running?');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!data) return; 

    const checkOnlineStatus = setInterval(() => {
      const timeSinceLastData = new Date() - new Date(data.receivedAt);
      if (timeSinceLastData > 60000) {
        if (isOnline) setIsOnline(false);
      } else {
        if (!isOnline) setIsOnline(true);
      }
    }, 5000);

    return () => clearInterval(checkOnlineStatus);
  }, [data, isOnline]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const lastUpdate = data ? new Date(data.receivedAt).toLocaleString() : 'Waiting for data...';
    
    // --- KEY CHANGE: Updated alert conditions to match user feedback ---
    const isCriticalHeartRate = data?.heart_rate_bpm < 70 || data?.heart_rate_bpm > 130;
    const heartRateTrend = data?.heart_rate_bpm > 130 ? 'up' : data?.heart_rate_bpm < 70 ? 'down' : 'stable';

    const isLowSpo2 = data?.spo2_percent < 95 && data?.spo2_percent > 0;
    const isHighCO = data?.mq7_volt > 0.6;
    
    return (
      <>
        <AnimationStyles />
        <Navbar onLogout={logout} />
        {error && <ErrorBanner message={error} onClose={() => setError('')} />}
        
        <main className="min-h-screen text-white p-4 sm:p-8 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
          <div className="max-w-7xl mx-auto pt-24">
            <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                  Live Operation Monitor
                </h1>
                <p className="text-slate-400 mt-2 text-lg">
                  Welcome, {user?.name || user?.email}!
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link href="/profile" className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-2 px-4 rounded-full text-sm">
                  View Profile
                </Link>
              </div>
            </header>
            
            {!isOnline && (
              <div className="text-center text-amber-300 bg-amber-900/50 p-3 rounded-lg mb-6 border border-amber-500/50 animate-pulse">
                Warning: Device is not relaying data properly. Last seen over a minute ago.
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <StatCard title="Heart Rate" value={data?.heart_rate_bpm} unit="bpm" icon="❤️" color="text-red-400" trend={heartRateTrend} isOnline={isOnline} isAlerting={isOnline && isCriticalHeartRate}/>
                <StatCard title="SpO₂" value={data?.spo2_percent} unit="%" icon="💨" color="text-sky-400" trend={isLowSpo2 ? 'down' : 'stable'} isOnline={isOnline} isAlerting={isOnline && isLowSpo2}/>
                <StatCard title="Temperature" value={data?.temperature_C} unit="°C" icon="🌡️" color="text-orange-400" trend="stable" isOnline={isOnline} isAlerting={false}/>
                <StatCard title="Humidity" value={data?.humidity_percent} unit="%" icon="💧" color="text-blue-400" trend="stable" isOnline={isOnline} isAlerting={false}/>
                <StatCard title="CO Sensor" value={data?.mq7_volt?.toFixed(3)} unit="V" icon="🔥" color="text-amber-400" trend={isHighCO ? 'up' : 'stable'} isOnline={isOnline} isAlerting={isOnline && isHighCO}/>
                <StatCard title="LPG Sensor" value={data?.mq6_volt?.toFixed(3)} unit="V" icon="🏭" color="text-slate-400" trend="stable" isOnline={isOnline} isAlerting={false}/>
              </div>

              <div className="space-y-6">
                <DeviceStatus deviceId={data?.device_id} lastUpdate={lastUpdate} isOnline={isOnline}/>
                <AlertPanel data={data} isOnline={isOnline} />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return null;
}

