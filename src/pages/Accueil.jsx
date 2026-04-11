import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getHoraires, getStatut } from '../services/horaireService';

const pizzasPopulaires = [
  { id: 1, nom: 'Margherita', description: 'Tomate, mozzarella, basilic', prix: 5000, image: '🍕' },
  { id: 2, nom: 'Poulet BBQ', description: 'Poulet grille, sauce BBQ, oignons', prix: 7000, image: '🍗' },
  { id: 3, nom: '4 Fromages', description: 'Mozzarella, cheddar, parmesan', prix: 6500, image: '🧀' }
];

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };
const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const Accueil = () => {
  const { ajouterAuPanier } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [horaires, setHoraires] = useState([]);
  const [statut, setStatut] = useState(null);

  useEffect(() => {
    getHoraires().then(res => {
      const tries = res.data.sort((a, b) =>
        JOURS_ORDRE.indexOf(a.jour) - JOURS_ORDRE.indexOf(b.jour)
      );
      setHoraires(tries);
    }).catch(() => {});

    getStatut().then(res => setStatut(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: F.corps }}>

      {/* ===== HERO ===== */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          {/* STATUT OUVERT/FERME */}
          {statut && (
            <div style={{ ...styles.statutBadge, background: statut.ouvert ? 'rgba(45,106,79,0.1)' : 'rgba(230,57,70,0.08)', color: statut.ouvert ? '#2D6A4F' : '#E63946' }}>
              <span style={{ ...styles.statutDot, background: statut.ouvert ? '#2D6A4F' : '#E63946' }} />
              {statut.ouvert ? 'Ouvert maintenant' : statut.message}
            </div>
          )}
          <span style={styles.tag}>
            {user ? '👋 Bonjour ' + user.nom : '🔥 Livraison rapide a Libreville'}
          </span>
          <h1 style={styles.h1}>
            La vraie pizza<br />
            <span style={{ color: '#E63946' }}>artisanale</span><br />
            livree chez toi
          </h1>
          <p style={styles.sub}>
            Commandez en ligne · Payez avec Airtel ou Moov Money
          </p>
          <div style={styles.btns}>
            <button
              style={{ ...styles.btnRed, opacity: statut && !statut.ouvert ? 0.6 : 1 }}
              onClick={() => statut && !statut.ouvert ? null : navigate('/menu')}
            >
              🍕 Commander maintenant
            </button>
            {!user && (
              <Link to="/inscription" style={styles.btnBorder}>S'inscrire gratuitement</Link>
            )}
            {user && (
              <Link to="/suivi" style={styles.btnBorder}>📋 Mes commandes</Link>
            )}
          </div>
          {statut && !statut.ouvert && (
            <p style={styles.fermeMsg}>⚠️ {statut.message}</p>
          )}
        </div>
      <div style={styles.heroImg}>
  <img src="/logo.png" alt="BAYAZOO" style={{ width: '100%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(230,57,70,0.2))' }} />
</div>
      </section>

      {/* ===== HORAIRES ===== */}
      {horaires.length > 0 && (
        <section style={{ ...styles.section, background: 'white' }}>
          <div style={styles.sectionHead}>
            <h2 style={styles.h2}>
              Nos <span style={{ color: '#E63946' }}>horaires</span>
            </h2>
            {statut && (
              <div style={{ ...styles.statutPill, background: statut.ouvert ? '#f0faf5' : '#fff0f0', color: statut.ouvert ? '#2D6A4F' : '#E63946', border: '1.5px solid ' + (statut.ouvert ? '#b7e4c7' : '#ffd0d0') }}>
                <span style={{ ...styles.statutDot, background: statut.ouvert ? '#2D6A4F' : '#E63946' }} />
                {statut.ouvert ? 'Ouvert maintenant' : 'Ferme'}
              </div>
            )}
          </div>
          <div style={styles.horairesGrid}>
            {horaires.map(h => {
              const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
              const jourActuel = jours[new Date().getDay()];
              const estAujourdhui = h.jour === jourActuel;
              return (
                <div key={h.id} style={{
                  ...styles.horaireCard,
                  background: estAujourdhui ? '#1a1a2e' : 'white',
                  border: estAujourdhui ? '2px solid #E63946' : '1.5px solid #e8e8ed'
                }}>
                  <p style={{ ...styles.horaireJour, color: estAujourdhui ? '#FFB703' : '#0d0d0d' }}>
                    {h.jour}
                    {estAujourdhui && <span style={styles.aujourdhuiTag}>Aujourd'hui</span>}
                  </p>
                  {h.ouvert ? (
                    <p style={{ ...styles.horaireHeure, color: estAujourdhui ? 'rgba(255,255,255,0.9)' : '#555' }}>
                      {h.heureOuverture} — {h.heureFermeture}
                    </p>
                  ) : (
                    <p style={{ ...styles.horaireFerme, color: estAujourdhui ? '#E63946' : '#aaa' }}>
                      Ferme
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== PIZZAS POPULAIRES ===== */}
      <section style={styles.section}>
        <div style={styles.sectionHead}>
          <h2 style={styles.h2}>
            Nos pizzas <span style={{ color: '#E63946' }}>populaires</span>
          </h2>
          <button style={styles.lienVoir} onClick={() => navigate('/menu')}>
            Voir tout le menu →
          </button>
        </div>
        <div style={styles.grid}>
          {pizzasPopulaires.map(pizza => (
            <div key={pizza.id} style={styles.card}>
              <div style={styles.cardImg}>{pizza.image}</div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardNom}>{pizza.nom}</h3>
                <p style={styles.cardDesc}>{pizza.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.prix}>{pizza.prix.toLocaleString()} FCFA</span>
                  <button style={styles.addBtn} onClick={() => ajouterAuPanier(pizza)}>
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== COMMENT CA MARCHE ===== */}
      <section style={styles.darkSection}>
        <h2 style={{ ...styles.h2, color: 'white', textAlign: 'center', marginBottom: '2.5rem' }}>
          Comment ca <span style={{ color: '#E63946' }}>marche ?</span>
        </h2>
        <div style={styles.steps}>
          {[
            { icon: '🛒', title: 'Choisissez', desc: 'Parcourez notre menu' },
            { icon: '📍', title: 'Localisez', desc: 'Activez votre GPS' },
            { icon: '💳', title: 'Payez', desc: 'Airtel ou Moov Money' },
            { icon: '🛵', title: 'Recevez', desc: 'Livraison rapide' }
          ].map((step, i) => (
            <div key={i} style={styles.step}>
              <div style={styles.stepNum}>{i + 1}</div>
              <div style={styles.stepIcon}>{step.icon}</div>
              <h3 style={{ color: '#FFB703', fontFamily: F.corps, fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.4rem' }}>
                {step.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: F.corps }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PAIEMENTS ===== */}
      <section style={{ ...styles.section, background: '#f5f5f7' }}>
        <h2 style={{ ...styles.h2, textAlign: 'center', marginBottom: '2rem' }}>
          Paiements <span style={{ color: '#E63946' }}>acceptes</span>
        </h2>
        <div style={styles.payments}>
          <div style={styles.payCard}>
            <img src="/images/airtel.png" alt="Airtel Money" style={styles.payLogo} />
            <span style={{ fontWeight: '700', fontFamily: F.corps, fontSize: '0.9rem' }}>Airtel Money</span>
          </div>
          <div style={styles.payCard}>
            <img src="/images/moov.png" alt="Moov Money" style={styles.payLogo} />
            <span style={{ fontWeight: '700', fontFamily: F.corps, fontSize: '0.9rem' }}>Moov Money</span>
          </div>
          <div style={styles.payCard}>
            <span style={{ fontSize: '2.5rem' }}>💵</span>
            <span style={{ fontWeight: '700', fontFamily: F.corps, fontSize: '0.9rem' }}>Especes</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: 'clamp(5rem, 10vw, 6rem) 2rem 5rem', // ✅ 5rem en bas
  minHeight: '100vh',
  fontFamily: "'Inter', -apple-system, sans-serif"
},
  hero: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'clamp(5rem, 10vw, 8rem) 5% 4rem',
    background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 65%)',
    gap: '2rem'
  },
  heroContent: { maxWidth: '55%', minWidth: '280px' },
  statutBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 1rem',
    borderRadius: '100px',
    fontSize: '0.82rem',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '1rem'
  },
  statutDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0
  },
  tag: {
    display: 'inline-block',
    background: 'rgba(230,57,70,0.08)',
    color: '#E63946',
    padding: '0.45rem 1.2rem',
    borderRadius: '100px',
    fontSize: '0.88rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.01em'
  },
  h1: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '900',
    lineHeight: '1.08',
    color: '#0d0d0d',
    marginBottom: '1.2rem',
    letterSpacing: '-0.02em'
  },
  sub: {
    color: '#6e6e73',
    fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
    marginBottom: '2rem',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1.7'
  },
  fermeMsg: {
    marginTop: '1rem',
    color: '#E63946',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.88rem',
    fontWeight: '600',
    background: '#fff0f0',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    border: '1px solid #ffd0d0',
    display: 'inline-block'
  },
  btns: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  btnRed: {
    background: '#E63946',
    color: 'white',
    border: 'none',
    padding: '0.9rem 2rem',
    borderRadius: '100px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 8px 20px rgba(230,57,70,0.28)',
    transition: 'all 0.25s ease',
    letterSpacing: '0.01em'
  },
  btnBorder: {
    background: 'transparent',
    color: '#E63946',
    border: '2px solid #E63946',
    padding: '0.9rem 2rem',
    borderRadius: '100px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.25s ease',
    letterSpacing: '0.01em'
  },
  heroImg: { fontSize: 'clamp(6rem, 12vw, 11rem)', flexShrink: 0, userSelect: 'none' },
  section: { padding: 'clamp(3rem, 6vw, 5rem) 5%', background: '#f5f5f7' },
  sectionHead: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '2rem',
    flexWrap: 'wrap', gap: '1rem'
  },
  h2: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
    fontWeight: '900',
    color: '#0d0d0d',
    letterSpacing: '-0.02em'
  },
  statutPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 1rem',
    borderRadius: '100px',
    fontSize: '0.82rem',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif"
  },
  horairesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.8rem'
  },
  horaireCard: {
    borderRadius: '16px',
    padding: '1rem',
    textAlign: 'center',
    transition: 'all 0.25s ease'
  },
  horaireJour: {
    fontFamily: 'Georgia, serif',
    fontWeight: '700',
    fontSize: '0.9rem',
    marginBottom: '0.4rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem'
  },
  aujourdhuiTag: {
    background: '#E63946',
    color: 'white',
    fontSize: '0.6rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '100px',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '0.03em'
  },
  horaireHeure: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.78rem',
    fontWeight: '600'
  },
  horaireFerme: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.78rem',
    fontWeight: '600'
  },
  lienVoir: {
    background: 'none', border: 'none',
    color: '#E63946', fontWeight: '700',
    cursor: 'pointer', fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif", padding: '0.5rem 0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.2rem', maxWidth: '1000px', margin: '0 auto'
  },
  card: {
    background: 'white', borderRadius: '20px',
    overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
  },
  cardImg: {
    fontSize: '3.5rem', textAlign: 'center',
    padding: '1.5rem 1rem',
    background: 'linear-gradient(135deg, #fff5f5, #fff0f0)'
  },
  cardBody: { padding: '1.2rem' },
  cardNom: {
    fontFamily: 'Georgia, serif', fontSize: '1.15rem',
    fontWeight: '700', color: '#0d0d0d', marginBottom: '0.4rem'
  },
  cardDesc: {
    color: '#6e6e73', fontSize: '0.83rem',
    marginBottom: '1rem', fontFamily: "'Inter', sans-serif", lineHeight: '1.5'
  },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prix: { fontWeight: '800', fontSize: '1rem', color: '#E63946', fontFamily: "'Inter', sans-serif" },
  addBtn: {
    background: '#E63946', color: 'white', border: 'none',
    padding: '0.5rem 1.1rem', borderRadius: '100px',
    fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(230,57,70,0.25)', transition: 'all 0.25s ease'
  },
  darkSection: { padding: 'clamp(3rem, 6vw, 4rem) 5%', background: '#1a1a2e' },
  steps: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem', maxWidth: '720px', margin: '0 auto'
  },
  step: {
    background: 'rgba(255,255,255,0.04)', borderRadius: '18px',
    padding: '1.5rem 1rem', textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.07)', position: 'relative'
  },
  stepNum: {
    position: 'absolute', top: '-12px', left: '50%',
    transform: 'translateX(-50%)', background: '#E63946',
    color: 'white', width: '24px', height: '24px',
    borderRadius: '50%', fontSize: '0.75rem', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Inter', sans-serif"
  },
  stepIcon: { fontSize: '2rem', marginBottom: '0.8rem', marginTop: '0.5rem' },
  payments: { display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' },
  payCard: {
    background: 'white', borderRadius: '18px', padding: '1.2rem 2rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.7rem', minWidth: '130px', border: '1px solid #e8e8ed',
    transition: 'all 0.25s ease'
  },
  payLogo: { width: '52px', height: '52px', objectFit: 'contain', borderRadius: '10px' }
};

export default Accueil;