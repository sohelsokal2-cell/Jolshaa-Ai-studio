import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';
import { Notification } from '../types.ts';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  notifications: Notification[];
  unreadNotificationCount: number;
  addNotification: (notif: Notification) => void;
  markNotificationsAsRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io();

    newSocket.on('connect', () => {
      newSocket.emit('join', user.id);
    });

    newSocket.on('userOnline', (userId: string) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    newSocket.on('userOffline', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    newSocket.on('newNotification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    });

    setSocket(newSocket);

    // Initial fetch of notifications
    fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    })
    .catch(err => console.error('Error fetching notifications:', err));

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const addNotification = (notif: Notification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error(err));
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, notifications, unreadNotificationCount, addNotification, markNotificationsAsRead }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
