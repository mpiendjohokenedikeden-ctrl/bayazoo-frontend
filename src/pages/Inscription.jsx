import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inscription } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Inscription = () => {
  const [form, setForm] = useState({ nom: '', email: '', motDePasse: '', telephone: '' });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    try {
      const res = await inscription(form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'inscription");
    }
    setLoading(false);
  };

  return (
    <div className="page" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>BAY<span style={{ color: '#E63946' }}>A</span>ZOO 🍕</h1>
        <h2 style={styles.subtitle}>Créer un compte</h2>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nom complet</label>
            <input style={styles.input} type="text" placeholder="Jean Dupont" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Téléphone</label>
            <input style={styles.input} type="text" placeholder="+241 XX XX XX XX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} required />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Inscription...' : 'Créer mon compte'}
          </button>
        </form>
        <p style={styles.lien}>
          Déjà un compte ? <Link to="/login" style={{ color: '#E63946' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: 'white', borderRadius: '16px', padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: '450px' },
  title: { fontFamily: 'Georgia, serif', fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '2rem', fontWeight: '400' },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem' },
  btn: { width: '100%', background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' },
  lien: { textAlign: 'center', marginTop: '1.5rem', color: '#666' }
};

export default Inscription;