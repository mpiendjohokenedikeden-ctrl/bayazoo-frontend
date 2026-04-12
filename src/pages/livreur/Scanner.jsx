import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };

const Scanner = () => {
  const [code, setCode] = useState('');
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [modeCamera, setModeCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      arreterCamera();
    };
  }, []);

  const demarrerCamera = async () => {
    setCameraError('');
    setResultat(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      setModeCamera(true);

      // Attendre que le DOM soit prêt
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true);
          videoRef.current.play()
            .then(() => {
              setScanning(true);
              scannerQR();
            })
            .catch(err => {
              setCameraError('Erreur lecture video : ' + err.message);
            });
        }
      }, 300);
    } catch (err) {
      setCameraError('Camera non accessible. Utilisez la saisie manuelle.');
      setModeCamera(false);
    }
  };

  const arreterCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setModeCamera(false);
    setScanning(false);
  };

  const scannerQR = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (qrCode && qrCode.data) {
          // QR détecté !
          arreterCamera();
          setCode(qrCode.data);
          validerAvecCode(qrCode.data);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const validerAvecCode = async (codeAValider) => {
    const c = codeAValider || code;
    if (!c.trim()) { setErreur('Entre un code'); return; }
    setLoading(true);
    setErreur('');
    setResultat(null);
    try {
      const res = await api.get('/orders/valider/' + c.trim().toUpperCase());
      const data = res.data;
      const order = data.order || data;
      setResultat({ message: data.message || 'Paiement valide !', order });
      setCode('');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Code invalide');
    }
    setLoading(false);
  };

  const validerCommande = () => validerAvecCode(code);

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>Scanner <span style={{ color: '#E63946' }}>QR Code</span></h1>

      <div style={styles.card}>
        <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</p>
        <h2 style={styles.cardTitle}>Valider une livraison</h2>
        <p style={styles.cardSub}>Scannez le QR code du client ou entrez le code manuellement</p>

        {/* BOUTONS MODE */}
        <div style={styles.modeChoice}>
          <button
            style={{ ...styles.modeBtn, ...(modeCamera ? styles.modeBtnActif : {}) }}
            onClick={modeCamera ? arreterCamera : demarrerCamera}
          >
            📷 {modeCamera ? 'Arrêter' : 'Scanner QR'}
          </button>
          <button
            style={{ ...styles.modeBtn, ...(!modeCamera ? styles.modeBtnActif : {}) }}
            onClick={arreterCamera}
          >
            ⌨️ Manuel
          </button>
        </div>

        {/* CAMERA */}
        {modeCamera && (
          <div style={styles.cameraWrapper}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={styles.video}
            />
            {/* Canvas caché pour jsQR */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Cadre scan */}
            <div style={styles.scanOverlay}>
              <div style={styles.scanFrame}>
                <div style={{ ...styles.coin, top: 0, left: 0, borderTop: '4px solid #E63946', borderLeft: '4px solid #E63946' }} />
                <div style={{ ...styles.coin, top: 0, right: 0, borderTop: '4px solid #E63946', borderRight: '4px solid #E63946' }} />
                <div style={{ ...styles.coin, bottom: 0, left: 0, borderBottom: '4px solid #E63946', borderLeft: '4px solid #E63946' }} />
                <div style={{ ...styles.coin, bottom: 0, right: 0, borderBottom: '4px solid #E63946', borderRight: '4px solid #E63946' }} />
                {/* Ligne de scan animée */}
                <div style={styles.scanLine} />
              </div>
            </div>
            <p style={styles.cameraHint}>Centrez le QR code dans le cadre</p>
          </div>
        )}

        {cameraError && <div style={styles.erreurBox}>📵 {cameraError}</div>}

        {/* SAISIE MANUELLE */}
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
            <button
              style={{ ...styles.btnValider, opacity: loading ? 0.7 : 1 }}
              onClick={validerCommande}
              disabled={loading}
            >
              {loading ? '...' : '✅'}
            </button>
          </div>
        </div>

        {erreur && <div style={styles.erreurBox}>❌ {erreur}</div>}

        {/* SUCCES */}
        {resultat && resultat.order && (
          <div style={styles.succes}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</p>
            <h3 style={styles.succesTitle}>Paiement validé !</h3>
            <div style={styles.succesDetails}>
              {[
                { label: 'Commande', value: '#' + (resultat.order.codeCommande || 'N/A') },
                { label: 'Montant', value: parseFloat(resultat.order.total || 0).toLocaleString() + ' FCFA', vert: true },
                { label: 'Statut', value: '✅ Payé', vert: true }
              ].map((d, i) => (
                <div key={i} style={styles.succesRow}>
                  <span style={{ color: '#888', fontSize: '0.82rem' }}>{d.label}</span>
                  <strong style={{ color: d.vert ? '#2D6A4F' : '#0d0d0d', fontSize: '0.9rem' }}>{d.value}</strong>
                </div>
              ))}
            </div>
            {(resultat.order.modePaiement || '').toLowerCase().includes('espece') && (
              <div style={styles.especesBadge}>💵 Espèces reçus — ajoutés à votre solde</div>
            )}
            <button style={styles.retourBtn} onClick={() => { setResultat(null); navigate('/livreur/commandes'); }}>
              Retour aux livraisons
            </button>
          </div>
        )}
      </div>

      {/* INSTRUCTIONS */}
      <div style={styles.instructions}>
        {[
          { num: '1', txt: 'Le client ouvre son QR code depuis "Mes commandes"' },
          { num: '2', txt: 'Cliquez "Scanner QR" et pointez vers le code' },
          { num: '3', txt: 'Ou entrez manuellement le code PAY-...' },
          { num: '4', txt: 'Le paiement est validé automatiquement ✅' }
        ].map((s, i) => (
          <div key={i} style={styles.instrStep}>
            <div style={styles.instrNum}>{s.num}</div>
            <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5', fontFamily: F.corps }}>{s.txt}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: { maxWidth: '500px', margin: '0 auto', padding: 'clamp(4.5rem, 10vw, 5.5rem) 1.2rem 6rem', minHeight: '100vh', fontFamily: F.corps },
  titre: { fontFamily: F.titre, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '1.5rem' },
  card: { background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', textAlign: 'center', marginBottom: '1rem' },
  cardTitle: { fontFamily: F.titre, fontSize: '1.3rem', color: '#0d0d0d', marginBottom: '0.4rem', fontWeight: '700' },
  cardSub: { color: '#aaa', fontSize: '0.82rem', marginBottom: '1.2rem', fontFamily: F.corps, lineHeight: '1.5' },
  modeChoice: { display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', justifyContent: 'center' },
  modeBtn: { background: '#f5f5f7', border: '1.5px solid #e8e8ed', padding: '0.6rem 1.2rem', borderRadius: '100px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.corps, transition: 'all 0.2s' },
  modeBtnActif: { background: '#0d0d0d', color: 'white', border: '1.5px solid #0d0d0d' },
  cameraWrapper: { position: 'relative', width: '100%', height: '280px', borderRadius: '16px', overflow: 'hidden', background: '#111', marginBottom: '1rem' },
  video: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', pointerEvents: 'none' },
  scanFrame: { width: '200px', height: '200px', position: 'relative' },
  coin: { position: 'absolute', width: '28px', height: '28px', borderRadius: '3px' },
  scanLine: {
    position: 'absolute', top: '50%', left: '10%', right: '10%', height: '2px',
    background: 'linear-gradient(90deg, transparent, #E63946, transparent)',
    animation: 'scan 2s ease-in-out infinite',
    boxShadow: '0 0 8px #E63946'
  },
  cameraHint: { position: 'absolute', bottom: '10px', left: 0, right: 0, textAlign: 'center', color: 'white', fontSize: '0.78rem', fontFamily: F.corps, fontWeight: '600', zIndex: 3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' },
  inputGroup: { display: 'flex', gap: '0.5rem', marginBottom: '0.8rem' },
  input: { flex: 1, padding: '0.85rem 1rem', borderRadius: '100px', border: '1.5px solid #e8e8ed', fontSize: '0.9rem', fontWeight: '700', outline: 'none', textAlign: 'center', fontFamily: F.corps, letterSpacing: '0.05em', color: '#0d0d0d' },
  btnValider: { background: '#E63946', color: 'white', border: 'none', padding: '0.85rem 1.2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontFamily: F.corps, fontSize: '1rem', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' },
  erreurBox: { background: '#fff0f0', color: '#c00', padding: '0.8rem', borderRadius: '12px', fontWeight: '600', fontFamily: F.corps, fontSize: '0.85rem', marginTop: '0.8rem', border: '1px solid #ffd0d0', textAlign: 'left' },
  succes: { background: 'linear-gradient(135deg, #f0faf5, #d4edda)', borderRadius: '16px', padding: '1.5rem', marginTop: '1rem', border: '1.5px solid #b7e4c7', textAlign: 'center' },
  succesTitle: { fontFamily: F.titre, fontSize: '1.2rem', color: '#2D6A4F', marginBottom: '1rem', fontWeight: '700' },
  succesDetails: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  succesRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0' },
  especesBadge: { background: '#fffbf0', border: '1.5px solid #FFB703', borderRadius: '10px', padding: '0.6rem', marginBottom: '1rem', color: '#b37a00', fontWeight: '700', fontSize: '0.8rem', fontFamily: F.corps },
  retourBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontFamily: F.corps, boxShadow: '0 4px 12px rgba(45,106,79,0.25)' },
  instructions: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  instrStep: { display: 'flex', gap: '0.8rem', alignItems: 'flex-start', marginBottom: '1rem' },
  instrNum: { background: '#E63946', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0, fontFamily: F.corps }
};

export default Scanner;