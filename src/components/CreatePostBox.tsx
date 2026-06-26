import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, VisibilityType } from '../types.ts';
import { Sparkles, Image, Globe, Users, Lock, Smile, X, Loader2, Tag, Plus, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreatePostBoxProps {
  onPostCreated: () => void;
  postedIn?: { type: 'profile' | 'group' | 'page'; refId?: string };
}

const FEELINGS = [
  { value: 'excited', emoji: '🌟', label: 'Excited' },
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'peaceful', emoji: '🌅', label: 'Peaceful' },
  { value: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { value: 'motivated', emoji: '💪', label: 'Motivated' },
  { value: 'tired', emoji: '🥱', label: 'Tired' }
];

const PRESET_IMAGES = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&auto=format&fit=crop'
];

export default function CreatePostBox({ onPostCreated, postedIn }: CreatePostBoxProps) {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string>('');
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);
  const [showTagUsers, setShowTagUsers] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Exclude current logged in user from tagging list
        const filtered = (data.users || []).filter((u: User) => u.id !== user?.id && (u as any)._id !== user?.id);
        setAllUsers(filtered);
      }
    } catch (err) {
      console.log('Error fetching users for tagging:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files) as File[];
      setMediaFiles(prev => [...prev, ...filesArray]);

      const previewsArray = filesArray.map((file: File) => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...previewsArray]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== index));
    setMediaPreviews(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddPresetImage = (url: string) => {
    // We can fetch pre-designed images and convert them into files, or just append them directly as a media URL fallback in our post box!
    // Let's create a temporary object that acts as a URL
    setMediaPreviews(prev => [...prev, url]);
    
    // Create a dummy file from preset url to upload cleanly
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob as Blob], 'preset_photo.jpg', { type: 'image/jpeg' });
        setMediaFiles(prev => [...prev, file]);
      })
      .catch(err => console.log('Error fetching blob:', err));
  };

  const handleToggleTagUser = (userId: string) => {
    if (taggedUsers.includes(userId)) {
      setTaggedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setTaggedUsers(prev => [...prev, userId]);
    }
  };

  const handlePublish = async () => {
    if (!text.trim() && mediaFiles.length === 0) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('visibility', visibility);
      if (selectedFeeling) {
        formData.append('feeling', selectedFeeling);
      }
      formData.append('taggedUsers', JSON.stringify(taggedUsers));
      if (postedIn) {
        formData.append('postedIn', JSON.stringify(postedIn));
      }
      
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        // Reset state
        setText('');
        setSelectedFeeling('');
        setTaggedUsers([]);
        setMediaFiles([]);
        setMediaPreviews([]);
        setShowFeelings(false);
        setShowTagUsers(false);
        onPostCreated();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to create post. Please try again.');
      }
    } catch (err) {
      console.error('Publish post error:', err);
      alert('An error occurred while publishing your post.');
    } finally {
      setLoading(false);
    }
  };

  const currentFeeling = FEELINGS.find(f => f.value === selectedFeeling);

  return (
    <div className="bg-white rounded-[2.5rem] border border-pink-50 shadow-xl shadow-rose-900/5 p-6 space-y-4">
      {/* HEADER: USER CARD & VISIBILITY */}
      <div className="flex items-center gap-3">
        <img
          src={user?.profilePhoto}
          alt={user?.name}
          className="w-11 h-11 rounded-[1.2rem] object-cover ring-2 ring-rose-50 border border-slate-100"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-sm text-slate-800">{user?.name}</span>
            {currentFeeling && (
              <span className="text-xs text-slate-500 font-medium">
                is feeling <span className="font-bold text-rose-500">{currentFeeling.emoji} {currentFeeling.label}</span>
              </span>
            )}
            
            {taggedUsers.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                with <span className="font-bold text-rose-500">{taggedUsers.length} others</span>
              </span>
            )}
          </div>
          
          {/* VISIBILITY DROPDOWN */}
          <div className="flex items-center gap-1.5 mt-1">
            <div className="relative group">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityType)}
                className="appearance-none bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600 rounded-full pl-6.5 pr-6 py-1 focus:outline-none cursor-pointer focus:ring-1 focus:ring-rose-200 transition-all uppercase tracking-wider"
              >
                <option value="public">Public</option>
                <option value="friends">Friends</option>
                <option value="onlyme">Only Me</option>
              </select>
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {visibility === 'public' && <Globe className="h-3 w-3 text-rose-400" />}
                {visibility === 'friends' && <Users className="h-3 w-3 text-rose-400" />}
                {visibility === 'onlyme' && <Lock className="h-3 w-3 text-rose-400" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEXT AREA */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
          rows={3}
          className="w-full text-slate-700 text-sm focus:outline-none placeholder-slate-400 font-medium resize-none border-b border-slate-50 pb-2"
        />
      </div>

      {/* MEDIA PREVIEWS */}
      {mediaPreviews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
          {mediaPreviews.map((preview, index) => (
            <div key={index} className="relative aspect-video rounded-xl overflow-hidden group shadow-inner">
              <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveMedia(index)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* EXPANDABLE SECTIONS: FEELINGS & TAGGING */}
      <AnimatePresence>
        {showFeelings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4.5"
          >
            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>How are you feeling?</span>
              <button onClick={() => { setSelectedFeeling(''); setShowFeelings(false); }} className="text-slate-400 hover:text-rose-500 font-medium">Clear</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FEELINGS.map((feel) => (
                <button
                  key={feel.value}
                  type="button"
                  onClick={() => { setSelectedFeeling(feel.value); setShowFeelings(false); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-bold border transition-all cursor-pointer ${
                    selectedFeeling === feel.value
                      ? 'bg-rose-50 border-pink-200 text-rose-600 shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{feel.emoji}</span>
                  <span>{feel.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {showTagUsers && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50/50 border border-slate-100/50 rounded-2xl p-4.5"
          >
            <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Tag friends in your post</span>
              <button onClick={() => setTaggedUsers([])} className="text-slate-400 hover:text-rose-500 font-bold">Clear All</button>
            </div>
            {allUsers.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-2 font-mono">No other members registered on Jolshaa yet!</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isTagged = taggedUsers.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleToggleTagUser(u.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        isTagged
                          ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <img src={u.profilePhoto} className="w-4 h-4 rounded-full object-cover" alt="" />
                      <span>{u.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESET COVER SELECTION IF THEY WANT SOMETHING TO LOOK BEAUTIFUL */}
      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
        {/* ACTION PANEL */}
        <div className="flex items-center gap-1.5">
          {/* File input clicker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-rose-50 hover:bg-rose-100/80 text-rose-500 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            title="Add Media File"
          >
            <Image className="h-4.5 w-4.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Feeling clicker */}
          <button
            type="button"
            onClick={() => { setShowFeelings(!showFeelings); setShowTagUsers(false); }}
            className={`p-2.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
              showFeelings ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 hover:bg-orange-100/80 text-orange-400'
            }`}
            title="Feeling / Activity"
          >
            <Smile className="h-4.5 w-4.5" />
          </button>

          {/* Tag friends */}
          <button
            type="button"
            onClick={() => { setShowTagUsers(!showTagUsers); setShowFeelings(false); }}
            className={`p-2.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
              showTagUsers ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-400'
            }`}
            title="Tag Friends"
          >
            <Tag className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* PRESET COVER INLINE SLIDER (Only shown if no media is selected) */}
        {mediaPreviews.length === 0 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presets:</span>
            <div className="flex gap-1">
              {PRESET_IMAGES.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPresetImage(url)}
                  className="w-7 h-7 rounded-lg overflow-hidden border border-slate-100 shadow-sm hover:scale-115 transition-transform cursor-pointer"
                >
                  <img src={url} alt="preset preview" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PUBLISH BUTTON */}
        <button
          onClick={handlePublish}
          disabled={loading || (!text.trim() && mediaFiles.length === 0)}
          className="bg-gradient-to-r from-rose-500 to-orange-400 disabled:from-rose-300 disabled:to-rose-300 hover:from-rose-600 hover:to-orange-500 text-white font-bold text-xs px-6 py-2.5 rounded-full shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 fill-white/10" />
              <span>Publish Post</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
