import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
  useDroppable, useDraggable,
} from '@dnd-kit/core';
import {
  ArrowLeft, Plus, MessageSquare, Calendar, Loader2, GripVertical,
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/client';
import TaskDetailDrawer from '../components/TaskDetailDrawer.jsx';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'DONE'];

const COLUMN_META = {
  TODO: { label: 'To Do', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400' },
  DONE: { label: 'Done', dot: 'bg-emerald-500' },
};

const PRIORITY_META = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  HIGH: { label: 'High', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

function DueDateBadge({ dueDate }) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const isOverdue = due < now && due.toDateString() !== now.toDateString();
  const isToday = due.toDateString() === now.toDateString();

  let className = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  let label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (isOverdue) {
    className = 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
    label = `Overdue · ${label}`;
  } else if (isToday) {
    className = 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    label = 'Due today';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${className}`}>
      <Calendar size={11} />
      {label}
    </span>
  );
}

function AssigneeAvatar({ assignee }) {
  if (!assignee) return null;
  const initial = (assignee.email || '?').charAt(0).toUpperCase();
  return (
    <div
      title={assignee.email}
      className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0"
    >
      {initial}
    </div>
  );
}

// Overlapping avatar stack showing who's currently viewing this board.
function PresenceBar({ viewers }) {
  const currentEmail = localStorage.getItem('email');
  if (viewers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex -space-x-2">
        {viewers.map(email => (
          <div
            key={email}
            title={email === currentEmail ? `${email} (you)` : email}
            className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-semibold border-2 border-white dark:border-slate-900"
          >
            {email.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {viewers.length === 1 ? 'Only you here' : `${viewers.length} people viewing`}
      </span>
    </div>
  );
}

function TaskCard({ task, onClick, isOverlay }) {
  const priority = task.priority && PRIORITY_META[task.priority];

  return (
    <div
      className={`rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 shadow-sm transition-shadow hover:shadow-md ${
  isOverlay ? 'shadow-lg' : ''
}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          onClick={onClick}
          className="text-sm font-medium text-slate-900 dark:text-white flex-1 cursor-pointer hover:text-brand-600 dark:hover:text-brand-400"
        >
          {task.title}
        </p>
        {!isOverlay && (
  <span className="text-slate-300 dark:text-slate-600 cursor-grab shrink-0 mt-0.5">
    <GripVertical size={14} />
  </span>
)}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {priority && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priority.className}`}>
            {priority.label}
          </span>
        )}
        <DueDateBadge dueDate={task.dueDate} />
      </div>

      <div className="flex items-center justify-between pt-1">
        <AssigneeAvatar assignee={task.assignee} />
        {typeof task.commentCount === 'number' && task.commentCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <MessageSquare size={12} />
            {task.commentCount}
          </span>
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task, onOpenDrawer }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-30' : ''}
    >
      <TaskCard
        task={task}
        onClick={() => onOpenDrawer(task)}
      />
    </div>
  );
}
function Column({ status, tasks, onOpenDrawer }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = COLUMN_META[status];

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 flex flex-col min-h-[200px] transition-colors ${
        isOver ? 'bg-brand-50 dark:bg-brand-500/10 ring-2 ring-brand-300 dark:ring-brand-500' : 'bg-slate-100 dark:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{meta.label}</h4>
        <span className="text-xs text-slate-400 ml-auto">{tasks.length}</span>
      </div>

      <div className="space-y-2 flex-1">
        {tasks.map(task => (
          <DraggableTaskCard key={task.id} task={task} onOpenDrawer={onOpenDrawer} />
        ))}

        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 px-1 py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [viewers, setViewers] = useState([]); // presence: emails of everyone currently viewing this board
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [drawerTask, setDrawerTask] = useState(null);
  const stompClient = useRef(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 3,
    },
  })
);
  useEffect(() => {
    setLoading(true);
    api.get(`/projects/${projectId}/tasks`)
      .then(res => setTasks(res.data))
      .finally(() => setLoading(false));

    api.get('/organizations/members').then(res => setMembers(res.data));
  }, [projectId]);

  useEffect(() => {
  const client = new Client({
    webSocketFactory: () => new SockJS('https://saas-pm-754y.onrender.com/ws'),

    reconnectDelay: 5000,

    debug: (str) => {
      console.log('[STOMP]', str);
    },

    onConnect: () => {
      console.log('✅ WebSocket CONNECTED:', projectId);

      // TASK UPDATES
      client.subscribe(`/topic/projects/${projectId}`, (message) => {
        console.log('📨 TASK UPDATE:', message.body);

        const updatedTask = JSON.parse(message.body);

        setTasks(prev => {
          const exists = prev.find(t => t.id === updatedTask.id);

          if (exists) {
            return prev.map(t =>
              t.id === updatedTask.id ? updatedTask : t
            );
          }

          return [...prev, updatedTask];
        });

        setDrawerTask(prev =>
          prev && prev.id === updatedTask.id
            ? updatedTask
            : prev
        );
      });

      // PRESENCE UPDATES
      client.subscribe(
        `/topic/projects/${projectId}/presence`,
        (message) => {
          console.log('👥 PRESENCE UPDATE:', message.body);

          const viewers = JSON.parse(message.body);

          setViewers(viewers);
        }
      );

      // TELL BACKEND WE JOINED
      const email = localStorage.getItem('email');

      console.log('📤 Sending presence join:', email);

      client.publish({
        destination: `/app/projects/${projectId}/presence/join`,
        body: JSON.stringify({
          email: email,
        }),
      });
    },

    onStompError: (frame) => {
      console.error('❌ STOMP ERROR:', frame);
    },

    onWebSocketError: (error) => {
      console.error('❌ WEBSOCKET ERROR:', error);
    },

    onWebSocketClose: (event) => {
      console.warn('⚠️ WEBSOCKET CLOSED:', event);
    },
  });

  client.activate();

  stompClient.current = client;

  return () => {
    client.deactivate();
  };
}, [projectId]);

  async function createTask(e) {
    e.preventDefault();
    await api.post(`/projects/${projectId}/tasks`, {
      title: newTaskTitle,
      priority: newTaskPriority || null,
      dueDate: newTaskDueDate || null,
      assigneeId: newTaskAssigneeId || null,
    });
    setNewTaskTitle('');
    setNewTaskPriority('');
    setNewTaskDueDate('');
    setNewTaskAssigneeId('');
  }

  async function moveTask(taskId, newStatus) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status: newStatus });
  }

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    moveTask(taskId, newStatus);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 sm:px-8 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-4">
        <ArrowLeft size={14} /> Back to projects
      </Link>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Board</h1>
      </div>

      <PresenceBar viewers={viewers} />

      <form onSubmit={createTask} className="flex flex-wrap gap-2 mb-6">
        <input
          placeholder="New task title" value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)} required
          className="flex-1 min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={newTaskPriority}
          onChange={e => setNewTaskPriority(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">No priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <input
          type="date"
          value={newTaskDueDate}
          onChange={e => setNewTaskDueDate(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={newTaskAssigneeId}
          onChange={e => setNewTaskAssigneeId(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.email}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Add
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 dark:text-slate-500 text-sm gap-2">
          <Loader2 size={18} className="animate-spin" />
          Loading board…
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(status => (
              <Column
                key={status}
                status={status}
                tasks={tasks.filter(t => t.status === status)}
                onOpenDrawer={setDrawerTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDetailDrawer
        task={drawerTask}
        projectId={projectId}
        members={members}
        isOpen={!!drawerTask}
        onClose={() => setDrawerTask(null)}
        onUpdated={(updated) => {
          setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }}
      />
    </div>
  );
}
