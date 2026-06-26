import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { SocketProvider } from './context/SocketContext.tsx';
import Navbar from './components/Navbar.tsx';
import LoginForm from './components/LoginForm.tsx';
import SignupForm from './components/SignupForm.tsx';
import ProfileView from './components/ProfileView.tsx';
import NewsFeed from './components/NewsFeed.tsx';
import ChatSidebar from './components/ChatSidebar.tsx';
import GroupsPagesHub from './components/GroupsPagesHub.tsx';
import SearchResults from './components/SearchResults.tsx';
import PrivacySettings from './components/PrivacySettings.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import ReportModal from './components/ReportModal.tsx';
import { Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [currentTab, setCurrentTab] = useState<'feed' | 'profile' | 'hub' | 'search' | 'privacy' | 'admin'>('feed');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment' | 'user'; id: string } | null>(null);

  // Helper to open a specific user profile
  const openUserProfile = (id: string) => {
    if (id === user?.id) {
      setViewingUserId(null);
    } else {
      setViewingUserId(id);
    }
    setCurrentTab('profile');
  };

  // 1. Loading overlay
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 text-rose-500 animate-spin" />
          <div>
            <h3 className="font-sans font-bold text-lg text-slate-800 tracking-tight">Initializing Jolshaa</h3>
            <p className="text-xs text-rose-400 font-medium">Securing credentials & launching profile cards...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Signup / Login View
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] relative overflow-hidden flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
        {/* Glow ambient spots */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-200/30 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-200/30 blur-[100px] pointer-events-none" />

        {/* Brand Banner */}
        <div className="text-center max-w-md mx-auto mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-pink-100 rounded-full text-xs font-semibold text-rose-600 shadow-sm mb-4">
            <Sparkles className="h-3.5 w-3.5 text-orange-400 fill-orange-300" />
            Social Profile Platform
          </div>
          <h1 className="text-4xl font-black font-sans tracking-tight bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">
            Jolshaa
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-medium max-w-xs mx-auto">
            Build your professional identity, design your profile, and connect with vibrant gatherings.
          </p>
        </div>

        {/* Card Area with AnimatePresence */}
        <div className="relative z-10 flex-grow flex items-center justify-center">
          <AnimatePresence mode="wait">
            {showSignup ? (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="w-full flex justify-center"
              >
                <SignupForm onToggleToLogin={() => setShowSignup(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="w-full flex justify-center"
              >
                <LoginForm onToggleToSignup={() => setShowSignup(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info line */}
        <div className="text-center text-[11px] text-slate-400 font-mono mt-12 relative z-10">
          <p>Jolshaa © 2026 • Phase 2 Core Specification • Built with Pride</p>
        </div>
      </div>
    );
  }

  // 3. Authenticated state: Protected Layout wrapper
  return (
    <div className="min-h-screen bg-[#FFF5F7] dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          if (tab === 'profile') setViewingUserId(null); // My Profile
          setCurrentTab(tab);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      {/* Main Profile Canvas / Feed Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === 'feed' ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <NewsFeed 
                onUserClick={openUserProfile} 
                onReportClick={(type, id) => setReportTarget({ type, id })}
              />
            </motion.div>
          ) : currentTab === 'profile' ? (
            <motion.div
              key={`profile-${viewingUserId || 'me'}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView 
                userId={viewingUserId} 
                onUserClick={openUserProfile} 
                onReportClick={(type, id) => setReportTarget({ type, id })}
              />
            </motion.div>
          ) : currentTab === 'hub' ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <GroupsPagesHub />
            </motion.div>
          ) : currentTab === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <SearchResults 
                searchQuery={searchQuery} 
                onUserClick={openUserProfile}
                onReportClick={(type, id) => setReportTarget({ type, id })}
              />
            </motion.div>
          ) : currentTab === 'privacy' ? (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <PrivacySettings />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mini App Footer */}
      <footer className="py-6 border-t border-slate-200/50 dark:border-slate-800 text-center text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-900 transition-colors">
        <p>Jolshaa Platform • Encrypted JWT Authentication Session • All Rights Reserved 2026</p>
      </footer>
      
      {/* Global Real-time Chat */}
      <ChatSidebar />

      {/* Global Content Reporting Modal Overlay */}
      {reportTarget && (
        <ReportModal 
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
