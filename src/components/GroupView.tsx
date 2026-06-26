import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Group, Post } from '../types.ts';
import { ArrowLeft, Users, Shield, Loader2, Check } from 'lucide-react';
import PostCard from './PostCard.tsx';
import CreatePostBox from './CreatePostBox.tsx';

interface GroupViewProps {
  groupId: string;
  onBack: () => void;
}

export default function GroupView({ groupId, onBack }: GroupViewProps) {
  const { token, user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'admin'>('feed');

  const fetchGroup = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGroup((await res.json()).group);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/feed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts((await res.json()).posts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchGroup();
      await fetchPosts();
      setLoading(false);
    };
    init();
  }, [groupId, token]);

  const handleJoin = async () => {
    if (!token || joinLoading) return;
    setJoinLoading(true);
    try {
      await fetch(`/api/groups/${groupId}/join`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchGroup();
    } catch (err) {
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!token || joinLoading) return;
    setJoinLoading(true);
    try {
      await fetch(`/api/groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchGroup();
    } catch (err) {
      console.error(err);
    } finally {
      setJoinLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/groups/${groupId}/approve/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !group || !user) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-rose-500" /></div>;
  }

  const isMember = group.members.some(m => m.id === user.id);
  const isAdmin = group.admins.some(a => a.id === user.id);
  const hasPendingRequest = group.pendingRequests?.some(m => m.id === user.id);

  return (
    <div className="space-y-6">
      {/* Cover & Header */}
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm overflow-hidden">
        <div className="h-48 bg-rose-200 relative">
          <button onClick={onBack} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full hover:bg-white transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </button>
        </div>
        <div className="p-6 relative">
          <div className="absolute -top-12 left-6 w-24 h-24 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
            <Users className="h-10 w-10 text-rose-400" />
          </div>
          <div className="ml-32 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{group.name}</h1>
              <p className="text-sm text-slate-500">{group.privacy === 'public' ? 'Public' : 'Private'} Group • {group.members.length} Members</p>
            </div>
            <div>
              {isMember ? (
                <button onClick={handleLeave} disabled={joinLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-full text-xs">
                  Leave Group
                </button>
              ) : hasPendingRequest ? (
                <button disabled className="bg-orange-100 text-orange-600 font-bold px-4 py-2 rounded-full text-xs">
                  Requested
                </button>
              ) : (
                <button onClick={handleJoin} disabled={joinLoading} className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded-full text-xs">
                  Join Group
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-700">{group.description}</p>
        </div>
        
        {/* Tabs */}
        {isMember && (
          <div className="flex border-t border-slate-100 p-2 gap-2">
            <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'feed' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}>Feed</button>
            <button onClick={() => setActiveTab('members')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'members' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}>Members</button>
            {isAdmin && (
              <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'admin' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}>Admin Panel</button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isMember ? (
        <div className="space-y-4">
          {activeTab === 'feed' && (
            <>
              <CreatePostBox onPostCreated={fetchPosts} postedIn={{ type: 'group', refId: group.id }} />
              {posts.map(post => <PostCard key={post.id} post={post} onPostUpdated={fetchPosts} onPostDeleted={fetchPosts} />)}
            </>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4">Members</h3>
              <div className="space-y-3">
                {group.members.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={m.profilePhoto} alt="" className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-bold text-sm text-slate-800 flex items-center gap-1">
                          {m.name}
                          {group.admins.some(a => a.id === m.id) && <Shield className="h-3 w-3 text-rose-500" />}
                        </p>
                      </div>
                    </div>
                    {isAdmin && m.id !== user.id && !group.admins.some(a => a.id === m.id) && (
                      <button onClick={async () => {
                        if (!token) return;
                        try {
                          await fetch(`/api/groups/${groupId}/remove/${m.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                          fetchGroup();
                        } catch (err) {}
                      }} className="text-xs font-bold text-slate-500 hover:text-red-500 px-3 py-1 bg-slate-50 hover:bg-red-50 rounded-full transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-lg mb-4">Join Requests</h3>
              {(!group.pendingRequests || group.pendingRequests.length === 0) ? (
                <p className="text-sm text-slate-500">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {group.pendingRequests.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={m.profilePhoto} alt="" className="w-10 h-10 rounded-full" />
                        <p className="font-bold text-sm text-slate-800">{m.name}</p>
                      </div>
                      <button onClick={() => handleApprove(m.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-slate-100">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Private Group</h3>
          <p className="text-sm text-slate-500 mt-2">Join this group to view its posts and members.</p>
        </div>
      )}
    </div>
  );
}
