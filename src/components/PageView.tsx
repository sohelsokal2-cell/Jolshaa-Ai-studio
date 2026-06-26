import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Page, Post } from '../types.ts';
import { ArrowLeft, FileText, Shield, Loader2 } from 'lucide-react';
import PostCard from './PostCard.tsx';
import CreatePostBox from './CreatePostBox.tsx';

interface PageViewProps {
  pageId: string;
  onBack: () => void;
}

export default function PageView({ pageId, onBack }: PageViewProps) {
  const { token, user } = useAuth();
  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'followers'>('feed');

  const fetchPage = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPage((await res.json()).page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/pages/${pageId}/feed`, {
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
      await fetchPage();
      await fetchPosts();
      setLoading(false);
    };
    init();
  }, [pageId, token]);

  const handleFollow = async () => {
    if (!token || followLoading) return;
    setFollowLoading(true);
    try {
      await fetch(`/api/pages/${pageId}/follow`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchPage();
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!token || followLoading) return;
    setFollowLoading(true);
    try {
      await fetch(`/api/pages/${pageId}/unfollow`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchPage();
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading || !page || !user) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-rose-500" /></div>;
  }

  const isFollower = page.followers.some(f => f.id === user.id);
  const isAdmin = page.admins.some(a => a.id === user.id);

  return (
    <div className="space-y-6">
      {/* Cover & Header */}
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm overflow-hidden">
        <div className="h-48 bg-orange-200 relative">
          <button onClick={onBack} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full hover:bg-white transition-colors shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </button>
        </div>
        <div className="p-6 relative">
          <div className="absolute -top-12 left-6 w-24 h-24 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center">
            <FileText className="h-10 w-10 text-orange-400" />
          </div>
          <div className="ml-32 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{page.name}</h1>
              <p className="text-sm text-slate-500">{page.category || 'Page'} • {page.followers.length} Followers</p>
            </div>
            <div>
              {isFollower ? (
                <button onClick={handleUnfollow} disabled={followLoading} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-full text-xs">
                  Following
                </button>
              ) : (
                <button onClick={handleFollow} disabled={followLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-full text-xs">
                  Follow
                </button>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-700">{page.description}</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-slate-100 p-2 gap-2">
          <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'feed' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>Feed</button>
          <button onClick={() => setActiveTab('about')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'about' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>About</button>
          <button onClick={() => setActiveTab('followers')} className={`px-4 py-2 rounded-full text-sm font-bold ${activeTab === 'followers' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}>Followers</button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'feed' && (
          <>
            {isAdmin && <CreatePostBox onPostCreated={fetchPosts} postedIn={{ type: 'page', refId: page.id }} />}
            {posts.map(post => <PostCard key={post.id} post={post} onPostUpdated={fetchPosts} onPostDeleted={fetchPosts} />)}
            {posts.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-sm">No posts yet on this page.</div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-4">About {page.name}</h3>
            <p className="text-sm text-slate-700">{page.description || 'No description provided.'}</p>
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
            <h3 className="font-bold text-lg mb-4">Followers</h3>
            {page.followers.length === 0 ? (
              <p className="text-sm text-slate-500">No followers yet.</p>
            ) : (
              <div className="space-y-3">
                {page.followers.map(f => (
                  <div key={f.id} className="flex items-center gap-3">
                    <img src={f.profilePhoto} alt="" className="w-10 h-10 rounded-full" />
                    <p className="font-bold text-sm text-slate-800">{f.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
