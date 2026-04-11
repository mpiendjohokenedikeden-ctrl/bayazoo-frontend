import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connexion } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Login = () => {
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setErreur('');
    try {
      const res = await connexion(form);
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'livreur') navigate('/livreur/commandes');
      else if (res.data.user.role === 'receveur') navigate('/receveur/commandes');
      else navigate('/');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BAY<span style={{ color: '#E63946' }}>A</span>ZOO 🍕</h1>
        <h2 style={styles.subtitle}>Connexion</h2>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="votre@email.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={form.motDePasse}
            onChange={e => setForm({ ...form, motDePasse: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div style={{ textAlign: 'right', marginBottom: '1rem', marginTop: '-0.5rem' }}>
          <Link to="/mot-de-passe-oublie" style={{ color: '#E63946', fontSize: '0.85rem', fontFamily: F.corps, textDecoration: 'none', fontWeight: '600' }}>
            Mot de passe oublié ?
          </Link>
        </div>
        <button type="button" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={handleSubmit}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p style={styles.link}>
          Pas encore de compte ? <Link to="/inscription" style={{ color: '#E63946' }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: '#f9f9f9' },
  card: { background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: '450px' },
  title: { fontFamily: F.titre, fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem', color: '#1A1A2E' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '2rem', fontWeight: '400', fontSize: '1.1rem', fontFamily: F.corps },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#333', fontFamily: F.corps },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  btn: { width: '100%', background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: F.corps },
  link: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontFamily: F.corps }
};

export default Login;