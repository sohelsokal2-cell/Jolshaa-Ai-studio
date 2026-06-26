import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Lock, Eye, Users, ShieldAlert, Loader2, RefreshCw, Unlock, Globe } from 'lucide-react';

export default function PrivacySettings() {
  const { user, token, refreshUser } = useAuth();
  
  // Privacy Form state
  const [defaultPostVisibility, setDefaultPostVisibility] = useState(
    user?.privacySettings?.defaultPostVisibility || 'public'
  );
  const [friendRequestSender, setFriendRequestSender] = useState(
    user?.privacySettings?.friendRequestSender || 'everyone'
  );
  const [friendsListVisibility, setFriendsListVisibility] = useState(
    user?.privacySettings?.friendsListVisibility || 'everyone'
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Blocked users management state
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    // If the logged in user changes, update form local state
    if (user?.privacySettings) {
      setDefaultPostVisibility(user.privacySettings.defaultPostVisibility || 'public');
      setFriendRequestSender(user.privacySettings.friendRequestSender || 'everyone');
      setFriendsListVisibility(user.privacySettings.friendsListVisibility || 'everyone');
    }
  }, [user]);

  // Fetch all users to resolve names/photos of blocked user IDs
  const fetchUsersAndResolveBlocked = async () => {
    if (!token) return;
    setLoadingBlocked(true);
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users for blocked list:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    fetchUsersAndResolveBlocked();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/users/privacy', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          defaultPostVisibility,
          friendRequestSender,
          friendsListVisibility
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ text: 'Privacy settings saved successfully!', type: 'success' });
        await refreshUser();
      } else {
        setMessage({ text: data.message || 'Error saving settings.', type: 'error' });
      }
    } catch (err) {
      console.error('Save privacy error:', err);
      setMessage({ text: 'Server error occurred while saving settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    setUnblockingId(blockedUserId);
    try {
      const response = await fetch(`/api/users/${blockedUserId}/unblock`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await refreshUser();
        setMessage({ text: 'User unblocked successfully!', type: 'success' });
      } else {
        const data = await response.json();
        setMessage({ text: data.message || 'Error unblocking user.', type: 'error' });
      }
    } catch (err) {
      console.error('Unblock error:', err);
      setMessage({ text: 'Server error unblocking user.', type: 'error' });
    } finally {
      setUnblockingId(null);
    }
  };

  // Safe mapping of blocked users list
  const blockedIds = user?.blockedUsers?.map((u: any) => typeof u === 'string' ? u : u.id || u._id) || [];
  const blockedUsersDetails = allUsers.filter(u => blockedIds.includes(u.id || u._id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Privacy Form Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-rose-500 mb-6">
            <Lock className="h-6 w-6" />
            <h2 className="font-sans font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tight">Privacy Preferences</h2>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl text-xs font-bold border mb-6 flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100/50 text-rose-600 dark:text-rose-400'
            }`}>
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Default Post Visibility */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Default Post Visibility
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                Choose the default visibility setting for your new feed posts. You can still adjust this individually on each post you write.
              </p>
              <div className="relative">
                <select
                  value={defaultPostVisibility}
                  onChange={(e: any) => setDefaultPostVisibility(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 text-slate-700 dark:text-slate-200 font-bold appearance-none cursor-pointer"
                >
                  <option value="public">🌍 Public (Everyone can see)</option>
                  <option value="friends">👥 Friends Only (Only your approved friends)</option>
                  <option value="onlyme">🔒 Only Me (Private backup)</option>
                </select>
              </div>
            </div>

            {/* Friend Requests Visibility */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Who can send you friend requests?
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                Limit who is allowed to send you social friend connection proposals.
              </p>
              <div className="relative">
                <select
                  value={friendRequestSender}
                  onChange={(e: any) => setFriendRequestSender(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 text-slate-700 dark:text-slate-200 font-bold appearance-none cursor-pointer"
                >
                  <option value="everyone">🌍 Everyone (All accounts)</option>
                  <option value="friendsOfFriends">👥 Friends of Friends</option>
                </select>
              </div>
            </div>

            {/* Friends List Visibility */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Who can see your Friends List?
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-1">
                Determine who is permitted to view the full friends directory list on your public profile page.
              </p>
              <div className="relative">
                <select
                  value={friendsListVisibility}
                  onChange={(e: any) => setFriendsListVisibility(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/25 text-slate-700 dark:text-slate-200 font-bold appearance-none cursor-pointer"
                >
                  <option value="everyone">🌍 Everyone (Public access)</option>
                  <option value="friends">👥 Approved Friends Only</option>
                  <option value="onlyme">🔒 Only Me (Hidden list)</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs shadow-md shadow-rose-200 dark:shadow-none hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Save Privacy Settings</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Blocked Users Section */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-sans font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">Blocked Users</h3>
            </div>
            <button
              onClick={fetchUsersAndResolveBlocked}
              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingBlocked ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            People you block will not be able to view your profile, see your posts, or interact with your content.
          </p>

          {loadingBlocked ? (
            <div className="text-center py-8">
              <Loader2 className="h-5 w-5 text-rose-500 animate-spin mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Syncing List...</p>
            </div>
          ) : blockedUsersDetails.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
              <p className="text-xs font-bold text-slate-400">Your block list is clean.</p>
              <p className="text-[10px] text-slate-400 mt-1">No users are currently blocked.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {blockedUsersDetails.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <img
                    src={u.profilePhoto}
                    alt={u.name}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">Blocked user</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(u.id)}
                    disabled={unblockingId === u.id}
                    className="px-3 py-1 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 hover:border-pink-200 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {unblockingId === u.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                    <span>Unblock</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
