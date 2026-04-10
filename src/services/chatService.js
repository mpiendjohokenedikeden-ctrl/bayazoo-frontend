import api from './api';

export const getMessages = (orderId) => api.get('/chat/' + orderId);
export const sendMessage = (data) => api.post('/chat', data);
export const getNonLus = () => api.get('/chat/non-lus');