import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Mail, Phone, Calendar, User as UserIcon, Edit2, Share2, ShieldCheck, MapPin, Sparkles, Loader2, Ban, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import EditProfileForm from './EditProfileForm.tsx';
import FriendRequestButton from './FriendRequestButton.tsx';
import FriendList from './FriendList.tsx';
import ProfileAlbums from './ProfileAlbums.tsx';
import { User } from '../types.ts';

interface ProfileViewProps {
  userId: string | null;
  onUserClick: (id: string) => void;
  onReportClick?: (type: 'post' | 'comment' | 'user', id: string) => void;
}

export default function ProfileView({ userId, onUserClick, onReportClick }: ProfileViewProps) {
  const { user: currentUser, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'albums'>('about');

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId || !token) {
        setProfileUser(currentUser);
        return;
      }
      try {
        setLoading(true);
        // We also check if this user is blocked by us
        const statusRes = await fetch(`/api/friends/status/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setIsBlockedByMe(statusData.status === 'blocking');
        }

        const res = await fetch(`/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProfileUser(data.user);
        }
      } catch (err) {
        console.error('Error fetching profile user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId, currentUser, token]);

  const handleBlockToggle = async () => {
    if (!profileUser || !token || blockLoading) return;
    try {
      setBlockLoading(true);
      if (isBlockedByMe) {
        await fetch(`/api/users/${profileUser.id}/unblock`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsBlockedByMe(false);
      } else {
        await fetch(`/api/users/${profileUser.id}/block`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setIsBlockedByMe(true);
      }
    } catch (err) {
      console.error('Error toggling block status:', err);
    } finally {
      setBlockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!profileUser) return null;

  const isOwnProfile = !userId || userId === currentUser?.id;

  // Helper to format date of birth and joined dates nicely
  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return 'Not Specified';
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4 py-6">
      {isEditing && isOwnProfile ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <EditProfileForm onCancel={() => setIsEditing(false)} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] border border-pink-50 overflow-hidden shadow-xl shadow-rose-50/50"
        >
          {/* COVER PHOTO BANNER */}
          <div className="h-48 sm:h-64 w-full relative bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
            <img
              src={profileUser.coverPhoto}
              alt="Cover Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            
            {/* Action Buttons on Banner */}
            <div className="absolute top-4 right-4 flex gap-2">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  id="edit-profile-trigger"
                  className="bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold px-5 py-2.5 rounded-full shadow-lg shadow-rose-900/10 transition-all flex items-center gap-1.5 cursor-pointer border border-pink-100"
                >
                  <Edit2 className="h-3.5 w-3.5 text-rose-500" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md p-1 rounded-full">
                  <FriendRequestButton targetUserId={profileUser.id} />
                  <button
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    className="bg-white hover:bg-rose-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-full shadow-lg shadow-black/5 transition-all flex items-center gap-1.5 cursor-pointer border border-pink-100 disabled:opacity-50"
                  >
                    <Ban className={`h-3.5 w-3.5 ${isBlockedByMe ? 'text-red-500' : 'text-slate-400'}`} />
                    {isBlockedByMe ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    onClick={() => onReportClick?.('user', profileUser.id)}
                    className="bg-white hover:bg-rose-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-full shadow-lg shadow-black/5 transition-all flex items-center gap-1.5 cursor-pointer border border-pink-100"
                    title="Report user profile"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AVATAR OVERLAP & IDENTITY CARD */}
          <div className="relative px-6 pb-8 pt-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-16 sm:-mt-20 mb-6">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] bg-white p-1.5 shadow-xl ring-4 ring-white">
                  <img
                    src={profileUser.profilePhoto}
                    alt={profileUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-[1.6rem]"
                  />
                </div>
                <span className="absolute bottom-2 right-2 bg-rose-500 border-2 border-white rounded-full h-5 w-5" title="Online" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black font-sans text-slate-800 tracking-tight">
                    {profileUser.name}
                  </h1>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-pink-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                    Verified User
                  </span>
                </div>
                <p className="text-sm font-semibold text-rose-400 font-mono">{profileUser.email}</p>
              </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-pink-50 mb-6 gap-6">
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 text-sm font-bold transition-all ${
                  activeTab === 'about'
                    ? 'text-rose-500 border-b-2 border-rose-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('albums')}
                className={`pb-3 text-sm font-bold transition-all ${
                  activeTab === 'albums'
                    ? 'text-rose-500 border-b-2 border-rose-500'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Albums
              </button>
            </div>

            {/* SECTIONS GRID OR ALBUMS */}
            {activeTab === 'about' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* LEFT COLUMN: BIO & ABOUT ME CARD */}
              <div className="md:col-span-2 space-y-5">
                <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-tight text-rose-500 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-orange-400 fill-orange-300" />
                    Biography
                  </h3>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {profileUser.bio || "No biography provided yet. Express yourself by editing your profile!"}
                  </p>
                </div>
                
                <FriendList userId={profileUser.id} onUserClick={onUserClick} />
              </div>

              {/* RIGHT COLUMN: DETAILED METADATA CARD */}
              <div className="space-y-4">
                <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-tight text-rose-500">
                    Profile Details
                  </h3>
                  
                  <div className="space-y-3.5">
                    {/* Gender info */}
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-rose-400 shrink-0">
                        <UserIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gender</p>
                        <p className="text-xs font-bold text-slate-800">{profileUser.gender || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Date of Birth info */}
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-rose-400 shrink-0">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date of Birth</p>
                        <p className="text-xs font-bold text-slate-800">{formatDateString(profileUser.dateOfBirth)}</p>
                      </div>
                    </div>

                    {/* Contact Phone info */}
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-rose-400 shrink-0">
                        <Phone className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Contact</p>
                        <p className="text-xs font-bold text-slate-800 font-mono">{profileUser.phone || 'None Provided'}</p>
                      </div>
                    </div>

                    {/* Member since info */}
                    <div className="flex items-center gap-3 text-slate-600 border-t border-pink-50 pt-3 mt-1">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <ShieldCheck className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jolshaa Member Since</p>
                        <p className="text-xs font-bold text-slate-800">{formatDateString(profileUser.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <ProfileAlbums userId={profileUser.id} />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
