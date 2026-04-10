import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.content}>
        <div>
          <h3 style={styles.logo}>BAY<span style={{ color: '#E63946' }}>A</span>ZOO 🍕</h3>
          <p style={styles.text}>La meilleure pizzeria de Libreville</p>
        </div>
        <div>
          <h4 style={styles.title}>Navigation</h4>
          <ul style={styles.list}>
            <li><Link to="/menu" style={styles.link}>Menu</Link></li>
            <li><Link to="/panier" style={styles.link}>Panier</Link></li>
            <li><Link to="/suivi" style={styles.link}>Suivi commande</Link></li>
          </ul>
        </div>
        <div>
          <h4 style={styles.title}>Contact</h4>
          <p style={styles.text}>📞 +241 XX XX XX XX</p>
          <p style={styles.text}>📍 Libreville, Gabon</p>
        </div>
      </div>
      <p style={styles.bottom}>© 2025 BAYAZOO — Tous droits réservés</p>
    </footer>
  );
};

const styles = {
  footer: {
    background: '#1A1A2E',
    color: 'white',
    padding: '3rem 5% 1.5rem'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem'
  },
  logo: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.6rem',
    marginBottom: '0.5rem'
  },
  title: {
    color: '#FFB703',
    marginBottom: '1rem'
  },
  list: {
    listStyle: 'none'
  },
  link: {
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    lineHeight: '2'
  },
  text: {
    color: 'rgba(255,255,255,0.5)',
    lineHeight: '1.8'
  },
  bottom: {
    textAlign: 'center',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.3)'
  }
};

export default Footer;