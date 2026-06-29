'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks to close panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="btn-secondary" 
        style={{ padding: '8px 12px', border: 'none', position: 'relative', background: 'rgba(255, 255, 255, 0.02)' }}
        title="View Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: '800',
            boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: '0',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'var(--bg-navbar)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 200,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Dynamic Reminders</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unreadCount} unread</span>
          </div>

          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No notifications. You are all set!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif) => (
                <div 
                  key={notif._id || notif.id}
                  style={{
                    background: notif.read ? 'transparent' : 'var(--timeline-task)',
                    border: `1px solid ${notif.read ? 'var(--border-color)' : 'var(--border-active)'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '0.85rem',
                    cursor: 'default'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: notif.read ? '500' : '700', color: notif.read ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {notif.title}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!notif.read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notif._id || notif.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                          title="Mark as Read"
                        >
                          ✔️
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(notif._id || notif.id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                        title="Dismiss"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', lineHeight: '1.3' }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    {new Date(notif.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
