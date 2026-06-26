import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Post } from '../types.ts';
import { Search, Users, FileText, User as UserIcon, HelpCircle, Loader2, Compass } from 'lucide-react';
import PostCard from './PostCard.tsx';
import GroupView from './GroupView.tsx';
import PageView from './PageView.tsx';

interface SearchResultsProps {
  searchQuery: string;
  onUserClick: (id: string) => void;
  onReportClick: (targetType: 'post' | 'comment' | 'user', targetId: string) => void;
}

export default function SearchResults({ searchQuery, onUserClick, onReportClick }: SearchResultsProps) {
  const { token, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'groups' | 'pages'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    posts: Post[];
    groups: any[];
    pages: any[];
  }>({
    users: [],
    posts: [],
    groups: [],
    pages: []
  });

  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);
  const [viewingPageId, setViewingPageId] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Store based on what tab is active
          if (activeTab === 'all') {
            setResults(data.results);
          } else {
            setResults(prev => ({
              ...prev,
              [activeTab === 'users' ? 'users' : activeTab === 'posts' ? 'posts' : activeTab === 'groups' ? 'groups' : 'pages']: data.results
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery, activeTab, token]);

  const handlePostUpdated = () => {
    // re-trigger fetch
    setActiveTab(prev => prev);
  };

  if (viewingGroupId) {
    return <GroupView groupId={viewingGroupId} onBack={() => setViewingGroupId(null)} />;
  }

  if (viewingPageId) {
    return <PageView pageId={viewingPageId} onBack={() => setViewingPageId(null)} />;
  }

  const hasAnyResults = 
    results.users.length > 0 || 
    results.posts.length > 0 || 
    results.groups.length > 0 || 
    results.pages.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Metadata Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="font-sans font-black text-xl text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Search className="h-5 w-5 text-rose-500" />
            <span>Search Results</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Showing matches for <span className="font-bold text-rose-500 font-mono">"{searchQuery}"</span>
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-50 dark:border-slate-800 p-2 flex flex-wrap gap-2 shadow-sm">
        {(['all', 'users', 'posts', 'groups', 'pages'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[70px] py-2.5 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === tab 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'all' && <Compass className="h-4 w-4" />}
            {tab === 'users' && <UserIcon className="h-4 w-4" />}
            {tab === 'posts' && <FileText className="h-4 w-4" />}
            {tab === 'groups' && <Users className="h-4 w-4" />}
            {tab === 'pages' && <FileText className="h-4 w-4" />}
            <span>{tab}</span>
          </button>
        ))}
      </div>

      {/* RESULTS DISPLAY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest font-mono">Searching Databases...</p>
        </div>
      ) : !hasAnyResults && activeTab === 'all' ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-pink-50 dark:border-slate-800 py-16 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-rose-400">
            <HelpCircle className="h-6 w-6" />
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No results found</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">We couldn't find any users, posts, groups, or pages matching your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* USERS MATCHED */}
          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans font-black text-xs text-slate-400 uppercase tracking-widest pl-2">Users ({results.users.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map((u: any) => (
                  <div key={u.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-center hover:shadow-md transition-shadow">
                    <img src={u.profilePhoto} alt={u.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-rose-50 dark:ring-slate-800 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{u.bio || 'No bio available'}</p>
                    </div>
                    <button
                      onClick={() => onUserClick(u.id)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md shadow-rose-100 dark:shadow-none"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS MATCHED */}
          {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans font-black text-xs text-slate-400 uppercase tracking-widest pl-2">Groups ({results.groups.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.groups.map((g: any) => (
                  <div key={g.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-center hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Users className="h-7 w-7 text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{g.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{g.description || 'No description available'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider font-mono">
                        {g.privacy} • {g.members?.length || 0} Members
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingGroupId(g.id)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md shadow-rose-100 dark:shadow-none"
                    >
                      View Group
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGES MATCHED */}
          {(activeTab === 'all' || activeTab === 'pages') && results.pages.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans font-black text-xs text-slate-400 uppercase tracking-widest pl-2">Pages ({results.pages.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.pages.map((p: any) => (
                  <div key={p.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4 items-center hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <FileText className="h-7 w-7 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{p.description || 'No description available'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider font-mono">
                        {p.followers?.length || 0} Followers
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingPageId(p.id)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md shadow-rose-100 dark:shadow-none"
                    >
                      View Page
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS MATCHED */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans font-black text-xs text-slate-400 uppercase tracking-widest pl-2">Posts ({results.posts.length})</h3>
              <div className="space-y-4">
                {results.posts.map((post: Post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostUpdated}
                    onUserClick={onUserClick}
                    onReportClick={onReportClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
