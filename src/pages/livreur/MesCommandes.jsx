import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Chat from '../../components/Chat';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// MODAL INTERNE
const Modal = ({ visible, titre, message, montant, onConfirm, onCancel, loading, type }) => {
  if (!visible) return null;
  return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.box}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : '💸'}
        </div>
        <h3 style={stylesModal.titre}>{titre}</h3>
        {montant && (
          <p style={stylesModal.montant}>{montant.toLocaleString()} FCFA</p>
        )}
        <p style={stylesModal.message}>{message}</p>
        <div style={stylesModal.actions}>
          {onCancel && (
            <button style={stylesModal.annulerBtn} onClick={onCancel} disabled={loading}>Annuler</button>
          )}
          {onConfirm && (
            <button style={{ ...stylesModal.confirmerBtn, opacity: loading ? 0.6 : 1 }} onClick={onConfirm} disabled={loading}>
              {loading ? 'En cours...' : type === 'success' || type === 'error' ? 'OK' : 'Confirmer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const stylesModal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  box: { background: 'white', borderRadius: '24px', padding: '2rem', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1A2E', marginBottom: '0.5rem', fontWeight: '700' },
  montant: { color: '#FFB703', fontWeight: '900', fontSize: '1.8rem', letterSpacing: '-0.02em', marginBottom: '0.5rem' },
  message: { color: '#666', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.5rem', fontFamily: "'Inter', sans-serif" },
  actions: { display: 'flex', gap: '0.8rem', justifyContent: 'center' },
  annulerBtn: { background: '#f0f0f0', color: '#333', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  confirmerBtn: { background: '#FFB703', color: '#1A1A2E', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(255,183,3,0.35)' }
};

const MesCommandes = () => {
  const [commandesEnCours, setCommandesEnCours] = useState([]);
  const [commandesTerminees, setCommandesTerminees] = useState([]);
  const [toutesCommandes, setToutesCommandes] = useState([]);
  const [fileAttente, setFileAttente] = useState([]);
  const [stats, setStats] = useState({ total: 0, aujourd: 0, terminees: 0, enCours: 0, revenuAujourdhui: 0 });
  const [loading, setLoading] = useState(true);
  const [chatOuvert, setChatOuvert] = useState(null);
  const [prise, setPrise] = useState(null);
  const [nonLus, setNonLus] = useState({});
  const [vue, setVue] = useState('aujourd');
  const [jourSelectionne, setJourSelectionne] = useState(new Date().toDateString());
  const [solde, setSolde] = useState({ solde: 0, totalEspeces: 0, totalRemis: 0, remiseEnAttente: null });
  const [loadingRemise, setLoadingRemise] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: '', titre: '', message: '', montant: null });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    chargerCommandes();
    chargerSolde();
    const interval = setInterval(() => { chargerCommandes(); chargerSolde(); }, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const chargerCommandes = async () => {
    try {
      const [mesCmd, fileCmd, statsCmd, nonLusCmd] = await Promise.all([
        api.get('/livreurs/commandes'),
        api.get('/livreurs/file-attente'),
        api.get('/livreurs/stats'),
        api.get('/chat/non-lus')
      ]);
      setToutesCommandes(mesCmd.data);
      setCommandesEnCours(mesCmd.data.filter(c => c.statut === 'en livraison'));
      setCommandesTerminees(mesCmd.data.filter(c => ['livré', 'payé'].includes(c.statut)));
      setFileAttente(fileCmd.data);
      setStats(statsCmd.data);
      setNonLus(prev => {
        const nouveau = { ...nonLusCmd.data };
        if (chatOuvert) nouveau[chatOuvert] = 0;
        return nouveau;
      });
    } catch (err) {}
    setLoading(false);
  };

  const chargerSolde = async () => {
    try {
      const res = await api.get('/remises/solde');
      setSolde(res.data);
    } catch (err) {}
  };

  const ouvrirModalRemise = () => {
    if (solde.remiseEnAttente) return;
    if (solde.solde <= 0) return;
    setModal({
      visible: true,
      type: 'remise',
      titre: 'Remettre les especes',
      message: 'Confirmez que vous remettez la totalite des especes en votre possession a l\'admin. Votre solde passera a 0 apres confirmation de l\'admin.',
      montant: solde.solde
    });
  };

  const confirmerRemise = async () => {
    setLoadingRemise(true);
    try {
      await api.post('/remises/demander');
      await chargerSolde();
      setModal({
        visible: true,
        type: 'success',
        titre: 'Demande envoyee !',
        message: 'L\'admin a ete notifie. Votre solde passera a 0 apres sa confirmation.',
        montant: null
      });
    } catch (err) {
      setModal({
        visible: true,
        type: 'error',
        titre: 'Erreur',
        message: err.response?.data?.message || 'Une erreur est survenue.',
        montant: null
      });
    }
    setLoadingRemise(false);
  };

  const fermerModal = () => setModal({ ...modal, visible: false });

  const prendreCommande = async () => {
    if (fileAttente.length === 0) return;
    const prochaine = fileAttente[0];
    try {
      await api.put('/livreurs/' + prochaine.id + '/prendre');
      setPrise(prochaine);
      chargerCommandes();
    } catch (err) {}
  };

  const ouvrirMaps = (cmd) => {
    if (cmd.localisation) {
      const loc = typeof cmd.localisation === 'string' ? JSON.parse(cmd.localisation) : cmd.localisation;
      window.open('https://www.google.com/maps?q=' + loc.lat + ',' + loc.lng, '_blank');
    } else if (cmd.adresseLivraison) {
      window.open('https://www.google.com/maps/search/' + encodeURIComponent(cmd.adresseLivraison), '_blank');
    }
  };

  const ouvrirChat = (cmdId) => {
    setChatOuvert(chatOuvert === cmdId ? null : cmdId);
    if (chatOuvert !== cmdId) setNonLus(prev => ({ ...prev, [cmdId]: 0 }));
  };

  const getDerniers7Jours = () => {
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); jours.push(date);
    }
    return jours;
  };

  const getStatsJour = (date) => {
    const dateStr = date.toDateString();
    const cmds = toutesCommandes.filter(c => new Date(c.createdAt).toDateString() === dateStr);
    const terminees = cmds.filter(c => ['livré', 'payé'].includes(c.statut));
    const especesRecus = terminees
      .filter(c => c.modePaiement?.toLowerCase().includes('espece') && c.modeReception === 'livraison')
      .reduce((sum, c) => sum + parseFloat(c.total), 0);
    return { total: cmds.length, terminees: terminees.length, especesRecus, commandes: cmds };
  };

  const derniers7Jours = getDerniers7Jours();
  const maxCommandes = Math.max(...derniers7Jours.map(j => getStatsJour(j).total), 1);
  const statsJourSelectionne = getStatsJour(new Date(jourSelectionne));
  const aujourd = new Date().toDateString();
  const termineesAujourdhui = commandesTerminees.filter(c => new Date(c.updatedAt).toDateString() === aujourd);
  const totalNonLus = commandesEnCours.reduce((sum, c) => sum + (nonLus[c.id] || 0), 0);
  const especesAujourdhui = termineesAujourdhui
    .filter(c => c.modePaiement?.toLowerCase().includes('espece') && c.modeReception === 'livraison')
    .reduce((sum, c) => sum + parseFloat(c.total), 0);

  return (
    <div className="page">
      {/* MODAL */}
      <Modal
        visible={modal.visible}
        type={modal.type}
        titre={modal.titre}
        message={modal.message}
        montant={modal.montant}
        loading={loadingRemise}
        onConfirm={modal.type === 'remise' ? confirmerRemise : fermerModal}
        onCancel={modal.type === 'remise' ? fermerModal : null}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Mes <span>Livraisons</span></h1>
        {totalNonLus > 0 && (
          <div style={styles.globalMsgBadge}>
            💬 <span style={styles.globalMsgCount}>{totalNonLus}</span> message(s) non lu(s)
          </div>
        )}
      </div>

      <div style={styles.vueSwitch}>
        <button style={{ ...styles.vueBtn, ...(vue === 'aujourd' ? styles.vueBtnActif : {}) }} onClick={() => setVue('aujourd')}>📅 Aujourd'hui</button>
        <button style={{ ...styles.vueBtn, ...(vue === 'semaine' ? styles.vueBtnActif : {}) }} onClick={() => setVue('semaine')}>📊 Cette semaine</button>
      </div>

      {vue === 'aujourd' && (
        <>
          <div style={styles.statsGrid}>
            <div style={{ ...styles.stat, borderLeft: '4px solid #0077B6' }}>
              <p style={styles.statNum}>{stats.enCours}</p>
              <p style={styles.statLabel}>🛵 En cours</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #2D6A4F' }}>
              <p style={styles.statNum}>{termineesAujourdhui.length}</p>
              <p style={styles.statLabel}>✅ Terminees aujourd'hui</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #FFB703' }}>
              <p style={styles.statNum}>{fileAttente.length}</p>
              <p style={styles.statLabel}>⏳ Disponibles</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #E63946' }}>
              <p style={styles.statNum}>{especesAujourdhui.toLocaleString()}</p>
              <p style={styles.statLabel}>💵 Especes aujourd'hui</p>
            </div>
          </div>

          {/* SOLDE EN POSSESSION */}
          <div style={styles.soldeCard}>
            <div style={styles.soldeTop}>
              <div>
                <p style={styles.soldeLabel}>💼 Especes en votre possession</p>
                <p style={styles.soldeMontant}>{(solde.solde || 0).toLocaleString()} FCFA</p>
                <p style={styles.soldeSub}>
                  Total encaisse : {(solde.totalEspeces || 0).toLocaleString()} FCFA
                  {solde.totalRemis > 0 && ` — Deja remis : ${solde.totalRemis.toLocaleString()} FCFA`}
                </p>
              </div>
              {solde.remiseEnAttente ? (
                <div style={styles.remiseAttente}>
                  <p style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.2rem' }}>⏳ Remise en attente</p>
                  <p style={{ fontSize: '0.72rem', opacity: 0.8 }}>
                    {parseFloat(solde.remiseEnAttente.montant).toLocaleString()} FCFA
                  </p>
                  <p style={{ fontSize: '0.68rem', opacity: 0.65, marginTop: '0.2rem' }}>
                    Confirmation admin en cours...
                  </p>
                </div>
              ) : solde.solde > 0 ? (
                <button style={styles.remiseBtn} onClick={ouvrirModalRemise} disabled={loadingRemise}>
                  💸 Remettre à l'admin
                </button>
              ) : (
                <div style={styles.soldeZero}>
                  <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>✅ Solde remis</p>
                </div>
              )}
            </div>
          </div>

          <div style={styles.prendreCard}>
            <div style={styles.fileInfo}>
              <span style={styles.fileNum}>{fileAttente.length}</span>
              <div>
                <p style={styles.fileTitle}>Commande(s) disponible(s)</p>
                <p style={styles.fileSub}>Pretes a etre livrees</p>
              </div>
            </div>
            <button style={{ ...styles.prendreBtn, opacity: fileAttente.length === 0 ? 0.5 : 1 }} onClick={prendreCommande} disabled={fileAttente.length === 0}>
              🛵 Prendre une commande
            </button>
          </div>

          {prise && (
            <div style={styles.priseCard}>
              <p style={{ fontSize: '2rem' }}>🎉</p>
              <h3 style={{ color: '#2D6A4F', marginBottom: '0.5rem' }}>Commande assignee !</h3>
              <div style={styles.bzCode}>
                <span style={styles.bzLabel}>Code cuisine :</span>
                <span style={styles.bzVal}>#{prise.codeCommande}</span>
              </div>
              <p style={{ color: '#666', marginTop: '0.5rem' }}>📍 {prise.adresseLivraison || 'Adresse a confirmer'}</p>
              <p style={{ color: '#E63946', fontWeight: '700' }}>{parseFloat(prise.total || 0).toLocaleString()} FCFA</p>
              <button style={styles.fermerBtn} onClick={() => setPrise(null)}>OK</button>
            </div>
          )}

          {loading ? <p>Chargement...</p> : (
            <>
              <h2 style={styles.sectionTitle}>🛵 En cours ({commandesEnCours.length})</h2>
              {commandesEnCours.length === 0 ? (
                <div style={styles.empty}><p>Aucune livraison en cours</p></div>
              ) : (
                <div style={styles.list}>
                  {commandesEnCours.map(cmd => {
                    const nbNonLus = nonLus[cmd.id] || 0;
                    return (
                      <div key={cmd.id} style={{ ...styles.card, borderLeft: '4px solid #0077B6' }}>
                        <div style={styles.cardHeader}>
                          <div>
                            <h3 style={styles.code}>Commande en livraison</h3>
                            <div style={styles.bzCode}>
                              <span style={styles.bzLabel}>Code cuisine :</span>
                              <span style={styles.bzVal}>#{cmd.codeCommande}</span>
                            </div>
                            <p style={styles.date}>📅 {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <span style={styles.badgeEnCours}>🛵 En livraison</span>
                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                              <button style={{ ...styles.chatIconBtn, background: chatOuvert === cmd.id ? '#E63946' : '#0077B6' }} onClick={() => ouvrirChat(cmd.id)}>💬</button>
                              {nbNonLus > 0 && chatOuvert !== cmd.id && <span style={styles.chatIconBadge}>{nbNonLus}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={styles.infosGrid}>
                          <div style={styles.infoItem}><p style={styles.infoLabel}>Client</p><p style={styles.infoValue}>👤 {cmd.client?.nom || 'Client'}</p></div>
                          <div style={styles.infoItem}><p style={styles.infoLabel}>Telephone</p><p style={styles.infoValue}>📞 {cmd.client?.telephone || 'Non renseigne'}</p></div>
                          <div style={styles.infoItem}><p style={styles.infoLabel}>Adresse</p><p style={styles.infoValue}>📍 {cmd.adresseLivraison || 'Voir localisation'}</p></div>
                          <div style={styles.infoItem}><p style={styles.infoLabel}>Paiement</p><p style={styles.infoValue}>💳 {cmd.modePaiement}</p></div>
                          <div style={styles.infoItem}><p style={styles.infoLabel}>Montant</p><p style={{ ...styles.infoValue, color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p></div>
                        </div>
                        <div style={styles.cardActions}>
                          <button style={styles.mapsBtn} onClick={() => ouvrirMaps(cmd)}>🗺️ Localisation</button>
                          <button style={styles.scanBtn} onClick={() => navigate('/livreur/scanner')}>📷 Scanner</button>
                        </div>
                        {chatOuvert === cmd.id && <Chat orderId={cmd.id} user={user} />}
                      </div>
                    );
                  })}
                </div>
              )}

              <h2 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>✅ Terminees aujourd'hui ({termineesAujourdhui.length})</h2>
              {termineesAujourdhui.length === 0 ? (
                <div style={styles.empty}><p>Aucune livraison terminee aujourd'hui</p></div>
              ) : (
                <div style={styles.list}>
                  {termineesAujourdhui.map(cmd => (
                    <div key={cmd.id} style={{ ...styles.card, opacity: 0.85 }}>
                      <div style={styles.cardHeader}>
                        <div>
                          <h3 style={styles.code}>Livraison terminee</h3>
                          <div style={styles.bzCode}><span style={styles.bzLabel}>Code :</span><span style={styles.bzVal}>#{cmd.codeCommande}</span></div>
                          <p style={styles.date}>📅 {new Date(cmd.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={styles.badgeTermine}>✅ {cmd.statut}</span>
                          {cmd.modePaiement?.toLowerCase().includes('espece') && cmd.modeReception === 'livraison' && (
                            <p style={{ fontSize: '0.72rem', color: '#FFB703', fontWeight: '700', marginTop: '0.3rem' }}>💵 Especes recus</p>
                          )}
                        </div>
                      </div>
                      <div style={styles.infosGrid}>
                        <div style={styles.infoItem}><p style={styles.infoLabel}>Client</p><p style={styles.infoValue}>👤 {cmd.client?.nom || 'Client'}</p></div>
                        <div style={styles.infoItem}><p style={styles.infoLabel}>Adresse</p><p style={styles.infoValue}>📍 {cmd.adresseLivraison || 'Retrait'}</p></div>
                        <div style={styles.infoItem}><p style={styles.infoLabel}>Montant</p><p style={{ ...styles.infoValue, color: '#2D6A4F', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {vue === 'semaine' && (
        <>
          <div style={styles.graphCard}>
            <h3 style={styles.graphTitle}>Mon activite des 7 derniers jours</h3>
            <div style={styles.barChart}>
              {derniers7Jours.map((date, i) => {
                const s = getStatsJour(date);
                const hauteur = (s.total / maxCommandes) * 100;
                const estSelectionne = date.toDateString() === jourSelectionne;
                const estAujourdhui = date.toDateString() === aujourd;
                return (
                  <div key={i} style={styles.barWrapper} onClick={() => setJourSelectionne(date.toDateString())}>
                    <p style={styles.barValue}>{s.total}</p>
                    <div style={styles.barContainer}>
                      <div style={{ ...styles.bar, height: Math.max(hauteur, 5) + '%', background: estSelectionne ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E' }} />
                    </div>
                    <p style={{ ...styles.barLabel, color: estSelectionne ? '#E63946' : '#666' }}>{JOURS[date.getDay()].substring(0, 3)}</p>
                    <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
                  </div>
                );
              })}
            </div>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>Cliquez sur un jour pour voir les details</p>
          </div>

          <h2 style={styles.sectionTitle}>{JOURS[new Date(jourSelectionne).getDay()]} {new Date(jourSelectionne).toLocaleDateString('fr-FR')}</h2>
          <div style={styles.statsGrid}>
            <div style={{ ...styles.stat, borderLeft: '4px solid #E63946' }}><p style={styles.statNum}>{statsJourSelectionne.total}</p><p style={styles.statLabel}>Livraisons</p></div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #2D6A4F' }}><p style={styles.statNum}>{statsJourSelectionne.terminees}</p><p style={styles.statLabel}>Terminees</p></div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #FFB703' }}><p style={styles.statNum}>{statsJourSelectionne.especesRecus.toLocaleString()}</p><p style={styles.statLabel}>💵 Especes recus</p></div>
          </div>

          {statsJourSelectionne.commandes.length === 0 ? (
            <div style={styles.empty}><p style={{ fontSize: '3rem' }}>📋</p><p>Aucune livraison ce jour</p></div>
          ) : (
            <div style={styles.list}>
              {statsJourSelectionne.commandes.map(cmd => (
                <div key={cmd.id} style={{ ...styles.card, opacity: ['livré', 'payé'].includes(cmd.statut) ? 0.85 : 1 }}>
                  <div style={styles.cardHeader}>
                    <div>
                      <div style={styles.bzCode}><span style={styles.bzLabel}>Code :</span><span style={styles.bzVal}>#{cmd.codeCommande}</span></div>
                      <p style={styles.date}>📅 {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ background: ['livré', 'payé'].includes(cmd.statut) ? '#2D6A4F' : '#0077B6', color: 'white', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600' }}>{cmd.statut}</span>
                      {cmd.modePaiement?.toLowerCase().includes('espece') && cmd.modeReception === 'livraison' && ['livré', 'payé'].includes(cmd.statut) && (
                        <p style={{ fontSize: '0.72rem', color: '#FFB703', fontWeight: '700', marginTop: '0.3rem' }}>💵 Especes recus</p>
                      )}
                    </div>
                  </div>
                  <div style={styles.infosGrid}>
                    <div style={styles.infoItem}><p style={styles.infoLabel}>Client</p><p style={styles.infoValue}>👤 {cmd.client?.nom || 'Client'}</p></div>
                    <div style={styles.infoItem}><p style={styles.infoLabel}>Adresse</p><p style={styles.infoValue}>📍 {cmd.adresseLivraison || 'Retrait'}</p></div>
                    <div style={styles.infoItem}><p style={styles.infoLabel}>Montant</p><p style={{ ...styles.infoValue, color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  vueSwitch: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  vueBtn: { background: '#f0f0f0', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  vueBtnActif: { background: '#1A1A2E', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  stat: { background: 'white', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  statNum: { fontSize: '1.8rem', fontWeight: '900', color: '#1A1A2E' },
  statLabel: { color: '#666', fontSize: '0.8rem', marginTop: '0.2rem' },
  soldeCard: { background: 'linear-gradient(135deg, #1a2744, #1A1A2E)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', border: '1.5px solid #FFB703' },
  soldeTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  soldeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginBottom: '0.3rem' },
  soldeMontant: { color: '#FFB703', fontWeight: '900', fontSize: '2rem', letterSpacing: '-0.02em', marginBottom: '0.2rem' },
  soldeSub: { color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' },
  remiseBtn: { background: '#FFB703', color: '#1A1A2E', border: 'none', padding: '0.8rem 1.3rem', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', fontSize: '0.88rem', boxShadow: '0 4px 12px rgba(255,183,3,0.35)', whiteSpace: 'nowrap', flexShrink: 0 },
  remiseAttente: { background: 'rgba(255,183,3,0.15)', border: '1.5px solid #FFB703', borderRadius: '12px', padding: '0.8rem 1rem', color: '#FFB703', flexShrink: 0, textAlign: 'center' },
  soldeZero: { background: 'rgba(45,106,79,0.2)', border: '1.5px solid #2D6A4F', borderRadius: '12px', padding: '0.8rem 1rem', color: '#40916c', flexShrink: 0, textAlign: 'center' },
  prendreCard: { background: 'linear-gradient(135deg, #1A1A2E, #2d2d4e)', borderRadius: '20px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  fileNum: { fontSize: '3rem', fontWeight: '900', color: '#FFB703' },
  fileTitle: { color: 'white', fontWeight: '700', fontSize: '1.2rem' },
  fileSub: { color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' },
  prendreBtn: { background: '#E63946', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '1.1rem' },
  priseCard: { background: 'linear-gradient(135deg, #d4edda, #c3e6cb)', borderRadius: '16px', padding: '2rem', textAlign: 'center', marginBottom: '2rem' },
  fermerBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.7rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', marginTop: '1rem' },
  graphCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
  graphTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1A2E', marginBottom: '1rem' },
  barChart: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', gap: '0.3rem' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 },
  barValue: { fontSize: '0.75rem', fontWeight: '700', color: '#1A1A2E', marginBottom: '0.2rem' },
  barContainer: { width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '60%', borderRadius: '6px 6px 0 0', transition: 'all 0.3s', minHeight: '4px' },
  barLabel: { fontSize: '0.75rem', fontWeight: '600', marginTop: '0.3rem' },
  barDate: { fontSize: '0.65rem', color: '#aaa' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#1A1A2E', marginBottom: '1rem' },
  empty: { background: 'white', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: '#666', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' },
  card: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  code: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1A2E' },
  bzCode: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1A1A2E', borderRadius: '50px', padding: '0.3rem 0.8rem', marginBottom: '0.3rem', marginTop: '0.3rem' },
  bzLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' },
  bzVal: { color: '#FFB703', fontWeight: '900', fontSize: '0.9rem' },
  date: { color: '#888', fontSize: '0.8rem', marginTop: '0.3rem' },
  badgeEnCours: { background: '#0077B6', color: 'white', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' },
  badgeTermine: { background: '#2D6A4F', color: 'white', padding: '0.4rem 1rem', borderRadius: '50px', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' },
  infosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  infoItem: {},
  infoLabel: { color: '#aaa', fontSize: '0.75rem', marginBottom: '0.2rem' },
  infoValue: { fontWeight: '600', color: '#333', fontSize: '0.9rem' },
  cardActions: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' },
  mapsBtn: { background: '#0077B6', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  scanBtn: { background: '#FB8500', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  chatIconBtn: { border: 'none', borderRadius: '50%', width: '42px', height: '42px', cursor: 'pointer', color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.25)', transition: 'all 0.2s ease', flexShrink: 0 },
  chatIconBadge: { position: 'absolute', top: '-6px', right: '-6px', background: '#E63946', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.65rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', zIndex: 10 },
  globalMsgBadge: { background: '#E63946', color: 'white', borderRadius: '100px', padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(230,57,70,0.3)' },
  globalMsgCount: { background: 'white', color: '#E63946', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.75rem', fontWeight: '900', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
};

export default MesCommandes;