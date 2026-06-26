import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Post } from '../types.ts';
import CreatePostBox from './CreatePostBox.tsx';
import PostCard from './PostCard.tsx';
import FriendSuggestions from './FriendSuggestions.tsx';
import StoriesBar from './StoriesBar.tsx';
import { Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NewsFeedProps {
  onUserClick?: (id: string) => void;
  onReportClick?: (type: 'post' | 'comment' | 'user', id: string) => void;
}

export default function NewsFeed({ onUserClick, onReportClick }: NewsFeedProps) {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 5;

  useEffect(() => {
    fetchFeed(true);
  }, [token]);

  const fetchFeed = async (reset: boolean = false) => {
    if (!token) return;
    
    if (reset) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    const currentSkip = reset ? 0 : skip;

    try {
      const response = await fetch(`/api/posts/feed?limit=${LIMIT}&skip=${currentSkip}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedPosts = data.posts || [];
        
        if (reset) {
          setPosts(fetchedPosts);
          setSkip(fetchedPosts.length);
        } else {
          setPosts(prev => [...prev, ...fetchedPosts]);
          setSkip(prev => prev + fetchedPosts.length);
        }

        // If we fetched fewer posts than the limit, we know there are no more posts left!
        if (fetchedPosts.length < LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to retrieve social feed.');
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handlePostCreated = () => {
    // Refresh the feed completely from the top
    fetchFeed(true);
  };

  const handlePostUpdated = () => {
    // Refresh feed to show updated content, reaction list, or comment count
    // Instead of resetting the full list, we could also fetch details, but refreshing is extremely simple and perfectly secure!
    fetchFeed(true);
  };

  const handlePostDeleted = () => {
    // Reset and reload the feed
    fetchFeed(true);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <StoriesBar />
      
      {/* 1. Create Post Box */}
      <CreatePostBox onPostCreated={handlePostCreated} />

      {/* Friend Suggestions */}
      <FriendSuggestions onUserClick={onUserClick} />

      {/* 2. Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-3xl p-4 flex items-center gap-2.5 shadow-sm text-xs font-semibold">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
          <button 
            onClick={() => fetchFeed(true)}
            className="p-1.5 hover:bg-red-100 rounded-xl transition-colors text-red-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-reverse" />
          </button>
        </div>
      )}

      {/* 3. Feed List / Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <span className="text-xs text-rose-400 font-bold uppercase tracking-wider font-mono">Assembling Feed Sparks...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-pink-50 p-8 text-center space-y-3 shadow-md shadow-rose-900/5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mx-auto">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="font-sans font-black text-slate-800 text-lg">Your Feed is Quiet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            There are no active gatherings or posts matching your visibility. Share a text, add a beautiful cover photo, or tag friends to spark a conversation!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onUserClick={onUserClick}
                onReportClick={onReportClick}
              />
            ))}
          </AnimatePresence>

          {/* INFINITE SCROLL / PAGINATION CONTROL */}
          {hasMore ? (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchFeed(false)}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-pink-100 hover:bg-rose-50 hover:border-pink-200 text-rose-600 font-black text-xs rounded-full shadow-md shadow-rose-900/5 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading more sparks...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Load More Posts</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 relative">
              <div className="absolute inset-0 flex items-center pointer-events-none" aria-hidden="true">
                <div className="w-full border-t border-pink-100/50"></div>
              </div>
              <div className="relative inline-block bg-[#FFF5F7] px-4">
                <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-rose-400 font-sans">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400 fill-orange-300" />
                  You are all caught up!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
