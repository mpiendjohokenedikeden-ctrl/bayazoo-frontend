import React, { useEffect, useState } from 'react';
import { getHoraires, updateHoraire } from '../../services/horaireService';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const JOURS_ORDRE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const Horaires = () => {
  const [horaires, setHoraires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [succes, setSucces] = useState('');
  const [saving, setSaving] = useState(null);

  useEffect(() => { chargerHoraires(); }, []);

  const chargerHoraires = async () => {
    try {
      const res = await getHoraires();
      const tries = res.data.sort((a, b) =>
        JOURS_ORDRE.indexOf(a.jour) - JOURS_ORDRE.indexOf(b.jour)
      );
      setHoraires(tries);
    } catch (err) {}
    setLoading(false);
  };

  const handleChange = (id, field, value) => {
    setHoraires(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const sauvegarder = async (horaire) => {
    setSaving(horaire.id);
    try {
      await updateHoraire(horaire.id, {
        heureOuverture: horaire.heureOuverture,
        heureFermeture: horaire.heureFermeture,
        ouvert: horaire.ouvert
      });
      setSucces('Horaires de ' + horaire.jour + ' sauvegardes !');
      setTimeout(() => setSucces(''), 3000);
    } catch (err) {}
    setSaving(null);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>
        Gestion <span style={{ color: '#E63946' }}>Horaires</span>
      </h1>
      <p style={styles.sousTitre}>Definissez les jours et heures d'ouverture de la pizzeria</p>

      {succes && <div style={styles.succes}>✅ {succes}</div>}

      {loading ? (
        <p style={{ fontFamily: F.corps, color: '#aaa' }}>Chargement...</p>
      ) : (
        <>
          {/* APERCU STATUT */}
          <div style={styles.apercuGrid}>
            {horaires.map(h => (
              <div key={h.id} style={{ ...styles.apercuCard, background: h.ouvert ? '#f0faf5' : '#fff0f0', border: '1.5px solid ' + (h.ouvert ? '#b7e4c7' : '#ffd0d0') }}>
                <p style={{ fontFamily: F.titre, fontWeight: '700', fontSize: '0.9rem', color: '#0d0d0d' }}>{h.jour}</p>
                {h.ouvert ? (
                  <p style={{ fontFamily: F.corps, fontSize: '0.75rem', color: '#2D6A4F', fontWeight: '600' }}>
                    {h.heureOuverture} — {h.heureFermeture}
                  </p>
                ) : (
                  <p style={{ fontFamily: F.corps, fontSize: '0.75rem', color: '#E63946', fontWeight: '600' }}>Ferme</p>
                )}
              </div>
            ))}
          </div>

          {/* FORMULAIRE */}
          <div style={styles.liste}>
            {horaires.map(h => (
              <div key={h.id} style={{ ...styles.card, opacity: h.ouvert ? 1 : 0.7 }}>
                <div style={styles.cardLeft}>
                  <h3 style={styles.jour}>{h.jour}</h3>
                  <label style={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={h.ouvert}
                      onChange={e => handleChange(h.id, 'ouvert', e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ ...styles.toggleTrack, background: h.ouvert ? '#2D6A4F' : '#ddd' }}>
                      <div style={{ ...styles.toggleThumb, transform: h.ouvert ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </div>
                    <span style={styles.toggleLabel}>{h.ouvert ? 'Ouvert' : 'Ferme'}</span>
                  </label>
                </div>

                {h.ouvert && (
                  <div style={styles.heures}>
                    <div style={styles.heureGroup}>
                      <label style={styles.heureLabel}>Ouverture</label>
                      <input
                        type="time"
                        value={h.heureOuverture}
                        onChange={e => handleChange(h.id, 'heureOuverture', e.target.value)}
                        style={styles.timeInput}
                      />
                    </div>
                    <div style={styles.separateurHeure}>→</div>
                    <div style={styles.heureGroup}>
                      <label style={styles.heureLabel}>Fermeture</label>
                      <input
                        type="time"
                        value={h.heureFermeture}
                        onChange={e => handleChange(h.id, 'heureFermeture', e.target.value)}
                        style={styles.timeInput}
                      />
                    </div>
                  </div>
                )}

                <button
                  style={{ ...styles.saveBtn, opacity: saving === h.id ? 0.7 : 1 }}
                  onClick={() => sauvegarder(h)}
                  disabled={saving === h.id}
                >
                  {saving === h.id ? '...' : '💾 Sauvegarder'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '900px', margin: '0 auto', padding: 'clamp(4.5rem, 10vw, 6rem) 1rem 6rem', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  titre: { fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '0.4rem' },
  sousTitre: { color: '#aaa', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", marginBottom: '1.5rem' },
  succes: { background: '#f0faf5', color: '#2D6A4F', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', fontWeight: '600', fontFamily: "'Inter', sans-serif", border: '1.5px solid #b7e4c7' },
  apercuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' },
  apercuCard: { borderRadius: '12px', padding: '0.7rem', textAlign: 'center' },
  liste: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  // ✅ Card en colonne sur mobile
  card: { background: 'white', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardLeft: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  jour: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '700', color: '#0d0d0d' },
  toggle: { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' },
  toggleTrack: { width: '46px', height: '26px', borderRadius: '100px', position: 'relative', transition: 'background 0.3s ease', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '3px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'transform 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  toggleLabel: { fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#555' },
  // ✅ Heures en colonne sur mobile — plus de coupure
  heures: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' },
  heureGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  heureLabel: { fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  // ✅ Input time prend toute la largeur
  timeInput: { padding: '0.7rem 0.8rem', borderRadius: '10px', border: '1.5px solid #e8e8ed', fontSize: '1rem', fontFamily: "'Inter', sans-serif", fontWeight: '700', color: '#0d0d0d', outline: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' },
  separateurHeure: { color: '#aaa', fontWeight: '700', textAlign: 'center' },
  saveBtn: { background: '#E63946', color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(230,57,70,0.22)', width: '100%' }
};

export default Horaires;