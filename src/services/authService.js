import api from './api';

export const inscription = (data) => api.post('/auth/inscription', data);
export const connexion = (data) => api.post('/auth/connexion', data);
export const verifierCouponDispo = () => api.get('/auth/coupon-dispo');
export const utiliserCoupon = () => api.post('/auth/utiliser-coupon');