'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, isAuthenticated } from '../utils/api';

const FEATURES = [
  {
    icon: '⚡',
    title: 'AI-Powered Scheduling',
    desc: 'Just describe your task. The AI extracts duration, priority, and slots it into your free windows automatically.'
  },
  {
    icon: '🔄',
    title: 'Dynamic Rescheduling',
    desc: 'Mark a task done and every remaining block instantly shifts — no manual dragging ever again.'
  },
  {
    icon: '🎯',
    title: 'Habit & Goal Tracking',
    desc: 'Build daily streaks, visualise consistency heatmaps, and link habits to long-term goal milestones.'
  },
  {
    icon: '📅',
    title: 'Calendar Sync',
    desc: 'Connect Google Calendar so external meetings appear as fixed blocks. The AI plans around them.'
  },
];

export default function WelcomePage() {
  const router = useRouter();

  // Auth form state
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister ? { name, email, password } : { email, password };
      const data = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (isRegister) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 73px)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0'
    }}>

      {/* ── LEFT: Hero / Marketing ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 56px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-app)'
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '6px 14px',
          fontSize: '0.78rem',
          fontWeight: '600',
          color: 'var(--accent-secondary)',
          marginBottom: '32px',
          width: 'fit-content'
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'inline-block' }}></span>
          AI-Powered Productivity Companion
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          letterSpacing: '-0.03em',
          color: 'var(--text-main)',
          marginBottom: '20px'
        }}>
          Your day,<br />
          <span style={{
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            planned perfectly.
          </span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-muted)',
          lineHeight: '1.65',
          maxWidth: '440px',
          marginBottom: '48px'
        }}>
          Planr is the last-minute life-saver that turns your chaotic task list into a smart, adaptive daily schedule — powered by AI, built around your life.
        </p>

        {/* Feature grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{f.icon}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{f.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Testimonial / social proof */}
        <div style={{
          marginTop: '40px',
          paddingTop: '32px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex' }}>
            {['🧑‍💻','👩‍🎓','👨‍💼','👩‍🔬'].map((a, i) => (
              <div key={i} style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--bg-card-hover)',
                border: '2px solid var(--bg-app)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
                marginLeft: i > 0 ? '-8px' : '0',
                zIndex: 4 - i,
                position: 'relative'
              }}>{a}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main)' }}>Join thousands of planners</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students, professionals, and freelancers</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Card ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        background: 'var(--bg-card)'
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mode tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '32px'
          }}>
            {['Sign In', 'Create Account'].map((label, i) => {
              const active = (i === 0) ? !isRegister : isRegister;
              return (
                <button
                  key={label}
                  onClick={() => { setIsRegister(i === 1); setError(''); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: 'calc(var(--radius-md) - 4px)',
                    background: active ? 'var(--bg-card)' : 'transparent',
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    border: active ? '1px solid var(--border-color)' : '1px solid transparent'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)' }}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
            {isRegister
              ? 'Plan, prioritize, and crush deadlines — all in one place.'
              : 'Sign in to rescue your daily schedule with AI.'}
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', marginTop: '4px' }}
              disabled={loading}
            >
              {loading
                ? (isRegister ? 'Creating Account...' : 'Signing In...')
                : (isRegister ? 'Create Account & Continue →' : 'Sign In to Dashboard →')
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0 20px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>What you get</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          {/* Mini feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['AI Task Parsing', 'Smart Timeline', 'Habit Streaks', 'Goal Blueprints', 'Calendar Sync', 'Coach AI'].map(pill => (
              <span key={pill} style={{
                padding: '5px 11px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: 'var(--text-muted)'
              }}>
                ✓ {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE: Stack on mobile ── */}
      <style>{`
        @media (max-width: 768px) {
          .welcome-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
