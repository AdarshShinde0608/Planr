'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredUser, logoutUser, isAuthenticated } from '../utils/api';
import Link from 'next/link';
import NotificationPanel from './NotificationPanel';
import ChatAssistant from './ChatAssistant';

export default function Header() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setUser(getStoredUser());

    const storedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(storedTheme);
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  };

  const isAuthPage = pathname === '/' || pathname === '/login';
  const showMobileLogo = loggedIn && !isAuthPage;

  return (
    <header className="top-header">
      {showMobileLogo && (
        <div className="mobile-logo lg:hidden">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="logo" style={{ fontSize: '1.25rem' }}>
              <svg width="22" height="22" viewBox="0 0 512 512" style={{ fill: 'none' }}>
                <circle cx="256" cy="256" r="220" stroke="url(#logo-grad-header)" strokeWidth="40" />
                <path d="M 256 100 L 256 256 L 350 300" stroke="url(#logo-grad-header)" strokeWidth="44" strokeLinecap="round" />
                <defs>
                  <linearGradient id="logo-grad-header" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a8c8d6" />
                    <stop offset="100%" stopColor="#6d8fab" />
                  </linearGradient>
                </defs>
              </svg>
              <span>Planr</span>
            </div>
          </Link>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          className="btn-secondary" 
          style={{ 
            width: '36px', 
            height: '36px', 
            padding: '0', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}
          title="Toggle Light/Dark Theme"
        >
          {/* Sun Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{
              transition: 'all 0.3s ease',
              transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
              opacity: theme === 'light' ? 1 : 0,
              position: theme === 'light' ? 'relative' : 'absolute'
            }}
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>

          {/* Moon Icon */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{
              transition: 'all 0.3s ease',
              transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
              opacity: theme === 'dark' ? 1 : 0,
              position: theme === 'dark' ? 'relative' : 'absolute'
            }}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        </button>

        {loggedIn && !isAuthPage && (
          <>
            <NotificationPanel />
            <button 
              onClick={() => setIsAssistantOpen(true)}
              className="btn-primary"
              style={{ padding: '8px 16px' }}
            >
              🤖 Coach
            </button>
          </>
        )}

        {loggedIn && !isAuthPage ? (
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Hi, {user?.name || 'User'}
            </span>
            <button onClick={logoutUser} className="btn-secondary" style={{ padding: '8px 16px' }}>
              Logout
            </button>
          </div>
        ) : (
          !isAuthPage && (
            <a href="/">
              <button className="btn-primary" style={{ padding: '8px 20px' }}>
                Sign In
              </button>
            </a>
          )
        )}
      </div>

      <ChatAssistant 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)}
        onRefreshData={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    </header>
  );
}
