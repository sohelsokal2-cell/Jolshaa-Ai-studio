import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserPlus, Sparkles, Loader2, Users } from 'lucide-react';
import { User } from '../types.ts';
import FriendRequestButton from './FriendRequestButton.tsx';

interface FriendSuggestionsProps {
  onUserClick?: (id: string) => void;
}

export default function FriendSuggestions({ onUserClick }: FriendSuggestionsProps) {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch('/api/friends/suggestions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 flex justify-center mb-6">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show anything if no suggestions
  }

  return (
    <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-6 mb-6">
      <h3 className="text-sm font-black uppercase tracking-tight text-rose-500 flex items-center gap-1.5 mb-4">
        <Sparkles className="h-4 w-4 text-orange-400 fill-orange-300" />
        People You May Know
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {suggestions.map((user) => (
          <div 
            key={user.id} 
            className="flex-shrink-0 w-36 bg-rose-50/30 border border-pink-100 rounded-2xl p-4 flex flex-col items-center text-center snap-start"
          >
            <img 
              src={user.profilePhoto} 
              alt={user.name} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm mb-2 cursor-pointer hover:ring-rose-200 transition-all"
              onClick={() => onUserClick && onUserClick(user.id)}
            />
            <p 
              className="text-xs font-bold text-slate-800 line-clamp-1 mb-1 cursor-pointer hover:text-rose-600 transition-colors"
              onClick={() => onUserClick && onUserClick(user.id)}
            >
              {user.name}
            </p>
            <div className="mt-auto pt-2 w-full flex justify-center">
              <FriendRequestButton targetUserId={user.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
