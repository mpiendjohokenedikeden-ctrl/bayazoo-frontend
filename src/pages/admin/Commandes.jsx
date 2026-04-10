import React, { useEffect, useState } from 'react';
import { getAllOrders, deleteOrder } from '../../services/orderService';
import api from '../../services/api';

const F = {
  titre: 'Georgia, serif',
  corps: "'Inter', -apple-system, sans-serif"
};

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const statutCouleur = {
  'en attente': '#FFB703',
  'en préparation': '#FB8500',
  'prêt': '#2D6A4F',
  'en livraison': '#0077B6',
  'livré': '#2D6A4F',
  'payé': '#2D6A4F',
  'annulé': '#E63946'
};

const statutEmoji = {
  'en attente': '⏳',
  'en préparation': '👨‍🍳',
  'prêt': '✅',
  'en livraison': '🛵',
  'livré': '✅',
  'payé': '💰',
  'annulé': '❌'
};

const Commandes = () => {
  const [commandes, setCommandes] = useState([]);
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [jourSelectionne, setJourSelectionne] = useState(new Date().toDateString());

  useEffect(() => {
    chargerDonnees();
    const interval = setInterval(chargerDonnees, 15000);
    return () => clearInterval(interval);
  }, []);

  const chargerDonnees = async () => {
    try {
      const [cmd, liv] = await Promise.all([
        getAllOrders(),
        api.get('/auth/livreurs')
      ]);
      setCommandes(cmd.data);
      setLivreurs(liv.data);
    } catch (err) {}
    setLoading(false);
  };

  const supprimerCommande = async (id) => {
    if (window.confirm('Supprimer cette commande ?\nCette action est irreversible.')) {
      await deleteOrder(id);
      chargerDonnees();
      if (commandeSelectionnee?.id === id) setCommandeSelectionnee(null);
    }
  };

  const getNomLivreur = (cmd) => {
    if (cmd.livreur?.nom) return cmd.livreur.nom;
    if (cmd.livreurNom) return cmd.livreurNom;
    if (cmd.livreurId) {
      const l = livreurs.find(l => parseInt(l.id) === parseInt(cmd.livreurId));
      return l ? l.nom : 'Livreur #' + cmd.livreurId;
    }
    return null;
  };

  const getTelLivreur = (cmd) => {
    if (cmd.livreur?.telephone) return cmd.livreur.telephone;
    if (cmd.livreurId) {
      const l = livreurs.find(l => parseInt(l.id) === parseInt(cmd.livreurId));
      return l?.telephone || null;
    }
    return null;
  };

  const aujourd = new Date().toDateString();

  const getDerniers7Jours = () => {
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      jours.push(date);
    }
    return jours;
  };

  const derniers7Jours = getDerniers7Jours();

  const getCommandesJour = (date) => {
    const dateStr = date.toDateString();
    return commandes.filter(c => new Date(c.createdAt).toDateString() === dateStr);
  };

  const maxCommandes = Math.max(...derniers7Jours.map(j => getCommandesJour(j).length), 1);
  const commandesJourSelectionne = getCommandesJour(new Date(jourSelectionne));
  const commandesAujourdhui = getCommandesJour(new Date());

  const stats = {
    tous: commandesJourSelectionne.length,
    'en attente': commandesJourSelectionne.filter(c => c.statut === 'en attente').length,
    'en préparation': commandesJourSelectionne.filter(c => c.statut === 'en préparation').length,
    'prêt': commandesJourSelectionne.filter(c => c.statut === 'prêt').length,
    'en livraison': commandesJourSelectionne.filter(c => c.statut === 'en livraison').length,
    'payé': commandesJourSelectionne.filter(c => c.statut === 'payé').length,
  };

  const commandesFiltrees = commandesJourSelectionne.filter(cmd => {
    const matchStatut = filtreStatut === 'tous' || cmd.statut === filtreStatut;
    const matchRecherche = recherche === '' ||
      cmd.codeCommande?.toLowerCase().includes(recherche.toLowerCase()) ||
      (cmd.client?.nom || cmd.clientNom || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (cmd.client?.telephone || cmd.clientTel || '').includes(recherche) ||
      (cmd.adresseLivraison || '').toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  const ouvrirMaps = (cmd) => {
    try {
      const loc = typeof cmd.localisation === 'string' ? JSON.parse(cmd.localisation) : cmd.localisation;
      if (loc?.lat) window.open('https://www.google.com/maps?q=' + loc.lat + ',' + loc.lng, '_blank');
      else if (cmd.adresseLivraison) window.open('https://www.google.com/maps/search/' + encodeURIComponent(cmd.adresseLivraison), '_blank');
    } catch {
      if (cmd.adresseLivraison) window.open('https://www.google.com/maps/search/' + encodeURIComponent(cmd.adresseLivraison), '_blank');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.titre}>Gestion <span style={{ color: '#E63946' }}>Commandes</span></h1>
        <p style={styles.sousTitre}>
          {commandes.length} commandes au total · {commandesAujourdhui.length} aujourd'hui
        </p>
      </div>

      {/* STATS DU JOUR SELECTIONNE */}
      <p style={styles.sectionLabel}>
        📅 {jourSelectionne === aujourd ? "Aujourd'hui" : JOURS[new Date(jourSelectionne).getDay()] + ' ' + new Date(jourSelectionne).toLocaleDateString('fr-FR')}
      </p>
      <div style={styles.statsGrid}>
        {[
          { key: 'en attente', label: 'En attente', color: '#FFB703', icon: '⏳' },
          { key: 'en préparation', label: 'En prep', color: '#FB8500', icon: '👨‍🍳' },
          { key: 'prêt', label: 'Pretes', color: '#2D6A4F', icon: '✅' },
          { key: 'en livraison', label: 'En livraison', color: '#0077B6', icon: '🛵' },
          { key: 'payé', label: 'Payees', color: '#2D6A4F', icon: '💰' },
        ].map(s => (
          <div
            key={s.key}
            style={{
              ...styles.stat,
              borderTop: '3px solid ' + s.color,
              background: filtreStatut === s.key ? s.color + '12' : 'white'
            }}
            onClick={() => setFiltreStatut(filtreStatut === s.key ? 'tous' : s.key)}
          >
            <p style={styles.statIcon}>{s.icon}</p>
            <p style={{ ...styles.statNum, color: s.color }}>{stats[s.key]}</p>
            <p style={styles.statLabel}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* GRAPHIQUE 7 JOURS */}
      <div style={styles.graphCard}>
        <p style={styles.graphTitre}>Historique des 7 derniers jours</p>
        <div style={styles.barChart}>
          {derniers7Jours.map((date, i) => {
            const cmds = getCommandesJour(date);
            const hauteur = (cmds.length / maxCommandes) * 100;
            const estSelectionne = date.toDateString() === jourSelectionne;
            const estAujourdhui = date.toDateString() === aujourd;
            return (
              <div key={i} style={styles.barWrapper} onClick={() => {
                setJourSelectionne(date.toDateString());
                setFiltreStatut('tous');
                setRecherche('');
              }}>
                <p style={styles.barValue}>{cmds.length}</p>
                <div style={styles.barContainer}>
                  <div style={{
                    ...styles.bar,
                    height: Math.max(hauteur, 5) + '%',
                    background: estSelectionne ? '#E63946' : estAujourdhui ? '#FFB703' : '#1a1a2e',
                    opacity: estSelectionne ? 1 : 0.75
                  }} />
                </div>
                <p style={{ ...styles.barLabel, color: estSelectionne ? '#E63946' : '#888', fontWeight: estSelectionne ? '800' : '500' }}>
                  {JOURS[date.getDay()].substring(0, 3)}
                </p>
                <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: 'center', color: '#bbb', fontSize: '0.75rem', marginTop: '0.5rem', fontFamily: F.corps }}>
          Cliquez sur un jour pour voir ses commandes
        </p>
      </div>

      {/* BOUTON REVENIR AUJOURD'HUI */}
      {jourSelectionne !== aujourd && (
        <div style={styles.jourSelectionneInfo}>
          <p style={{ fontFamily: F.titre, fontWeight: '700', color: '#0d0d0d' }}>
            {JOURS[new Date(jourSelectionne).getDay()]} {new Date(jourSelectionne).toLocaleDateString('fr-FR')}
          </p>
          <p style={{ fontFamily: F.corps, color: '#888', fontSize: '0.85rem' }}>
            {commandesJourSelectionne.length} commande(s) ce jour
          </p>
          <button style={styles.resetJourBtn} onClick={() => {
            setJourSelectionne(aujourd);
            setFiltreStatut('tous');
          }}>
            Revenir à aujourd'hui
          </button>
        </div>
      )}

      {/* RECHERCHE + FILTRE */}
      <div style={styles.searchRow}>
        <div style={styles.searchBar}>
          <span style={{ color: '#bbb' }}>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Code, client, adresse..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          {recherche && (
            <button style={styles.clearBtn} onClick={() => setRecherche('')}>✕</button>
          )}
        </div>
        <select style={styles.selectStatut} value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
          <option value="tous">Tous ({stats.tous})</option>
          <option value="en attente">En attente ({stats['en attente']})</option>
          <option value="en préparation">En preparation ({stats['en préparation']})</option>
          <option value="prêt">Pretes ({stats['prêt']})</option>
          <option value="en livraison">En livraison ({stats['en livraison']})</option>
          <option value="payé">Payees ({stats['payé']})</option>
        </select>
      </div>

      <p style={styles.count}>{commandesFiltrees.length} commande(s) affichee(s)</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa', fontFamily: F.corps }}>
          Chargement...
        </div>
      ) : (
        <div style={styles.list}>
          {commandesFiltrees.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '2.5rem' }}>📋</p>
              <p style={{ marginTop: '0.8rem', fontFamily: F.corps }}>Aucune commande ce jour</p>
            </div>
          ) : (
            commandesFiltrees.map(cmd => {
              const estOuverte = commandeSelectionnee?.id === cmd.id;
              const nomLivreur = getNomLivreur(cmd);
              const telLivreur = getTelLivreur(cmd);
              const couleur = statutCouleur[cmd.statut] || '#888';

              return (
                <div key={cmd.id} style={{ ...styles.card, borderLeft: '4px solid ' + couleur }}>
                  <div style={styles.cardHeader} onClick={() => setCommandeSelectionnee(estOuverte ? null : cmd)}>
                    <div style={styles.headerLeft}>
                      <h3 style={styles.code}>#{cmd.codeCommande}</h3>
                      <p style={styles.date}>
                        📅 {new Date(cmd.createdAt).toLocaleDateString('fr-FR')} · {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p style={styles.clientInfo}>
                        👤 <strong>{cmd.client?.nom || cmd.clientNom || 'Client'}</strong>
                        &nbsp;·&nbsp;
                        📞 {cmd.client?.telephone || cmd.clientTel || 'Non renseigne'}
                      </p>
                    </div>
                    <div style={styles.headerRight}>
                      <span style={{ ...styles.badge, background: couleur }}>
                        {statutEmoji[cmd.statut]} {cmd.statut}
                      </span>
                      <p style={styles.total}>{parseFloat(cmd.total).toLocaleString()} FCFA</p>
                      <span style={styles.chevron}>{estOuverte ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {estOuverte && (
                    <div style={styles.details}>
                      <div style={styles.detailSection}>
                        <h4 style={styles.detailTitre}>📋 Details</h4>
                        <div style={styles.infosGrid}>
                          {[
                            { label: 'Mode', value: cmd.modeReception === 'livraison' ? '🛵 Livraison' : '🏪 Retrait' },
                            { label: 'Paiement', value: '💳 ' + cmd.modePaiement },
                            { label: 'Total', value: parseFloat(cmd.total).toLocaleString() + ' FCFA', rouge: true },
                            { label: 'Code', value: '#' + cmd.codeCommande }
                          ].map((info, i) => (
                            <div key={i} style={styles.infoItem}>
                              <p style={styles.infoLabel}>{info.label}</p>
                              <p style={{ ...styles.infoValue, ...(info.rouge ? { color: '#E63946', fontWeight: '800', fontSize: '1rem' } : {}) }}>
                                {info.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={styles.detailSection}>
                        <h4 style={styles.detailTitre}>👤 Client</h4>
                        <div style={styles.infosGrid}>
                          {[
                            { label: 'Nom', value: cmd.client?.nom || cmd.clientNom || 'Non renseigne' },
                            { label: 'Email', value: cmd.client?.email || cmd.clientEmail || 'Non renseigne' },
                            { label: 'Telephone', value: cmd.client?.telephone || cmd.clientTel || 'Non renseigne' },
                            ...(cmd.adresseLivraison ? [{ label: 'Adresse', value: '📍 ' + cmd.adresseLivraison }] : [])
                          ].map((info, i) => (
                            <div key={i} style={styles.infoItem}>
                              <p style={styles.infoLabel}>{info.label}</p>
                              <p style={styles.infoValue}>{info.value}</p>
                            </div>
                          ))}
                        </div>
                        {(cmd.localisation || cmd.adresseLivraison) && (
                          <button style={styles.mapsBtn} onClick={() => ouvrirMaps(cmd)}>
                            🗺️ Voir sur Google Maps
                          </button>
                        )}
                      </div>

                      {cmd.modeReception === 'livraison' && (
                        <div style={styles.detailSection}>
                          <h4 style={styles.detailTitre}>🛵 Livreur</h4>
                          {nomLivreur ? (
                            <div style={styles.livreurCard}>
                              <div style={styles.livreurAvatar}>🛵</div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: '700', color: '#0d0d0d', fontFamily: F.corps }}>{nomLivreur}</p>
                                {telLivreur && (
                                  <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '0.2rem', fontFamily: F.corps }}>
                                    📞 {telLivreur}
                                  </p>
                                )}
                              </div>
                              <span style={{ ...styles.badge, background: '#0077B6' }}>{cmd.statut}</span>
                            </div>
                          ) : (
                            <div style={styles.pasLivreur}>
                              <p style={{ fontFamily: F.corps, fontSize: '0.88rem' }}>⏳ Aucun livreur assigne</p>
                            </div>
                          )}
                        </div>
                      )}

                      {cmd.items && cmd.items.length > 0 && (
                        <div style={styles.detailSection}>
                          <h4 style={styles.detailTitre}>🍕 Articles</h4>
                          <div style={styles.itemsList}>
                            {cmd.items.map((item, i) => (
                              <div key={i} style={styles.itemRow}>
                                <span style={styles.itemNom}>🍕 {item.nom}</span>
                                <span style={styles.itemQty}>×{item.quantite}</span>
                                <span style={styles.itemPrix}>{(item.prix * item.quantite).toLocaleString()} FCFA</span>
                              </div>
                            ))}
                            <div style={styles.itemTotalRow}>
                              <span style={{ fontWeight: '700', fontFamily: F.corps }}>Total</span>
                              <span style={{ color: '#E63946', fontWeight: '900', fontSize: '1.1rem', fontFamily: F.corps }}>
                                {parseFloat(cmd.total).toLocaleString()} FCFA
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={styles.actions}>
                        <button style={styles.deleteBtn} onClick={() => supprimerCommande(cmd.id)}>
                          🗑️ Supprimer
                        </button>
                        <button style={styles.fermerBtn} onClick={() => setCommandeSelectionnee(null)}>
                          ✕ Fermer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: '1200px', margin: '0 auto',
    padding: 'clamp(5rem, 10vw, 6rem) 2rem 4rem',
    minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif"
  },
  pageHeader: { marginBottom: '1.5rem' },
  titre: {
    fontFamily: 'Georgia, serif',
    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
    fontWeight: '900', color: '#0d0d0d',
    letterSpacing: '-0.02em', marginBottom: '0.3rem'
  },
  sousTitre: { color: '#aaa', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif" },
  sectionLabel: {
    fontFamily: "'Inter', sans-serif", fontWeight: '700',
    fontSize: '0.82rem', color: '#888', marginBottom: '0.8rem',
    textTransform: 'uppercase', letterSpacing: '0.05em'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '0.8rem', marginBottom: '2rem'
  },
  stat: {
    background: 'white', borderRadius: '14px', padding: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', cursor: 'pointer',
    transition: 'all 0.2s ease', textAlign: 'center'
  },
  statIcon: { fontSize: '1.4rem', marginBottom: '0.4rem' },
  statNum: { fontSize: '1.7rem', fontWeight: '900', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' },
  statLabel: { color: '#888', fontSize: '0.72rem', marginTop: '0.2rem', fontFamily: "'Inter', sans-serif" },
  graphCard: {
    background: 'white', borderRadius: '20px', padding: '1.5rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '1.5rem'
  },
  graphTitre: {
    fontFamily: 'Georgia, serif', fontWeight: '700',
    fontSize: '1rem', color: '#0d0d0d', marginBottom: '1.2rem'
  },
  barChart: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', gap: '0.3rem' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 },
  barValue: { fontSize: '0.72rem', fontWeight: '700', color: '#0d0d0d', marginBottom: '0.2rem', fontFamily: "'Inter', sans-serif" },
  barContainer: { width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '60%', borderRadius: '6px 6px 0 0', transition: 'all 0.3s ease', minHeight: '4px' },
  barLabel: { fontSize: '0.7rem', marginTop: '0.3rem', fontFamily: "'Inter', sans-serif" },
  barDate: { fontSize: '0.62rem', color: '#bbb', fontFamily: "'Inter', sans-serif" },
  jourSelectionneInfo: {
    background: '#f9f9f9', borderRadius: '14px', padding: '1rem 1.5rem',
    marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
    gap: '1rem', flexWrap: 'wrap', border: '1.5px solid #e8e8ed'
  },
  resetJourBtn: {
    background: '#E63946', color: 'white', border: 'none',
    padding: '0.4rem 1rem', borderRadius: '100px', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.78rem', fontFamily: "'Inter', sans-serif",
    marginLeft: 'auto'
  },
  searchRow: { display: 'flex', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchBar: {
    flex: 1, display: 'flex', alignItems: 'center', background: 'white',
    borderRadius: '100px', padding: '0.7rem 1.5rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1.5px solid #e8e8ed',
    gap: '0.8rem', minWidth: '220px'
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem',
    background: 'transparent', fontFamily: "'Inter', sans-serif", color: '#0d0d0d'
  },
  clearBtn: {
    background: '#f0f0f0', border: 'none', borderRadius: '50%',
    width: '24px', height: '24px', cursor: 'pointer',
    fontWeight: '700', fontSize: '0.72rem', color: '#666'
  },
  selectStatut: {
    padding: '0.7rem 1.2rem', borderRadius: '100px',
    border: '1.5px solid #e8e8ed', fontSize: '0.85rem', outline: 'none',
    background: 'white', cursor: 'pointer', fontFamily: "'Inter', sans-serif", color: '#555'
  },
  count: { color: '#bbb', fontSize: '0.82rem', marginBottom: '1.2rem', fontFamily: "'Inter', sans-serif" },
  list: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  empty: {
    background: 'white', borderRadius: '20px', padding: '3rem',
    textAlign: 'center', color: '#aaa', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  card: {
    background: 'white', borderRadius: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
    transition: 'box-shadow 0.25s ease'
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.2rem 1.5rem', cursor: 'pointer', gap: '1rem'
  },
  headerLeft: { flex: 1 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 },
  code: { fontFamily: 'Georgia, serif', fontSize: '1.15rem', color: '#0d0d0d', marginBottom: '0.25rem', fontWeight: '700' },
  date: { color: '#bbb', fontSize: '0.78rem', marginBottom: '0.25rem', fontFamily: "'Inter', sans-serif" },
  clientInfo: { color: '#666', fontSize: '0.83rem', fontFamily: "'Inter', sans-serif" },
  badge: {
    color: 'white', padding: '0.25rem 0.85rem', borderRadius: '100px',
    fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap',
    fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em'
  },
  total: { color: '#E63946', fontWeight: '900', fontSize: '1.05rem', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' },
  chevron: { color: '#ccc', fontSize: '0.75rem', fontFamily: "'Inter', sans-serif" },
  details: { borderTop: '1px solid #f5f5f7', padding: '1.5rem' },
  detailSection: { marginBottom: '1.5rem' },
  detailTitre: { fontFamily: 'Georgia, serif', fontSize: '0.95rem', color: '#0d0d0d', marginBottom: '0.8rem', fontWeight: '700' },
  infosGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.8rem', background: '#f9f9f9', borderRadius: '14px',
    padding: '1rem', marginBottom: '0.8rem'
  },
  infoItem: {},
  infoLabel: { color: '#bbb', fontSize: '0.72rem', marginBottom: '0.25rem', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' },
  infoValue: { fontWeight: '600', color: '#333', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif" },
  mapsBtn: {
    background: '#0077B6', color: 'white', border: 'none',
    padding: '0.6rem 1.3rem', borderRadius: '100px', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.83rem', fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(0,119,182,0.2)'
  },
  livreurCard: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    background: '#f0f8ff', borderRadius: '14px', padding: '1rem',
    border: '1.5px solid #bee3f8'
  },
  livreurAvatar: {
    fontSize: '1.5rem', background: '#0077B6', borderRadius: '50%',
    width: '44px', height: '44px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  pasLivreur: {
    background: '#fffbf0', borderRadius: '14px', padding: '1rem',
    color: '#aaa', textAlign: 'center', border: '1.5px dashed #FFB703'
  },
  itemsList: { background: '#fffbf0', borderRadius: '14px', padding: '1rem', border: '1.5px solid #FFB703' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #ffe0a0' },
  itemNom: { fontWeight: '600', color: '#333', flex: 1, fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' },
  itemQty: { background: '#FFB703', color: 'white', borderRadius: '100px', padding: '0.18rem 0.6rem', fontWeight: '700', fontSize: '0.75rem', margin: '0 0.5rem', fontFamily: "'Inter', sans-serif" },
  itemPrix: { color: '#E63946', fontWeight: '700', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem' },
  itemTotalRow: { display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0 0', marginTop: '0.5rem' },
  actions: { display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f5f5f7' },
  deleteBtn: { background: '#fff0f0', color: '#c00', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" },
  fermerBtn: { background: '#f5f5f7', color: '#555', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif" }
};

export default Commandes;