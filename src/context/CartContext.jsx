import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [panier, setPanier] = useState([]);

  const ajouterAuPanier = (pizza) => {
    setPanier(prev => {
      const existe = prev.find(item => item.id === pizza.id);
      if (existe) {
        return prev.map(item =>
          item.id === pizza.id ? { ...item, quantite: item.quantite + 1 } : item
        );
      }
      return [...prev, { ...pizza, quantite: 1 }];
    });
  };

  const supprimerDuPanier = (id) => {
    setPanier(prev => prev.filter(item => item.id !== id));
  };

  const augmenterQuantite = (id) => {
    setPanier(prev =>
      prev.map(item => item.id === id ? { ...item, quantite: item.quantite + 1 } : item)
    );
  };

  const diminuerQuantite = (id) => {
    setPanier(prev => {
      const item = prev.find(i => i.id === id);
      if (item.quantite <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantite: i.quantite - 1 } : i);
    });
  };

  const viderPanier = () => setPanier([]);

  const total = panier.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  const nombreArticles = panier.reduce((sum, item) => sum + item.quantite, 0);

  return (
    <CartContext.Provider value={{
      panier, ajouterAuPanier, supprimerDuPanier,
      augmenterQuantite, diminuerQuantite,
      viderPanier, total, nombreArticles
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);