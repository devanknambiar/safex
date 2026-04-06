'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './context/AuthContext';

// --- HELPERS FOR LAYMAN DATA ---
// Converts sensor voltage (0.1V - 2.0V range) into a Safety Level
const getGasStatus = (volt) => {
  if (!volt) return { label: '---', percent: 0, status: 'Normal' };
  // Mapping 0.1V (clean) to 2.0V (dangerous) to a 0-100 scale
  const percent = Math.min(Math.max(((volt - 0.1) / (2.0 - 0.1)) * 100, 0), 100);
  
  if (percent < 15) return { label: 'Normal', percent: Math.round(percent), color: 'text-green-400' };
  if (percent < 40) return { label: 'Caution', percent: Math.round(percent), color: 'text-amber-400' };
  return { label: 'Danger', percent: Math.round(percent), color: 'text-red-500' };
};

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
const Navbar = ({ onLogout }) => (
  <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
    <div className="mx-4 p-2.5 bg-black/20 backdrop-blur-lg border border-white/10 rounded-full shadow-lg flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-slate-900">W</div>
        <span className="font-semibold text-white">Wearable Monitor</span>
      </div>
      <button onClick={onLogout} className="bg-slate-700/50 hover:bg-slate-600/50 border border-white/10 text-white font-medium py-1.5 px-4 rounded-full text-sm">Logout</button>
    </div>
  </nav>
);

const StatCard = ({ title, value, unit, icon, color, trend, isOnline, isAlerting, isGas = false }) => {
  const gas = isGas ? getGasStatus(value) : null;
  
  return (
    <div className={`backdrop-blur-xl border rounded-2xl shadow-lg p-5 transition-all duration-300 ${!isOnline && 'opacity-50'} ${isAlerting ? 'animate-critical-alert' : 'bg-slate-900/30 border-white/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`text-3xl ${color}`}>{icon}</div>
          <h3 className="font-medium text-slate-300">{title}</h3>
        </div>
        {isOnline && trend !== 'stable' && trend && <div className="text-sm font-semibold text-red-400">{trend === 'up' ? '▲' : '▼'}</div>}
      </div>
      <div className="text-right mt-4">
        <p className={`text-4xl font-bold transition-colors duration-500 ${isGas && isOnline ? gas.color : 'text-white'}`}>
          {isOnline ? (isGas ? gas.label : (value ?? '0')) : '---'}
        </p>
        <p className="text-lg font-normal text-slate-400 -mt-1">
          {isOnline ? (isGas ? `Index: ${gas.percent}%` : unit) : 'No Signal'}
        </p>
      </div>
    </div>
  );
};

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
    <div className="flex items-center justify-between"><span className="text-slate-400 text-sm">Last Update</span><span className="text-slate-300 text-sm">{lastUpdate}</span></div>
  </div>
);

const AlertPanel = ({ data, isOnline }) => {
  const co = getGasStatus(data?.mq7);
  const lpg = getGasStatus(data?.mq6);
  const highCO = isOnline && co.percent > 40;
  const highLPG = isOnline && lpg.percent > 40;
  const lowSpo2 = isOnline && data?.spo2 < 95 && data?.spo2 > 0;
  const criticalHeartRate = isOnline && data?.hr > 0 && (data?.hr < 60 || data?.hr > 120);
  
  return (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-5">
      <h3 className="font-semibold text-white mb-3">Safety Briefing</h3>
      <div className="space-y-3">
        {criticalHeartRate && <p className="text-red-400 text-sm animate-pulse">● Alert: Abnormal Heart Rate ({data.hr} bpm)</p>}
        {highCO && <p className="text-red-400 text-sm animate-pulse">● Danger: Carbon Monoxide Leak Detected</p>}
        {highLPG && <p className="text-orange-400 text-sm animate-pulse">● Hazard: Flammable Gas Detected</p>}
        {lowSpo2 && <p className="text-amber-400 text-sm animate-pulse">● Warning: Low Oxygen Levels ({data.spo2}%)</p>}
        {isOnline && !highCO && !highLPG && !lowSpo2 && !criticalHeartRate && <p className="text-green-400 text-sm">● All Systems Nominal</p>}
        {!isOnline && <p className="text-red-500 text-sm">● Monitoring Interrupted</p>}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();
  const { isAuthenticated, logout, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/latest-data');
      if (!response.ok) throw new Error('Fetch failed');
      const result = await response.json();
      
      setData(result);
      setError('');

      if (result.receivedAt) {
        const timeDiff = new Date() - new Date(result.receivedAt);
        setIsOnline(timeDiff < 60000);
      }
    } catch (e) {
      setError('Connection lost to backend.');
      setIsOnline(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  if (loading || !isAuthenticated) return <div className="min-h-screen bg-slate-900" />;

  const lastUpdate = data ? new Date(data.receivedAt).toLocaleTimeString() : '---';

  return (
    <>
      <AnimationStyles />
      <Navbar onLogout={logout} />
      <main className="min-h-screen text-white p-4 sm:p-8 bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto pt-24">
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Live Operation Monitor</h1>
            <p className="text-slate-400">Authorized Personnel: {user?.name || 'Operator'}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <StatCard title="Heart Rate" value={data?.hr} unit="bpm" icon="❤️" color="text-red-400" isOnline={isOnline} isAlerting={isOnline && (data?.hr > 120 || (data?.hr < 60 && data?.hr > 0))}/>
              <StatCard title="SpO₂" value={data?.spo2} unit="%" icon="💨" color="text-sky-400" isOnline={isOnline} isAlerting={isOnline && data?.spo2 < 95 && data?.spo2 > 0}/>
              <StatCard title="Temperature" value={data?.temperature} unit="°C" icon="🌡️" color="text-orange-400" isOnline={isOnline}/>
              <StatCard title="Humidity" value={data?.humidity} unit="%" icon="💧" color="text-blue-400" isOnline={isOnline}/>
              
              {/* LAYMAN GAS SENSORS */}
              <StatCard title="CO Safety" value={data?.mq7} icon="🔥" color="text-amber-400" isOnline={isOnline} isGas={true} isAlerting={isOnline && getGasStatus(data?.mq7).percent > 40}/>
              <StatCard title="Gas Leakage" value={data?.mq6} icon="🏭" color="text-slate-400" isOnline={isOnline} isGas={true} isAlerting={isOnline && getGasStatus(data?.mq6).percent > 40}/>
            </div>
            
            <div className="space-y-6">
              <DeviceStatus lastUpdate={lastUpdate} isOnline={isOnline}/>
              <AlertPanel data={data} isOnline={isOnline} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}