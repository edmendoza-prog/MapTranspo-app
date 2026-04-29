'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Notification } from '@/types/database';

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to notification changes
    const channel = supabase
      .channel('notification-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications((prev) =>
            prev.map((n) => (n.id === (payload.new as any).id ? (payload.new as Notification) : n))
          );
          fetchUnreadCount();
        } else if (payload.eventType === 'DELETE') {
          setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
          fetchUnreadCount();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const result = await response.json();
      if (result.success) {
        setNotifications(result.data);
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    setUnreadCount(count || 0);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      await Promise.all(
        unreadIds.map((id) =>
          fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_read: true }),
          })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-900';
      case 'error':
        return 'bg-red-50 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-400 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delay':
        return '⚠️';
      case 'deviation':
        return '🚨';
      case 'check-in':
        return '✅';
      case 'maintenance':
        return '🔧';
      case 'arrival':
        return '📍';
      case 'departure':
        return '🚚';
      case 'alert':
      default:
        return '🔔';
    }
  };

  const displayedNotifications = showUnreadOnly
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-slate-50">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-slate-800">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowUnreadOnly(false)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition ${
              !showUnreadOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition ${
              showUnreadOnly
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`border-l-4 rounded-r-lg p-3 cursor-pointer transition hover:shadow-md ${getSeverityColor(
              notification.severity
            )} ${!notification.is_read ? 'bg-opacity-100' : 'bg-opacity-50 opacity-70'}`}
            onClick={() => !notification.is_read && markAsRead(notification.id)}
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">{getTypeIcon(notification.notification_type)}</span>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <p className="text-xs mt-1">{notification.message}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs opacity-75">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-75">
                    {notification.notification_type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {displayedNotifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🔕</p>
            <p className="text-sm">
              {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
