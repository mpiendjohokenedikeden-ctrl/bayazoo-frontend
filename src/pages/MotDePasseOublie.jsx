import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const MotDePasseOublie = () => {
  const [etape, setEtape] = useState(1);
  const [form, setForm] = useState({ email: '', telephone: '+241', nouveauMotDePasse: '', confirmer: '' });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErreur('');
    if (!form.email || !form.telephone || !form.nouveauMotDePasse || !form.confirmer) {
      setErreur('Tous les champs sont obligatoires');
      return;
    }
    if (form.nouveauMotDePasse !== form.confirmer) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.nouveauMotDePasse.length < 6) {
      setErreur('Le mot de passe doit avoir au moins 6 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/mot-de-passe-oublie', {
        email: form.email,
        telephone: form.telephone,
        nouveauMotDePasse: form.nouveauMotDePasse
      });
      setSucces('Mot de passe modifié avec succès !');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BAY<span style={{ color: '#E63946' }}>A</span>ZOO 🍕</h1>
        <h2 style={styles.subtitle}>Mot de passe oublié</h2>
        <p style={styles.desc}>Entrez votre email et votre numéro de téléphone pour réinitialiser votre mot de passe.</p>

        {erreur && <div style={styles.erreur}>{erreur}</div>}
        {succes && <div style={styles.succes}>{succes}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="votre@email.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Téléphone 🇬🇦</label>
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
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••"
            value={form.nouveauMotDePasse} onChange={e => setForm({ ...form, nouveauMotDePasse: e.target.value })} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Confirmer le mot de passe</label>
          <input style={styles.input} type="password" placeholder="••••••••"
            value={form.confirmer} onChange={e => setForm({ ...form, confirmer: e.target.value })} />
        </div>

        <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Modification...' : '🔐 Réinitialiser le mot de passe'}
        </button>

        <p style={styles.lien}>
          <Link to="/login" style={{ color: '#E63946', fontFamily: F.corps, textDecoration: 'none', fontWeight: '600' }}>
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: '#f9f9f9' },
  card: { background: 'white', borderRadius: '24px', padding: '3rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: '100%', maxWidth: '450px' },
  title: { fontFamily: F.titre, fontSize: '2rem', textAlign: 'center', marginBottom: '0.5rem', color: '#1A1A2E' },
  subtitle: { textAlign: 'center', color: '#333', marginBottom: '0.5rem', fontWeight: '700', fontSize: '1.2rem', fontFamily: F.titre },
  desc: { textAlign: 'center', color: '#888', marginBottom: '2rem', fontSize: '0.88rem', fontFamily: F.corps, lineHeight: '1.6' },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps },
  succes: { background: '#d4edda', color: '#2D6A4F', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps, fontWeight: '700' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontFamily: F.corps, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  phoneWrapper: { display: 'flex', alignItems: 'center', border: '2px solid #e0e0e0', borderRadius: '10px', overflow: 'hidden' },
  phonePrefix: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem', background: '#f5f5f7', borderRight: '2px solid #e0e0e0', flexShrink: 0 },
  phonePrefixText: { fontWeight: '700', color: '#333', fontFamily: F.corps, fontSize: '0.95rem' },
  phoneInput: { flex: 1, padding: '0.9rem', border: 'none', outline: 'none', fontSize: '1rem', fontFamily: F.corps },
  btn: { width: '100%', background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: F.corps },
  lien: { textAlign: 'center', marginTop: '1.5rem' }
};

export default MotDePasseOublie;