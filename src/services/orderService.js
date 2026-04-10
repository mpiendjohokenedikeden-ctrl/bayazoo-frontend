import api from './api';

export const createOrder = (data) => api.post('/orders', data);
export const getMesCommandes = () => api.get('/orders/mes-commandes');
export const getAllOrders = () => api.get('/orders');
export const updateStatut = (id, statut) => api.put(`/orders/${id}/statut`, { statut });
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const validerPaiement = (code) => api.get(`/orders/valider/${code}`);