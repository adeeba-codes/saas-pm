import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Copy, Check, X } from 'lucide-react';
import api from '../api/client';

const ROLES = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState(null); // holds { email, temporaryPassword } after a successful invite
  const [copied, setCopied] = useState(false);

  const currentRole = localStorage.getItem('role');
  const isAdmin = currentRole === 'ADMIN';

  useEffect(() => {
    loadMembers();
  }, []);

  function loadMembers() {
    setLoading(true);
    api.get('/organizations/members')
      .then(res => setMembers(res.data))
      .finally(() => setLoading(false));
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    setInviteResult(null);
    try {
      const res = await api.post('/organizations/members/invite', { email, role });
      setInviteResult(res.data);
      setEmail('');
      loadMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not invite this user — email may already be in use');
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.patch(`/organizations/members/${userId}/role`, { role: newRole });
      loadMembers();
    } catch (err) {
      setError('Could not change role');
    }
  }

  async function handleRemove(userId) {
    if (!confirm('Remove this member from the organization?')) return;
    try {
      await api.delete(`/organizations/members/${userId}`);
      loadMembers();
    } catch (err) {
      setError('Could not remove this member');
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(inviteResult.temporaryPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 sm:px-8 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-4">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Team members</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {isAdmin ? 'Invite people and manage their access.' : 'View who has access to this organization.'}
      </p>

      {/* Invite form — admin only */}
      {isAdmin && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 mb-6 max-w-lg">
          <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Invite a member</h2>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="email@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button
              type="submit"
              className="flex items-center justify-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
            >
              <UserPlus size={16} /> Invite
            </button>
          </form>

          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

          {/* One-time display of the temp password — this is the honest
              workaround for not having an email service. Shown once,
              never stored or shown again after this. */}
          {inviteResult && (
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-400 mb-2">
                Invited <strong>{inviteResult.email}</strong>. Share this temporary password with them —
                it won't be shown again:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/30 text-slate-900 dark:text-white">
                  {inviteResult.temporaryPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
                  aria-label="Copy password"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading members…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden max-w-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-xs text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                {isAdmin && <th className="px-4 py-2 font-medium w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <td className="px-4 py-2.5 text-slate-900 dark:text-white">{m.email}</td>
                  <td className="px-4 py-2.5">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        className="text-xs rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{m.role}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRemove(m.id)}
                        className="text-slate-400 hover:text-red-500"
                        aria-label={`Remove ${m.email}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}