'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStoredUser, logoutUser, isAuthenticated } from '../utils/api';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
    setUser(getStoredUser());
  }, [pathname]);

  const links = [
    { name: 'Schedule', href: '/dashboard', icon: '📅' },
    { name: 'Tasks', href: '/tasks', icon: '📝' },
    { name: 'Habits', href: '/habits', icon: '🏃' },
    { name: 'Goals', href: '/goals', icon: '🎯' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 512 512" style={{ fill: 'none' }}>
              <circle cx="256" cy="256" r="220" stroke="url(#logo-grad-sidebar)" strokeWidth="40" />
              <path d="M 256 100 L 256 256 L 350 300" stroke="url(#logo-grad-sidebar)" strokeWidth="44" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-grad-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a8c8d6" />
                  <stop offset="100%" stopColor="#6d8fab" />
                </linearGradient>
              </defs>
            </svg>
            <span>Planr</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-links">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {loggedIn && (
        <div className="sidebar-profile mt-auto border-t border-border pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                {user?.name || 'User'}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email || ''}
              </span>
            </div>
          </div>
          <button 
            onClick={logoutUser} 
            className="btn-secondary w-full justify-center py-2 text-sm border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
}
