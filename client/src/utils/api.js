let API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://planrserver.vercel.app/api';
// const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://planr-sooty.vercel.app/api'; // Default to production API if not set

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
  if (isLocal) {
    API_BASE = `http://${hostname}:5000/api`;
  } else {
    API_BASE = 'https://planr-sooty.vercel.app/api'; // Safe fallback for production deployments
  }
}

// Fetch helper with JWT header inclusion
export async function apiFetch(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Normalize API_BASE and endpoint to prevent trailing/duplicate slashes
  const cleanBase = API_BASE.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      logoutUser();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    return null;
  }
}
