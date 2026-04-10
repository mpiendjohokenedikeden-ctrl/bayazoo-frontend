import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders, deleteOrder } from '../../services/orderService';
import { getPizzas } from '../../services/pizzaService';
import { getStatut } from '../../services/horaireService';
import api from '../../services/api';

const F = { titre: 'Georgia, serif', corps: "'Inter', -apple-system, sans-serif" };
const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const Dashboard = () => {
  const [commandes, setCommandes] = useState([]);
  const [pizzas, setPizzas] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('overview');
  const [jourSelectionne, setJourSelectionne] = useState(new Date().toDateString());
  const [statut, setStatut] = useState(null);
  const [periodeRevenu, setPeriodeRevenu] = useState('aujourd');
  const [jourRevenuSelectionne, setJourRevenuSelectionne] = useState(null);
  const [rechercheCaisse, setRechercheCaisse] = useState('');
  const [remisesEnAttente, setRemisesEnAttente] = useState([]);
  const [loadingConfirm, setLoadingConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [remiseAConfirmer, setRemiseAConfirmer] = useState(null);

  useEffect(() => {
    chargerDonnees();
    const interval = setInterval(chargerDonnees, 15000);
    return () => clearInterval(interval);
  }, []);

  const afficherNotif = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const chargerDonnees = async () => {
    try {
      const [cmd, piz, liv, stat, remises] = await Promise.all([
        getAllOrders(), getPizzas(), api.get('/auth/livreurs'), getStatut(),
        api.get('/remises/en-attente')
      ]);
      setCommandes(cmd.data);
      setPizzas(piz.data);
      setLivreurs(liv.data);
      setStatut(stat.data);
      setRemisesEnAttente(remises.data);
    } catch (err) {}
    setLoading(false);
  };

  const supprimerCommande = async (id) => {
    if (window.confirm('Supprimer cette commande ?')) {
      await deleteOrder(id);
      chargerDonnees();
    }
  };

  const validerPaiementEspeces = async (id) => {
    try {
      await api.put('/orders/' + id + '/valider-especes');
      chargerDonnees();
      afficherNotif('✅ Paiement valide avec succes !');
    } catch (err) {
      afficherNotif('❌ ' + (err.response?.data?.message || 'Erreur'), 'error');
    }
  };

  const confirmerRemise = async () => {
    if (!remiseAConfirmer) return;
    setLoadingConfirm(remiseAConfirmer.id);
    try {
      await api.put('/remises/' + remiseAConfirmer.id + '/confirmer');
      await chargerDonnees();
      setRemiseAConfirmer(null);
      afficherNotif('✅ Remise confirmee ! Le solde du livreur est maintenant a 0.');
    } catch (err) {
      afficherNotif('❌ ' + (err.response?.data?.message || 'Erreur'), 'error');
      setRemiseAConfirmer(null);
    }
    setLoadingConfirm(null);
  };

  const getNomLivreur = (cmd) => {
    if (cmd.livreur?.nom) return cmd.livreur.nom;
    if (cmd.livreurNom) return cmd.livreurNom;
    if (cmd.livreurId) {
      const l = livreurs.find(l => parseInt(l.id) === parseInt(cmd.livreurId));
      return l ? l.nom : 'Livreur #' + cmd.livreurId;
    }
    return 'Non assigne';
  };

  const aujourd = new Date().toDateString();
  const commandesAujourdhui = commandes.filter(c => new Date(c.createdAt).toDateString() === aujourd);
  const revenusAujourdhui = commandesAujourdhui.filter(c => c.statut === 'payé').reduce((sum, c) => sum + parseFloat(c.total), 0);
  const commandesEnAttente = commandesAujourdhui.filter(c => c.statut === 'en attente').length;
  const commandesEnLivraison = commandesAujourdhui.filter(c => c.statut === 'en livraison').length;
  const commandesPayees = commandesAujourdhui.filter(c => c.statut === 'payé').length;
  const commandesAttentesPaiement = commandes.filter(c => c.statut === 'en attente paiement');
  const commandesAttentesPaiementAujourdhui = commandesAttentesPaiement.filter(c => new Date(c.createdAt).toDateString() === aujourd);
  const commandesAttentesPaiementFiltrees = rechercheCaisse.trim()
    ? commandesAttentesPaiement.filter(c => c.codeCommande?.toLowerCase().includes(rechercheCaisse.toLowerCase()))
    : commandesAttentesPaiement;
  const totalBadgeCaisse = commandesAttentesPaiement.length + remisesEnAttente.length;

  const getDerniers7Jours = () => {
    const jours = [];
    for (let i = 6; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); jours.push(date); }
    return jours;
  };
  const getDerniers30Jours = () => {
    const jours = [];
    for (let i = 29; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); jours.push(date); }
    return jours;
  };
  const getStatsJour = (date) => {
    const dateStr = date.toDateString();
    const cmdsJour = commandes.filter(c => new Date(c.createdAt).toDateString() === dateStr);
    const revenu = cmdsJour.filter(c => c.statut === 'payé').reduce((sum, c) => sum + parseFloat(c.total), 0);
    return { commandes: cmdsJour, total: cmdsJour.length, revenu };
  };
  const getRevenuParModeJour = (date) => {
    const dateStr = date.toDateString();
    const cmds = commandes.filter(c => new Date(c.createdAt).toDateString() === dateStr && c.statut === 'payé');
    return {
      airtel: cmds.filter(c => (c.modePaiement || '').toLowerCase().includes('airtel')).reduce((s, c) => s + parseFloat(c.total), 0),
      moov: cmds.filter(c => (c.modePaiement || '').toLowerCase().includes('moov')).reduce((s, c) => s + parseFloat(c.total), 0),
      especes: cmds.filter(c => (c.modePaiement || '').toLowerCase().includes('espece')).reduce((s, c) => s + parseFloat(c.total), 0),
      total: cmds.reduce((s, c) => s + parseFloat(c.total), 0),
      nb: cmds.length
    };
  };

  const derniers7Jours = getDerniers7Jours();
  const derniers30Jours = getDerniers30Jours();
  const statsJourSelectionne = getStatsJour(new Date(jourSelectionne));
  const maxCommandes = Math.max(...derniers7Jours.map(j => getStatsJour(j).total), 1);
  const max7JoursRevenu = Math.max(...derniers7Jours.map(j => getRevenuParModeJour(j).total), 1);
  const max30JoursRevenu = Math.max(...derniers30Jours.map(j => getRevenuParModeJour(j).total), 1);

  const getCommandesPeriode = () => {
    if (periodeRevenu === 'aujourd') return commandesAujourdhui;
    if (periodeRevenu === 'semaine') { const d = new Date(); d.setDate(d.getDate() - 7); return commandes.filter(c => new Date(c.createdAt) >= d); }
    if (periodeRevenu === 'mois') { const d = new Date(); d.setDate(d.getDate() - 30); return commandes.filter(c => new Date(c.createdAt) >= d); }
    return commandes;
  };

  const commandesPeriode = getCommandesPeriode();
  const commandesPayeesPeriode = commandesPeriode.filter(c => c.statut === 'payé');
  const revenuAirtel = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('airtel')).reduce((sum, c) => sum + parseFloat(c.total), 0);
  const revenuMoov = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('moov')).reduce((sum, c) => sum + parseFloat(c.total), 0);
  const revenuEspeces = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('espece')).reduce((sum, c) => sum + parseFloat(c.total), 0);
  const revenuTotal = revenuAirtel + revenuMoov + revenuEspeces;
  const nbAirtel = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('airtel')).length;
  const nbMoov = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('moov')).length;
  const nbEspeces = commandesPayeesPeriode.filter(c => (c.modePaiement || '').toLowerCase().includes('espece')).length;
  const getPct = (val) => revenuTotal > 0 ? Math.round((val / revenuTotal) * 100) : 0;
  const jourRevenuStats = jourRevenuSelectionne ? getRevenuParModeJour(new Date(jourRevenuSelectionne)) : null;
  const statsCartes = (periodeRevenu === 'semaine' && jourRevenuSelectionne) ? jourRevenuStats : null;
  const revenuAirtelAffiche = statsCartes ? statsCartes.airtel : revenuAirtel;
  const revenuMoovAffiche = statsCartes ? statsCartes.moov : revenuMoov;
  const revenuEspecesAffiche = statsCartes ? statsCartes.especes : revenuEspeces;
  const revenuTotalAffiche = statsCartes ? statsCartes.total : revenuTotal;
  const nbAirtelAffiche = statsCartes ? commandesPayeesPeriode.filter(c => new Date(c.createdAt).toDateString() === jourRevenuSelectionne && (c.modePaiement || '').toLowerCase().includes('airtel')).length : nbAirtel;
  const nbMoovAffiche = statsCartes ? commandesPayeesPeriode.filter(c => new Date(c.createdAt).toDateString() === jourRevenuSelectionne && (c.modePaiement || '').toLowerCase().includes('moov')).length : nbMoov;
  const nbEspecesAffiche = statsCartes ? commandesPayeesPeriode.filter(c => new Date(c.createdAt).toDateString() === jourRevenuSelectionne && (c.modePaiement || '').toLowerCase().includes('espece')).length : nbEspeces;
  const getPctAffiche = (val) => revenuTotalAffiche > 0 ? Math.round((val / revenuTotalAffiche) * 100) : 0;

  const statutCouleur = { 'en attente': '#FFB703', 'en préparation': '#FB8500', 'prêt': '#2D6A4F', 'en livraison': '#0077B6', 'livré': '#2D6A4F', 'payé': '#2D6A4F', 'annulé': '#E63946', 'en attente paiement': '#9C27B0' };
  const statutBadge = (s) => (
    <span style={{ background: statutCouleur[s] || '#888', color: 'white', padding: '0.25rem 0.8rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap', fontFamily: F.corps }}>
      {s}
    </span>
  );

  const Notification = () => {
    if (!notification) return null;
    const estErreur = notification.type === 'error';
    return (
      <div style={{
        background: estErreur ? 'linear-gradient(135deg, #fff0f0, #ffe0e0)' : 'linear-gradient(135deg, #f0faf5, #d4edda)',
        border: '1.5px solid ' + (estErreur ? '#ffd0d0' : '#b7e4c7'),
        borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        color: estErreur ? '#c00' : '#2D6A4F', fontWeight: '700',
        fontFamily: F.corps, fontSize: '0.92rem',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <span>{notification.message}</span>
        <button onClick={() => setNotification(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', opacity: 0.6, fontWeight: '700' }}>✕</button>
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titre}>Dashboard <span style={{ color: '#E63946' }}>Admin</span></h1>
          <p style={styles.refresh}>🔄 Mise a jour automatique toutes les 15s</p>
        </div>
        {statut && (
          <Link to="/admin/horaires" style={{ ...styles.statutPill, background: statut.ouvert ? '#f0faf5' : '#fff0f0', color: statut.ouvert ? '#2D6A4F' : '#E63946', border: '1.5px solid ' + (statut.ouvert ? '#b7e4c7' : '#ffd0d0') }}>
            <span style={{ ...styles.statutDot, background: statut.ouvert ? '#2D6A4F' : '#E63946' }} />
            {statut.ouvert ? 'Ouvert' : 'Ferme'}
            <span style={styles.statutEdit}>Gerer →</span>
          </Link>
        )}
      </div>

      <div style={styles.onglets}>
        {[
          { key: 'overview', label: "📊 Aujourd'hui" },
          { key: 'caisse', label: '💵 Caisse', badge: totalBadgeCaisse },
          { key: 'semaine', label: '📅 Semaine' },
          { key: 'revenus', label: '💰 Revenus' }
        ].map(o => (
          <button key={o.key} style={{ ...styles.onglet, ...(onglet === o.key ? styles.ongletActif : {}), position: 'relative' }} onClick={() => setOnglet(o.key)}>
            {o.label}
            {o.badge > 0 && (
              <span style={{ background: '#9C27B0', color: 'white', borderRadius: '100px', fontSize: '0.65rem', fontWeight: '800', padding: '1px 7px', marginLeft: '0.4rem' }}>
                {o.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa', fontFamily: F.corps }}>Chargement...</div>
      ) : (
        <>
          {onglet === 'overview' && (
            <>
              <div style={styles.statsGrid}>
                {[
                  { num: commandesEnAttente, label: 'En attente', color: '#FFB703', icon: '⏳' },
                  { num: commandesEnLivraison, label: 'En livraison', color: '#0077B6', icon: '🛵' },
                  { num: commandesPayees, label: 'Payees', color: '#2D6A4F', icon: '✅' },
                  { num: commandesAttentesPaiementAujourdhui.length, label: 'Att. caisse', color: '#9C27B0', icon: '💵' },
                  { num: revenusAujourdhui.toLocaleString(), label: "FCFA aujourd'hui", color: '#E63946', icon: '💰' }
                ].map((s, i) => (
                  <div key={i} style={{ ...styles.stat, borderTop: '3px solid ' + s.color }}>
                    <p style={styles.statIcon}>{s.icon}</p>
                    <p style={{ ...styles.statNum, color: s.color }}>{s.num}</p>
                    <p style={styles.statLabel}>{s.label}</p>
                  </div>
                ))}
              </div>
              <h2 style={styles.sectionTitle}>Acces rapide</h2>
              <div style={styles.menuGrid}>
                {[
                  { to: '/admin/commandes', icon: '📋', titre: 'Commandes', sub: commandesAujourdhui.length + " aujourd'hui" },
                  { to: '/admin/pizzas', icon: '🍕', titre: 'Pizzas', sub: pizzas.length + ' au menu' },
                  { to: '/admin/livreurs', icon: '👥', titre: 'Equipe', sub: livreurs.length + ' actifs' },
                  { to: '/admin/horaires', icon: '🕐', titre: 'Horaires', sub: statut ? (statut.ouvert ? 'Ouvert maintenant' : 'Ferme') : 'Gerer les horaires', couleur: statut ? (statut.ouvert ? '#2D6A4F' : '#E63946') : '#555' }
                ].map((m, i) => (
                  <Link key={i} to={m.to} style={styles.menuCard}>
                    <p style={styles.menuIcon}>{m.icon}</p>
                    <h3 style={styles.menuTitre}>{m.titre}</h3>
                    <p style={{ ...styles.menuSub, color: m.couleur || '#888', fontWeight: m.couleur ? '700' : '400' }}>{m.sub}</p>
                  </Link>
                ))}
              </div>
              <h2 style={styles.sectionTitle}>Dernieres commandes du jour</h2>
              {commandesAujourdhui.length === 0 ? (
                <div style={styles.empty}><p style={{ fontSize: '2rem' }}>📋</p><p style={{ marginTop: '0.5rem' }}>Aucune commande aujourd'hui</p></div>
              ) : (
                <div style={styles.tableWrap}>
                  <div style={{ ...styles.tableHeader, gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 44px' }}>
                    <span>Code</span><span>Client</span><span>Livreur</span><span>Total</span><span>Statut</span><span></span>
                  </div>
                  {commandesAujourdhui.map(cmd => (
                    <div key={cmd.id} style={{ ...styles.tableRow, gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 44px' }}>
                      <span style={styles.codeCmd}>#{cmd.codeCommande}</span>
                      <span style={styles.cellTxt}>{cmd.client?.nom || cmd.clientNom || 'Client'}</span>
                      <span style={{ ...styles.cellTxt, color: '#0077B6', fontWeight: '600' }}>{cmd.modeReception === 'livraison' ? '🛵 ' + getNomLivreur(cmd) : '🏪 Retrait'}</span>
                      <span style={{ ...styles.cellTxt, color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</span>
                      <span>{statutBadge(cmd.statut)}</span>
                      <button style={styles.deleteBtn} onClick={() => supprimerCommande(cmd.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {onglet === 'caisse' && (
            <>
              <Notification />

              {remisesEnAttente.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={styles.sectionTitle}>
                    💸 Remises especes <span style={{ color: '#FFB703' }}>a confirmer ({remisesEnAttente.length})</span>
                  </h2>
                  <div style={styles.remiseBanniere}>
                    <span style={{ fontSize: '1.5rem' }}>🛵</span>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {remisesEnAttente.length} livreur(s) vous ont remis des especes
                      </p>
                      <p style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                        Confirmez la reception pour remettre leur solde a zero.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    {remisesEnAttente.map(remise => (
                      <div key={remise.id} style={styles.remiseCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                              <div style={styles.remiseAvatar}>🛵</div>
                              <div>
                                <p style={{ fontWeight: '800', fontSize: '1rem', color: '#1A1A2E' }}>{remise.livreur?.nom || 'Livreur'}</p>
                                <p style={{ color: '#888', fontSize: '0.78rem' }}>📞 {remise.livreur?.telephone || 'Non renseigne'}</p>
                              </div>
                            </div>
                            <p style={{ color: '#888', fontSize: '0.78rem' }}>
                              🕐 {new Date(remise.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {new Date(remise.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.3rem' }}>Montant a recevoir</p>
                            <p style={{ fontWeight: '900', fontSize: '1.6rem', color: '#FFB703', letterSpacing: '-0.02em' }}>
                              {parseFloat(remise.montant).toLocaleString()} FCFA
                            </p>
                          </div>
                        </div>

                        {/* ✅ CONFIRMATION INLINE */}
                        {remiseAConfirmer?.id === remise.id ? (
                          <div style={styles.confirmBox}>
                            <p style={styles.confirmTitre}>⚠️ Confirmer la reception ?</p>
                            <p style={styles.confirmSub}>
                              Vous confirmez avoir recu <strong>{parseFloat(remise.montant).toLocaleString()} FCFA</strong> de <strong>{remise.livreur?.nom}</strong> en especes. Le solde du livreur passera a 0.
                            </p>
                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                              <button
                                style={{ ...styles.confirmerRemiseBtn, flex: 1, marginTop: 0, opacity: loadingConfirm === remise.id ? 0.6 : 1 }}
                                onClick={confirmerRemise}
                                disabled={loadingConfirm === remise.id}
                              >
                                {loadingConfirm === remise.id ? 'Confirmation...' : '✅ Oui, confirmer'}
                              </button>
                              <button
                                style={styles.annulerConfirmBtn}
                                onClick={() => setRemiseAConfirmer(null)}
                                disabled={loadingConfirm === remise.id}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            style={{ ...styles.confirmerRemiseBtn, opacity: loadingConfirm === remise.id ? 0.6 : 1 }}
                            onClick={() => setRemiseAConfirmer(remise)}
                            disabled={loadingConfirm === remise.id}
                          >
                            ✅ Confirmer la reception de {parseFloat(remise.montant).toLocaleString()} FCFA
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={styles.separateur} />
                </div>
              )}

              <h2 style={styles.sectionTitle}>
                Paiements <span style={{ color: '#9C27B0' }}>Especes a valider</span>
              </h2>
              <div style={styles.searchBar}>
                <span>🔍</span>
                <input
                  style={styles.searchInput}
                  type="text"
                  placeholder="Rechercher par code BZ..."
                  value={rechercheCaisse}
                  onChange={e => setRechercheCaisse(e.target.value.toUpperCase())}
                />
                {rechercheCaisse && <button style={styles.clearBtn} onClick={() => setRechercheCaisse('')}>✕</button>}
              </div>
              {commandesAttentesPaiementFiltrees.length === 0 ? (
                <div style={styles.empty}>
                  <p style={{ fontSize: '3rem' }}>{commandesAttentesPaiement.length === 0 ? '✅' : '🔍'}</p>
                  <p style={{ marginTop: '0.5rem' }}>
                    {commandesAttentesPaiement.length === 0 ? 'Aucun paiement en attente' : 'Aucun resultat pour "' + rechercheCaisse + '"'}
                  </p>
                  {commandesAttentesPaiement.length === 0 && (
                    <p style={{ fontSize: '0.85rem', color: '#bbb', marginTop: '0.3rem' }}>Toutes les commandes especes ont ete validees</p>
                  )}
                </div>
              ) : (
                <>
                  <div style={styles.caisseBanniere}>
                    <span style={{ fontSize: '1.5rem' }}>💵</span>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                        {commandesAttentesPaiementFiltrees.length} commande(s) en attente de paiement especes
                      </p>
                      <p style={{ fontSize: '0.82rem', opacity: 0.85 }}>
                        Le client a paye a la caisse ? Cliquez sur "Valider le paiement" pour confirmer.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {commandesAttentesPaiementFiltrees.map(cmd => (
                      <div key={cmd.id} style={{ ...styles.caisseCard, borderLeft: '4px solid #9C27B0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ fontFamily: F.titre, fontSize: '1.2rem', color: '#0d0d0d', marginBottom: '0.3rem' }}>#{cmd.codeCommande}</h3>
                            <p style={{ color: '#aaa', fontSize: '0.8rem', fontFamily: F.corps }}>
                              📅 {new Date(cmd.createdAt).toLocaleDateString('fr-FR')} à {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span style={{ background: '#9C27B0', color: 'white', padding: '0.3rem 0.9rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: '700', fontFamily: F.corps }}>
                            💵 Att. paiement
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.8rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ color: '#bbb', fontSize: '0.7rem', fontFamily: F.corps, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Client</p>
                            <p style={{ fontWeight: '600', color: '#333', fontFamily: F.corps, fontSize: '0.88rem' }}>👤 {cmd.client?.nom || cmd.clientNom || 'Client'}</p>
                          </div>
                          <div>
                            <p style={{ color: '#bbb', fontSize: '0.7rem', fontFamily: F.corps, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Mode</p>
                            <p style={{ fontWeight: '600', color: '#333', fontFamily: F.corps, fontSize: '0.88rem' }}>🏪 Retrait</p>
                          </div>
                          <div>
                            <p style={{ color: '#bbb', fontSize: '0.7rem', fontFamily: F.corps, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Paiement</p>
                            <p style={{ fontWeight: '600', color: '#333', fontFamily: F.corps, fontSize: '0.88rem' }}>💵 Especes</p>
                          </div>
                          <div>
                            <p style={{ color: '#bbb', fontSize: '0.7rem', fontFamily: F.corps, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Total</p>
                            <p style={{ fontWeight: '800', color: '#E63946', fontFamily: F.corps, fontSize: '1.1rem' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p>
                          </div>
                        </div>
                        {cmd.items && cmd.items.length > 0 && (
                          <div style={{ background: '#fffbf0', borderRadius: '12px', padding: '0.8rem', marginBottom: '1rem', border: '1px solid #ffe0a0' }}>
                            {cmd.items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
                                <span style={{ fontFamily: F.corps, fontSize: '0.88rem' }}>🍕 {item.nom}</span>
                                <span style={{ background: '#FFB703', color: 'white', borderRadius: '100px', padding: '0.1rem 0.5rem', fontWeight: '700', fontSize: '0.72rem', fontFamily: F.corps }}>x{item.quantite}</span>
                                <span style={{ color: '#E63946', fontWeight: '700', fontFamily: F.corps, fontSize: '0.88rem' }}>{(item.prix * item.quantite).toLocaleString()} FCFA</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button style={styles.validerBtn} onClick={() => validerPaiementEspeces(cmd.id)}>
                          ✅ Valider le paiement — {parseFloat(cmd.total).toLocaleString()} FCFA recu
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {onglet === 'semaine' && (
            <>
              <h2 style={styles.sectionTitle}>Historique des 7 derniers jours</h2>
              <div style={styles.graphCard}>
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
                          <div style={{ ...styles.bar, height: Math.max(hauteur, 5) + '%', background: estSelectionne ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E', opacity: estSelectionne ? 1 : 0.75 }} />
                        </div>
                        <p style={{ ...styles.barLabel, color: estSelectionne ? '#E63946' : '#888', fontWeight: estSelectionne ? '800' : '500' }}>{JOURS[date.getDay()].substring(0, 3)}</p>
                        <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <h2 style={styles.sectionTitle}>{JOURS[new Date(jourSelectionne).getDay()]} {new Date(jourSelectionne).toLocaleDateString('fr-FR')}</h2>
              <div style={styles.statsGrid}>
                {[
                  { num: statsJourSelectionne.total, label: 'Commandes', color: '#E63946' },
                  { num: statsJourSelectionne.revenu.toLocaleString(), label: 'FCFA encaisses', color: '#2D6A4F' },
                  { num: statsJourSelectionne.commandes.filter(c => ['livré', 'payé'].includes(c.statut)).length, label: 'Livrees', color: '#0077B6' },
                  { num: statsJourSelectionne.commandes.filter(c => c.statut === 'annulé').length, label: 'Annulees', color: '#FFB703' }
                ].map((s, i) => (
                  <div key={i} style={{ ...styles.stat, borderTop: '3px solid ' + s.color }}>
                    <p style={{ ...styles.statNum, color: s.color }}>{s.num}</p>
                    <p style={styles.statLabel}>{s.label}</p>
                  </div>
                ))}
              </div>
              {statsJourSelectionne.commandes.length > 0 && (
                <div style={styles.tableWrap}>
                  <div style={{ ...styles.tableHeader, gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1fr 44px' }}>
                    <span>Code</span><span>Client</span><span>Livreur</span><span>Total</span><span>Statut</span><span>Heure</span><span></span>
                  </div>
                  {statsJourSelectionne.commandes.map(cmd => (
                    <div key={cmd.id} style={{ ...styles.tableRow, gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1fr 44px' }}>
                      <span style={styles.codeCmd}>#{cmd.codeCommande}</span>
                      <span style={styles.cellTxt}>{cmd.client?.nom || cmd.clientNom || 'Client'}</span>
                      <span style={{ ...styles.cellTxt, color: '#0077B6', fontWeight: '600' }}>{cmd.modeReception === 'livraison' ? '🛵 ' + getNomLivreur(cmd) : '🏪 Retrait'}</span>
                      <span style={{ ...styles.cellTxt, color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</span>
                      <span>{statutBadge(cmd.statut)}</span>
                      <span style={{ color: '#aaa', fontSize: '0.78rem', fontFamily: F.corps }}>{new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button style={styles.deleteBtn} onClick={() => supprimerCommande(cmd.id)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {onglet === 'revenus' && (
            <>
              <h2 style={styles.sectionTitle}>Revenus par <span style={{ color: '#E63946' }}>mode de paiement</span></h2>
              <div style={styles.periodeSwitch}>
                {[{ key: 'aujourd', label: "Aujourd'hui" }, { key: 'semaine', label: '7 derniers jours' }, { key: 'mois', label: '30 derniers jours' }].map(p => (
                  <button key={p.key} style={{ ...styles.periodeBtn, ...(periodeRevenu === p.key ? styles.periodeBtnActif : {}) }}
                    onClick={() => { setPeriodeRevenu(p.key); setJourRevenuSelectionne(null); }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={styles.totalGlobal}>
                <p style={styles.totalGlobalLabel}>
                  Total encaisse — {periodeRevenu === 'aujourd' ? "Aujourd'hui" : periodeRevenu === 'semaine' ? (jourRevenuSelectionne ? new Date(jourRevenuSelectionne).toLocaleDateString('fr-FR') : '7 derniers jours') : '30 derniers jours'}
                </p>
                <p style={styles.totalGlobalVal}>{revenuTotalAffiche.toLocaleString()} FCFA</p>
                <p style={styles.totalGlobalSub}>
                  {statsCartes ? statsCartes.nb : commandesPayeesPeriode.length} commande(s) payee(s)
                  {jourRevenuSelectionne && periodeRevenu === 'semaine' && (
                    <span style={{ marginLeft: '0.8rem', cursor: 'pointer', textDecoration: 'underline', opacity: 0.7 }} onClick={() => setJourRevenuSelectionne(null)}>← Voir les 7 jours</span>
                  )}
                </p>
              </div>

              {periodeRevenu === 'semaine' && (
                <div style={styles.graphCard}>
                  <p style={{ fontFamily: F.titre, fontWeight: '700', fontSize: '1rem', color: '#0d0d0d', marginBottom: '0.3rem' }}>Revenus par jour</p>
                  <p style={{ fontFamily: F.corps, fontSize: '0.78rem', color: '#aaa', marginBottom: '1rem' }}>Cliquez sur un jour pour voir ses stats en detail</p>
                  <div style={styles.barChart}>
                    {derniers7Jours.map((date, i) => {
                      const r = getRevenuParModeJour(date);
                      const hauteur = (r.total / max7JoursRevenu) * 100;
                      const estSel = jourRevenuSelectionne === date.toDateString();
                      const estAujourdhui = date.toDateString() === aujourd;
                      return (
                        <div key={i} style={styles.barWrapper} onClick={() => setJourRevenuSelectionne(estSel ? null : date.toDateString())}>
                          <p style={styles.barValue}>{r.total > 0 ? (r.total / 1000).toFixed(0) + 'k' : '0'}</p>
                          <div style={styles.barContainer}>
                            <div style={{ ...styles.bar, height: Math.max(hauteur, 5) + '%', background: estSel ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E', opacity: estSel ? 1 : 0.75 }} />
                          </div>
                          <p style={{ ...styles.barLabel, color: estSel ? '#E63946' : '#888', fontWeight: estSel ? '800' : '500' }}>{JOURS[date.getDay()].substring(0, 3)}</p>
                          <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
                        </div>
                      );
                    })}
                  </div>
                  {jourRevenuSelectionne && jourRevenuStats && (
                    <div style={styles.jourDetail}>
                      <p style={styles.jourDetailTitre}>📅 {JOURS[new Date(jourRevenuSelectionne).getDay()]} {new Date(jourRevenuSelectionne).toLocaleDateString('fr-FR')} — {jourRevenuStats.nb} commande(s)</p>
                      <div style={styles.jourDetailGrid}>
                        {[{ label: 'Airtel Money', val: jourRevenuStats.airtel, color: '#E63946', logo: '/images/airtel.png' }, { label: 'Moov Money', val: jourRevenuStats.moov, color: '#0077B6', logo: '/images/moov.png' }, { label: 'Especes', val: jourRevenuStats.especes, color: '#2D6A4F', emoji: '💵' }].map((m, i) => (
                          <div key={i} style={styles.jourDetailItem}>
                            {m.logo ? <img src={m.logo} alt={m.label} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }} /> : <span>{m.emoji}</span>}
                            <span style={{ fontFamily: F.corps, fontSize: '0.85rem', fontWeight: '600' }}>{m.label}</span>
                            <span style={{ fontFamily: F.corps, fontSize: '0.85rem', color: m.color, fontWeight: '800', marginLeft: 'auto' }}>{m.val.toLocaleString()} FCFA</span>
                          </div>
                        ))}
                        <div style={{ ...styles.jourDetailItem, borderTop: '1.5px solid #e8e8ed', paddingTop: '0.6rem', marginTop: '0.3rem' }}>
                          <span style={{ fontFamily: F.titre, fontWeight: '700' }}>Total</span>
                          <span style={{ fontFamily: F.corps, fontWeight: '900', color: '#FFB703', marginLeft: 'auto' }}>{jourRevenuStats.total.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {periodeRevenu === 'mois' && (
                <div style={styles.graphCard}>
                  <p style={{ fontFamily: F.titre, fontWeight: '700', fontSize: '1rem', color: '#0d0d0d', marginBottom: '0.3rem' }}>Bilan 30 jours</p>
                  <p style={{ fontFamily: F.corps, fontSize: '0.78rem', color: '#aaa', marginBottom: '1rem' }}>Cliquez sur un jour pour voir ses stats en detail</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '0.15rem', marginBottom: '0.5rem' }}>
                    {derniers30Jours.map((date, i) => {
                      const r = getRevenuParModeJour(date);
                      const hauteur = (r.total / max30JoursRevenu) * 100;
                      const estSel = jourRevenuSelectionne === date.toDateString();
                      const estAujourdhui = date.toDateString() === aujourd;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 }} onClick={() => setJourRevenuSelectionne(estSel ? null : date.toDateString())}>
                          <div style={{ width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div style={{ width: '70%', borderRadius: '3px 3px 0 0', minHeight: '3px', height: Math.max(hauteur, 3) + '%', background: estSel ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E', opacity: estSel ? 1 : 0.7, transition: 'all 0.3s' }} />
                          </div>
                          <p style={{ fontSize: '0.55rem', color: estSel ? '#E63946' : '#ccc', fontFamily: F.corps, marginTop: '0.2rem' }}>{date.getDate()}</p>
                        </div>
                      );
                    })}
                  </div>
                  {jourRevenuSelectionne && jourRevenuStats && (
                    <div style={styles.jourDetail}>
                      <p style={styles.jourDetailTitre}>📅 {new Date(jourRevenuSelectionne).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {jourRevenuStats.nb} commande(s)</p>
                      <div style={styles.jourDetailGrid}>
                        {[{ label: 'Airtel Money', val: jourRevenuStats.airtel, color: '#E63946', logo: '/images/airtel.png' }, { label: 'Moov Money', val: jourRevenuStats.moov, color: '#0077B6', logo: '/images/moov.png' }, { label: 'Especes', val: jourRevenuStats.especes, color: '#2D6A4F', emoji: '💵' }].map((m, i) => (
                          <div key={i} style={styles.jourDetailItem}>
                            {m.logo ? <img src={m.logo} alt={m.label} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }} /> : <span>{m.emoji}</span>}
                            <span style={{ fontFamily: F.corps, fontSize: '0.85rem', fontWeight: '600' }}>{m.label}</span>
                            <span style={{ fontFamily: F.corps, fontSize: '0.85rem', color: m.color, fontWeight: '800', marginLeft: 'auto' }}>{m.val.toLocaleString()} FCFA</span>
                          </div>
                        ))}
                        <div style={{ ...styles.jourDetailItem, borderTop: '1.5px solid #e8e8ed', paddingTop: '0.6rem', marginTop: '0.3rem' }}>
                          <span style={{ fontFamily: F.titre, fontWeight: '700' }}>Total</span>
                          <span style={{ fontFamily: F.corps, fontWeight: '900', color: '#FFB703', marginLeft: 'auto' }}>{jourRevenuStats.total.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1.5px solid #f0f0f0' }}>
                    <p style={{ fontFamily: F.titre, fontWeight: '700', fontSize: '0.95rem', color: '#0d0d0d', marginBottom: '1rem' }}>Recap mensuel par mode de paiement</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                      {[{ label: 'Airtel Money', val: revenuAirtel, nb: nbAirtel, color: '#E63946', logo: '/images/airtel.png' }, { label: 'Moov Money', val: revenuMoov, nb: nbMoov, color: '#0077B6', logo: '/images/moov.png' }, { label: 'Especes', val: revenuEspeces, nb: nbEspeces, color: '#2D6A4F', emoji: '💵' }].map((m, i) => (
                        <div key={i} style={{ background: '#f9f9f9', borderRadius: '14px', padding: '1rem', textAlign: 'center', border: '1.5px solid #e8e8ed' }}>
                          {m.logo ? <img src={m.logo} alt={m.label} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'contain', marginBottom: '0.5rem' }} /> : <p style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{m.emoji}</p>}
                          <p style={{ fontFamily: F.corps, fontSize: '0.72rem', color: '#888', marginBottom: '0.3rem' }}>{m.label}</p>
                          <p style={{ fontFamily: F.corps, fontWeight: '900', fontSize: '1rem', color: m.color }}>{m.val.toLocaleString()} FCFA</p>
                          <p style={{ fontFamily: F.corps, fontSize: '0.65rem', color: '#bbb', marginTop: '0.2rem' }}>{m.nb} cmd — {getPct(m.val)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {periodeRevenu !== 'mois' && (
                <div style={styles.revenuGrid}>
                  <div style={styles.revenuCard}>
                    <div style={styles.revenuCardHeader}><img src="/images/airtel.png" alt="Airtel" style={styles.revenuLogo} /><div><p style={styles.revenuNom}>Airtel Money</p><p style={styles.revenuNb}>{nbAirtelAffiche} commande(s)</p></div></div>
                    <p style={styles.revenuMontant}>{revenuAirtelAffiche.toLocaleString()} <span style={styles.revenuFcfa}>FCFA</span></p>
                    <div style={styles.barreProgres}><div style={{ ...styles.barreProgresInner, width: getPctAffiche(revenuAirtelAffiche) + '%', background: '#E63946' }} /></div>
                    <p style={styles.revenuPct}>{getPctAffiche(revenuAirtelAffiche)}% du total</p>
                  </div>
                  <div style={styles.revenuCard}>
                    <div style={styles.revenuCardHeader}><img src="/images/moov.png" alt="Moov" style={styles.revenuLogo} /><div><p style={styles.revenuNom}>Moov Money</p><p style={styles.revenuNb}>{nbMoovAffiche} commande(s)</p></div></div>
                    <p style={styles.revenuMontant}>{revenuMoovAffiche.toLocaleString()} <span style={styles.revenuFcfa}>FCFA</span></p>
                    <div style={styles.barreProgres}><div style={{ ...styles.barreProgresInner, width: getPctAffiche(revenuMoovAffiche) + '%', background: '#0077B6' }} /></div>
                    <p style={styles.revenuPct}>{getPctAffiche(revenuMoovAffiche)}% du total</p>
                  </div>
                  <div style={styles.revenuCard}>
                    <div style={styles.revenuCardHeader}><div style={styles.especesIconGrand}>💵</div><div><p style={styles.revenuNom}>Especes</p><p style={styles.revenuNb}>{nbEspecesAffiche} commande(s)</p></div></div>
                    <p style={styles.revenuMontant}>{revenuEspecesAffiche.toLocaleString()} <span style={styles.revenuFcfa}>FCFA</span></p>
                    <div style={styles.barreProgres}><div style={{ ...styles.barreProgresInner, width: getPctAffiche(revenuEspecesAffiche) + '%', background: '#2D6A4F' }} /></div>
                    <p style={styles.revenuPct}>{getPctAffiche(revenuEspecesAffiche)}% du total</p>
                  </div>
                </div>
              )}

              {periodeRevenu !== 'mois' && (
                <>
                  <h2 style={{ ...styles.sectionTitle, marginTop: '1rem' }}>Detail des paiements</h2>
                  <div style={styles.tableWrap}>
                    <div style={{ ...styles.tableHeader, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                      <span>Code</span><span>Client</span><span>Paiement</span><span>Total</span><span>Date</span>
                    </div>
                    {commandesPayeesPeriode.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontFamily: F.corps }}>Aucun paiement sur cette periode</div>
                    ) : (
                      commandesPayeesPeriode.map(cmd => {
                        const mp = (cmd.modePaiement || '').toLowerCase();
                        return (
                          <div key={cmd.id} style={{ ...styles.tableRow, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
                            <span style={styles.codeCmd}>#{cmd.codeCommande}</span>
                            <span style={styles.cellTxt}>{cmd.client?.nom || cmd.clientNom || 'Client'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {mp.includes('airtel') && <img src="/images/airtel.png" alt="Airtel" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }} />}
                              {mp.includes('moov') && <img src="/images/moov.png" alt="Moov" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'contain' }} />}
                              {mp.includes('espece') && <span>💵</span>}
                              <span style={styles.cellTxt}>{cmd.modePaiement}</span>
                            </span>
                            <span style={{ ...styles.cellTxt, color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</span>
                            <span style={{ color: '#aaa', fontSize: '0.78rem', fontFamily: F.corps }}>{new Date(cmd.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: '1200px', margin: '0 auto', padding: 'clamp(5rem, 10vw, 6rem) 2rem 4rem', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  titre: { fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '0.4rem' },
  refresh: { color: '#aaa', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" },
  statutPill: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '700', fontFamily: "'Inter', sans-serif", textDecoration: 'none', transition: 'all 0.2s ease' },
  statutDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  statutEdit: { color: 'inherit', opacity: 0.6, fontSize: '0.78rem', marginLeft: '0.3rem' },
  onglets: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' },
  onglet: { background: 'white', border: '1.5px solid #e8e8ed', padding: '0.65rem 1.3rem', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: '#555', transition: 'all 0.2s ease' },
  ongletActif: { background: '#E63946', border: '1.5px solid #E63946', color: 'white', boxShadow: '0 4px 12px rgba(230,57,70,0.25)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  stat: { background: 'white', borderRadius: '16px', padding: '1.4rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'all 0.25s ease' },
  statIcon: { fontSize: '1.5rem', marginBottom: '0.5rem' },
  statNum: { fontSize: '1.9rem', fontWeight: '900', color: '#0d0d0d', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' },
  statLabel: { color: '#888', marginTop: '0.3rem', fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', color: '#0d0d0d', marginBottom: '1rem', fontWeight: '700', letterSpacing: '-0.01em' },
  menuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  menuCard: { background: 'white', borderRadius: '20px', padding: '1.8rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textDecoration: 'none', color: '#0d0d0d', textAlign: 'center', transition: 'all 0.25s ease', border: '1.5px solid #f0f0f0' },
  menuIcon: { fontSize: '2.5rem', marginBottom: '0.8rem' },
  menuTitre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.3rem', color: '#0d0d0d' },
  menuSub: { fontSize: '0.82rem', fontFamily: "'Inter', sans-serif" },
  empty: { background: 'white', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', color: '#aaa', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '1rem', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem' },
  graphCard: { background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '2rem' },
  barChart: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '160px', gap: '0.4rem' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 },
  barValue: { fontSize: '0.78rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '0.3rem', fontFamily: "'Inter', sans-serif" },
  barContainer: { width: '100%', height: '110px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '55%', borderRadius: '8px 8px 0 0', transition: 'all 0.35s ease', minHeight: '4px' },
  barLabel: { fontSize: '0.75rem', marginTop: '0.4rem', fontFamily: "'Inter', sans-serif" },
  barDate: { fontSize: '0.65rem', color: '#bbb', fontFamily: "'Inter', sans-serif" },
  tableWrap: { background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '2rem', overflowX: 'auto' },
  tableHeader: { display: 'grid', padding: '0.9rem 1.5rem', background: '#0d0d0d', color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '0.75rem', fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em', textTransform: 'uppercase' },
  tableRow: { display: 'grid', padding: '0.9rem 1.5rem', borderBottom: '1px solid #f5f5f7', alignItems: 'center', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", transition: 'background 0.2s' },
  codeCmd: { fontWeight: '800', color: '#0d0d0d', fontFamily: 'Georgia, serif', fontSize: '0.9rem' },
  cellTxt: { color: '#444', fontSize: '0.85rem' },
  deleteBtn: { background: '#fff0f0', color: '#c00', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s ease' },
  addBtn: { background: '#E63946', color: 'white', padding: '0.65rem 1.4rem', borderRadius: '100px', textDecoration: 'none', fontWeight: '700', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(230,57,70,0.22)' },
  periodeSwitch: { display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' },
  periodeBtn: { background: 'white', border: '1.5px solid #e8e8ed', padding: '0.6rem 1.2rem', borderRadius: '100px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: '#555', transition: 'all 0.2s ease' },
  periodeBtnActif: { background: '#0d0d0d', border: '1.5px solid #0d0d0d', color: 'white' },
  totalGlobal: { background: 'linear-gradient(135deg, #1a1a2e, #2d1a1a)', borderRadius: '20px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem', color: 'white' },
  totalGlobalLabel: { fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' },
  totalGlobalVal: { fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '900', color: '#FFB703', letterSpacing: '-0.02em' },
  totalGlobalSub: { fontFamily: "'Inter', sans-serif", fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' },
  revenuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem', marginBottom: '2rem' },
  revenuCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #f0f0f0' },
  revenuCardHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' },
  revenuLogo: { width: '48px', height: '48px', borderRadius: '12px', objectFit: 'contain', border: '1px solid #e8e8ed', padding: '4px', background: 'white', flexShrink: 0 },
  especesIconGrand: { width: '48px', height: '48px', borderRadius: '12px', background: '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '1px solid #b7e4c7', flexShrink: 0 },
  revenuNom: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '1rem', color: '#0d0d0d' },
  revenuNb: { fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', color: '#aaa', marginTop: '0.2rem' },
  revenuMontant: { fontFamily: "'Inter', sans-serif", fontWeight: '900', fontSize: '1.8rem', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '1rem' },
  revenuFcfa: { fontSize: '0.9rem', fontWeight: '500', color: '#aaa' },
  barreProgres: { height: '8px', background: '#f0f0f0', borderRadius: '100px', marginBottom: '0.5rem', overflow: 'hidden' },
  barreProgresInner: { height: '100%', borderRadius: '100px', transition: 'width 0.5s ease' },
  revenuPct: { fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', color: '#888', fontWeight: '600' },
  jourDetail: { background: '#f9f9f9', borderRadius: '14px', padding: '1.2rem', marginTop: '1.2rem', border: '1.5px solid #e8e8ed' },
  jourDetailTitre: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '0.9rem', color: '#0d0d0d', marginBottom: '0.8rem' },
  jourDetailGrid: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  jourDetailItem: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0' },
  searchBar: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '0.7rem 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #e0e0e0', gap: '0.8rem', marginBottom: '1.5rem' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', fontWeight: '600', fontFamily: "'Inter', sans-serif" },
  clearBtn: { background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700' },
  caisseBanniere: { background: 'linear-gradient(135deg, #f3e5f5, #ede7f6)', border: '1.5px solid #ce93d8', borderRadius: '16px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#6a1b9a' },
  caisseCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  validerBtn: { background: 'linear-gradient(135deg, #2D6A4F, #40916c)', color: 'white', border: 'none', padding: '1rem 1.5rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 6px 18px rgba(45,106,79,0.28)', transition: 'all 0.25s ease' },
  remiseBanniere: { background: 'linear-gradient(135deg, #fffbf0, #fff8e7)', border: '1.5px solid #FFB703', borderRadius: '16px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: '#b37a00' },
  remiseCard: { background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1.5px solid #FFB703' },
  remiseAvatar: { width: '44px', height: '44px', borderRadius: '50%', background: '#fff8e7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: '1.5px solid #FFB703', flexShrink: 0 },
  confirmerRemiseBtn: { background: 'linear-gradient(135deg, #FFB703, #f59e00)', color: '#1A1A2E', border: 'none', padding: '1rem 1.5rem', borderRadius: '100px', fontWeight: '800', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 6px 18px rgba(255,183,3,0.35)', marginTop: '1rem', transition: 'all 0.25s ease' },
  separateur: { height: '1.5px', background: '#e8e8ed', margin: '0 0 2rem 0', borderRadius: '100px' },
  confirmBox: { background: 'linear-gradient(135deg, #fffbf0, #fff8e7)', border: '1.5px solid #FFB703', borderRadius: '14px', padding: '1rem 1.2rem', marginTop: '1rem' },
  confirmTitre: { fontWeight: '800', fontSize: '0.95rem', color: '#b37a00', marginBottom: '0.4rem', fontFamily: 'Georgia, serif' },
  confirmSub: { fontSize: '0.85rem', color: '#666', lineHeight: '1.6', fontFamily: "'Inter', sans-serif" },
  annulerConfirmBtn: { background: '#f0f0f0', color: '#333', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '100px', fontWeight: '600', cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }
};

export default Dashboard;