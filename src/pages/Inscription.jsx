import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inscription } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Inscription = () => {
  const [form, setForm] = useState({ nom: '', email: '', motDePasse: '', telephone: '+241' });
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTelephone = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+241')) val = '+241';
    setForm({ ...form, telephone: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErreur('');
    if (!form.nom || !form.email || !form.motDePasse || !form.telephone) {
      setErreur('Tous les champs sont obligatoires');
      setLoading(false);
      return;
    }
    if (form.telephone.length < 8) {
      setErreur('Numero de telephone invalide');
      setLoading(false);
      return;
    }
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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BAY<span style={{ color: '#E63946' }}>A</span>ZOO 🍕</h1>
        <h2 style={styles.subtitle}>Créer un compte</h2>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Nom complet *</label>
            <input style={styles.input} type="text" placeholder="Jean Dupont" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" placeholder="votre@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Téléphone * <span style={{ color: '#888', fontSize: '0.78rem' }}>(obligatoire pour récupérer votre compte)</span></label>
            <div style={styles.phoneWrapper}>
              <div style={styles.phonePrefix}>
                <span style={{ fontSize: '1.2rem' }}>🇬🇦</span>
                <span style={styles.phonePrefixText}>+241</span>
              </div>
              <input
                style={styles.phoneInput}
                type="tel"
                placeholder="XX XX XX XX"
                value={form.telephone.replace('+241', '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setForm({ ...form, telephone: '+241' + digits });
                }}
                required
              />
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe *</label>
            <input style={styles.input} type="password" placeholder="••••••••" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} required />
          </div>
          <button type="submit" style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
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
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: '#f9f9f9' },
  card: { background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: '450px' },
  title: { fontFamily: F.titre, fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: '2rem', fontWeight: '400', fontFamily: F.corps },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontFamily: F.corps, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  phoneWrapper: { display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden' },
  phonePrefix: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem', background: '#f5f5f7', borderRight: '2px solid #e0e0e0', flexShrink: 0 },
  phonePrefixText: { fontWeight: '700', color: '#333', fontFamily: F.corps, fontSize: '0.95rem' },
  phoneInput: { flex: 1, padding: '0.9rem', border: 'none', outline: 'none', fontSize: '1rem', fontFamily: F.corps },
  btn: { width: '100%', background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: F.corps },
  lien: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontFamily: F.corps }
};

export default Inscription;