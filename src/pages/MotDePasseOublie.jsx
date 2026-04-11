import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const MotDePasseOublie = () => {
  const [etape, setEtape] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ETAPE 1 — Envoyer code
  const envoyerCode = async () => {
    setErreur('');
    if (!email) { setErreur('Entrez votre email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/envoyer-code-reinit', { email });
      setSucces('Code envoyé sur ' + email + ' — vérifiez votre boîte mail !');
      setEtape(2);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  // ETAPE 2 — Vérifier code + nouveau mot de passe
  const reinitialiser = async () => {
    setErreur('');
    if (!code || !nouveauMotDePasse || !confirmer) { setErreur('Tous les champs sont obligatoires'); return; }
    if (nouveauMotDePasse !== confirmer) { setErreur('Les mots de passe ne correspondent pas'); return; }
    if (nouveauMotDePasse.length < 6) { setErreur('Minimum 6 caractères'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reinitialiser-mot-de-passe', { email, code, nouveauMotDePasse });
      setSucces('Mot de passe modifié avec succès ! Redirection...');
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

        {/* INDICATEUR ETAPES */}
        <div style={styles.etapes}>
          <div style={{ ...styles.etape, background: etape >= 1 ? '#E63946' : '#e0e0e0' }}>1</div>
          <div style={styles.etapeLigne} />
          <div style={{ ...styles.etape, background: etape >= 2 ? '#E63946' : '#e0e0e0' }}>2</div>
        </div>
        <div style={styles.etapesLabels}>
          <span style={{ color: etape >= 1 ? '#E63946' : '#aaa', fontSize: '0.75rem', fontFamily: F.corps }}>Email</span>
          <span style={{ color: etape >= 2 ? '#E63946' : '#aaa', fontSize: '0.75rem', fontFamily: F.corps }}>Nouveau mot de passe</span>
        </div>

        {erreur && <div style={styles.erreur}>{erreur}</div>}
        {succes && <div style={styles.succes}>{succes}</div>}

        {/* ETAPE 1 */}
        {etape === 1 && (
          <>
            <p style={styles.desc}>Entrez votre email — nous vous enverrons un code de vérification.</p>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} type="email" placeholder="votre@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && envoyerCode()} />
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={envoyerCode} disabled={loading}>
              {loading ? '⏳ Envoi...' : '📧 Envoyer le code'}
            </button>
          </>
        )}

        {/* ETAPE 2 */}
        {etape === 2 && (
          <>
            <p style={styles.desc}>Entrez le code reçu par email et votre nouveau mot de passe.</p>
            <div style={styles.field}>
              <label style={styles.label}>Code reçu par email</label>
              <input style={{ ...styles.input, textAlign: 'center', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '0.5rem' }}
                type="text" placeholder="000000" maxLength={6}
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nouveau mot de passe</label>
              <input style={styles.input} type="password" placeholder="••••••••"
                value={nouveauMotDePasse} onChange={e => setNouveauMotDePasse(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Confirmer le mot de passe</label>
              <input style={styles.input} type="password" placeholder="••••••••"
                value={confirmer} onChange={e => setConfirmer(e.target.value)} />
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} onClick={reinitialiser} disabled={loading}>
              {loading ? '⏳ Modification...' : '🔐 Modifier le mot de passe'}
            </button>
            <button style={styles.retourBtn} onClick={() => { setEtape(1); setErreur(''); setSucces(''); setCode(''); }}>
              ← Changer d'email
            </button>
          </>
        )}

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
  subtitle: { textAlign: 'center', color: '#333', marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.2rem', fontFamily: F.titre },
  etapes: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '0.5rem' },
  etape: { width: '32px', height: '32px', borderRadius: '50%', color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontFamily: F.corps, transition: 'background 0.3s' },
  etapeLigne: { width: '80px', height: '2px', background: '#e0e0e0' },
  etapesLabels: { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.5rem' },
  desc: { color: '#888', fontSize: '0.88rem', fontFamily: F.corps, lineHeight: '1.6', marginBottom: '1.5rem', textAlign: 'center' },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps },
  succes: { background: '#d4edda', color: '#2D6A4F', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', fontFamily: F.corps, fontWeight: '700' },
  field: { marginBottom: '1.2rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontFamily: F.corps, fontSize: '0.9rem' },
  input: { width: '100%', padding: '0.9rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps },
  btn: { width: '100%', background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '50px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: F.corps },
  retourBtn: { width: '100%', background: '#f5f5f7', color: '#555', border: 'none', padding: '0.8rem', borderRadius: '50px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.8rem', fontFamily: F.corps },
  lien: { textAlign: 'center', marginTop: '1.5rem' }
};

export default MotDePasseOublie;