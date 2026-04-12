import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Profil = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [onglet, setOnglet] = useState('infos');

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [mdpActuel, setMdpActuel] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmerMdp, setConfirmerMdp] = useState('');
  const [showMdp, setShowMdp] = useState({ actuel: false, nouveau: false, confirmer: false });

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
      setTelephone(res.data.telephone || '');
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
      const res = await api.put('/auth/modifier-profil', { nom, email, telephone });
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

  const InputField = ({ label, value, onChange, type = 'text', placeholder, prefix, showToggle, show, onToggle }) => (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        {prefix && <span style={styles.inputPrefix}>{prefix}</span>}
        <input
          style={{ ...styles.input, paddingLeft: prefix ? '3.5rem' : '1rem' }}
          type={showToggle ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {showToggle && (
          <button style={styles.eyeBtn} onClick={onToggle} type="button">
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.page}>

      {/* HERO PROFIL */}
      <div style={styles.hero}>
        <div style={styles.avatarGrand}>{user.nom.charAt(0).toUpperCase()}</div>
        <div style={styles.heroInfo}>
          <h1 style={styles.heroNom}>{user.nom}</h1>
          <p style={styles.heroEmail}>{profil?.email || user.email}</p>
          <div style={styles.heroBadges}>
            <span style={styles.roleBadge}>
              {user.role === 'admin' ? '👑 Admin' : user.role === 'livreur' ? '🛵 Livreur' : user.role === 'receveur' ? '📋 Receveur' : '👤 Client'}
            </span>
            {profil && (
              <span style={styles.dateBadge}>
                Membre depuis {new Date(profil.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {erreur && (
        <div style={styles.erreur}>
          <span>⚠️</span> {erreur}
        </div>
      )}
      {succes && (
        <div style={styles.succes}>
          <span>✅</span> {succes}
        </div>
      )}

      {/* ONGLETS */}
      <div style={styles.onglets}>
        <button
          style={{ ...styles.onglet, ...(onglet === 'infos' ? styles.ongletActif : {}) }}
          onClick={() => setOnglet('infos')}
        >
          Informations
        </button>
        <button
          style={{ ...styles.onglet, ...(onglet === 'securite' ? styles.ongletActif : {}) }}
          onClick={() => setOnglet('securite')}
        >
          Sécurité
        </button>
      </div>

      {/* ONGLET INFOS */}
      {onglet === 'infos' && (
        <div style={styles.section}>
          <InputField
            label="Nom complet"
            value={nom}
            onChange={setNom}
            placeholder="Votre nom complet"
          />
          <InputField
            label="Adresse email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="votre@email.com"
          />
          <div style={styles.field}>
            <label style={styles.label}>Téléphone</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputPrefix}>🇬🇦</span>
              <input
                style={{ ...styles.input, paddingLeft: '3.5rem' }}
                type="tel"
                value={telephone.replace('+241', '')}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setTelephone('+241' + digits);
                }}
                placeholder="XX XX XX XX"
              />
            </div>
          </div>
          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={modifierInfos}
            disabled={loading}
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {/* ONGLET SECURITE */}
      {onglet === 'securite' && (
        <div style={styles.section}>
          <p style={styles.secuDesc}>Choisissez un mot de passe fort d'au moins 6 caractères.</p>
          <InputField
            label="Mot de passe actuel"
            value={mdpActuel}
            onChange={setMdpActuel}
            placeholder="••••••••"
            showToggle
            show={showMdp.actuel}
            onToggle={() => setShowMdp(p => ({ ...p, actuel: !p.actuel }))}
          />
          <InputField
            label="Nouveau mot de passe"
            value={nouveauMdp}
            onChange={setNouveauMdp}
            placeholder="••••••••"
            showToggle
            show={showMdp.nouveau}
            onToggle={() => setShowMdp(p => ({ ...p, nouveau: !p.nouveau }))}
          />
          <InputField
            label="Confirmer le nouveau mot de passe"
            value={confirmerMdp}
            onChange={setConfirmerMdp}
            placeholder="••••••••"
            showToggle
            show={showMdp.confirmer}
            onToggle={() => setShowMdp(p => ({ ...p, confirmer: !p.confirmer }))}
          />

          {/* Indicateur force mot de passe */}
          {nouveauMdp && (
            <div style={styles.forceWrap}>
              <div style={styles.forceBarre}>
                <div style={{
                  ...styles.forceRemplissage,
                  width: nouveauMdp.length < 6 ? '33%' : nouveauMdp.length < 10 ? '66%' : '100%',
                  background: nouveauMdp.length < 6 ? '#E63946' : nouveauMdp.length < 10 ? '#FFB703' : '#2D6A4F'
                }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: nouveauMdp.length < 6 ? '#E63946' : nouveauMdp.length < 10 ? '#FFB703' : '#2D6A4F', fontFamily: F.corps, fontWeight: '600' }}>
                {nouveauMdp.length < 6 ? 'Faible' : nouveauMdp.length < 10 ? 'Moyen' : 'Fort'}
              </span>
            </div>
          )}

          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={modifierMotDePasse}
            disabled={loading}
          >
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '500px', margin: '0 auto', padding: 'clamp(4.5rem, 10vw, 5.5rem) 1.2rem 6rem', minHeight: '100vh', fontFamily: "'Inter', sans-serif", background: '#f5f5f7' },

  // HERO
  hero: { background: 'linear-gradient(135deg, #1A1A2E, #2d1a1a)', borderRadius: '24px', padding: '1.8rem', display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' },
  avatarGrand: { width: '72px', height: '72px', background: '#E63946', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '2rem', fontFamily: 'Georgia, serif', flexShrink: 0, boxShadow: '0 4px 16px rgba(230,57,70,0.4)' },
  heroInfo: { flex: 1, minWidth: 0 },
  heroNom: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: '900', color: 'white', marginBottom: '0.2rem', letterSpacing: '-0.01em' },
  heroEmail: { color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif", marginBottom: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  heroBadges: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  roleBadge: { background: 'rgba(230,57,70,0.2)', color: '#ff8a8a', padding: '0.25rem 0.8rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '700', fontFamily: "'Inter', sans-serif", border: '1px solid rgba(230,57,70,0.3)' },
  dateBadge: { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '0.25rem 0.8rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '600', fontFamily: "'Inter', sans-serif" },

  // NOTIFS
  erreur: { background: '#fff0f0', color: '#c00', padding: '0.9rem 1rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", border: '1px solid #ffd0d0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' },
  succes: { background: '#f0faf5', color: '#2D6A4F', padding: '0.9rem 1rem', borderRadius: '14px', marginBottom: '1rem', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", border: '1px solid #b7e4c7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' },

  // ONGLETS
  onglets: { display: 'flex', background: 'white', borderRadius: '16px', padding: '0.3rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  onglet: { flex: 1, background: 'none', border: 'none', padding: '0.75rem', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", color: '#888', transition: 'all 0.2s' },
  ongletActif: { background: '#E63946', color: 'white', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' },

  // SECTION
  section: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1rem' },
  secuDesc: { color: '#888', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif", marginBottom: '1.2rem', lineHeight: '1.5' },

  // CHAMPS
  field: { marginBottom: '1rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif", color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputPrefix: { position: 'absolute', left: '1rem', fontSize: '1.1rem', zIndex: 1, pointerEvents: 'none' },
  input: { width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #e8e8ed', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", color: '#0d0d0d', transition: 'border-color 0.2s', background: '#fafafa' },
  eyeBtn: { position: 'absolute', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0', lineHeight: 1 },

  // FORCE MDP
  forceWrap: { display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', marginTop: '-0.5rem' },
  forceBarre: { flex: 1, height: '4px', background: '#e8e8ed', borderRadius: '100px', overflow: 'hidden' },
  forceRemplissage: { height: '100%', borderRadius: '100px', transition: 'all 0.3s ease' },

  // BOUTON
  btn: { background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", width: '100%', marginTop: '0.5rem', boxShadow: '0 4px 16px rgba(230,57,70,0.25)', transition: 'all 0.2s' },
};

export default Profil;