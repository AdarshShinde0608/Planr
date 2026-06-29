'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getStoredUser, isAuthenticated } from '../../utils/api';

export default function OnboardingPage() {
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const [sleepStart, setSleepStart] = useState('23:00');
  const [sleepEnd, setSleepEnd] = useState('07:00');
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('17:00');
  const [gymStart, setGymStart] = useState('18:00');
  const [gymEnd, setGymEnd] = useState('19:00');
  const [energyPreference, setEnergyPreference] = useState('Morning');
  const [occupation, setOccupation] = useState('Student');
  const [timezone, setTimezone] = useState(typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const preferences = {
        sleepTime: { start: sleepStart, end: sleepEnd },
        workHours: { start: workStart, end: workEnd },
        gymTime: { start: gymStart, end: gymEnd },
        energyPreference,
        occupation,
        timezone,
        language
      };

      const updatedUser = await apiFetch('/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      });

      // Update stored user details
      localStorage.setItem('user', JSON.stringify(updatedUser));
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 120px)',
      padding: '24px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Set Your Daily Routine</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          We place tasks into your free time. Set your sleep, work, and exercise blocks so the AI won't schedule tasks over them.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Profile & Location */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-indigo)' }}>👤 Profile & Context</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>What describes you best?</label>
                <select 
                  className="form-input" 
                  value={occupation} 
                  onChange={(e) => setOccupation(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Employee">Working Professional</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Timezone</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={timezone} 
                  onChange={(e) => setTimezone(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>
          
          {/* Sleep Hours */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-indigo)' }}>🌙 Sleep Hours</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sleep Time</label>
                <input type="time" className="form-input" value={sleepStart} onChange={(e) => setSleepStart(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Wake Up Time</label>
                <input type="time" className="form-input" value={sleepEnd} onChange={(e) => setSleepEnd(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Work / Study Hours */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-indigo)' }}>💼 Work / Study Hours</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Work Start</label>
                <input type="time" className="form-input" value={workStart} onChange={(e) => setWorkStart(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Work End</label>
                <input type="time" className="form-input" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Gym / Exercise Hours */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-indigo)' }}>💪 Workout Hours</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workout Start</label>
                <input type="time" className="form-input" value={gymStart} onChange={(e) => setGymStart(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workout End</label>
                <input type="time" className="form-input" value={gymEnd} onChange={(e) => setGymEnd(e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Productivity Peaks */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--accent-indigo)' }}>⚡ Peak Energy Window</h3>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem' }}>When do you feel most productive and alert?</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['Morning', 'Afternoon', 'Night'].map((pref) => (
                <label 
                  key={pref} 
                  style={{
                    flex: 1,
                    display: 'block',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${energyPreference === pref ? 'var(--border-active)' : 'var(--border-color)'}`,
                    background: energyPreference === pref ? 'var(--timeline-task)' : 'var(--bg-input)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <input
                    type="radio"
                    name="energyPreference"
                    value={pref}
                    checked={energyPreference === pref}
                    onChange={() => setEnergyPreference(pref)}
                    style={{ display: 'none' }}
                  />
                  {pref === 'Morning' && '🌅 Early Bird'}
                  {pref === 'Afternoon' && '☀️ Mid-Day'}
                  {pref === 'Night' && '🦉 Night Owl'}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
            {loading ? 'Saving Preferences...' : 'Save & Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
