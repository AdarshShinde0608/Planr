'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../utils/api';

export default function ChatAssistant({ isOpen, onClose, onRefreshData }) {
  const router = useRouter();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Companion. Tell me what is on your plate or ask me: "What should I work on now?" or "Reschedule my day".' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const chatEndRef = useRef(null);

  const fetchSuggestedActions = async () => {
    try {
      const data = await apiFetch('/assistant/actions');
      setSuggestedActions(data);
    } catch (err) {
      console.error("Failed to load actions:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuggestedActions();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const data = await apiFetch('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.message, 
        actions: data.actions 
      }]);

      // If reschedule was completed or needed, refresh page data
      if (data.actions && data.actions.some(a => a.type === 'RESCHEDULE')) {
        if (onRefreshData) onRefreshData();
      }

      fetchSuggestedActions();
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I hit a snag: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action) => {
    try {
      if (action.type === 'RESCHEDULE') {
        setLoading(true);
        const updatedTimeline = await apiFetch('/schedule/reschedule', { method: 'POST' });
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: '✅ Your remaining tasks have been dynamically rescheduled based on your active routine blocks.' 
        }]);
        if (onRefreshData) onRefreshData();
      } else if (action.type === 'VIEW_PAGE') {
        router.push(action.page);
        onClose();
      } else if (action.type === 'FOCUS_TASK') {
        router.push('/tasks');
        onClose();
      }
    } catch (err) {
      console.error("Failed to execute action:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      right: '0',
      width: '420px',
      height: '100vh',
      background: 'var(--bg-navbar)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-card)',
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 AI Coach Companion
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>Active and listening</span>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem' }}
        >
          ✕
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: '12px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Quick Actions:</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleSendMessage("What should I do now?")} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            💡 Focus suggestion
          </button>
          <button 
            onClick={() => handleSendMessage("Reschedule my day")} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            🔄 Reschedule day
          </button>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-input)',
              border: `1px solid ${msg.role === 'user' ? 'transparent' : 'var(--border-color)'}`,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '12px 16px',
              fontSize: '0.9rem',
              lineHeight: '1.4',
              color: 'var(--text-main)'
            }}
          >
            <div>{msg.text}</div>
            
            {/* Structured Actions Inline */}
            {msg.actions && msg.actions.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {msg.actions.map((act, actIdx) => (
                  <button 
                    key={actIdx} 
                    onClick={() => handleExecuteAction(act)}
                    className="btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                  >
                    🚀 {act.description}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', fontSize: '0.9rem' }}>
            <span className="pulse" style={{ color: 'var(--accent-secondary)' }}>Coach is thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input box */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        style={{
          padding: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '12px',
          background: 'var(--bg-navbar)'
        }}
      >
        <input 
          type="text" 
          placeholder="Ask something about your day..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" style={{ padding: '12px' }} disabled={loading}>
          →
        </button>
      </form>
    </div>
  );
}
