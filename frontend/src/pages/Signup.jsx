import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutGrid, Eye, EyeOff, Loader2, CheckCircle2, Users, Zap } from 'lucide-react';
import api from '../api/client';

// Client-side only — no backend field for this, purely a UX signal.
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', className: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Weak', className: 'bg-red-500' },
    { label: 'Fair', className: 'bg-amber-500' },
    { label: 'Good', className: 'bg-blue-500' },
    { label: 'Strong', className: 'bg-emerald-500' },
  ];
  const idx = Math.max(0, Math.min(score - 1, levels.length - 1));
  return { score, ...levels[idx] };
}

export default function Signup() {
  const [organizationName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword === '' || confirmPassword === password;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side check only — backend still validates independently,
    // this just avoids an unnecessary round trip on an obvious mismatch.
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { organizationName, email, password });
      localStorage.setItem('token', res.data.token);
localStorage.setItem('role', res.data.role);
localStorage.setItem('orgName', res.data.organizationName);
localStorage.setItem('email', email); // needed for presence indicators — WebSocket doesn't carry JWT identity in this setup
      navigate('/');
    } catch (err) {
      setError('Signup failed — email may already be in use');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Left: branding panel — identical to Login for visual consistency */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-brand-700 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="bg-white/15 rounded-lg p-2">
            <LayoutGrid size={20} />
          </div>
          <span className="font-semibold text-lg">Boardly</span>
        </div>

        <div>
          <h1 className="text-3xl font-semibold leading-tight mb-4">
            Set up your team's<br />workspace in seconds.
          </h1>
          <p className="text-brand-100 text-sm max-w-sm">
            You'll be the admin of your organization, with full control
            over projects, tasks, and team members.
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-brand-600 text-white rounded-lg p-2">
              <LayoutGrid size={18} />
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">Boardly</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-1">Create your workspace</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">You'll be the admin of this organization</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="orgName" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Organization name
              </label>
              <input
                id="orgName"
                placeholder="Acme Inc"
                value={organizationName}
                onChange={e => setOrgName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
              />
            </div>

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
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

              {/* Strength indicator — purely visual, no backend field */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength.score ? strength.className : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={`w-full rounded-lg border bg-transparent px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow ${
                  passwordsMatch
                    ? 'border-slate-300 dark:border-slate-600 focus:ring-brand-500'
                    : 'border-red-400 dark:border-red-500 focus:ring-red-400'
                }`}
              />
              {!passwordsMatch && (
                <p className="text-[11px] text-red-500 mt-1">Passwords don't match</p>
              )}
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
              {loading ? 'Creating workspace…' : 'Sign up'}
            </button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-8 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
