'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- ICONS ---
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const AnimationStyles = () => (
  <style jsx global>{`
    @keyframes critical-alert-flash {
      0%, 49% { background-color: rgba(220, 38, 38, 0.5); border-color: rgba(248, 113, 113, 1); }
      50%, 100% { background-color: rgba(15, 23, 42, 0.3); border-color: rgba(255, 255, 255, 0.1); }
    }
    .animate-critical-alert { animation: critical-alert-flash 0.8s infinite step-end; }
  `}</style>
);

// --- COMPONENTS ---
const Navbar = () => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
    <div className="mx-4 p-2.5 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-slate-900">W</div>
          <span className="font-semibold text-white">Wearable Monitor</span>
        </div>
        <Link href="/login" className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-1.5 px-4 rounded-full text-sm">
          Logout
        </Link>
      </div>
    </div>
  </nav>
);

const StatCard = ({ title, value, unit, icon, color, trend, isOnline, isAlerting }) => (
    <div className={`backdrop-blur-xl border rounded-2xl shadow-lg p-5 transition-all duration-300 ${!isOnline && 'opacity-50'} ${isAlerting ? 'animate-critical-alert' : 'bg-slate-900/30 border-white/10'}`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={`text-3xl ${color}`}>{icon}</div>
                <h3 className="font-medium text-slate-300">{title}</h3>
            </div>
            {isOnline && <div className="text-sm font-semibold text-slate-400">{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '▬'}</div>}
        </div>
        <div className="text-right mt-4">
            <p className="text-5xl font-bold text-white">{isOnline ? (value ?? '...') : '---'}</p>
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

const AlertPanel = ({ data, isOnline }) => {
    const highCO = isOnline && data?.mq7_volt > 0.6;
    const lowSpo2 = isOnline && data?.spo2_percent < 95 && data?.spo2_percent > 0;
    const criticalHR = isOnline && (data?.heart_rate_bpm < 70 || data?.heart_rate_bpm > 130);
    
    return (
        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold text-white mb-3">System Alerts</h3>
            <div className="space-y-3 text-sm">
                {criticalHR && <p className="text-slate-300"><span className="text-red-400">●</span> Critical HR: {data.heart_rate_bpm} bpm</p>}
                {highCO && <p className="text-slate-300"><span className="text-red-400">●</span> High CO: {data.mq7_volt.toFixed(2)} V</p>}
                {lowSpo2 && <p className="text-slate-300"><span className="text-amber-400">●</span> Low SpO₂: {data.spo2_percent}%</p>}
                {!highCO && !lowSpo2 && !criticalHR && isOnline && <p className="text-slate-300"><span className="text-green-400">●</span> System Nominal</p>}
                {!isOnline && <p className="text-slate-300"><span className="text-red-500">●</span> Device Offline</p>}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Hardcoded User for Demo/Prototype
  const user = { name: "Devank", email: "devank@sit.ac.in" };

  const fetchData = async () => {
    try {
      // Prioritize the environment variable, fallback to localhost for development
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/latest-data`);
      
      if (!response.ok) throw new Error('Network error');
      
      const result = await response.json();
      setData(result);
      setError('');

      // 1-minute offline check
      const timeSinceLastData = new Date() - new Date(result.receivedAt);
      setIsOnline(timeSinceLastData < 60000);
    } catch (e) {
      setError('Connection lost to backend server.');
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const lastUpdate = data ? new Date(data.receivedAt).toLocaleString() : 'Waiting for data...';
  const isCriticalHR = data?.heart_rate_bpm < 70 || data?.heart_rate_bpm > 130;
  const hrTrend = data?.heart_rate_bpm > 130 ? 'up' : data?.heart_rate_bpm < 70 ? 'down' : 'stable';

  return (
    <>
      <AnimationStyles />
      <Navbar />
      
      <main className="min-h-screen text-white p-4 sm:p-8 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto pt-24">
          <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
                SafeX Monitor
              </h1>
              <p className="text-slate-400 mt-2 text-lg">Operator: {user.name}</p>
            </div>
          </header>
          
          {error && <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg mb-6 text-sm">{error}</div>}
          {!isOnline && data && (
            <div className="text-center text-amber-300 bg-amber-900/50 p-3 rounded-lg mb-6 border border-amber-500/50 animate-pulse">
              DEVICE OFFLINE: Last relay was {lastUpdate}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <StatCard title="Heart Rate" value={data?.heart_rate_bpm} unit="bpm" icon="❤️" color="text-red-400" trend={hrTrend} isOnline={isOnline} isAlerting={isOnline && isCriticalHR}/>
              <StatCard title="SpO₂" value={data?.spo2_percent} unit="%" icon="💨" color="text-sky-400" trend={data?.spo2_percent < 95 ? 'down' : 'stable'} isOnline={isOnline} isAlerting={isOnline && data?.spo2_percent < 95}/>
              <StatCard title="CO Level" value={data?.mq7_volt?.toFixed(3)} unit="V" icon="🔥" color="text-amber-400" trend={data?.mq7_volt > 0.6 ? 'up' : 'stable'} isOnline={isOnline} isAlerting={isOnline && data?.mq7_volt > 0.6}/>
              <StatCard title="Temp" value={data?.temperature_C} unit="°C" icon="🌡️" color="text-orange-400" isOnline={isOnline}/>
              <StatCard title="Humidity" value={data?.humidity_percent} unit="%" icon="💧" color="text-blue-400" isOnline={isOnline}/>
              <StatCard title="LPG" value={data?.mq6_volt?.toFixed(3)} unit="V" icon="🏭" color="text-slate-400" isOnline={isOnline}/>
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