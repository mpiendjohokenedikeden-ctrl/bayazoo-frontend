import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { getPizzas } from '../services/pizzaService';

const F = {
  titre: 'Georgia, serif',
  corps: "'Inter', 'SF Pro Display', -apple-system, sans-serif"
};

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith('/uploads/')) {
    return 'http://' + window.location.hostname + ':5000' + image;
  }
  return null;
};

const Menu = () => {
  const { ajouterAuPanier } = useCart();
  const [pizzas, setPizzas] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPizzas()
      .then(res => setPizzas(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAjouter = (pizza) => {
    ajouterAuPanier(pizza);
    setToast('✅ ' + pizza.nom + ' ajoute au panier !');
    setTimeout(() => setToast(''), 2500);
  };

  const pizzasFiltrees = pizzas.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titre}>Notre <span style={{ color: '#E63946' }}>Menu</span></h1>
          <p style={styles.sousTitre}>Pizzas artisanales preparees avec des ingredients frais</p>
        </div>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div style={styles.searchBar}>
        <span style={{ fontSize: '1rem', color: '#aaa' }}>🔍</span>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Rechercher une pizza..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
        {recherche && (
          <button style={styles.clearBtn} onClick={() => setRecherche('')}>✕</button>
        )}
      </div>

      {/* CONTENU */}
      {loading ? (
        <div style={styles.centre}>
          <p style={{ fontSize: '3rem' }}>🍕</p>
          <p style={{ color: '#aaa', fontFamily: F.corps, marginTop: '1rem' }}>Chargement du menu...</p>
        </div>
      ) : pizzasFiltrees.length === 0 ? (
        <div style={styles.centre}>
          <p style={{ fontSize: '3rem' }}>🔍</p>
          <p style={{ color: '#aaa', fontFamily: F.corps, marginTop: '1rem' }}>
            {recherche ? 'Aucune pizza pour "' + recherche + '"' : 'Aucune pizza disponible'}
          </p>
          {recherche && (
            <button style={styles.btnVoir} onClick={() => setRecherche('')}>
              Voir tout le menu
            </button>
          )}
        </div>
      ) : (
        <>
          {recherche && (
            <p style={styles.resultats}>
              {pizzasFiltrees.length} pizza(s) trouvee(s)
            </p>
          )}
          <div style={styles.grid}>
            {pizzasFiltrees.map(pizza => {
              const imgUrl = getImageUrl(pizza.image);
              return (
                <div key={pizza.id} style={styles.card}>
                  {/* IMAGE */}
                  <div style={styles.imgWrapper}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={pizza.nom} style={styles.img} />
                    ) : (
                      <div style={styles.imgFallback}>🍕</div>
                    )}
                    {/* BADGE PRIX */}
                    <div style={styles.prixBadge}>
                      {parseFloat(pizza.prix).toLocaleString()} FCFA
                    </div>
                  </div>

                  {/* CONTENU */}
                  <div style={styles.cardBody}>
                    <h3 style={styles.nom}>{pizza.nom}</h3>
                    <p style={styles.desc}>{pizza.description}</p>
                    <button style={styles.btn} onClick={() => handleAjouter(pizza)}>
                      + Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TOAST */}
      {toast && (
        <div style={styles.toast}>
          {toast}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: 'clamp(5rem, 10vw, 6rem) 2rem 4rem',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, sans-serif"
  },
  header: {
    marginBottom: '2rem'
  },
  titre: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '900',
    color: '#0d0d0d',
    letterSpacing: '-0.05em',
    marginBottom: '0.5rem'
  },
  sousTitre: {
    color: '#6e6e73',
    fontSize: 'clamp(0.85rem, 2vw, 1rem)',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.6'
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    background: 'white',
    borderRadius: '100px',
    padding: '0.8rem 1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    border: '1.5px solid #e8e8ed',
    gap: '0.8rem',
    marginBottom: '2rem',
    transition: 'all 0.25s ease'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    background: 'transparent',
    fontFamily: "'Inter', sans-serif",
    color: '#0d0d0d'
  },
  clearBtn: {
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '50%',
    width: '26px',
    height: '26px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.75rem',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultats: {
    color: '#aaa',
    fontSize: '0.85rem',
    marginBottom: '1.2rem',
    fontFamily: "'Inter', sans-serif"
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1.2rem'
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    cursor: 'pointer'
  },
  imgWrapper: {
    width: '100%',
    height: '190px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #fff5f5, #fff0f0)',
    position: 'relative'
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease'
  },
  imgFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '5rem',
    background: 'linear-gradient(135deg, #fff5f5, #fff0f0)'
  },
  prixBadge: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(230,57,70,0.92)',
    color: 'white',
    padding: '0.3rem 0.8rem',
    borderRadius: '100px',
    fontWeight: '800',
    fontSize: '0.82rem',
    fontFamily: "'Inter', sans-serif",
    backdropFilter: 'blur(8px)',
    letterSpacing: '0.01em'
  },
  cardBody: {
    padding: '1.2rem'
  },
  nom: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#0d0d0d',
    marginBottom: '0.4rem',
    letterSpacing: '-0.01em'
  },
  desc: {
    color: '#6e6e73',
    fontSize: '0.82rem',
    marginBottom: '1.2rem',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.55'
  },
  btn: {
    width: '100%',
    background: '#E63946',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '100px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(230,57,70,0.22)',
    transition: 'all 0.25s ease',
    letterSpacing: '0.01em'
  },
  btnVoir: {
    background: '#E63946',
    color: 'white',
    border: 'none',
    padding: '0.8rem 2rem',
    borderRadius: '100px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    marginTop: '1.5rem',
    boxShadow: '0 4px 12px rgba(230,57,70,0.22)'
  },
  centre: {
    textAlign: 'center',
    padding: '4rem 1rem'
  },
  toast: {
    position: 'fixed',
    bottom: '5rem',
    right: '1.5rem',
    background: '#0d0d0d',
    color: 'white',
    padding: '0.9rem 1.5rem',
    borderRadius: '14px',
    fontWeight: '600',
    zIndex: 9999,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.88rem',
    backdropFilter: 'blur(10px)',
    animation: 'slideUp 0.3s ease'
  }
};

export default Menu;