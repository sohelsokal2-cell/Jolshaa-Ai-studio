import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Conversation, Message } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatSidebar() {
  const { user, token } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, token]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMsg = (msg: Message) => {
      // If it's for the active conversation, append it
      if (activeConv && msg.conversation === activeConv.id) {
        setMessages(prev => [...prev, msg]);
      }
      // Re-fetch conversations to update the lastMessage and sort order
      fetchConversations();
    };

    socket.on('newMessage', handleNewMsg);
    return () => {
      socket.off('newMessage', handleNewMsg);
    };
  }, [socket, activeConv]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeConv || !socket || !user) return;
    
    // Optimistic UI could be added here, but socket will emit it back
    const targetParticipants = activeConv.participants.map(p => p.id);
    
    socket.emit('sendMessage', {
      conversationId: activeConv.id,
      senderId: user.id,
      text: inputText,
      participants: targetParticipants
    });
    
    setInputText('');
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xl shadow-rose-200 flex items-center justify-center transition-transform hover:scale-105 z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
          >
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
              <h2 className="font-black text-slate-800 flex items-center gap-2">
                {activeConv ? (
                  <button onClick={() => setActiveConv(null)} className="text-rose-500 hover:underline text-xs mr-2">
                    &larr; Back
                  </button>
                ) : (
                  <MessageCircle className="h-5 w-5 text-rose-500" />
                )}
                {activeConv ? (
                  activeConv.isGroup ? activeConv.groupName : activeConv.participants.find(p => p.id !== user.id)?.name || 'Chat'
                ) : 'Messages'}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col bg-[#FAFAFA]">
              {activeConv ? (
                // --- CHAT WINDOW ---
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMsgs ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-rose-500" /></div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMine = msg.sender.id === user.id;
                        return (
                          <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                              {!isMine && activeConv.isGroup && (
                                <p className="text-[10px] font-bold text-slate-400 mb-0.5">{msg.sender.name}</p>
                              )}
                              <p className="text-sm">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Input Box */}
                  <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="w-10 h-10 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>
                </>
              ) : (
                // --- CONVERSATION LIST ---
                <div className="flex-1 overflow-y-auto p-2">
                  {conversations.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 text-sm font-medium">
                      No conversations yet. <br/> Visit a friend's profile to start chatting!
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const otherUser = conv.participants.find(p => p.id !== user.id);
                      if (!otherUser && !conv.isGroup) return null;
                      
                      const isOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;

                      return (
                        <div
                          key={conv.id}
                          onClick={() => openConversation(conv)}
                          className="flex items-center gap-3 p-3 hover:bg-white rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 hover:shadow-sm mb-1"
                        >
                          <div className="relative">
                            <img
                              src={conv.isGroup ? 'https://ui-avatars.com/api/?name=Group' : otherUser?.profilePhoto}
                              alt="Avatar"
                              className="w-12 h-12 rounded-[1rem] object-cover"
                            />
                            {!conv.isGroup && isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">
                              {conv.isGroup ? conv.groupName : otherUser?.name}
                            </h4>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {conv.lastMessage ? (
                                <>
                                  {conv.lastMessage.sender.id === user.id ? 'You: ' : ''}
                                  {conv.lastMessage.text}
                                </>
                              ) : (
                                'New conversation'
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
