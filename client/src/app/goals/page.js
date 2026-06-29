'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, isAuthenticated } from '../../utils/api';

export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [goalTitle, setGoalTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [rawSubtasks, setRawSubtasks] = useState('');

  const fetchGoals = async () => {
    try {
      const data = await apiFetch('/goals');
      setGoals(data);
    } catch (err) {
      setError(err.message || 'Failed to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    } else {
      fetchGoals();
    }
  }, [router]);

  // Create new goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim() || !deadline) return;

    setError('');
    setActionLoading(true);

    try {
      // Parse subtasks list (split by comma or newline)
      const tasks = rawSubtasks
        .split(/[,\n]/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(title => ({ title, completed: false }));

      const newGoal = await apiFetch('/goals', {
        method: 'POST',
        body: JSON.stringify({
          goal: goalTitle,
          deadline: new Date(deadline),
          tasks
        })
      });

      setGoals([newGoal, ...goals]);

      // Reset form
      setGoalTitle('');
      setDeadline('');
      setRawSubtasks('');
    } catch (err) {
      setError(err.message || 'Failed to create goal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Subtask inside a Goal
  const handleToggleSubtask = async (goal, taskIndex) => {
    try {
      const updatedTasks = [...goal.tasks];
      updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

      const goalId = goal._id || goal.id;
      const updatedGoal = await apiFetch(`/goals/${goalId}`, {
        method: 'PUT',
        body: JSON.stringify({ tasks: updatedTasks })
      });

      // Update state
      setGoals(goals.map(g => (g._id || g.id) === goalId ? updatedGoal : g));
    } catch (err) {
      setError(err.message || 'Failed to toggle subtask.');
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    try {
      await apiFetch(`/goals/${goalId}`, { method: 'DELETE' });
      setGoals(goals.filter(g => (g._id || g.id) !== goalId));
    } catch (err) {
      setError(err.message || 'Failed to delete goal.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="pulse" style={{ color: 'var(--accent-teal)' }}>Structuring Goals...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Goal Planner</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: Goals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>🎯 Long-Term Achievements</h3>
            
            {goals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No goals set yet. Add one on the right!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {goals.map((goal) => {
                  const goalId = goal._id || goal.id;
                  
                  return (
                    <div 
                      key={goalId}
                      style={{
                        background: 'var(--bg-input)',
                        padding: '16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.2rem' }}>{goal.goal}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Target: {new Date(goal.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteGoal(goalId)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                        >
                          🗑️
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                          <span style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>{goal.progress}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            background: 'var(--accent-gradient)',
                            width: `${goal.progress}%`
                          }}></div>
                        </div>
                      </div>

                      {/* Sub-steps Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        {goal.tasks.map((task, index) => (
                          <label 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px', 
                              cursor: 'pointer', 
                              fontSize: '0.9rem',
                              padding: '4px 0'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleSubtask(goal, index)}
                              style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {task.title}
                            </span>
                          </label>
                        ))}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Add Goal Form */}
        <div>
          <div className="glass-card" style={{ sticky: 'top', top: '90px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>🎯 New Goal Blueprint</h3>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '12px',
                borderRadius: 'var(--border-radius-md)',
                marginBottom: '16px',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Goal Objective</label>
                <input
                  type="text"
                  placeholder="e.g. Build Web Portfolio"
                  className="form-input"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>Final Deadline</label>
                <input
                  type="date"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                  Milestones / Sub-steps (one per line)
                </label>
                <textarea
                  placeholder="Design layout&#10;Develop home page&#10;Deploy to Vercel"
                  className="form-input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={rawSubtasks}
                  onChange={(e) => setRawSubtasks(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={actionLoading}>
                {actionLoading ? 'Creating Blueprint...' : 'Add Goal Blueprint'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
