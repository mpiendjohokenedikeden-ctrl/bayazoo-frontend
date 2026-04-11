import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Profil = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Formulaires
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [mdpActuel, setMdpActuel] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');
  const [onglet, setOnglet] = useState('infos');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    chargerProfil();
  }, [user]);

  const chargerProfil = async () => {
    try {
      const res = await api.get('/auth/profil');
      setProfil(res.data);
      setNom(res.data.nom || '');
      setEmail(res.data.email || '');
    } catch (err) {}
  };

  const afficherNotif = (msg, type = 'succes') => {
    if (type === 'succes') { setSucces(msg); setErreur(''); }
    else { setErreur(msg); setSucces(''); }
    setTimeout(() => { setSucces(''); setErreur(''); }, 4000);
  };

  const modifierInfos = async () => {
    if (!nom.trim()) { afficherNotif('Le nom est obligatoire', 'erreur'); return; }
    if (!email.trim()) { afficherNotif('L\'email est obligatoire', 'erreur'); return; }
    setLoading(true);
    try {
      const res = await api.put('/auth/modifier-profil', { nom, email });
      login(res.data.user, res.data.token);
      afficherNotif('Informations modifiées avec succès !');
      chargerProfil();
    } catch (err) {
      afficherNotif(err.response?.data?.message || 'Erreur', 'erreur');
    }
    setLoading(false);
  };

  const modifierMotDePasse = async () => {
    if (!mdpActuel || !nouveauMdp || !confirmerMdp) { afficherNotif('Tous les champs sont obligatoires', 'erreur'); return; }
    if (nouveauMdp !== confirmerMdp) { afficherNotif('Les mots de passe ne correspondent pas', 'erreur'); return; }
    if (nouveauMdp.length < 6) { afficherNotif('Minimum 6 caractères', 'erreur'); return; }
    setLoading(true);
    try {
      await api.put('/auth/modifier-mot-de-passe', { motDePasseActuel: mdpActuel, nouveauMotDePasse: nouveauMdp });
      afficherNotif('Mot de passe modifié avec succès !');
      setMdpActuel(''); setNouveauMdp(''); setConfirmerMdp('');
    } catch (err) {
      afficherNotif(err.response?.data?.message || 'Erreur', 'erreur');
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

      {/* ONGLETS */}
      <div style={styles.onglets}>
        <button style={{ ...styles.onglet, ...(onglet === 'infos' ? styles.ongletActif : {}) }} onClick={() => setOnglet('infos')}>
          👤 Informations
        </button>
        <button style={{ ...styles.onglet, ...(onglet === 'securite' ? styles.ongletActif : {}) }} onClick={() => setOnglet('securite')}>
          🔐 Sécurité
        </button>
      </div>

      {erreur && <div style={styles.erreur}>{erreur}</div>}
      {succes && <div style={styles.succes}>{succes}</div>}

      {/* ONGLET INFOS */}
      {onglet === 'infos' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitre}>Modifier mes informations</h2>
          <div style={styles.field}>
            <label style={styles.label}>Nom complet</label>
            <input style={styles.input} type="text" value={nom}
              onChange={e => setNom(e.target.value)} placeholder="Votre nom complet" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Téléphone</label>
            <input style={{ ...styles.input, background: '#f5f5f7', color: '#aaa' }}
              type="text" value={profil?.telephone || ''} disabled />
            <p style={styles.hint}>Le numéro de téléphone ne peut pas être modifié</p>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Membre depuis</label>
            <input style={{ ...styles.input, background: '#f5f5f7', color: '#aaa' }}
              type="text" value={profil ? new Date(profil.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} disabled />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={modifierInfos} disabled={loading}>
            {loading ? '⏳ Modification...' : '✅ Sauvegarder les modifications'}
          </button>
        </div>
      )}

      {/* ONGLET SECURITE */}
      {onglet === 'securite' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitre}>Changer mon mot de passe</h2>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe actuel</label>
            <input style={styles.input} type="password" placeholder="••••••••"
              value={mdpActuel} onChange={e => setMdpActuel(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Nouveau mot de passe</label>
            <input style={styles.input} type="password" placeholder="••••••••"
              value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirmer le nouveau mot de passe</label>
            <input style={styles.input} type="password" placeholder="••••••••"
              value={confirmerMdp} onChange={e => setConfirmerMdp(e.target.value)} />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={modifierMotDePasse} disabled={loading}>
            {loading ? '⏳ Modification...' : '🔐 Modifier le mot de passe'}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '600px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 1.5rem 6rem', minHeight: '100vh', fontFamily: F.corps },
  titre: { fontFamily: F.titre, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '1.5rem' },
  profilCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' },
  avatar: { width: '64px', height: '64px', background: '#E63946', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.6rem', fontFamily: F.corps, flexShrink: 0 },
  profilNom: { fontFamily: F.titre, fontSize: '1.2rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '0.2rem' },
  profilEmail: { color: '#888', fontSize: '0.85rem', fontFamily: F.corps, marginBottom: '0.5rem' },
  roleBadge: { background: '#fff0f0', color: '#E63946', padding: '0.2rem 0.8rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: '700', fontFamily: F.corps },
  onglets: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  onglet: { flex: 1, background: '#f5f5f7', border: 'none', padding: '0.8rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem', fontFamily: F.corps, color: '#555', transition: 'all 0.2s' },
  ongletActif: { background: '#E63946', color: 'white' },
  erreur: { background: '#fff0f0', color: '#c00', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: F.corps, border: '1px solid #ffd0d0' },
  succes: { background: '#f0faf5', color: '#2D6A4F', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: F.corps, fontWeight: '700', border: '1px solid #b7e4c7' },
  section: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '1.5rem' },
  sectionTitre: { fontFamily: F.titre, fontSize: '1.1rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '1.2rem' },
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.88rem', fontFamily: F.corps, color: '#333' },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  hint: { color: '#aaa', fontSize: '0.75rem', fontFamily: F.corps, marginTop: '0.3rem' },
  btn: { background: '#E63946', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: F.corps, width: '100%', marginTop: '0.5rem' },
};

export default Profil;