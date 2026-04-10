import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Scanner = () => {
  const [code, setCode] = useState('');
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [modeCamera, setModeCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const demarrerCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setModeCamera(true);
    } catch (err) {
      setCameraError('Camera non accessible. Utilisez la saisie manuelle.');
    }
  };

  const arreterCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setModeCamera(false);
  };

  const validerCommande = async () => {
    if (!code.trim()) { setErreur('Entre un code'); return; }
    setLoading(true);
    setErreur('');
    setResultat(null);
    try {
      const res = await api.get('/orders/valider/' + code.trim().toUpperCase());
      // ✅ Sécuriser la lecture de la réponse
      const data = res.data;
      const order = data.order || data;
      setResultat({ message: data.message || 'Paiement valide !', order });
      setCode('');
      arreterCamera();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code invalide');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>Scanner <span style={{ color: '#E63946' }}>QR Code</span></h1>

      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>📷</p>
          <h2 style={styles.cardTitle}>Valider une livraison</h2>
          <p style={styles.cardSub}>Scannez le QR code du client ou entrez le code manuellement</p>

          <div style={styles.modeChoice}>
            <button style={{ ...styles.modeBtn, ...(modeCamera ? styles.modeBtnActif : {}) }} onClick={modeCamera ? arreterCamera : demarrerCamera}>
              📷 {modeCamera ? 'Arreter' : 'Scanner QR'}
            </button>
            <button style={{ ...styles.modeBtn, ...(!modeCamera ? styles.modeBtnActif : {}) }} onClick={arreterCamera}>
              ⌨️ Manuel
            </button>
          </div>

          {modeCamera && (
            <div style={styles.cameraWrapper}>
              <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
              <div style={styles.scanOverlay}>
                <div style={styles.scanFrame}>
                  <div style={{ ...styles.coin, top: 0, left: 0, borderTop: '5px solid #E63946', borderLeft: '5px solid #E63946' }} />
                  <div style={{ ...styles.coin, top: 0, right: 0, borderTop: '5px solid #E63946', borderRight: '5px solid #E63946' }} />
                  <div style={{ ...styles.coin, bottom: 0, left: 0, borderBottom: '5px solid #E63946', borderLeft: '5px solid #E63946' }} />
                  <div style={{ ...styles.coin, bottom: 0, right: 0, borderBottom: '5px solid #E63946', borderRight: '5px solid #E63946' }} />
                </div>
              </div>
              <p style={styles.cameraHint}>Pointez vers le QR code du client</p>
            </div>
          )}

          {cameraError && <div style={styles.erreurBox}>📵 {cameraError}</div>}

          <div style={{ marginTop: modeCamera ? '1rem' : '0' }}>
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="text"
                placeholder="Ex: PAY-A3K9Z2"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyPress={e => e.key === 'Enter' && validerCommande()}
              />
              <button style={{ ...styles.btnValider, opacity: loading ? 0.7 : 1 }} onClick={validerCommande} disabled={loading}>
                {loading ? '...' : '✅ Valider'}
              </button>
            </div>
          </div>

          {erreur && <div style={styles.erreurBox}>❌ {erreur}</div>}

          {/* ✅ SUCCES — lecture sécurisée */}
          {resultat && resultat.order && (
            <div style={styles.succes}>
              <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</p>
              <h3 style={styles.succesTitle}>Paiement valide !</h3>
              <div style={styles.succesDetails}>
                {[
                  { label: 'Code commande', value: '#' + (resultat.order.codeCommande || 'N/A') },
                  { label: 'Client', value: '👤 ' + (resultat.order.clientNom || resultat.order.client?.nom || 'Client') },
                  { label: 'Montant', value: parseFloat(resultat.order.total || 0).toLocaleString() + ' FCFA', vert: true },
                  { label: 'Mode paiement', value: resultat.order.modePaiement || 'N/A' },
                  { label: 'Statut', value: '✅ Paye', vert: true }
                ].map((d, i) => (
                  <div key={i} style={styles.succesRow}>
                    <span style={{ color: '#888', fontFamily: F.corps, fontSize: '0.85rem' }}>{d.label}</span>
                    <strong style={{ fontFamily: F.corps, color: d.vert ? '#2D6A4F' : '#0d0d0d', fontSize: '0.9rem' }}>{d.value}</strong>
                  </div>
                ))}
              </div>
              {/* Badge espèces */}
              {(resultat.order.modePaiement || '').toLowerCase().includes('espece') && (
                <div style={styles.especesBadge}>
                  💵 Especes recus — ajout automatique a votre solde
                </div>
              )}
              <button style={styles.retourBtn} onClick={() => { setResultat(null); navigate('/livreur/commandes'); }}>
                Retour aux livraisons
              </button>
            </div>
          )}
        </div>

        <div style={styles.instructions}>
          <h3 style={styles.instrTitle}>Comment ca marche ?</h3>
          {[
            { num: '1', txt: 'Le client ouvre son QR code depuis "Mes commandes"' },
            { num: '2', txt: 'Scannez le QR code OU le client vous dicte le code PAY-...' },
            { num: '3', txt: 'Le systeme valide automatiquement et verifie que la commande vous est assignee' },
            { num: '4', txt: 'La commande passe au statut Paye ✅' }
          ].map((s, i) => (
            <div key={i} style={styles.instrStep}>
              <div style={styles.instrNum}>{s.num}</div>
              <p style={{ fontFamily: F.corps, fontSize: '0.88rem', color: '#555', lineHeight: '1.5' }}>{s.txt}</p>
            </div>
          ))}
          <div style={styles.noteBox}>
            <p style={{ fontWeight: '700', fontFamily: F.titre, marginBottom: '0.5rem', fontSize: '0.95rem' }}>💡 Note importante</p>
            <p style={{ fontSize: '0.82rem', color: '#666', fontFamily: F.corps, lineHeight: '1.6' }}>
              Le code <strong>BZ...</strong> est pour la cuisine uniquement.<br />
              Le code <strong>PAY-...</strong> valide le paiement.<br />
              Vous ne pouvez valider que les commandes qui vous sont assignees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: '1000px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 2rem 4rem', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  titre: { fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '2rem' },
  container: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'flex-start' },
  card: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', textAlign: 'center' },
  cardTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#0d0d0d', marginBottom: '0.5rem', fontWeight: '700' },
  cardSub: { color: '#aaa', fontSize: '0.85rem', marginBottom: '1.5rem', fontFamily: "'Inter', sans-serif", lineHeight: '1.5' },
  modeChoice: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' },
  modeBtn: { background: '#f5f5f7', border: '1.5px solid #e8e8ed', padding: '0.6rem 1.3rem', borderRadius: '100px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif", transition: 'all 0.2s ease' },
  modeBtnActif: { background: '#0d0d0d', color: 'white', border: '1.5px solid #0d0d0d' },
  cameraWrapper: { position: 'relative', width: '100%', height: '320px', borderRadius: '16px', overflow: 'hidden', background: '#111', marginBottom: '1rem' },
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', pointerEvents: 'none' },
  scanFrame: { width: '240px', height: '240px', position: 'relative' },
  coin: { position: 'absolute', width: '32px', height: '32px', borderRadius: '4px' },
  cameraHint: { position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', color: 'white', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif", fontWeight: '600', zIndex: 3, textShadow: '0 1px 6px rgba(0,0,0,0.9)' },
  inputGroup: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  input: { flex: 1, padding: '0.9rem 1rem', borderRadius: '100px', border: '1.5px solid #e8e8ed', fontSize: '0.88rem', fontWeight: '700', outline: 'none', textAlign: 'center', fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em', color: '#0d0d0d' },
  btnValider: { background: '#E63946', color: 'white', border: 'none', padding: '0.9rem 1.2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' },
  erreurBox: { background: '#fff0f0', color: '#c00', padding: '0.9rem 1rem', borderRadius: '12px', fontWeight: '600', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', marginTop: '0.8rem', border: '1px solid #ffd0d0', textAlign: 'left' },
  succes: { background: 'linear-gradient(135deg, #f0faf5, #d4edda)', borderRadius: '16px', padding: '1.5rem', marginTop: '1rem', border: '1.5px solid #b7e4c7', textAlign: 'center' },
  succesTitle: { fontFamily: 'Georgia, serif', fontSize: '1.3rem', color: '#2D6A4F', marginBottom: '1rem', fontWeight: '700' },
  succesDetails: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1.2rem' },
  succesRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' },
  especesBadge: { background: '#fffbf0', border: '1.5px solid #FFB703', borderRadius: '10px', padding: '0.7rem 1rem', marginBottom: '1rem', color: '#b37a00', fontWeight: '700', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" },
  retourBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(45,106,79,0.25)' },
  instructions: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
  instrTitle: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#0d0d0d', marginBottom: '1.5rem', fontWeight: '700' },
  instrStep: { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.2rem' },
  instrNum: { background: '#E63946', color: 'white', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0, fontFamily: "'Inter', sans-serif" },
  noteBox: { background: '#fffbf0', border: '1.5px solid #FFB703', borderRadius: '14px', padding: '1rem', marginTop: '1.5rem' }
};

export default Scanner;