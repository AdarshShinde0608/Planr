'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, isAuthenticated } from '../../utils/api';

export default function DashboardPage() {
  const router = useRouter();
  const [timeline, setTimeline] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [quickInput, setQuickInput] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCalendarSynced, setIsCalendarSynced] = useState(false);
  const [syncStatusBanner, setSyncStatusBanner] = useState('');

  const fetchData = async () => {
    try {
      const timelineData = await apiFetch('/schedule/generate', { method: 'POST' });
      setTimeline(timelineData);

      const analyticsData = await apiFetch('/analytics');
      setAnalytics(analyticsData);

      try {
        const syncStatus = await apiFetch('/calendar/status');
        setIsCalendarSynced(syncStatus.synced);
      } catch (e) { console.error('Calendar status error:', e); }

      try {
        const historyData = await apiFetch('/analytics/history');
        setHistory(historyData);
      } catch (e) { console.error('History error:', e); }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load schedule data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    } else {
      fetchData();
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('calendar_sync') === 'success') {
        setSyncStatusBanner('✅ Google Calendar connected successfully! Your external events are now dynamically mapped to your schedule.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('calendar_sync') === 'error') {
        setSyncStatusBanner('❌ Failed to link Google Calendar. Please check your credentials or scope consent.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleLinkCalendar = async () => {
    setError('');
    setActionLoading(true);
    try {
      const data = await apiFetch('/calendar/auth');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Google OAuth authentication URL could not be resolved.');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize calendar linking.');
      setActionLoading(false);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setError('');
    setActionLoading(true);
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ rawText: quickInput, deadline: deadlineDate ? new Date(deadlineDate) : null })
      });
      setQuickInput('');
      setDeadlineDate('');
      await fetchData();
    } catch (err) {
      setError(err.message || 'AI task extraction failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    setError('');
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await apiFetch(`/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
      const updatedTimeline = await apiFetch('/schedule/reschedule', { method: 'POST' });
      setTimeline(updatedTimeline);
      const analyticsData = await apiFetch('/analytics');
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to update task.');
    }
  };

  const handleReschedule = async () => {
    setError('');
    setActionLoading(true);
    try {
      const updatedTimeline = await apiFetch('/schedule/reschedule', { method: 'POST' });
      setTimeline(updatedTimeline);
      const analyticsData = await apiFetch('/analytics');
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to reschedule tasks.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="pulse" style={{ color: 'var(--accent-secondary)' }}>Loading Your Companion...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">

      {/* LEFT PANEL: TIMELINE & SCHEDULER (Spans 8 columns on desktop) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {syncStatusBanner && (
          <div style={{
            background: syncStatusBanner.includes('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${syncStatusBanner.includes('✅') ? 'var(--success)' : 'var(--danger)'}`,
            color: syncStatusBanner.includes('✅') ? 'var(--success)' : 'var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '12px',
            fontSize: '0.95rem',
            fontWeight: '600'
          }}>
            {syncStatusBanner}
          </div>
        )}

        {/* Quick Add Task */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>⚡ AI Quick Capture</h3>
          <form onSubmit={handleQuickAdd} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="e.g. Study Chemistry for final exam tomorrow (AI predicts duration and subtasks)"
              className="form-input"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              disabled={actionLoading}
              required
            />
            <div className="flex gap-3">
              <input
                type="datetime-local"
                className="form-input flex-1"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                disabled={actionLoading}
                title="Task Deadline"
              />
              <button type="submit" className="btn-primary px-6" style={{ whiteSpace: 'nowrap' }} disabled={actionLoading}>
                {actionLoading ? 'Analyzing...' : 'Parse & Add'}
              </button>
            </div>
          </form>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '8px' }}>{error}</p>}
        </div>

        {/* Schedule Display */}
        <div className="glass-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 style={{ fontSize: '1.8rem' }}>Today's AI Schedule</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Dynamic plan optimized for your energy levels</p>
            </div>
            <button onClick={handleReschedule} className="btn-primary text-sm whitespace-nowrap" disabled={actionLoading}>
              🔄 Reschedule Remaining
            </button>
          </div>

          {timeline.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No commitments scheduled. Add tasks above to populate your timeline!
            </div>
          ) : (
            <div className="timeline-container">
              {timeline.map((block, idx) => {
                const isFixed = block.type === 'fixed';
                const start = formatTime(block.start);
                const end = formatTime(block.end);

                return (
                  <div key={idx} className={`timeline-block ${isFixed ? 'fixed' : 'task'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="timeline-time">{start} - {end}</div>
                        <div className="timeline-title" style={{ textDecoration: block.completed ? 'line-through' : 'none' }}>
                          {block.title}
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          background: isFixed ? 'var(--timeline-fixed)' : 'var(--timeline-task)',
                          color: isFixed ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          {block.category || 'Focus'}
                        </span>
                      </div>

                      {!isFixed && (
                        <input
                          type="checkbox"
                          style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--accent-secondary)' }}
                          onChange={() => handleToggleTask(block.taskId, block.completed ? 'completed' : 'pending')}
                          checked={block.completed || false}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: ANALYTICS & REFLECTIONS (Spans 4 columns on desktop) */}
      <div className="lg:col-span-4 flex flex-col gap-6">

        {/* Productivity Score */}
        <div className="glass-card text-center flex flex-col items-center">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>🏆 Productivity Score</h3>
          
          {/* Conic Gradient Ring */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(hsl(var(--accent)) ${(analytics?.productivityScore || 0)}%, hsl(var(--border)) ${(analytics?.productivityScore || 0)}% 100%)`,
            margin: '0 auto 16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '102px',
              height: '102px',
              borderRadius: '50%',
              background: 'hsl(var(--card))',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '2rem',
              fontWeight: '800',
              color: 'hsl(var(--foreground))'
            }}>
              {analytics?.productivityScore || 0}%
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div className="border border-border bg-background p-3 rounded-md">
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--success)' }}>{analytics?.completedCount || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
            </div>
            <div className="border border-border bg-background p-3 rounded-md">
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--danger)' }}>{analytics?.overdueCount || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overdue</div>
            </div>
          </div>
        </div>

        {/* AI Reflection Coach */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 AI Companion Coach
          </h3>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)', fontStyle: 'italic' }}>
            "{analytics?.reflection || "Let's start scheduling some tasks! I will summarize your day and motivate you here."}"
          </p>
        </div>

        {/* Google Calendar Sync */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-secondary)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Google Calendar Sync
          </h3>
          {isCalendarSynced ? (
            <div>
              <p style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.95rem' }}>✅ Connected</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                Your calendar events are automatically integrated as fixed schedule blocks.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
                Sync your external schedule so the AI won't double-book your appointments.
              </p>
              <button onClick={handleLinkCalendar} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={actionLoading}>
                🔗 Link Google Calendar
              </button>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📊 Category Allocation</h3>
          {analytics && Object.keys(analytics.categoryDistribution).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No task category distribution data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analytics && Object.entries(analytics.categoryDistribution).map(([category, count]) => {
                const percentage = Math.round((count / analytics.totalTasks) * 100);
                return (
                  <div key={category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span>{category}</span>
                      <span style={{ fontWeight: '600' }}>{count} tasks ({percentage}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: category === 'Work' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                        width: `${percentage}%`
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7-Day Productivity Trend */}
        {history.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📈 7-Day Productivity Trend</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', paddingTop: '20px', gap: '10px' }}>
              {history.map((day, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', background: 'var(--bg-input)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ height: `${day.productivityScore}%`, width: '100%', background: 'var(--accent-gradient)', borderRadius: '4px 4px 0 0', position: 'relative' }}
                      title={`Daily Score: ${day.productivityScore}%`}>
                      <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-main)' }}>
                        {day.productivityScore}%
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
