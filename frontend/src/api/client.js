import axios from 'axios';

const api = axios.create({
  baseURL: 'https://saas-pm-754y.onrender.com/api',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
