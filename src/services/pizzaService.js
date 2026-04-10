import api from './api';

export const getPizzas = () => api.get('/pizzas');
export const createPizza = (data) => api.post('/pizzas', data);
export const updatePizza = (id, data) => api.put(`/pizzas/${id}`, data);
export const deletePizza = (id) => api.delete(`/pizzas/${id}`);