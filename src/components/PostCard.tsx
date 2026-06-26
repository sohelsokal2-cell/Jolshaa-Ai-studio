import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Post, Reaction } from '../types.ts';
import { 
  Heart, Sparkles, MessageSquare, Share2, Edit3, Trash2, 
  Globe, Users, Lock, Check, Loader2, Smile, AlertCircle, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactionPicker from './ReactionPicker.tsx';
import CommentSection from './CommentSection.tsx';

interface PostCardProps {
  key?: string | number;
  post: Post;
  onPostUpdated: () => void;
  onPostDeleted: () => void;
  onUserClick?: (id: string) => void;
  onReportClick?: (targetType: 'post' | 'comment' | 'user', targetId: string) => void;
}

const EMOJI_MAP: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡'
};

const COLOR_MAP: Record<string, string> = {
  like: 'text-blue-500 hover:text-blue-600',
  love: 'text-rose-500 hover:text-rose-600',
  haha: 'text-amber-500 hover:text-amber-600',
  wow: 'text-orange-500 hover:text-orange-600',
  sad: 'text-indigo-500 hover:text-indigo-600',
  angry: 'text-red-500 hover:text-red-600'
};

export default function PostCard({ post, onPostUpdated, onPostDeleted, onUserClick, onReportClick }: PostCardProps) {
  const { user, token } = useAuth();
  
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editVisibility, setEditVisibility] = useState(post.visibility);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const reactionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwnPost = user && (post.author.id === user.id || (post.author as any)._id === user.id);

  // Find current user's reaction if any
  const myReaction = post.reactions.find(
    r => r.user.id === user?.id || (r.user as any)._id === user?.id
  );

  const handleReact = async (type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        onPostUpdated();
      }
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  const handleUpdatePost = async () => {
    if (!editText.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: editText.trim(),
          visibility: editVisibility
        })
      });

      if (response.ok) {
        setIsEditing(false);
        onPostUpdated();
      }
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onPostDeleted();
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleShare = () => {
    // Generate post link
    const postUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.log('Clipboard copy failed:', err));
  };

  // Group reactions for nice count display (e.g. ❤️ 👍 haha)
  const reactionCounts: Record<string, number> = {};
  post.reactions.forEach(r => {
    reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
  });

  const uniqueReactionTypes = Object.keys(reactionCounts);
  const totalReactionsCount = post.reactions.length;

  const handleMouseEnter = () => {
    if (reactionsTimeoutRef.current) clearTimeout(reactionsTimeoutRef.current);
    setShowReactions(true);
  };

  const handleMouseLeave = () => {
    reactionsTimeoutRef.current = setTimeout(() => {
      setShowReactions(false);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-pink-50 shadow-md hover:shadow-xl transition-all p-6 space-y-4"
    >
      {/* HEADER: USER INFO, VISIBILITY, EDIT & DELETE TRIGGER */}
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onUserClick && onUserClick(post.author.id)}
        >
          <img
            src={post.author.profilePhoto}
            alt={post.author.name}
            className="w-10 h-10 rounded-[1rem] object-cover ring-2 ring-rose-50 border border-slate-100 group-hover:ring-rose-200 transition-all"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-slate-800 group-hover:text-rose-600 transition-colors">{post.author.name}</span>
              {post.postedIn && post.postedIn.type !== 'profile' && (
                <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100 flex items-center gap-1">
                  {post.postedIn.type === 'group' ? <Users className="h-3 w-3 text-rose-400" /> : <FileText className="h-3 w-3 text-orange-400" />}
                  in {post.postedIn.type}
                </span>
              )}
              {post.feeling && (
                <span className="text-[11px] text-slate-400 font-medium">
                  is feeling <span className="font-bold text-rose-500">{post.feeling}</span>
                </span>
              )}
            </div>
            
            {/* Timestamp & Visibility */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <span>{new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {post.visibility === 'public' && <Globe className="h-3 w-3" />}
                {post.visibility === 'friends' && <Users className="h-3 w-3" />}
                {post.visibility === 'onlyme' && <Lock className="h-3 w-3" />}
                <span className="capitalize">{post.visibility}</span>
              </div>
              {post.isEdited && (
                <>
                  <span>•</span>
                  <span className="text-orange-400 lowercase font-bold font-sans">edited</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {isOwnPost ? (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isEditing ? 'bg-rose-50 text-rose-500' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                }`}
                title="Edit Post"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={handleDeletePost}
                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Delete Post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            user && (
              <button
                onClick={() => onReportClick && onReportClick('post', post.id)}
                className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                title="Report Post"
              >
                <AlertCircle className="h-4 w-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* TAGGED FRIENDS CARD */}
      {post.taggedUsers && post.taggedUsers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3.5 py-1.5 bg-rose-50/50 border border-pink-100 rounded-2xl text-[11px] text-rose-600 font-bold">
          <span className="opacity-75">Tagged in this post:</span>
          {post.taggedUsers.map((u) => (
            <span 
              key={u.id} 
              className="bg-white border border-pink-100/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm cursor-pointer hover:bg-rose-100 transition-colors"
              onClick={() => onUserClick && onUserClick(u.id)}
            >
              <img src={u.profilePhoto} className="w-3.5 h-3.5 rounded-full object-cover" alt="" />
              {u.name}
            </span>
          ))}
        </div>
      )}

      {/* BODY CONTENT: EDITING VS SHOWING */}
      {isEditing ? (
        <div className="space-y-3 bg-slate-50/60 border border-slate-100 p-4 rounded-3xl">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-white border border-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 rounded-2xl p-3 text-xs text-slate-700 font-medium resize-none"
            rows={3}
          />
          <div className="flex justify-between items-center">
            <select
              value={editVisibility}
              onChange={(e) => setEditVisibility(e.target.value as any)}
              className="bg-white border border-slate-100 text-[10px] font-bold text-slate-600 rounded-full px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="onlyme">Only Me</option>
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-full font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={saving || !editText.trim()}
                className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-bold shadow-md shadow-rose-100 hover:bg-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium break-words">
            {post.text}
          </p>

          {/* MEDIA CONTENT */}
          {post.media && post.media.length > 0 && (
            <div className={`grid gap-2 rounded-[2rem] overflow-hidden ${
              post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {post.media.map((url, index) => (
                <div key={index} className="relative overflow-hidden aspect-video group">
                  <img
                    src={url}
                    alt="Post Media Attachment"
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-500 cursor-zoom-in"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* METRIC COUNTS: REACTION EMOTICONS & COMMENT COUNTS */}
      {(totalReactionsCount > 0 || (post.commentCount || 0) > 0) && (
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold border-b border-rose-50/50 pb-3">
          {/* Reaction bubbles */}
          <div className="flex items-center gap-1.5">
            {totalReactionsCount > 0 && (
              <div className="flex items-center gap-1 bg-rose-50/40 px-2.5 py-1 rounded-full border border-pink-50">
                <div className="flex -space-x-1">
                  {uniqueReactionTypes.slice(0, 3).map((type) => (
                    <span key={type} className="text-sm" title={type}>
                      {EMOJI_MAP[type]}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-rose-500 tracking-tight font-black">
                  {totalReactionsCount} {totalReactionsCount === 1 ? 'reaction' : 'reactions'}
                </span>
              </div>
            )}
          </div>

          {/* Comment counts */}
          <div className="flex gap-3">
            {(post.commentCount || 0) > 0 && (
              <span>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</span>
            )}
          </div>
        </div>
      )}

      {/* INTERACTIVE CONTROLS: LIKE/REACT TRIGGER, COMMENT TOGGLE, SHARE ACTION */}
      <div className="flex items-center justify-between relative border-t border-slate-50 pt-3">
        {/* REACTION SYSTEM */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => handleReact(myReaction ? null : 'like')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              myReaction 
                ? 'bg-rose-50 ' + COLOR_MAP[myReaction.type]
                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            {myReaction ? (
              <span className="text-base select-none leading-none -mt-0.5">{EMOJI_MAP[myReaction.type]}</span>
            ) : (
              <Heart className="h-4.5 w-4.5" />
            )}
            <span className="capitalize">{myReaction ? myReaction.type : 'React'}</span>
          </button>

          {/* Floating reaction picker */}
          <AnimatePresence>
            {showReactions && (
              <div className="absolute bottom-full left-0 mb-1.5 z-50">
                <ReactionPicker 
                  currentReaction={myReaction?.type}
                  onSelect={handleReact}
                  onClose={() => setShowReactions(false)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* COMMENT BOX TOGGLE */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            showComments 
              ? 'bg-rose-50 text-rose-500' 
              : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500'
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span>Comment</span>
        </button>

        {/* SHARE LINK SYSTEM */}
        <div className="relative">
          <button
            onClick={handleShare}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              copied 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            {copied ? <Check className="h-4.5 w-4.5" /> : <Share2 className="h-4.5 w-4.5" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          {/* Copied tooltip popup */}
          <AnimatePresence>
            {copied && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                className="absolute bottom-full right-0 mb-2 bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md shadow-emerald-900/10 whitespace-nowrap z-50 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Copied Link to Clipboard!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* COMMENTS EXPANSION AREA */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CommentSection 
              postId={post.id} 
              onCommentAdded={onPostUpdated} 
              onReportClick={onReportClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
