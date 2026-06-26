import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Comment } from '../types.ts';
import { Loader2, MessageSquare, Send, Trash2, Reply, CornerDownRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
  onReportClick?: (targetType: 'post' | 'comment' | 'user', targetId: string) => void;
}

export default function CommentSection({ postId, onCommentAdded, onReportClick }: CommentSectionProps) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: commentText.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyTo || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: replyText.trim(),
          parentComment: replyTo.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setReplyText('');
        setReplyTo(null);
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Error adding reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove comment and all its replies from the local state
        setComments(prev => prev.filter(c => c.id !== commentId && c.parentComment !== commentId));
        onCommentAdded?.();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Helper to construct hierarchy: returns root comments with their nested replies populated
  const buildCommentTree = (): Comment[] => {
    const commentMap = new Map<string, Comment & { replies: Comment[] }>();
    
    // Initialize map
    comments.forEach(c => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    const rootComments: Comment[] = [];

    comments.forEach(c => {
      const commentWithReplies = commentMap.get(c.id)!;
      if (c.parentComment && commentMap.has(c.parentComment)) {
        commentMap.get(c.parentComment)!.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree();

  return (
    <div className="space-y-4 pt-4 border-t border-rose-50">
      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Comments ({comments.length})
      </h4>

      {/* Primary Add Comment Input */}
      <form onSubmit={handleAddComment} className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:bg-white text-slate-700 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!commentText.trim() || submitting}
          className="p-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-full transition-colors flex items-center justify-center shadow-md shadow-rose-100 cursor-pointer"
        >
          {submitting && !replyTo ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>

      {/* Floating Reply Indicator */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-50/50 border border-pink-100 rounded-xl p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between text-[11px] text-rose-600 font-bold">
              <span className="flex items-center gap-1">
                <Reply className="h-3 w-3" />
                Replying to {replyTo.author.name}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-slate-400 hover:text-rose-500 font-medium"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleAddReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${replyTo.author.name}...`}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-pink-100 rounded-full focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-medium"
                autoFocus
              />
              <button
                type="submit"
                disabled={!replyText.trim() || submitting}
                className="px-3 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-full transition-colors flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments List */}
      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 text-rose-500 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-2 font-mono">Be the first to leave a spark on this post!</p>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          <AnimatePresence>
            {commentTree.map(comment => (
              <div key={comment.id} className="space-y-3">
                {/* Root Comment Row */}
                <div className="flex gap-2.5 items-start">
                  <img
                    src={comment.author.profilePhoto}
                    alt={comment.author.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 bg-slate-50 border border-slate-100/50 rounded-2xl p-3 relative group">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-black text-slate-800">{comment.author.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium break-all">{comment.text}</p>
                    
                    {/* Action buttons on comment */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        onClick={() => setReplyTo(comment)}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Reply className="h-2.5 w-2.5" />
                        Reply
                      </button>
                      
                      {user && (comment.author.id === user.id || (comment.author as any)._id === user.id) ? (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer ml-auto"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          Delete
                        </button>
                      ) : (
                        user && (
                          <button
                            onClick={() => onReportClick && onReportClick('comment', comment.id)}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer ml-auto"
                          >
                            <AlertCircle className="h-2.5 w-2.5" />
                            Report
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-6 border-l-2 border-pink-50 space-y-3 ml-3.5">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-2 items-start">
                        <CornerDownRight className="h-3.5 w-3.5 text-rose-300 shrink-0 mt-1" />
                        <img
                          src={reply.author.profilePhoto}
                          alt={reply.author.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 bg-[#FFFDFE] border border-pink-50/60 rounded-2xl p-2.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-black text-slate-800">{reply.author.name}</span>
                            <span className="text-[8px] text-slate-400 font-mono">
                              {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium break-all">{reply.text}</p>
                          
                          {user && (reply.author.id === user.id || (reply.author as any)._id === user.id) ? (
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-[9px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer mt-1"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                                Delete
                              </button>
                            </div>
                          ) : (
                            user && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => onReportClick && onReportClick('comment', reply.id)}
                                  className="text-[9px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer mt-1"
                                >
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  Report
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
