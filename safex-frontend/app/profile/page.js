// File: app/profile/page.js
// REDESIGNED: This page now uses the new layout and maintains all functionality.

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// --- SVG Icons (for a clean, dependency-free UI) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;

// --- REUSABLE COMPONENTS ---
const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-3 w-full text-left px-4 py-2.5 rounded-lg transition-colors duration-200 ${active ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-300 hover:bg-slate-700/50'}`}>
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);
const InfoCard = ({ icon, title, description, onClick }) => (
  <button onClick={onClick} className="flex items-center w-full p-6 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 rounded-2xl transition-all duration-300 space-x-6 text-left">
    <div className="text-slate-400">{icon}</div>
    <div className="flex-grow">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-slate-400 text-sm mt-1">{description}</p>
    </div>
    <div className="text-slate-500"><ArrowRightIcon /></div>
  </button>
);

// --- CONTENT COMPONENTS ---
const HomeContent = ({ user, setActiveTab }) => (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white"> Welcome, {user?.name}! </h1>
        <p className="text-slate-400 mt-1">Manage your info and security to make this service work better for you.</p>
      </div>
      <div className="space-y-5">
        <InfoCard icon={<UserIcon />} title="Personal Info" description="Update your name and contact details." onClick={() => setActiveTab('personal')} />
        <InfoCard icon={<LockIcon />} title="Security" description="Change your password." onClick={() => setActiveTab('security')} />
      </div>
    </>
);

const PersonalInfoContent = ({ user }) => {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fullName: name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update name.');
      }
      
      const data = await response.json();
      updateUser({ name: data.user.name });
      setIsEditing(false);
      alert('Name updated successfully!');

    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Personal Info</h1>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-white/10">
          <div>
            <span className="text-slate-400 text-sm">Full Name</span>
            {isEditing ? (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-700/50 border border-white/10 rounded-md px-3 py-1.5 mt-1 text-white"/>
            ) : (
              <p className="font-medium text-white">{user?.name}</p>
            )}
          </div>
          {isEditing ? (
            <div className="flex space-x-2">
              <button onClick={handleSave} className="text-sm bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold py-1 px-3 rounded-md transition-colors">Save</button>
              <button onClick={() => setIsEditing(false)} className="text-sm bg-slate-600 hover:bg-slate-500 font-bold py-1 px-3 rounded-md transition-colors">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Edit</button>
          )}
        </div>
        <div className="flex justify-between items-center py-3 border-b border-white/10">
          <div> <span className="text-slate-400 text-sm">Email</span> <p className="font-medium text-white">{user?.email}</p> </div>
          <span className="text-sm text-slate-500">Cannot be changed</span>
        </div>
      </div>
    </div>
  );
};

const SecurityContent = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">Security</h1>
            <p className="text-slate-400">Security settings and password change functionality will be implemented here.</p>
        </div>
    );
};

// --- MAIN PROFILE PAGE ---
export default function ProfilePage() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <p className="text-white text-lg">Loading Profile...</p>
        </div>
      );
    }
    
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-10 p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center font-bold text-slate-900">W</div>
                <span className="font-semibold hidden sm:block">Wearable Monitor</span>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-fuchsia-500 rounded-full flex items-center justify-center font-bold text-slate-900 text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </header>
    
          {/* Main Content with Sidebar */}
          <div className="max-w-7xl mx-auto pt-20 px-4">
            <div className="flex flex-col md:flex-row md:space-x-8">
              
              {/* Sidebar */}
              <aside className="w-full md:w-64 flex-shrink-0 mb-8 md:mb-0">
                <nav className="space-y-2">
                  <NavItem icon={<HomeIcon />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                  <NavItem icon={<UserIcon />} label="Personal Info" active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
                  <NavItem icon={<ShieldIcon />} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                </nav>
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button onClick={() => { logout(); router.push('/login'); }} className="w-full text-left text-slate-400 hover:text-red-400 transition-colors px-4 font-medium">
                    Log Out
                  </button>
                </div>
              </aside>
              
              {/* Content Area */}
              <main className="flex-grow">
                <div className="bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 min-h-[500px]">
                  {activeTab === 'home' && <HomeContent user={user} setActiveTab={setActiveTab} />}
                  {activeTab === 'personal' && <PersonalInfoContent user={user} />}
                  {activeTab === 'security' && <SecurityContent />}
                </div>
              </main>

            </div>
          </div>
        </div>
      );
}

