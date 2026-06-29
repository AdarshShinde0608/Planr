'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isAuthenticated } from '../utils/api';
import Link from 'next/link';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, [pathname]);

  const isAuthPage = pathname === '/' || pathname === '/login';
  const showSidebar = loggedIn && !isAuthPage;

  const links = [
    { name: 'Schedule', href: '/dashboard', icon: '📅' },
    { name: 'Tasks', href: '/tasks', icon: '📝' },
    { name: 'Habits', href: '/habits', icon: '🏃' },
    { name: 'Goals', href: '/goals', icon: '🎯' },
  ];

  return (
    <div className="app-container">
      {showSidebar && <Sidebar />}
      <div className={`main-wrapper ${showSidebar ? 'has-sidebar' : 'no-sidebar'}`}>
        <Header />
        <main className="page-content">
          {children}
        </main>
        {showSidebar && (
          <nav className="bottom-nav">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`bottom-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="bottom-nav-icon">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
