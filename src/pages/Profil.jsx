import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Profil = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [nom, setNom] = useState(user?.nom || '');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/auth/profil').then(res => setProfil(res.data)).catch(() => {});
  }, [user, navigate]);

  const modifierNom = async () => {
    setErreur(''); setSucces('');
    if (!nom.trim()) { setErreur('Le nom est obligatoire'); return; }
    setLoading(true);
    try {
      const res = await api.put('/auth/modifier-profil', { nom });
      login(res.data.user, res.data.token);
      setSucces('Nom modifié avec succès !');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>Mon <span style={{ color: '#E63946' }}>Profil</span></h1>

      {/* CARTE PROFIL */}
      <div style={styles.profilCard}>
        <div style={styles.avatar}>{user.nom.charAt(0).toUpperCase()}</div>
        <div>
          <p style={styles.profilNom}>{user.nom}</p>
          <p style={styles.profilEmail}>{profil?.email || user.email}</p>
          <span style={styles.roleBadge}>
            {user.role === 'admin' ? '👑 Admin' : user.role === 'livreur' ? '🛵 Livreur' : user.role === 'receveur' ? '📋 Receveur' : '👤 Client'}
          </span>
        </div>
      </div>

      {/* MODIFIER NOM */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitre}>✏️ Modifier mon nom</h2>
        {erreur && <div style={styles.erreur}>{erreur}</div>}
        {succes && <div style={styles.succes}>{succes}</div>}
        <div style={styles.field}>
          <label style={styles.label}>Nom complet</label>
          <input
            style={styles.input}
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            placeholder="Votre nom complet"
          />
        </div>
        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={modifierNom}
          disabled={loading}
        >
          {loading ? 'Modification...' : '✅ Sauvegarder'}
        </button>
      </div>

      {/* INFOS */}
      {profil && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitre}>📋 Mes informations</h2>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <p style={styles.infoLabel}>Email</p>
              <p style={styles.infoVal}>{profil.email}</p>
            </div>
            <div style={styles.infoItem}>
              <p style={styles.infoLabel}>Téléphone</p>
              <p style={styles.infoVal}>{profil.telephone || 'Non renseigné'}</p>
            </div>
            <div style={styles.infoItem}>
              <p style={styles.infoLabel}>Membre depuis</p>
              <p style={styles.infoVal}>{new Date(profil.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      )}

      {/* MOT DE PASSE */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitre}>🔐 Sécurité</h2>
        <button style={styles.btnSecondaire} onClick={() => navigate('/mot-de-passe-oublie')}>
          Changer mon mot de passe
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: '600px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 2rem 6rem', minHeight: '100vh', fontFamily: F.corps },
  titre: { fontFamily: F.titre, fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '2rem' },
  profilCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' },
  avatar: { width: '64px', height: '64px', background: '#E63946', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.6rem', fontFamily: F.corps, flexShrink: 0 },
  profilNom: { fontFamily: F.titre, fontSize: '1.3rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '0.2rem' },
  profilEmail: { color: '#888', fontSize: '0.85rem', fontFamily: F.corps, marginBottom: '0.5rem' },
  roleBadge: { background: '#fff0f0', color: '#E63946', padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', fontFamily: F.corps },
  section: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.5rem' },
  sectionTitre: { fontFamily: F.titre, fontSize: '1.1rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '1.2rem' },
  erreur: { background: '#fff0f0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: F.corps },
  succes: { background: '#f0faf5', color: '#2D6A4F', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: F.corps, fontWeight: '700' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', fontFamily: F.corps },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  btn: { background: '#E63946', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: F.corps, width: '100%' },
  btnSecondaire: { background: '#f5f5f7', color: '#333', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', fontFamily: F.corps, width: '100%' },
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  infoItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  infoLabel: { color: '#888', fontSize: '0.85rem', fontFamily: F.corps },
  infoVal: { fontWeight: '600', color: '#333', fontSize: '0.88rem', fontFamily: F.corps }
};

export default Profil;