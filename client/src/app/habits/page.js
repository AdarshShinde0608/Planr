'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, isAuthenticated } from '../../utils/api';

export default function HabitsPage() {
  const router = useRouter();
  const [habits, setHabits] = useState([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHabits = async () => {
    try {
      const data = await apiFetch('/habits');
      setHabits(data);
    } catch (err) {
      setError(err.message || 'Failed to load habits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    } else {
      fetchHabits();
    }
  }, [router]);

  // Create new habit
  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setError('');
    setActionLoading(true);
    try {
      const newHabit = await apiFetch('/habits', {
        method: 'POST',
        body: JSON.stringify({ name: newHabitName })
      });
      setHabits([...habits, newHabit]);
      setNewHabitName('');
    } catch (err) {
      setError(err.message || 'Failed to create habit.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle habit completion for a specific date
  const handleToggleHabitDate = async (habitId, dateStr) => {
    try {
      const updatedHabit = await apiFetch(`/habits/${habitId}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ date: dateStr })
      });
      setHabits(habits.map(h => (h._id || h.id) === habitId ? updatedHabit : h));
    } catch (err) {
      setError(err.message || 'Failed to toggle habit.');
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Delete this habit and all its history?')) return;
    try {
      await apiFetch(`/habits/${habitId}`, { method: 'DELETE' });
      setHabits(habits.filter(h => (h._id || h.id) !== habitId));
    } catch (err) {
      setError(err.message || 'Failed to delete habit.');
    }
  };

  // Generate list of the last 7 dates for the checkboxes
  const getLast7Days = () => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const last7Days = getLast7Days();

  // Generate date list for the 5-week Heatmap (35 days)
  const getHeatmapDays = () => {
    const list = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  };

  const heatmapDays = getHeatmapDays();

  // Calculate completion level for a specific date across all habits (for heatmap styling)
  const getCompletionLevelForDate = (dateStr) => {
    if (habits.length === 0) return 0;
    
    let completedCount = 0;
    habits.forEach(h => {
      const record = h.history.find(entry => entry.date === dateStr);
      if (record && record.completed) completedCount++;
    });

    const completionRatio = completedCount / habits.length;
    if (completionRatio === 0) return 0;
    if (completionRatio <= 0.33) return 1;
    if (completionRatio <= 0.66) return 2;
    if (completionRatio < 1.0) return 3;
    return 4; // 100% completed
  };

  // Format date string to display Day Initial (e.g. "M", "T")
  const getDayLabel = (dateStr) => {
    const dateObj = new Date(dateStr);
    const options = { weekday: 'narrow' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="pulse" style={{ color: 'var(--accent-teal)' }}>Aligning Habits...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '2rem' }}>Habit & Routine Tracker</h2>
          <p style={{ color: 'var(--text-muted)' }}>Build consistent streaks and track daily adherence</p>
        </div>

        {/* Add Habit Form */}
        <form onSubmit={handleCreateHabit} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="New Habit (e.g. Read 15 mins)"
            className="form-input"
            style={{ width: '220px' }}
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            disabled={actionLoading}
            required
          />
          <button type="submit" className="btn-primary" disabled={actionLoading}>
            + Add
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          color: 'var(--danger)',
          padding: '12px',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* HEATMAP INSIGHT CARD (Github style) */}
      <div className="glass-card" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-teal)' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🔥 5-Week Consistency Heatmap</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Visualizing your daily habit completion rate over the last 35 days. Darker green blocks represent higher completion ratios.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {/* Heatmap Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', width: '260px' }}>
            {heatmapDays.map((day) => {
              const level = getCompletionLevelForDate(day);
              return (
                <div 
                  key={day} 
                  className={`heatmap-cell level-${level}`}
                  style={{ width: '30px', height: '30px', borderRadius: '4px', position: 'relative' }}
                  title={`${day}: Level ${level} completion`}
                >
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '0.65rem',
                    color: level > 0 ? 'var(--bg-app)' : 'var(--text-muted)',
                    fontWeight: '700'
                  }}>
                    {getDayLabel(day)}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '16px' }}>
            <div>Level 0: 0% complete</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px' }} className="heatmap-cell level-1"></span>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px' }} className="heatmap-cell level-2"></span>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px' }} className="heatmap-cell level-3"></span>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px' }} className="heatmap-cell level-4"></span>
            </div>
          </div>
        </div>
      </div>

      {/* HABIT LIST CARD */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>🏃 Your Active Habits</h3>
        
        {habits.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No habits added yet. Build your first habit above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {habits.map((habit) => {
              const habitId = habit._id || habit.id;
              
              return (
                <div 
                  key={habitId} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {/* Habit Details */}
                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{habit.name}</div>
                    <div style={{ color: 'var(--accent-teal)', fontSize: '0.85rem', marginTop: '4px', fontWeight: '600' }}>
                      🔥 {habit.streak} Day Streak
                    </div>
                  </div>

                  {/* 7-Day Checklist */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {last7Days.map((day) => {
                      const record = habit.history.find(h => h.date === day);
                      const isCompleted = record ? record.completed : false;
                      const dateObj = new Date(day);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                      const dayNumber = dateObj.getDate();

                      return (
                        <div 
                          key={day}
                          onClick={() => handleToggleHabitDate(habitId, day)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                            background: isCompleted ? 'var(--timeline-task)' : 'transparent',
                            border: `1px solid ${isCompleted ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
                            width: '40px'
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            {dayName}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '700', margin: '2px 0' }}>
                            {dayNumber}
                          </span>
                          <span style={{ fontSize: '0.8rem' }}>
                            {isCompleted ? '✅' : '⭕'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteHabit(habitId)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                    title="Delete Habit"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
