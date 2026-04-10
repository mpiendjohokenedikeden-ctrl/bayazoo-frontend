import React, { useEffect, useState } from 'react';
import { getMesCommandes } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';
import { getNonLus } from '../services/chatService';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

const F = {
  titre: 'Georgia, serif',
  corps: "'Inter', -apple-system, sans-serif"
};

const statutCouleur = {
  'en attente': '#FFB703',
  'en préparation': '#FB8500',
  'prêt': '#2D6A4F',
  'en livraison': '#0077B6',
  'livré': '#2D6A4F',
  'payé': '#2D6A4F',
  'annulé': '#E63946',
  'en attente paiement': '#9C27B0'
};

const statutEmoji = {
  'en attente': '⏳',
  'en préparation': '👨‍🍳',
  'prêt': '✅',
  'en livraison': '🛵',
  'livré': '✅',
  'payé': '💰',
  'annulé': '❌',
  'en attente paiement': '💵'
};

const statutMessage = {
  'en attente': 'Votre commande est en attente de traitement',
  'en préparation': 'Votre commande est en cours de preparation',
  'en livraison': 'Votre commande est en route vers vous !',
  'livré': 'Votre commande a ete livree avec succes',
  'payé': 'Commande payee — Merci pour votre confiance !',
  'annulé': 'Votre commande a ete annulee',
  'en attente paiement': 'Votre commande est prete — veuillez payer a la caisse en especes !'
};

const getStatutMessage = (cmd) => {
  if (cmd.statut === 'prêt') {
    if (cmd.modeReception === 'retrait') return "Votre commande est prete — venez la recuperer a la boutique !";
    return "Votre commande est prete — en attente d'un livreur";
  }
  return statutMessage[cmd.statut] || '';
};

const STATUTS_EN_COURS = ['en attente', 'en préparation', 'prêt', 'en livraison', 'en attente paiement'];
const STATUTS_TERMINES = ['payé', 'livré', 'annulé'];
const SEUIL_COUPON = 5;

const LogoPaiement = ({ modePaiement }) => {
  const mp = (modePaiement || '').toLowerCase();
  if (mp.includes('airtel')) return (
    <div style={styles.paiementInfo}>
      <img src="/images/airtel.png" alt="Airtel Money" style={styles.paiementLogo} />
      <span style={styles.paiementNom}>Airtel Money</span>
    </div>
  );
  if (mp.includes('moov')) return (
    <div style={styles.paiementInfo}>
      <img src="/images/moov.png" alt="Moov Money" style={styles.paiementLogo} />
      <span style={styles.paiementNom}>Moov Money</span>
    </div>
  );
  return (
    <div style={styles.paiementInfo}>
      <div style={styles.especesIcon}>💵</div>
      <span style={styles.paiementNom}>Especes</span>
    </div>
  );
};

const QRModal = ({ cmd }) => {
  const [ouvert, setOuvert] = useState(false);
  if (!cmd.codeSecret) return null;
  if (cmd.statut === 'payé' || cmd.statut === 'livré') return null;
  if (cmd.modeReception === 'retrait') return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <button style={styles.qrBtn} onClick={() => setOuvert(!ouvert)}>
        {ouvert ? 'Fermer' : '📱 Voir mon QR Code'}
      </button>
      {ouvert && (
        <div style={styles.qrModal}>
          <h3 style={styles.qrTitle}>QR Code de paiement</h3>
          <p style={styles.qrSub}>Montrez ce QR au livreur pour valider votre commande</p>
          <div style={styles.qrWrapper}>
            <QRCodeSVG value={cmd.codeSecret} size={200} bgColor="white" fgColor="#1A1A2E" level="H" />
          </div>
          <div style={styles.codeSecretBox}>
            <p style={styles.codeSecretLabel}>Code manuel (si camera indisponible)</p>
            <p style={styles.codeSecretVal}>{cmd.codeSecret}</p>
          </div>
          <p style={styles.qrNote}>Ne partagez ce code qu'au livreur BAYAZOO</p>
        </div>
      )}
    </div>
  );
};

const Suivi = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOuvert, setChatOuvert] = useState(null);
  const [nonLus, setNonLus] = useState({});
  const [onglet, setOnglet] = useState('en_cours');
  const [coupon, setCoupon] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    chargerCommandes();
    chargerNonLus();
    chargerCoupon();
    const interval = setInterval(() => {
      chargerCommandes();
      chargerNonLus();
      chargerCoupon();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const chargerCommandes = () => {
    getMesCommandes()
      .then(res => setCommandes(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const chargerNonLus = async () => {
    try {
      const res = await getNonLus();
      setNonLus(res.data);
    } catch (err) {}
  };

  const chargerCoupon = async () => {
    try {
      const res = await api.get('/auth/coupon-dispo');
      setCoupon(res.data);
    } catch (err) {}
  };

  const ouvrirChat = (cmdId) => {
    setChatOuvert(chatOuvert === cmdId ? null : cmdId);
    if (chatOuvert !== cmdId) setNonLus(prev => ({ ...prev, [cmdId]: 0 }));
  };

  const fermerChat = () => setChatOuvert(null);

  const commandesEnCours = commandes.filter(c => STATUTS_EN_COURS.includes(c.statut));
  const commandesTerminees = commandes.filter(c => STATUTS_TERMINES.includes(c.statut));
  const totalNonLusEnCours = commandesEnCours.reduce((sum, c) => sum + (nonLus[c.id] || 0), 0);
  const commandesAffichees = onglet === 'en_cours' ? commandesEnCours : commandesTerminees;

  // Commandes en livraison avec chat actif
  const commandesEnLivraison = commandes.filter(c => c.statut === 'en livraison');
  const totalNonLus = commandesEnLivraison.reduce((sum, c) => sum + (nonLus[c.id] || 0), 0);
  const cmdChatOuverte = chatOuvert ? commandes.find(c => c.id === chatOuvert) : null;

  const nbPayees = coupon?.nbCommandesPayees || 0;
  const progression = coupon?.aCouponDispo ? 100 : Math.min((nbPayees % SEUIL_COUPON) / SEUIL_COUPON * 100, 100);
  const commandesRestantes = coupon?.commandesRestantes || (SEUIL_COUPON - (nbPayees % SEUIL_COUPON));

  const renderCommande = (cmd) => (
    <div key={cmd.id} style={{
      ...styles.card,
      borderLeft: '4px solid ' + (statutCouleur[cmd.statut] || '#888'),
      opacity: STATUTS_TERMINES.includes(cmd.statut) ? 0.88 : 1
    }}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.code}>#{cmd.codeCommande}</h3>
          <p style={styles.date}>
            📅 {new Date(cmd.createdAt).toLocaleDateString('fr-FR')} à {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
          <span style={{ ...styles.badge, background: statutCouleur[cmd.statut] || '#666' }}>
            {statutEmoji[cmd.statut] || '📦'} {cmd.statut}
          </span>
          {/* ICONE CHAT FLOTTANT SUR LA CARTE si en livraison */}
          {cmd.statut === 'en livraison' && (
            <button style={{ ...styles.chatIconBtn, background: chatOuvert === cmd.id ? '#E63946' : '#0077B6' }}
              onClick={() => ouvrirChat(cmd.id)}>
              💬
              {nonLus[cmd.id] > 0 && chatOuvert !== cmd.id && (
                <span style={styles.chatIconBadge}>{nonLus[cmd.id]}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MESSAGE STATUT */}
      <div style={{ ...styles.statutMsg, background: (statutCouleur[cmd.statut] || '#888') + '18', borderLeft: '4px solid ' + (statutCouleur[cmd.statut] || '#888') }}>
        <p style={{ color: statutCouleur[cmd.statut] || '#888', fontWeight: '600', fontSize: '0.88rem', fontFamily: F.corps }}>
          {statutEmoji[cmd.statut]} {getStatutMessage(cmd)}
        </p>
      </div>

      {/* BANNIERE CAISSE */}
      {cmd.statut === 'en attente paiement' && (
        <div style={styles.caisseBanniere}>
          <span style={{ fontSize: '1.5rem' }}>🏪</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem', color: '#6a1b9a' }}>
              Rendez-vous a la caisse !
            </p>
            <p style={{ fontSize: '0.78rem', color: '#7b1fa2', lineHeight: '1.5' }}>
              Votre commande est prete. Veuillez payer{' '}
              <strong>{parseFloat(cmd.total).toLocaleString()} FCFA</strong>{' '}
              en especes a la caisse. Elle vous sera remise apres validation du paiement.
            </p>
          </div>
        </div>
      )}

      {/* BANNIERE RETRAIT PRET */}
      {cmd.statut === 'prêt' && cmd.modeReception === 'retrait' && (
        <div style={styles.retraitBanniere}>
          <span style={{ fontSize: '1.5rem' }}>🏪</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem', color: '#1a6b3a' }}>
              Votre commande vous attend !
            </p>
            <p style={{ fontSize: '0.78rem', color: '#2d6a4f', lineHeight: '1.5' }}>
              Passez a la boutique pour recuperer votre commande.
              {((cmd.modePaiement || '').toLowerCase().includes('airtel') || (cmd.modePaiement || '').toLowerCase().includes('moov')) &&
                ' Le paiement mobile sera confirme a la remise.'
              }
            </p>
          </div>
        </div>
      )}

      <div style={styles.infos}>
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Mode</p>
          <p style={styles.infoValue}>{cmd.modeReception === 'livraison' ? '🛵 Livraison' : '🏪 Retrait'}</p>
        </div>
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Paiement</p>
          <LogoPaiement modePaiement={cmd.modePaiement} />
        </div>
        {cmd.adresseLivraison && (
          <div style={styles.infoItem}>
            <p style={styles.infoLabel}>Adresse</p>
            <p style={styles.infoValue}>📍 {cmd.adresseLivraison}</p>
          </div>
        )}
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Total</p>
          <p style={{ ...styles.infoValue, color: '#E63946', fontWeight: '800', fontSize: '1.1rem' }}>
            {parseFloat(cmd.total).toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {cmd.items && cmd.items.length > 0 && (
        <div style={styles.itemsList}>
          {cmd.items.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <span style={{ fontFamily: F.corps, fontSize: '0.88rem' }}>🍕 {item.nom}</span>
              <span style={styles.itemQty}>x{item.quantite}</span>
              <span style={{ color: '#E63946', fontWeight: '700', fontFamily: F.corps, fontSize: '0.88rem' }}>
                {(item.prix * item.quantite).toLocaleString()} FCFA
              </span>
            </div>
          ))}
        </div>
      )}

      <QRModal cmd={cmd} />
    </div>
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>
        Mes <span style={{ color: '#E63946' }}>Commandes</span>
      </h1>

      {/* CARTE COUPON */}
      {coupon && (
        <div style={coupon.aCouponDispo ? styles.couponCardDispo : styles.couponCard}>
          <div style={styles.couponTop}>
            <div style={styles.couponIconWrap}>
              <span style={styles.couponIcon}>{coupon.aCouponDispo ? '🎁' : '⭐'}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.couponTitre}>
                {coupon.aCouponDispo ? 'Coupon de reduction disponible !' : 'Programme fidelite'}
              </p>
              <p style={styles.couponSub}>
                {coupon.aCouponDispo
                  ? 'Vous avez -5% sur votre prochaine commande — utilisez-le dans le panier !'
                  : commandesRestantes + ' commande(s) payee(s) pour obtenir -5%'}
              </p>
            </div>
            {coupon.aCouponDispo && <div style={styles.couponBadge}>-5%</div>}
          </div>
          <div style={styles.progressionWrap}>
            <div style={styles.progressionBar}>
              <div style={{ ...styles.progressionInner, width: progression + '%', background: coupon.aCouponDispo ? 'linear-gradient(90deg, #2D6A4F, #40916c)' : 'linear-gradient(90deg, #E63946, #ff6b6b)' }} />
            </div>
            <div style={styles.progressionLabels}>
              <span style={styles.progressionNb}>{coupon.aCouponDispo ? nbPayees : (nbPayees % SEUIL_COUPON)} / {SEUIL_COUPON} commandes payees</span>
              <span style={{ ...styles.progressionPct, color: coupon.aCouponDispo ? '#2D6A4F' : '#E63946' }}>{Math.round(progression)}%</span>
            </div>
          </div>
          <div style={styles.etapes}>
            {[1, 2, 3, 4, 5].map(n => {
              const actif = coupon.aCouponDispo || (nbPayees % SEUIL_COUPON) >= n;
              return (
                <div key={n} style={{ ...styles.etape, background: actif ? '#E63946' : '#e8e8ed' }}>
                  <span style={{ color: actif ? 'white' : '#aaa', fontSize: '0.7rem', fontWeight: '800' }}>{actif ? '✓' : n}</span>
                </div>
              );
            })}
          </div>
          {coupon.aCouponDispo && <p style={styles.couponCTA}>🛒 Allez dans le panier et cliquez sur "Voir la facture" pour l'utiliser !</p>}
        </div>
      )}

      {/* ONGLETS */}
      {!loading && commandes.length > 0 && (
        <div style={styles.onglets}>
          <button style={{ ...styles.onglet, ...(onglet === 'en_cours' ? styles.ongletActif : {}) }} onClick={() => setOnglet('en_cours')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              🔄 En cours
              {commandesEnCours.length > 0 && (
                <span style={{ ...styles.ongletBadge, background: onglet === 'en_cours' ? 'white' : '#E63946', color: onglet === 'en_cours' ? '#E63946' : 'white' }}>
                  {commandesEnCours.length}
                </span>
              )}
              {totalNonLusEnCours > 0 && onglet !== 'en_cours' && (
                <span style={styles.msgBadge}>{totalNonLusEnCours}</span>
              )}
            </span>
          </button>
          <button style={{ ...styles.onglet, ...(onglet === 'terminees' ? styles.ongletActif : {}) }} onClick={() => setOnglet('terminees')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              ✅ Terminees
              {commandesTerminees.length > 0 && (
                <span style={{ ...styles.ongletBadge, background: onglet === 'terminees' ? 'white' : '#888', color: onglet === 'terminees' ? '#555' : 'white' }}>
                  {commandesTerminees.length}
                </span>
              )}
            </span>
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ fontFamily: F.corps, color: '#aaa', textAlign: 'center', padding: '3rem' }}>Chargement...</p>
      ) : commandes.length === 0 ? (
        <div style={styles.vide}>
          <p style={{ fontSize: '4rem' }}>📋</p>
          <p style={styles.videText}>Aucune commande pour l'instant</p>
          <button style={styles.btnRed} onClick={() => navigate('/menu')}>🍕 Commander maintenant</button>
        </div>
      ) : commandesAffichees.length === 0 ? (
        <div style={styles.videOnglet}>
          <p style={{ fontSize: '2.5rem' }}>{onglet === 'en_cours' ? '🎉' : '📋'}</p>
          <p style={styles.videText}>{onglet === 'en_cours' ? 'Aucune commande en cours' : 'Aucune commande terminee'}</p>
          {onglet === 'en_cours' && <button style={styles.btnRed} onClick={() => navigate('/menu')}>🍕 Commander maintenant</button>}
        </div>
      ) : (
        <div style={styles.list}>
          {commandesAffichees.map(cmd => renderCommande(cmd))}
        </div>
      )}

      {/* ===== BOUTON CHAT FLOTTANT ===== */}
      {commandesEnLivraison.length > 0 && (
        <div style={styles.floatWrap}>
          {/* CHAT OUVERT — fenetre flottante */}
          {chatOuvert && cmdChatOuverte && (
            <div style={styles.floatChatBox}>
              <div style={styles.floatChatHeader}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'white' }}>
                    💬 Livreur — #{cmdChatOuverte.codeCommande}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.1rem' }}>
                    🛵 En route vers vous
                  </p>
                </div>
                <button style={styles.floatChatClose} onClick={fermerChat}>✕</button>
              </div>
              <div style={styles.floatChatBody}>
                <Chat orderId={chatOuvert} user={user} />
              </div>
            </div>
          )}

          {/* BOUTON FLOTTANT */}
          <button style={styles.floatBtn} onClick={() => {
            if (chatOuvert) {
              fermerChat();
            } else {
              // Ouvrir le chat de la commande en livraison avec le plus de non lus
              const cmdAvecNonLus = commandesEnLivraison.find(c => (nonLus[c.id] || 0) > 0) || commandesEnLivraison[0];
              ouvrirChat(cmdAvecNonLus.id);
            }
          }}>
            💬
            {totalNonLus > 0 && !chatOuvert && (
              <span style={styles.floatBadge}>{totalNonLus}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 2rem 6rem', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  titre: { fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '1.5rem' },
  couponCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '1.5rem', border: '1.5px solid #e8e8ed' },
  couponCardDispo: { background: 'linear-gradient(135deg, #f0faf5, #e8f5e9)', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(45,106,79,0.12)', marginBottom: '1.5rem', border: '1.5px solid #b7e4c7' },
  couponTop: { display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.2rem' },
  couponIconWrap: { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(230,57,70,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  couponIcon: { fontSize: '1.4rem' },
  couponTitre: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '0.95rem', color: '#0d0d0d', marginBottom: '0.3rem' },
  couponSub: { fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', color: '#666', lineHeight: '1.5' },
  couponBadge: { background: '#2D6A4F', color: 'white', borderRadius: '100px', padding: '0.4rem 0.9rem', fontFamily: "'Inter', sans-serif", fontWeight: '900', fontSize: '1rem', flexShrink: 0 },
  progressionWrap: { marginBottom: '1rem' },
  progressionBar: { height: '10px', background: '#e8e8ed', borderRadius: '100px', overflow: 'hidden', marginBottom: '0.5rem' },
  progressionInner: { height: '100%', borderRadius: '100px', transition: 'width 0.5s ease' },
  progressionLabels: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  progressionNb: { fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', color: '#888' },
  progressionPct: { fontFamily: "'Inter', sans-serif", fontSize: '0.72rem', fontWeight: '800' },
  etapes: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  etape: { flex: 1, height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' },
  couponCTA: { fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', color: '#2D6A4F', fontWeight: '600', textAlign: 'center', background: 'rgba(45,106,79,0.08)', padding: '0.7rem', borderRadius: '10px', marginTop: '0.5rem' },
  onglets: { display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  onglet: { background: 'white', border: '1.5px solid #e8e8ed', padding: '0.65rem 1.3rem', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", color: '#555', transition: 'all 0.2s ease' },
  ongletActif: { background: '#E63946', border: '1.5px solid #E63946', color: 'white', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' },
  ongletBadge: { fontSize: '0.65rem', fontWeight: '800', padding: '2px 7px', borderRadius: '100px', fontFamily: "'Inter', sans-serif" },
  msgBadge: { background: '#FFB703', color: 'white', fontSize: '0.6rem', fontWeight: '900', padding: '2px 6px', borderRadius: '100px', fontFamily: "'Inter', sans-serif" },
  vide: { textAlign: 'center', padding: '4rem 1rem' },
  videOnglet: { textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  videText: { color: '#aaa', fontFamily: "'Inter', sans-serif", margin: '1rem 0 1.5rem', fontSize: '0.95rem' },
  btnRed: { background: '#E63946', color: 'white', border: 'none', padding: '0.9rem 2rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 8px 20px rgba(230,57,70,0.28)' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  code: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#0d0d0d', marginBottom: '0.3rem', fontWeight: '700' },
  date: { color: '#aaa', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif" },
  badge: { color: 'white', padding: '0.35rem 0.9rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' },
  statutMsg: { padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem' },
  caisseBanniere: { background: 'linear-gradient(135deg, #f3e5f5, #ede7f6)', border: '1.5px solid #ce93d8', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' },
  retraitBanniere: { background: 'linear-gradient(135deg, #f0faf5, #e8f5e9)', border: '1.5px solid #b7e4c7', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.8rem' },
  infos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  infoItem: {},
  infoLabel: { color: '#bbb', fontSize: '0.7rem', marginBottom: '0.4rem', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' },
  infoValue: { fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' },
  paiementInfo: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  paiementLogo: { width: '28px', height: '28px', borderRadius: '8px', objectFit: 'contain', flexShrink: 0, border: '1px solid #e8e8ed', background: 'white', padding: '2px' },
  paiementNom: { fontWeight: '600', color: '#333', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' },
  especesIcon: { width: '28px', height: '28px', borderRadius: '8px', background: '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, border: '1px solid #b7e4c7' },
  itemsList: { background: '#fffbf0', borderRadius: '12px', padding: '0.8rem', marginBottom: '0.5rem', border: '1px solid #ffe0a0' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0' },
  itemQty: { background: '#FFB703', color: 'white', borderRadius: '100px', padding: '0.1rem 0.5rem', fontWeight: '700', fontSize: '0.72rem', fontFamily: "'Inter', sans-serif" },

  // ICONE CHAT SUR LA CARTE
  chatIconBtn: {
    position: 'relative', border: 'none', borderRadius: '50%',
    width: '36px', height: '36px', cursor: 'pointer',
    fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s ease'
  },
  chatIconBadge: {
    position: 'absolute', top: '-4px', right: '-4px',
    background: '#E63946', color: 'white', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '0.6rem', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },

  // BOUTON FLOTTANT
  floatWrap: {
    position: 'fixed', bottom: '5rem', right: '1.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem',
    zIndex: 1000
  },
  floatBtn: {
    position: 'relative', width: '60px', height: '60px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0077B6, #023e8a)',
    color: 'white', border: 'none', fontSize: '1.6rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(0,119,182,0.45)', transition: 'all 0.25s ease'
  },
  floatBadge: {
    position: 'absolute', top: '-2px', right: '-2px',
    background: '#E63946', color: 'white', borderRadius: '50%',
    width: '22px', height: '22px', fontSize: '0.7rem', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid white'
  },

  // FENETRE CHAT FLOTTANTE
  floatChatBox: {
    width: 'min(340px, calc(100vw - 3rem))',
    background: 'white', borderRadius: '20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    overflow: 'hidden', border: '1.5px solid #e8e8ed'
  },
  floatChatHeader: {
    background: 'linear-gradient(135deg, #0077B6, #023e8a)',
    padding: '1rem 1.2rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  floatChatClose: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
    fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  floatChatBody: { maxHeight: '320px', overflowY: 'auto' },

  qrBtn: { background: '#0d0d0d', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '100px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif" },
  qrModal: { background: 'white', borderRadius: '20px', padding: '2rem', marginTop: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center', border: '1.5px solid #e8e8ed' },
  qrTitle: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#0d0d0d', marginBottom: '0.5rem', fontWeight: '700' },
  qrSub: { color: '#aaa', fontSize: '0.82rem', marginBottom: '1.5rem', fontFamily: "'Inter', sans-serif" },
  qrWrapper: { display: 'inline-block', padding: '1rem', background: '#f9f9f9', borderRadius: '12px', marginBottom: '1.5rem' },
  codeSecretBox: { background: '#0d0d0d', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  codeSecretLabel: { color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif" },
  codeSecretVal: { color: '#FFB703', fontWeight: '900', fontSize: '0.92rem', letterSpacing: '1px', wordBreak: 'break-all', fontFamily: "'Inter', sans-serif" },
  qrNote: { color: '#E63946', fontSize: '0.78rem', fontWeight: '600', fontFamily: "'Inter', sans-serif" },
  notifBadge: { background: '#E63946', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }
};

export default Suivi;