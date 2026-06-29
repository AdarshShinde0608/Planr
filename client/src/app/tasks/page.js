'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, isAuthenticated } from '../../utils/api';

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // New task form fields
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState(5);
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [difficulty, setDifficulty] = useState('Medium');
  const [category, setCategory] = useState('Work');

  const fetchTasks = async () => {
    try {
      const data = await apiFetch('/tasks');
      setTasks(data);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
    } else {
      fetchTasks();
    }
  }, [router]);

  // Handle direct manual task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    setActionLoading(true);

    try {
      const payload = {
        title,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: Number(priority),
        estimatedTime: Number(estimatedTime),
        difficulty,
        category
      };

      const newTask = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setTasks([newTask, ...tasks]);
      
      // Reset form
      setTitle('');
      setDeadline('');
      setPriority(5);
      setEstimatedTime(60);
      setDifficulty('Medium');
      setCategory('Work');
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setError('');
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => (t._id || t.id) !== id));
      if (selectedTask && (selectedTask._id === id || selectedTask.id === id)) {
        setSelectedTask(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
    }
  };

  // Toggle subtask completion
  const handleToggleSubtask = async (task, subtaskIndex) => {
    try {
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;

      const taskId = task._id || task.id;
      const updatedTask = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });

      // Update local state
      setTasks(tasks.map(t => (t._id || t.id) === taskId ? updatedTask : t));
      if (selectedTask && (selectedTask._id === taskId || selectedTask.id === taskId)) {
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      setError(err.message || 'Failed to update subtask.');
    }
  };

  // Toggle main task completion status
  const handleToggleTaskStatus = async (task) => {
    try {
      const taskId = task._id || task.id;
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const updatedTask = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      setTasks(tasks.map(t => (t._id || t.id) === taskId ? updatedTask : t));
      if (selectedTask && (selectedTask._id === taskId || selectedTask.id === taskId)) {
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <h2 className="pulse" style={{ color: 'var(--accent-teal)' }}>Retrieving Tasks...</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '24px' }}>Task Workspace</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* LEFT COLUMN: Add Task & Task List */}
        <div>
          {/* Manual Create Form */}
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📝 Create Manual Task</h3>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Task Name</label>
                <input
                  type="text"
                  placeholder="Review lecture slides..."
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Deadline</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Est (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    className="form-input"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Category</label>
                  <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Gym">Gym</option>
                    <option value="Meals">Meals</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Difficulty</label>
                  <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: '600' }}>Priority</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Add Task'}
              </button>
            </form>
          </div>

          {/* List of Tasks */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📋 Pending & Active Tasks</h3>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No tasks found. Create one above!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.map((task) => {
                  const taskId = task._id || task.id;
                  const isCompleted = task.status === 'completed';

                  return (
                    <div 
                      key={taskId} 
                      onClick={() => setSelectedTask(task)}
                      className="glass-card" 
                      style={{
                        padding: '16px',
                        cursor: 'pointer',
                        borderColor: selectedTask && (selectedTask._id === taskId || selectedTask.id === taskId) ? 'var(--border-active)' : 'var(--border-color)',
                        opacity: isCompleted ? 0.6 : 1,
                        background: 'var(--bg-input)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input 
                            type="checkbox" 
                            checked={isCompleted}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleTaskStatus(task);
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontWeight: '600', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                              {task.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Due: {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            background: task.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.15)' : task.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: task.difficulty === 'Hard' ? 'var(--danger)' : task.difficulty === 'Medium' ? 'var(--warning)' : 'var(--success)'
                          }}>{task.difficulty}</span>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(taskId);
                            }} 
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Task Details & Subtasks Inspector */}
        <div>
          <div className="glass-card" style={{ sticky: 'top', top: '90px', minHeight: '300px' }}>
            {selectedTask ? (
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{selectedTask.title}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    📁 {selectedTask.category}
                  </span>
                  <span className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    ⏱️ {selectedTask.estimatedTime} Mins
                  </span>
                  <span className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                    🔥 Priority: {selectedTask.priority}/10
                  </span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>📋 AI Breakdown Steps</h4>
                  {selectedTask.subtasks && selectedTask.subtasks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No steps generated for this task.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedTask.subtasks.map((sub, idx) => (
                        <label 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            padding: '8px', 
                            background: 'var(--bg-input)', 
                            borderRadius: '6px', 
                            cursor: 'pointer' 
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={sub.completed} 
                            onChange={() => handleToggleSubtask(selectedTask, idx)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', color: sub.completed ? 'var(--text-muted)' : 'var(--text-main)', fontSize: '0.9rem' }}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {selectedTask.scheduledStart && (
                  <div style={{ 
                    marginTop: '24px', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--timeline-task)',
                    border: '1px solid var(--border-active)'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>📅 SCHEDULED BLOCK</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                      {new Date(selectedTask.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(selectedTask.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '240px', color: 'var(--text-muted)' }}>
                <span>🔍 Click on a task in the list to view its AI breakdown steps and schedule status.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
