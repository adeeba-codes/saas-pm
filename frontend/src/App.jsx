import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectBoard from './pages/ProjectBoard.jsx';
import TeamMembers from './pages/TeamMembers.jsx';

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// Simple guard: redirect to login if there's no token.
// A real app would also verify the token isn't expired.
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/projects/:projectId" element={
        <ProtectedRoute><ProjectBoard /></ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute><TeamMembers /></ProtectedRoute>
      } />
    </Routes>
  );
}
