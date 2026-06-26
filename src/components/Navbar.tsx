import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { 
  LogOut, User as UserIcon, Database, Compass, Sparkles, Bell, 
  Search, Lock, Sun, Moon, ShieldCheck 
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'feed' | 'profile' | 'hub' | 'search' | 'privacy' | 'admin';
  setCurrentTab: (tab: 'feed' | 'profile' | 'hub' | 'search' | 'privacy' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({ currentTab, setCurrentTab, searchQuery, setSearchQuery }: NavbarProps) {
  const { user, logout, dbStatus } = useAuth();
  const { notifications, unreadNotificationCount, markNotificationsAsRead } = useSocket();
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchVal, setSearchVal] = useState(searchQuery);

  // Theme support
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync searchVal if searchQuery prop changes
  useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setSearchQuery(searchVal.trim());
      setCurrentTab('search');
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-pink-100 dark:border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-8 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand Logo & Search */}
        <div className="flex items-center justify-between md:justify-start gap-4 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-orange-400 rounded-xl flex items-center justify-center p-2 text-white shadow-lg shadow-rose-200 dark:shadow-none">
              <span className="font-black text-xl">J</span>
            </div>
            <div>
              <span className="font-sans font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-orange-500">
                Jolshaa
              </span>
            </div>
          </div>

          {/* Inline Search Bar */}
          {user && (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700 max-w-xs w-full">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search users, posts, groups..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-200 w-full placeholder-slate-400 font-medium"
              />
            </form>
          )}
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        {user && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/80 dark:bg-slate-800/80 p-1 rounded-full border border-slate-100 dark:border-slate-800 mx-auto md:mx-2">
            <button
              onClick={() => setCurrentTab('feed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                currentTab === 'feed'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Feed</span>
            </button>
            
            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setCurrentTab('hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                currentTab === 'hub'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              <span>Hub</span>
            </button>

            {/* Admin-only panel Tab */}
            {user.isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-tight transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-amber-500 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            )}
          </div>
        )}

        {/* Action Controls & Badges */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Privacy settings lock */}
          {user && (
            <button
              onClick={() => setCurrentTab('privacy')}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                currentTab === 'privacy' 
                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Privacy settings"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifs(!showNotifs);
                    if (unreadNotificationCount > 0 && !showNotifs) {
                      markNotificationsAsRead();
                    }
                  }}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 border-2 border-white rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div key={notif.id || idx} className={`p-3 border-b border-slate-50 dark:border-slate-800 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 ${!notif.isRead ? 'bg-rose-50/30' : ''}`}>
                            <img src={notif.sender.profilePhoto} alt="User" className="w-8 h-8 rounded-full object-cover" />
                            <div className="flex-1">
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                <span className="font-bold text-slate-900 dark:text-slate-100">{notif.sender.name}</span>{' '}
                                {notif.type === 'friend_request' && 'sent you a friend request.'}
                                {notif.type === 'reaction' && 'reacted to your post.'}
                                {notif.type === 'comment' && 'commented on your post.'}
                                {notif.type === 'message' && 'sent you a message.'}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Banner */}
              <div className="hidden lg:flex items-center gap-2 border-l border-pink-100 dark:border-slate-800 pl-4">
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-rose-100 ring-2 ring-rose-50 dark:ring-slate-800"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-800 dark:text-slate-200 line-clamp-1">{user.name}</p>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                id="logout-btn"
                className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs shadow-md shadow-rose-100 dark:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
