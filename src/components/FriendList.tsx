import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Users, Loader2, UserMinus } from 'lucide-react';
import { User } from '../types.ts';

interface FriendListProps {
  userId: string;
  onUserClick?: (id: string) => void;
}

export default function FriendList({ userId, onUserClick }: FriendListProps) {
  const { token, user: currentUser } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/friends/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFriends(data.friends || []);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-tight text-rose-500 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-rose-400" />
          Friends ({friends.length})
        </h3>
      </div>

      {friends.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No friends to show yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {friends.map((friend) => (
            <div 
              key={friend.id} 
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-pink-100"
              onClick={() => onUserClick && onUserClick(friend.id)}
            >
              <img 
                src={friend.profilePhoto} 
                alt={friend.name} 
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800 line-clamp-1">{friend.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
