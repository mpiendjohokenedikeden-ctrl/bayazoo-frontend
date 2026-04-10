import api from './api';

export const getHoraires = () => api.get('/horaires');
export const getStatut = () => api.get('/horaires/status');
export const updateHoraire = (id, data) => api.put('/horaires/' + id, data);