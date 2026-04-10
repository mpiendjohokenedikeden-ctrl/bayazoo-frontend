import axios from 'axios';

const getBaseURL = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return 'https://uncrookedly-lipopectic-loura.ngrok-free.dev/api';
};

const isNgrok = () => {
  const hostname = window.location.hostname;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
};

const api = axios.create({
  baseURL: getBaseURL()
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bayazoo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isNgrok()) {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
});

export default api;

