import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { StoryGroup, Story } from '../types.ts';
import { Plus, X, ChevronRight, ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StoriesBar() {
  const { token, user } = useAuth();
  const [feed, setFeed] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Story viewer state
  const [viewingGroupIdx, setViewingGroupIdx] = useState<number | null>(null);
  const [viewingStoryIdx, setViewingStoryIdx] = useState<number>(0);
  
  // Create story state
  const [isCreating, setIsCreating] = useState(false);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/stories/feed', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setFeed((await res.json()).feed || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [token]);

  // Story Viewer logic
  const handleStoryTap = (groupIdx: number) => {
    setViewingGroupIdx(groupIdx);
    // Find first unseen story
    const group = feed[groupIdx];
    if (!group) return;
    
    let firstUnseenIdx = 0;
    if (user) {
      const idx = group.stories.findIndex(s => !s.viewers?.includes(user.id));
      if (idx !== -1) firstUnseenIdx = idx;
    }
    setViewingStoryIdx(firstUnseenIdx);
  };

  useEffect(() => {
    if (viewingGroupIdx !== null && viewingStoryIdx !== null && user) {
      const story = feed[viewingGroupIdx]?.stories[viewingStoryIdx];
      if (story && !story.viewers?.includes(user.id)) {
        // mark viewed
        fetch(`/api/stories/${story.id}/view`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } }).catch(console.error);
        
        // optimistic update
        setFeed(prev => {
          const newFeed = [...prev];
          newFeed[viewingGroupIdx].stories[viewingStoryIdx].viewers.push(user.id);
          return newFeed;
        });
      }
    }
  }, [viewingGroupIdx, viewingStoryIdx]);

  useEffect(() => {
    let timer: any;
    if (viewingGroupIdx !== null && feed[viewingGroupIdx]) {
      const currentStory = feed[viewingGroupIdx].stories[viewingStoryIdx];
      // 5 seconds per photo, 15 for video
      const duration = currentStory.mediaType === 'video' ? 15000 : 5000;
      timer = setTimeout(() => {
        handleNextStory();
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [viewingGroupIdx, viewingStoryIdx, feed]);

  const handleNextStory = () => {
    if (viewingGroupIdx === null) return;
    const group = feed[viewingGroupIdx];
    if (viewingStoryIdx < group.stories.length - 1) {
      setViewingStoryIdx(prev => prev + 1);
    } else if (viewingGroupIdx < feed.length - 1) {
      setViewingGroupIdx(prev => prev! + 1);
      setViewingStoryIdx(0);
    } else {
      setViewingGroupIdx(null); // close
      fetchStories(); // refresh
    }
  };

  const handlePrevStory = () => {
    if (viewingGroupIdx === null) return;
    if (viewingStoryIdx > 0) {
      setViewingStoryIdx(prev => prev - 1);
    } else if (viewingGroupIdx > 0) {
      setViewingGroupIdx(prev => prev! - 1);
      setViewingStoryIdx(feed[viewingGroupIdx - 1].stories.length - 1);
    }
  };

  // Create Story logic
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCreateFile(file);
      setCreatePreview(URL.createObjectURL(file));
      setIsCreating(true);
    }
  };

  const handleCreateSubmit = async () => {
    if (!createFile || !token) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('media', createFile);
    
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setIsCreating(false);
        setCreateFile(null);
        setCreatePreview(null);
        fetchStories();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="h-28 bg-white rounded-[2rem] border border-pink-50 shadow-sm animate-pulse mb-6"></div>;
  }

  // Active viewing story
  const activeGroup = viewingGroupIdx !== null ? feed[viewingGroupIdx] : null;
  const activeStory = activeGroup ? activeGroup.stories[viewingStoryIdx] : null;

  // Determine if user has own stories
  const myGroupIdx = feed.findIndex(g => g.user.id === user?.id);

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-4 mb-6 overflow-x-auto hide-scrollbar">
        <div className="flex gap-4">
          
          {/* Create Story Button */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer w-[72px]" onClick={() => fileInputRef.current?.click()}>
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center relative border-2 border-transparent">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} className="w-full h-full rounded-full object-cover opacity-60" />
              ) : (
                <Plus className="h-6 w-6 text-slate-400" />
              )}
              <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-1 border-2 border-white">
                <Plus className="h-3 w-3" />
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">Add Story</span>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </div>

          {/* Stories List */}
          {feed.map((group, idx) => {
            const isMe = group.user.id === user?.id;
            return (
              <div key={group.user.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer w-[72px]" onClick={() => handleStoryTap(idx)}>
                <div className={`w-16 h-16 rounded-full p-[3px] ${group.allSeen ? 'bg-slate-200' : 'bg-gradient-to-tr from-rose-500 to-orange-400'}`}>
                  <div className="w-full h-full bg-white rounded-full p-[2px]">
                    <img src={group.user.profilePhoto} alt={group.user.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                  {isMe ? 'Your Story' : group.user.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STORY VIEWER */}
      <AnimatePresence>
        {activeGroup && activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col sm:p-4"
          >
            {/* Header / Progress */}
            <div className="absolute top-0 inset-x-0 p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
              <div className="flex gap-1 mb-4">
                {activeGroup.stories.map((s, i) => (
                  <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: i < viewingStoryIdx ? '100%' : '0%' }}
                      animate={{ width: i === viewingStoryIdx ? '100%' : i < viewingStoryIdx ? '100%' : '0%' }}
                      transition={{ duration: i === viewingStoryIdx ? (activeStory.mediaType === 'video' ? 15 : 5) : 0, ease: "linear" }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={activeGroup.user.profilePhoto} className="w-10 h-10 rounded-full border border-white/20" />
                  <div>
                    <p className="font-bold text-white text-sm shadow-sm">{activeGroup.user.name}</p>
                    <p className="text-[10px] text-white/70">{new Date(activeStory.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <button onClick={() => { setViewingGroupIdx(null); fetchStories(); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Media Area */}
            <div className="flex-1 relative flex items-center justify-center max-w-md mx-auto w-full group overflow-hidden sm:rounded-[2rem]">
              {activeStory.mediaType === 'video' ? (
                <video src={activeStory.media} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={activeStory.media} className="w-full h-full object-cover" />
              )}
              
              {/* Tap zones */}
              <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrevStory} />
              <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNextStory} />
            </div>

            {/* Viewers (only for owner) */}
            {activeGroup.user.id === user?.id && (
              <div className="absolute bottom-4 inset-x-0 flex justify-center z-20">
                <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {activeStory.viewers?.length || 0} Viewers
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE PREVIEW MODAL */}
      <AnimatePresence>
        {isCreating && createPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-[2rem] max-w-md w-full overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-black text-lg">Create Story</h2>
                <button onClick={() => { setIsCreating(false); setCreatePreview(null); setCreateFile(null); }} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-[9/16] bg-slate-900 relative">
                {createFile?.type.startsWith('video/') ? (
                  <video src={createPreview} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={createPreview} className="w-full h-full object-contain" />
                )}
              </div>
              <div className="p-4 bg-white flex justify-end gap-2">
                <button 
                  onClick={() => { setIsCreating(false); setCreatePreview(null); setCreateFile(null); }}
                  className="px-6 py-2.5 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateSubmit}
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-full font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors flex items-center gap-2"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Story'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
