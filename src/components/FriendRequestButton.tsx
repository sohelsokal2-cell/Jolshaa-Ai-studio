import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useSocket } from '../context/SocketContext.tsx';
import { UserPlus, UserCheck, UserMinus, Clock, ThumbsUp, X, Ban, RefreshCw } from 'lucide-react';

interface FriendRequestButtonProps {
  targetUserId: string;
  onStatusChange?: () => void;
}

export default function FriendRequestButton({ targetUserId, onStatusChange }: FriendRequestButtonProps) {
  const { token, user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked' | 'blocking' | 'self'>('none');
  const [requestId, setRequestId] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!token || !targetUserId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/friends/status/${targetUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        setRequestId(data.requestId || null);
      }
    } catch (err) {
      console.error('Error fetching friendship status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [targetUserId, token]);

  const handleAction = async (method: 'POST' | 'PUT' | 'DELETE', url: string, actionType?: string) => {
    if (!token || actionLoading) return;
    try {
      setActionLoading(true);
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        await fetchStatus();
        if (onStatusChange) onStatusChange();
        
        // Emit notification for friend request
        if (actionType === 'send_request' && socket && currentUser) {
          socket.emit('sendNotification', {
            recipientId: targetUserId,
            senderId: currentUser.id,
            type: 'friend_request'
          });
        }
      }
    } catch (err) {
      console.error('Friend action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Loading...
      </button>
    );
  }

  if (status === 'self') {
    return null;
  }

  // 1. BLOCKED BY THE OTHER USER
  if (status === 'blocked') {
    return (
      <button disabled className="bg-slate-100 text-slate-400 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 cursor-not-allowed">
        <Ban className="h-3.5 w-3.5" />
        Unavailable
      </button>
    );
  }

  // 2. BLOCKED BY ME
  if (status === 'blocking') {
    return (
      <button
        onClick={() => handleAction('DELETE', `/api/users/${targetUserId}/unblock`)}
        disabled={actionLoading}
        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 cursor-pointer transition-all"
      >
        <Ban className="h-3.5 w-3.5" />
        Unblock User
      </button>
    );
  }

  // 3. PENDING SENT (WE REQUESTED)
  if (status === 'pending_sent') {
    return (
      <button
        onClick={() => requestId && handleAction('DELETE', `/api/friends/cancel/${requestId}`)}
        disabled={actionLoading}
        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-pink-100 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 cursor-pointer transition-all"
        title="Cancel Request"
      >
        <Clock className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
        Requested (Cancel)
      </button>
    );
  }

  // 4. PENDING RECEIVED (THEY REQUESTED)
  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => requestId && handleAction('PUT', `/api/friends/accept/${requestId}`)}
          disabled={actionLoading}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-200 transition-all"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          onClick={() => requestId && handleAction('PUT', `/api/friends/reject/${requestId}`)}
          disabled={actionLoading}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1 cursor-pointer transition-all"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    );
  }

  // 5. FRIENDS
  if (status === 'friends') {
    return (
      <button
        onClick={() => handleAction('DELETE', `/api/friends/unfriend/${targetUserId}`)}
        disabled={actionLoading}
        className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-200 transition-all group"
      >
        <UserCheck className="h-3.5 w-3.5 group-hover:hidden" />
        <UserMinus className="h-3.5 w-3.5 hidden group-hover:inline" />
        <span className="group-hover:hidden">Friends</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    );
  }

  // 6. NONE (ADD FRIEND)
  return (
    <button
      onClick={() => handleAction('POST', `/api/friends/request/${targetUserId}`, 'send_request')}
      disabled={actionLoading}
      className="bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-100 transition-all"
    >
      <UserPlus className="h-3.5 w-3.5" />
      Add Friend
    </button>
  );
}
