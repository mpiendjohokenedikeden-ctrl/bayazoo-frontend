import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { getStatut } from '../services/horaireService';
import api from '../services/api';

const F = {
  titre: 'Georgia, serif',
  corps: "'Inter', -apple-system, sans-serif"
};

const MODES_PAIEMENT = [
  { id: 'Airtel Money', label: 'Airtel Money', logo: '/images/airtel.png' },
  { id: 'Moov Money', label: 'Moov Money', logo: '/images/moov.png' },
  { id: 'Especes', label: 'Especes', logo: null }
];

const LogoPaiement = ({ modePaiement, size = 24 }) => {
  if (modePaiement === 'Airtel Money') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src="/images/airtel.png" alt="Airtel Money"
        style={{ width: size, height: size, borderRadius: '6px', objectFit: 'contain', border: '1px solid #e8e8ed', background: 'white', padding: '2px' }} />
      <span style={{ fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }}>Airtel Money</span>
    </div>
  );
  if (modePaiement === 'Moov Money') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <img src="/images/moov.png" alt="Moov Money"
        style={{ width: size, height: size, borderRadius: '6px', objectFit: 'contain', border: '1px solid #e8e8ed', background: 'white', padding: '2px' }} />
      <span style={{ fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }}>Moov Money</span>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ width: size, height: size, borderRadius: '6px', background: '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1px solid #b7e4c7' }}>
        💵
      </div>
      <span style={{ fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' }}>Especes</span>
    </div>
  );
};

const Panier = () => {
  const { panier, supprimerDuPanier, augmenterQuantite, diminuerQuantite, viderPanier, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modeReception, setModeReception] = useState('livraison');
  const [modePaiement, setModePaiement] = useState('Airtel Money');
  const [adresse, setAdresse] = useState('');
  const [localisation, setLocalisation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locErreur, setLocErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [statut, setStatut] = useState(null);
  const [showFacture, setShowFacture] = useState(false);
  const [couponDispo, setCouponDispo] = useState(null);
  const [utiliserCoupon, setUtiliserCoupon] = useState(false);

  useEffect(() => {
    getStatut().then(res => setStatut(res.data)).catch(() => {});
    if (user) {
      api.get('/auth/coupon-dispo').then(res => setCouponDispo(res.data)).catch(() => {});
    }
  }, [user]);

  const obtenirLocalisation = () => {
    setLocLoading(true);
    setLocErreur('');
    setLocalisation(null);

    if (!navigator.geolocation) {
      setLocErreur('Geolocalisation non supportee par votre navigateur. Entrez votre adresse manuellement.');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocalisation(loc);
        setAdresse('GPS: ' + loc.lat.toFixed(5) + ', ' + loc.lng.toFixed(5));
        setLocLoading(false);
      },
      (error) => {
        let msg = 'Position impossible. ';
        if (error.code === 1) msg += 'Acces refuse — autorisez la localisation dans les parametres de votre navigateur.';
        else if (error.code === 2) msg += 'Position indisponible. Entrez votre adresse manuellement.';
        else if (error.code === 3) msg += 'Delai depasse. Entrez votre adresse manuellement.';
        setLocErreur(msg);
        setLocLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const voirFacture = () => {
    setErreur('');
    if (!user) { navigate('/login'); return; }
    if (panier.length === 0) { setErreur('Votre panier est vide'); return; }
    if (statut && !statut.ouvert) {
      setErreur('La pizzeria est fermee. ' + statut.message);
      return;
    }
    if (modeReception === 'livraison' && !adresse && !localisation) {
      setErreur('Veuillez entrer votre adresse ou partager votre localisation');
      return;
    }
    setShowFacture(true);
  };

  const fraisLivraison = modeReception === 'livraison' ? 1000 : 0;
  const sousTotal = total + fraisLivraison;
  const remiseCoupon = utiliserCoupon && couponDispo?.aCouponDispo ? Math.round(sousTotal * 0.05) : 0;
  const totalFinal = sousTotal - remiseCoupon;

  const confirmerCommande = async () => {
    setLoading(true);
    setErreur('');
    try {
      if (utiliserCoupon && couponDispo?.aCouponDispo) {
        await api.post('/auth/utiliser-coupon');
      }
      await createOrder({
        total: totalFinal,
        modePaiement,
        modeReception,
        adresseLivraison: adresse,
        localisation,
        items: panier.map(item => ({
          id: item.id,
          nom: item.nom,
          prix: item.prix,
          quantite: item.quantite
        }))
      });
      viderPanier();
      navigate('/suivi');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la commande');
      setShowFacture(false);
    }
    setLoading(false);
  };

  if (panier.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.panierVide}>
          <p style={{ fontSize: '5rem' }}>🛒</p>
          <h2 style={styles.panierVideTitre}>Votre panier est vide</h2>
          <p style={styles.panierVideSub}>Ajoutez des pizzas depuis le menu</p>
          <button style={styles.btnRed} onClick={() => navigate('/menu')}>🍕 Voir le menu</button>
        </div>
      </div>
    );
  }

  const mapsUrl = localisation
    ? 'https://www.google.com/maps?q=' + localisation.lat + ',' + localisation.lng
    : '#';

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>Mon <span style={{ color: '#E63946' }}>Panier</span></h1>

      {statut && !statut.ouvert && (
        <div style={styles.banniereClose}>
          <p style={{ fontSize: '1.5rem' }}>🔒</p>
          <div>
            <p style={{ fontWeight: '700', fontFamily: F.titre, fontSize: '1rem' }}>La pizzeria est fermee</p>
            <p style={{ fontFamily: F.corps, fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>{statut.message}</p>
          </div>
        </div>
      )}

      <div style={styles.layout}>
        <div style={styles.left}>
          <h2 style={styles.sectionTitle}>Articles <span style={{ color: '#E63946' }}>({panier.length})</span></h2>
          <div style={styles.articles}>
            {panier.map((item) => (
              <div key={item.id} style={styles.article}>
                <div style={styles.articleEmoji}>🍕</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.articleNom}>{item.nom}</p>
                  <p style={styles.articlePrixUnit}>{item.prix?.toLocaleString()} FCFA / unite</p>
                </div>
                <div style={styles.qtyControls}>
                  <button style={styles.qtyBtn} onClick={() => diminuerQuantite(item.id)}>−</button>
                  <span style={styles.qtyNum}>{item.quantite}</span>
                  <button style={styles.qtyBtn} onClick={() => augmenterQuantite(item.id)}>+</button>
                </div>
                <p style={styles.articleTotal}>{(item.prix * item.quantite).toLocaleString()} FCFA</p>
                <button style={styles.removeBtn} onClick={() => supprimerDuPanier(item.id)}>🗑️</button>
              </div>
            ))}
          </div>

          <h2 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>Mode de reception</h2>
          <div style={styles.modeGrid}>
            {[
              { key: 'livraison', icon: '🛵', titre: 'Livraison', sub: 'A domicile' },
              { key: 'retrait', icon: '🏪', titre: 'Retrait', sub: 'A la pizzeria' }
            ].map(m => (
              <div key={m.key}
                style={{ ...styles.modeCard, ...(modeReception === m.key ? styles.modeActif : {}) }}
                onClick={() => setModeReception(m.key)}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{m.icon}</p>
                <p style={styles.modeTitre}>{m.titre}</p>
                <p style={styles.modeSub}>{m.sub}</p>
                {modeReception === m.key && <div style={styles.modeCheck}>✓</div>}
              </div>
            ))}
          </div>

          {modeReception === 'livraison' && (
            <div style={{ marginTop: '2rem' }}>
              <h2 style={styles.sectionTitle}>Localisation</h2>

              {/* AVERTISSEMENT HTTP */}
              {window.location.protocol === 'http:' && (
                <div style={styles.httpWarning}>
                  ⚠️ Le GPS necessite HTTPS. Sur mobile, utilisez le lien ngrok ou entrez votre adresse manuellement ci-dessous.
                </div>
              )}

              <button
                style={{ ...styles.gpsBtn, opacity: locLoading ? 0.7 : 1 }}
                onClick={obtenirLocalisation}
                disabled={locLoading}
              >
                {locLoading ? '⏳ Localisation en cours (15s max)...' : '📡 Partager ma position GPS'}
              </button>

              {locErreur && <div style={styles.locErreur}>⚠️ {locErreur}</div>}

              {localisation && (
                <div style={styles.locSuccess}>
                  <span>✅ Position GPS obtenue</span>
                  <a href={mapsUrl} target="_blank" rel="noreferrer" style={styles.mapsLink}>Voir sur la carte →</a>
                </div>
              )}

              <div style={styles.separateur}>
                <div style={styles.separateurLigne} />
                <span style={styles.separateurTxt}>ou entrez votre adresse</span>
                <div style={styles.separateurLigne} />
              </div>

              <input
                style={{
                  ...styles.adresseInput,
                  border: adresse && !adresse.startsWith('GPS:') ? '1.5px solid #E63946' : '1.5px solid #e8e8ed'
                }}
                type="text"
                placeholder="Ex: Quartier Louis, Libreville, rue..."
                value={adresse}
                onChange={e => {
                  setAdresse(e.target.value);
                  if (localisation && !e.target.value.startsWith('GPS:')) {
                    setLocalisation(null);
                  }
                }}
              />
              {adresse && !adresse.startsWith('GPS:') && (
                <p style={{ fontSize: '0.78rem', color: '#2D6A4F', fontFamily: F.corps, marginTop: '0.5rem', fontWeight: '600' }}>
                  ✅ Adresse saisie manuellement
                </p>
              )}
            </div>
          )}
        </div>

        <div style={styles.right}>
          <div style={styles.resumeCard}>
            <h2 style={styles.resumeTitre}>Paiement</h2>
            <p style={styles.paiementLabel}>Choisissez un mode</p>
            <div style={styles.paiements}>
              {MODES_PAIEMENT.map(p => (
                <div key={p.id}
                  style={{ ...styles.paiementCard, ...(modePaiement === p.id ? styles.paiementActif : {}) }}
                  onClick={() => setModePaiement(p.id)}>
                  {p.logo ? (
                    <img src={p.logo} alt={p.label} style={styles.paiementLogo} />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>💵</span>
                  )}
                  <span style={styles.paiementTxt}>{p.label}</span>
                  {modePaiement === p.id && <div style={styles.paiementCheck}>✓</div>}
                </div>
              ))}
            </div>

            <div style={styles.totaux}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Sous-total</span>
                <span style={styles.totalVal}>{total.toLocaleString()} FCFA</span>
              </div>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Livraison</span>
                <span style={{ ...styles.totalVal, color: '#2D6A4F', fontWeight: '700' }}>
                  {modeReception === 'retrait' ? 'Gratuit' : '1 000 FCFA'}
                </span>
              </div>
              {remiseCoupon > 0 && (
                <div style={styles.totalRow}>
                  <span style={{ ...styles.totalLabel, color: '#2D6A4F' }}>Coupon -5%</span>
                  <span style={{ ...styles.totalVal, color: '#2D6A4F', fontWeight: '700' }}>-{remiseCoupon.toLocaleString()} FCFA</span>
                </div>
              )}
              <div style={styles.totalFinalRow}>
                <span style={styles.totalFinalLabel}>Total</span>
                <span style={styles.totalFinalVal}>{totalFinal.toLocaleString()} FCFA</span>
              </div>
            </div>

            {erreur && <div style={styles.erreur}>{erreur}</div>}

            <button
              style={{ ...styles.commanderBtn, opacity: statut && !statut.ouvert ? 0.6 : 1, cursor: statut && !statut.ouvert ? 'not-allowed' : 'pointer' }}
              onClick={voirFacture}
              disabled={statut && !statut.ouvert}
            >
              {statut && !statut.ouvert ? '🔒 Pizzeria fermee' : '📋 Voir la facture'}
            </button>
            <button style={styles.viderBtn} onClick={viderPanier}>Vider le panier</button>
          </div>
        </div>
      </div>

      {/* ===== MODAL FACTURE ===== */}
      {showFacture && (
        <div style={styles.modalOverlay} onClick={() => setShowFacture(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.factureHeader}>
              <div>
                <h2 style={styles.factureTitre}>Recapitulatif</h2>
                <p style={styles.factureSub}>Verifiez votre commande avant de confirmer</p>
              </div>
              <button style={styles.fermerModal} onClick={() => setShowFacture(false)}>✕</button>
            </div>

            <div style={styles.factureLogo}>
              <img src="/logo.png" alt="BAYAZOO" style={{ height: '48px', objectFit: 'contain' }} />
            </div>

            <div style={styles.factureSection}>
              <p style={styles.factureSectionTitre}>Articles commandes</p>
              {panier.map((item, i) => (
                <div key={i} style={styles.factureRow}>
                  <span style={styles.factureItemNom}>🍕 {item.nom}</span>
                  <span style={styles.factureItemQty}>×{item.quantite}</span>
                  <span style={styles.factureItemPrix}>{(item.prix * item.quantite).toLocaleString()} FCFA</span>
                </div>
              ))}
            </div>

            <div style={styles.factureDivider} />

            <div style={styles.factureSection}>
              <p style={styles.factureSectionTitre}>Informations</p>
              <div style={styles.factureInfo}>
                <span style={styles.factureInfoLabel}>Mode</span>
                <span style={styles.factureInfoVal}>{modeReception === 'livraison' ? '🛵 Livraison' : '🏪 Retrait boutique'}</span>
              </div>
              <div style={styles.factureInfo}>
                <span style={styles.factureInfoLabel}>Paiement</span>
                <LogoPaiement modePaiement={modePaiement} size={22} />
              </div>
              {adresse && (
                <div style={styles.factureInfo}>
                  <span style={styles.factureInfoLabel}>Adresse</span>
                  <span style={styles.factureInfoVal}>📍 {adresse}</span>
                </div>
              )}
              {user && (
                <div style={styles.factureInfo}>
                  <span style={styles.factureInfoLabel}>Client</span>
                  <span style={styles.factureInfoVal}>👤 {user.nom}</span>
                </div>
              )}
            </div>

            <div style={styles.factureDivider} />

            {couponDispo?.aCouponDispo && (
              <>
                <div style={styles.couponSection}>
                  <div style={styles.couponHeader}>
                    <span style={styles.couponEmoji}>🎁</span>
                    <div style={{ flex: 1 }}>
                      <p style={styles.couponTitre}>Coupon de reduction disponible !</p>
                      <p style={styles.couponSub}>-5% sur votre commande — recompense fidelite</p>
                    </div>
                  </div>
                  <div style={styles.couponToggle}>
                    <span style={styles.couponToggleLabel}>
                      {utiliserCoupon ? '✅ Coupon applique' : 'Utiliser le coupon ?'}
                    </span>
                    <button
                      style={{ ...styles.couponBtn, background: utiliserCoupon ? '#E63946' : '#2D6A4F' }}
                      onClick={() => setUtiliserCoupon(!utiliserCoupon)}
                    >
                      {utiliserCoupon ? 'Annuler' : 'Appliquer -5%'}
                    </button>
                  </div>
                  {utiliserCoupon && (
                    <p style={styles.couponEconomie}>Vous economisez {remiseCoupon.toLocaleString()} FCFA 🎉</p>
                  )}
                </div>
                <div style={styles.factureDivider} />
              </>
            )}

            <div style={styles.factureSection}>
              <div style={styles.factureInfo}>
                <span style={styles.factureInfoLabel}>Sous-total</span>
                <span style={styles.factureInfoVal}>{total.toLocaleString()} FCFA</span>
              </div>
              <div style={styles.factureInfo}>
                <span style={styles.factureInfoLabel}>Livraison</span>
                <span style={{ ...styles.factureInfoVal, color: '#2D6A4F', fontWeight: '700' }}>
                  {modeReception === 'retrait' ? 'Gratuit' : '1 000 FCFA'}
                </span>
              </div>
              {remiseCoupon > 0 && (
                <div style={styles.factureInfo}>
                  <span style={{ ...styles.factureInfoLabel, color: '#2D6A4F', fontWeight: '700' }}>Coupon -5%</span>
                  <span style={{ ...styles.factureInfoVal, color: '#2D6A4F', fontWeight: '700' }}>-{remiseCoupon.toLocaleString()} FCFA</span>
                </div>
              )}
              <div style={{ ...styles.factureInfo, marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1.5px solid #e8e8ed' }}>
                <span style={{ fontFamily: F.titre, fontWeight: '700', fontSize: '1.1rem', color: '#0d0d0d' }}>Total</span>
                <span style={{ fontFamily: F.corps, fontWeight: '900', fontSize: '1.3rem', color: '#E63946' }}>
                  {totalFinal.toLocaleString()} FCFA
                </span>
              </div>
            </div>

            <div style={styles.factureBtns}>
              <button style={styles.annulerBtn} onClick={() => setShowFacture(false)}>← Modifier</button>
              <button
                style={{ ...styles.confirmerBtn, opacity: loading ? 0.7 : 1 }}
                onClick={confirmerCommande}
                disabled={loading}
              >
                {loading ? '⏳ Envoi...' : '✅ Confirmer la commande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 2rem 4rem', minHeight: '100vh', fontFamily: F.corps },
  titre: { fontFamily: F.titre, fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '1.5rem' },
  banniereClose: { background: 'linear-gradient(135deg, #1a1a2e, #2d1a1a)', color: 'white', borderRadius: '16px', padding: '1.2rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1.5px solid rgba(230,57,70,0.3)' },
  panierVide: { textAlign: 'center', padding: '4rem 1rem', maxWidth: '400px', margin: '0 auto' },
  panierVideTitre: { fontFamily: F.titre, fontSize: '2rem', color: '#0d0d0d', margin: '1rem 0 0.5rem', letterSpacing: '-0.02em' },
  panierVideSub: { color: '#aaa', fontFamily: F.corps, marginBottom: '2rem', fontSize: '0.95rem' },
  btnRed: { background: '#E63946', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: F.corps, boxShadow: '0 8px 20px rgba(230,57,70,0.28)' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'flex-start' },
  left: {},
  right: {},
  sectionTitle: { fontFamily: F.titre, fontSize: '1.3rem', color: '#0d0d0d', marginBottom: '1rem', fontWeight: '700', letterSpacing: '-0.01em' },
  articles: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  article: { background: 'white', borderRadius: '16px', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', flexWrap: 'wrap' },
  articleEmoji: { fontSize: '1.8rem', background: '#fff5f5', borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  articleNom: { fontFamily: F.titre, fontWeight: '700', color: '#0d0d0d', fontSize: '1rem', marginBottom: '0.2rem' },
  articlePrixUnit: { color: '#aaa', fontSize: '0.8rem', fontFamily: F.corps },
  articleTotal: { fontWeight: '800', color: '#E63946', fontSize: '0.95rem', fontFamily: F.corps, whiteSpace: 'nowrap' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f5f5f7', borderRadius: '100px', padding: '0.3rem 0.6rem' },
  qtyBtn: { background: '#E63946', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '50%', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.corps },
  qtyNum: { fontWeight: '800', fontSize: '0.95rem', minWidth: '22px', textAlign: 'center', fontFamily: F.corps, color: '#0d0d0d' },
  removeBtn: { background: '#fff0f0', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.9rem', flexShrink: 0 },
  modeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  modeCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: '1.5px solid #e8e8ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.25s ease', position: 'relative' },
  modeActif: { border: '2px solid #E63946', background: '#fff8f8', boxShadow: '0 4px 16px rgba(230,57,70,0.12)' },
  modeTitre: { fontFamily: F.titre, fontWeight: '700', fontSize: '1rem', color: '#0d0d0d', marginBottom: '0.25rem' },
  modeSub: { color: '#aaa', fontSize: '0.8rem', fontFamily: F.corps },
  modeCheck: { position: 'absolute', top: '10px', right: '10px', background: '#E63946', color: 'white', width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.72rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.corps },
  httpWarning: { background: '#fffbf0', border: '1.5px solid #FFB703', borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#b37a00', fontFamily: F.corps, lineHeight: '1.5' },
  gpsBtn: { background: 'linear-gradient(135deg, #0077B6, #023e8a)', color: 'white', border: 'none', padding: '0.95rem 2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', width: '100%', fontSize: '0.95rem', marginBottom: '1rem', fontFamily: F.corps, boxShadow: '0 6px 16px rgba(0,119,182,0.25)' },
  locErreur: { color: '#c00', background: '#fff0f0', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem', fontFamily: F.corps, border: '1px solid #ffd0d0' },
  locSuccess: { color: '#2D6A4F', background: '#f0faf5', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontFamily: F.corps, fontSize: '0.88rem', border: '1px solid #b7e4c7' },
  mapsLink: { color: '#0077B6', fontWeight: '700', textDecoration: 'none', fontFamily: F.corps, fontSize: '0.85rem' },
  separateur: { display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.2rem 0' },
  separateurLigne: { flex: 1, height: '1px', background: '#e8e8ed' },
  separateurTxt: { color: '#bbb', fontSize: '0.8rem', fontFamily: F.corps, fontWeight: '500', whiteSpace: 'nowrap' },
  adresseInput: { width: '100%', padding: '0.95rem 1.2rem', borderRadius: '14px', border: '1.5px solid #e8e8ed', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: F.corps, color: '#0d0d0d' },
  resumeCard: { background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', position: 'sticky', top: '100px' },
  resumeTitre: { fontFamily: F.titre, fontSize: '1.5rem', color: '#0d0d0d', marginBottom: '0.5rem', fontWeight: '700', letterSpacing: '-0.01em' },
  paiementLabel: { color: '#aaa', fontSize: '0.78rem', fontFamily: F.corps, marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  paiements: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' },
  paiementCard: { background: '#f5f5f7', borderRadius: '14px', padding: '0.8rem 0.4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', border: '1.5px solid transparent', transition: 'all 0.2s ease', position: 'relative' },
  paiementActif: { border: '1.5px solid #E63946', background: '#fff8f8', boxShadow: '0 4px 12px rgba(230,57,70,0.1)' },
  paiementLogo: { width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px' },
  paiementTxt: { fontWeight: '600', fontSize: '0.68rem', textAlign: 'center', fontFamily: F.corps, color: '#555', lineHeight: '1.3' },
  paiementCheck: { position: 'absolute', top: '-6px', right: '-6px', background: '#E63946', color: 'white', width: '18px', height: '18px', borderRadius: '50%', fontSize: '0.6rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.corps },
  totaux: { borderTop: '1px solid #f0f0f0', paddingTop: '1rem', marginBottom: '1.5rem' },
  totalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontFamily: F.corps },
  totalLabel: { color: '#888', fontSize: '0.88rem' },
  totalVal: { color: '#333', fontSize: '0.88rem', fontWeight: '600' },
  totalFinalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0 0', marginTop: '0.5rem', borderTop: '1px solid #f0f0f0' },
  totalFinalLabel: { fontFamily: F.titre, fontWeight: '700', fontSize: '1.1rem', color: '#0d0d0d' },
  totalFinalVal: { fontFamily: F.corps, fontWeight: '900', fontSize: '1.2rem', color: '#E63946', letterSpacing: '-0.01em' },
  erreur: { background: '#fff0f0', color: '#c00', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem', fontFamily: F.corps, border: '1px solid #ffd0d0' },
  commanderBtn: { background: '#E63946', color: 'white', border: 'none', padding: '1rem', borderRadius: '100px', fontWeight: '700', width: '100%', fontSize: '0.95rem', marginBottom: '0.8rem', fontFamily: F.corps, boxShadow: '0 6px 18px rgba(230,57,70,0.28)', transition: 'all 0.25s ease', letterSpacing: '0.01em' },
  viderBtn: { background: '#f5f5f7', border: 'none', padding: '0.85rem', borderRadius: '100px', fontWeight: '600', cursor: 'pointer', width: '100%', fontSize: '0.88rem', fontFamily: F.corps, color: '#888' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' },
  modal: { background: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
  factureHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  factureTitre: { fontFamily: F.titre, fontSize: '1.5rem', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em' },
  factureSub: { color: '#aaa', fontSize: '0.82rem', fontFamily: F.corps, marginTop: '0.3rem' },
  fermerModal: { background: '#f5f5f7', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#555' },
  factureLogo: { textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1.5px solid #f0f0f0' },
  factureSection: { marginBottom: '1rem' },
  factureSectionTitre: { fontFamily: F.corps, fontSize: '0.72rem', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8rem' },
  factureRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f9f9f9' },
  factureItemNom: { fontFamily: F.corps, fontWeight: '600', color: '#333', flex: 1, fontSize: '0.9rem' },
  factureItemQty: { background: '#FFB703', color: 'white', borderRadius: '100px', padding: '0.15rem 0.6rem', fontWeight: '700', fontSize: '0.72rem', fontFamily: F.corps, margin: '0 0.5rem' },
  factureItemPrix: { fontFamily: F.corps, fontWeight: '700', color: '#E63946', fontSize: '0.9rem' },
  factureDivider: { height: '1.5px', background: '#f0f0f0', margin: '1rem 0' },
  factureInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0' },
  factureInfoLabel: { color: '#888', fontSize: '0.82rem', fontFamily: F.corps },
  factureInfoVal: { fontWeight: '600', color: '#333', fontSize: '0.88rem', fontFamily: F.corps },
  couponSection: { background: 'linear-gradient(135deg, #f0faf5, #e8f5e9)', borderRadius: '16px', padding: '1.2rem', border: '1.5px solid #b7e4c7', marginBottom: '0.5rem' },
  couponHeader: { display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem' },
  couponEmoji: { fontSize: '1.8rem', flexShrink: 0 },
  couponTitre: { fontFamily: F.titre, fontWeight: '700', fontSize: '0.95rem', color: '#0d0d0d', marginBottom: '0.2rem' },
  couponSub: { fontFamily: F.corps, fontSize: '0.78rem', color: '#2D6A4F' },
  couponToggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' },
  couponToggleLabel: { fontFamily: F.corps, fontSize: '0.85rem', fontWeight: '600', color: '#333' },
  couponBtn: { color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', fontFamily: F.corps, whiteSpace: 'nowrap', transition: 'all 0.2s ease' },
  couponEconomie: { fontFamily: F.corps, fontSize: '0.82rem', color: '#2D6A4F', fontWeight: '700', marginTop: '0.8rem', textAlign: 'center' },
  factureBtns: { display: 'flex', gap: '0.8rem', marginTop: '1.5rem' },
  annulerBtn: { flex: 1, background: '#f5f5f7', color: '#555', border: 'none', padding: '0.9rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', fontFamily: F.corps },
  confirmerBtn: { flex: 2, background: '#E63946', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', fontFamily: F.corps, boxShadow: '0 6px 18px rgba(230,57,70,0.28)', transition: 'all 0.25s ease' }
};

export default Panier;