import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Eye, EyeOff, Loader2, CheckCircle2, Users, Zap } from 'lucide-react';
import api from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      // Unchanged: same storage keys, same fields from the response.
     localStorage.setItem('token', res.data.token);
localStorage.setItem('role', res.data.role);
localStorage.setItem('orgName', res.data.organizationName);
localStorage.setItem('email', email); // needed for presence indicators — WebSocket doesn't carry JWT identity in this setup
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Left: branding panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-700 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="bg-white/15 rounded-lg p-2">
            <LayoutGrid size={20} />
          </div>
          <span className="font-semibold text-lg">Boardly</span>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-tight mb-4">
            Project management,<br />without the chaos.
          </h1>
          <p className="text-brand-100 text-sm max-w-sm">
            Boards, tasks, and real-time collaboration for your whole team —
            all isolated per organization, all in one place.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-brand-50">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Real-time task boards
            </li>
            <li className="flex items-center gap-2">
              <Users size={16} /> Role-based team access
            </li>
            <li className="flex items-center gap-2">
              <Zap size={16} /> Built for speed
            </li>
          </ul>
        </div>

        <p className="text-xs text-brand-200">© {new Date().getFullYear()} Boardly</p>
      </div>

      {/* Right: auth card */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo shown only on small screens, where the left panel is hidden */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-brand-600 text-white rounded-lg p-2">
              <LayoutGrid size={18} />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">Boardly</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Log in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Password
                </label>
                {/* UI-only per requirements — no backend flow exists for this yet */}
                <button
                  type="button"
                  className="text-xs text-brand-600 dark:text-brand-500 hover:underline"
                  onClick={() => alert('Password reset isn\'t implemented yet.')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-8 text-center">
            No account?{' '}
            <Link to="/signup" className="text-brand-600 dark:text-brand-500 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}