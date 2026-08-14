import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/client';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// A slide-in drawer for viewing/editing a single task's full details.
// Note: no comments, checklist, or attachments here — those aren't
// built on the backend yet, so this drawer only exposes fields that
// actually persist and sync (title, status, priority, dueDate, assignee).
export default function TaskDetailDrawer({ task, projectId, members, isOpen, onClose, onUpdated }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sync local form state whenever a different task is opened.
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setStatus(task.status || 'TODO');
      setPriority(task.priority || '');
      setDueDate(task.dueDate || '');
      setAssigneeId(task.assignee?.id || '');
      setError('');
    }
  }, [task]);

  if (!task) return null;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // Two separate calls because status and details are two separate
      // endpoints on the backend — status changes broadcast differently
      // conceptually (it's the field the Kanban board itself moves),
      // even though both trigger the same WebSocket update in practice.
      if (status !== task.status) {
        await api.patch(`/projects/${projectId}/tasks/${task.id}/status`, { status });
      }
      const res = await api.patch(`/projects/${projectId}/tasks/${task.id}/details`, {
        title,
        priority: priority || null,
        dueDate: dueDate || null,
        assigneeId: assigneeId || null,
      });
      onUpdated(res.data);
      onClose();
    } catch (err) {
      setError('Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-800 shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Task details</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 130px)' }}>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">No priority</option>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Due date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.email}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </>
  );
}