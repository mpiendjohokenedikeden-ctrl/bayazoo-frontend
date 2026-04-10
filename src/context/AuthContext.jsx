import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerUser();
  }, []);

  const chargerUser = () => {
    try {
      const savedToken = localStorage.getItem('bayazoo_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      // Decoder le token pour avoir les vraies infos
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      
      // Verifier expiration
      if (Date.now() > payload.exp * 1000) {
        localStorage.removeItem('bayazoo_token');
        localStorage.removeItem('bayazoo_user');
        setLoading(false);
        return;
      }

      // Construire user depuis le token uniquement
      const userFromToken = {
        id: payload.id,
        nom: payload.nom,
        role: payload.role
      };

      setUser(userFromToken);
      setToken(savedToken);
      // Toujours synchroniser le localStorage avec le token
      localStorage.setItem('bayazoo_user', JSON.stringify(userFromToken));
    } catch (err) {
      localStorage.removeItem('bayazoo_token');
      localStorage.removeItem('bayazoo_user');
    }
    setLoading(false);
  };

  const login = (userData, tokenData) => {
    try {
      const payload = JSON.parse(atob(tokenData.split('.')[1]));
      const userFromToken = {
        id: payload.id,
        nom: payload.nom,
        role: payload.role
      };
      setUser(userFromToken);
      setToken(tokenData);
      localStorage.setItem('bayazoo_user', JSON.stringify(userFromToken));
      localStorage.setItem('bayazoo_token', tokenData);
    } catch (err) {
      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('bayazoo_user', JSON.stringify(userData));
      localStorage.setItem('bayazoo_token', tokenData);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bayazoo_user');
    localStorage.removeItem('bayazoo_token');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);