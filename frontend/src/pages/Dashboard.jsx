import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Plus, LogOut, FolderKanban, Search,
  CheckCircle2, Clock, ListTodo, Layers, Users,
} from 'lucide-react';
import api from '../api/client';

const COLUMN_STYLES = {
  TODO: { label: 'To Do', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400' },
  DONE: { label: 'Done', dot: 'bg-emerald-500' },
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // aggregated across all projects, for stats + mini board
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [search, setSearch] = useState('');
  const role = localStorage.getItem('role');
  const orgName = localStorage.getItem('orgName');

  // Load projects, then load tasks for every project in parallel.
  // This reuses the existing GET /api/projects/{id}/tasks endpoint —
  // no new backend work needed. Real counts, not placeholder numbers.
  useEffect(() => {
    api.get('/projects').then(res => {
      setProjects(res.data);
      if (res.data.length === 0) {
        setLoadingTasks(false);
        return;
      }
      Promise.all(
        res.data.map(p =>
          api.get(`/projects/${p.id}/tasks`).then(r =>
            r.data.map(t => ({ ...t, projectId: p.id, projectName: p.name }))
          )
        )
      ).then(results => {
        setAllTasks(results.flat());
        setLoadingTasks(false);
      });
    });
  }, []);

  async function createProject(e) {
    e.preventDefault();
    const res = await api.post('/projects', { name: newProjectName });
    setProjects([...projects, res.data]);
    setNewProjectName('');
  }

  function logout() {
  localStorage.clear();
  navigate('/login', { replace: true });
}

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const taskCounts = {
    total: allTasks.length,
    done: allTasks.filter(t => t.status === 'DONE').length,
    inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    todo: allTasks.filter(t => t.status === 'TODO').length,
  };

  const stats = [
    { label: 'Active Projects', value: projects.length, icon: Layers, color: 'text-brand-600 bg-brand-50 dark:bg-brand-500/10' },
    { label: 'Total Tasks', value: taskCounts.total, icon: ListTodo, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' },
    { label: 'In Progress', value: taskCounts.inProgress, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Completed', value: taskCounts.done, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-brand-600 text-white rounded-lg p-2">
            <LayoutGrid size={18} />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Boardly</span>
        </div>

        <nav className="flex-1 space-y-1">
  <div className="flex items-center gap-2 rounded-lg bg-brand-50 dark:bg-slate-700 text-brand-700 dark:text-white px-3 py-2 text-sm font-medium">
    <FolderKanban size={16} />
    Dashboard
  </div>
  <Link
    to="/team"
    className="flex items-center gap-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 text-sm font-medium transition-colors"
  >
    <Users size={16} />
    Team
  </Link>
</nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-2"
        >
          <LogOut size={16} />
          Log out
        </button>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between px-8">
          <div className="relative w-80 max-w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">{orgName}</span>
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
              {orgName ? orgName.charAt(0).toUpperCase() : '?'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">Overview</h1>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div
                key={s.label}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
              >
                <div className={`inline-flex items-center justify-center rounded-lg p-2 mb-3 ${s.color}`}>
                  <s.icon size={18} />
                </div>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {loadingTasks ? '—' : s.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Projects section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Projects</h2>
          </div>

          {role !== 'VIEWER' && (
            <form onSubmit={createProject} className="flex gap-2 mb-6 max-w-md">
              <input
                placeholder="New project name" value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)} required
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
              >
                <Plus size={16} /> New project
              </button>
            </form>
          )}

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              {projects.length === 0 ? 'No projects yet — create your first one above.' : 'No projects match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {filteredProjects.map(p => {
                const projectTasks = allTasks.filter(t => t.projectId === p.id);
                const done = projectTasks.filter(t => t.status === 'DONE').length;
                const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <FolderKanban size={16} className="text-brand-600" />
                      <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 mb-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {projectTasks.length === 0 ? 'No tasks yet' : `${done}/${projectTasks.length} tasks done (${pct}%)`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Aggregated mini Kanban across ALL projects */}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">All Tasks</h2>
          {allTasks.length === 0 && !loadingTasks ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              No tasks yet across any project.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(COLUMN_STYLES).map(col => (
                <div key={col} className="rounded-xl bg-slate-100 dark:bg-slate-800/60 p-3">
                  <div className="flex items-center gap-2 px-1 mb-3">
                    <span className={`w-2 h-2 rounded-full ${COLUMN_STYLES[col].dot}`} />
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {COLUMN_STYLES[col].label}
                    </h4>
                    <span className="text-xs text-slate-400 ml-auto">
                      {allTasks.filter(t => t.status === col).length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allTasks.filter(t => t.status === col).map(task => (
                      <Link
                        key={task.id}
                        to={`/projects/${task.projectId}`}
                        className="block rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-sm hover:border-brand-300 dark:hover:border-brand-500 transition-colors"
                      >
                        <p className="text-sm text-slate-900 dark:text-white mb-1">{task.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{task.projectName}</p>
                      </Link>
                    ))}
                    {allTasks.filter(t => t.status === col).length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 px-1 py-4 text-center">
                        Nothing here
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
