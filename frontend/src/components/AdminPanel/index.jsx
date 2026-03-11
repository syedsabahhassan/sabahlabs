import React, { useState, useEffect } from 'react';
import QuizList from './QuizList';
import QuizEditor from './QuizEditor';

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'sabahlabs-admin-secret';
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ─────────────────────────────────────────────
// Simple password gate
// ─────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_SECRET) {
      onLogin();
    } else {
      setError('Incorrect admin password.');
    }
  };

  return (
    <div className="screen-centered fade-in">
      <div className="card" style={{ maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.5rem' }}>🔐</div>
          <h2 style={{ marginTop: '8px' }}>Admin Panel</h2>
          <p style={{ color: 'var(--text-dim)', fontWeight: 600, marginTop: '6px' }}>
            Quiz creator & manager
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700 }}>⚠️ {error}</div>
          )}
          <button type="submit" className="btn btn-primary btn-full">
            Login →
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Panel Root
// ─────────────────────────────────────────────
export default function AdminPanel({ onBack }) {
  const [authed, setAuthed]       = useState(false);
  const [view, setView]           = useState('list');   // 'list' | 'editor'
  const [editingQuiz, setEditing] = useState(null);     // null = new quiz
  const [quizzes, setQuizzes]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [importing, setImporting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quizzes`);
      setQuizzes(await res.json());
    } catch (e) {
      showToast('Failed to load quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (authed) fetchQuizzes(); }, [authed]);

  // ── JSON Import ──────────────────────────────────────────────
  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';            // reset so same file can be re-imported

    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return showToast('Invalid JSON file — could not parse.', 'error');
    }

    // Basic validation
    if (!data.title || !Array.isArray(data.questions) || data.questions.length === 0) {
      return showToast('JSON must have "title" and at least one question.', 'error');
    }
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (!q.text) return showToast(`Question ${i + 1} is missing "text".`, 'error');
      if (!Array.isArray(q.answers) || q.answers.length !== 4)
        return showToast(`Question ${i + 1} must have exactly 4 answers.`, 'error');
      if (!q.answers.some((a) => a.isCorrect))
        return showToast(`Question ${i + 1} has no correct answer marked.`, 'error');
    }

    setImporting(true);
    try {
      const headers = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };

      // 1. Create quiz
      const qRes = await fetch(`${API_URL}/api/admin/quizzes`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: data.title,
          description: data.description || '',
          isPublic: data.isPublic !== false,
        }),
      });
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error || 'Failed to create quiz');

      // 2. Create questions
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        await fetch(`${API_URL}/api/admin/quizzes/${qData.id}/questions`, {
          method: 'POST', headers,
          body: JSON.stringify({
            text: q.text,
            imageUrl: q.imageUrl || null,
            timeLimit: q.timeLimit || 20,
            pointsBase: q.pointsBase || 500,
            orderIndex: i,
            answers: q.answers,
          }),
        });
      }

      showToast(`✅ "${data.title}" imported (${data.questions.length} questions)!`);
      fetchQuizzes();
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--darker)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Exit Admin</button>
        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
          🎛️ Admin Panel
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {view === 'list' && (
            <label
              className="btn btn-secondary btn-sm"
              style={{ cursor: importing ? 'not-allowed' : 'pointer', opacity: importing ? 0.6 : 1 }}
              title="Import a quiz from a JSON file"
            >
              {importing ? '⏳ Importing…' : '📂 Import JSON'}
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportJSON}
                disabled={importing}
              />
            </label>
          )}
          {view === 'editor' && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setView('list'); setEditing(null); }}>
              ← Back to Quizzes
            </button>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#7f1d1d' : '#14532d',
          border: `1px solid ${toast.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          color: 'white', padding: '12px 24px', borderRadius: 'var(--radius)',
          fontWeight: 700, zIndex: 9999, boxShadow: 'var(--shadow-lg)',
          animation: 'toastIn 0.3s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}

      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {view === 'list' && (
          <QuizList
            quizzes={quizzes}
            loading={loading}
            onRefresh={fetchQuizzes}
            onNew={() => { setEditing(null); setView('editor'); }}
            onEdit={(quiz) => { setEditing(quiz); setView('editor'); }}
            onDelete={async (id) => {
              if (!window.confirm('Delete this quiz?')) return;
              await fetch(`${API_URL}/api/admin/quizzes/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-secret': ADMIN_SECRET },
              });
              showToast('Quiz deleted');
              fetchQuizzes();
            }}
            adminSecret={ADMIN_SECRET}
          />
        )}

        {view === 'editor' && (
          <QuizEditor
            quiz={editingQuiz}
            adminSecret={ADMIN_SECRET}
            onSaved={(msg) => { showToast(msg || 'Saved!'); setView('list'); fetchQuizzes(); }}
            onCancel={() => { setView('list'); setEditing(null); }}
          />
        )}
      </div>
    </div>
  );
}
