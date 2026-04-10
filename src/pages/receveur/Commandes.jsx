import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const ReceveurCommandes = () => {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('nouvelles');
  const [vue, setVue] = useState('aujourd');
  const [jourSelectionne, setJourSelectionne] = useState(new Date().toDateString());
  const [recherche, setRecherche] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    chargerCommandes();
    const interval = setInterval(chargerCommandes, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const chargerCommandes = async () => {
    try {
      const res = await api.get('/orders');
      setCommandes(res.data);
    } catch (err) {}
    setLoading(false);
  };

  const changerStatut = async (id, statut) => {
    try {
      await api.put('/orders/' + id + '/statut', { statut });
      chargerCommandes();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const aujourd = new Date().toDateString();

  const commandesDuJour = commandes.filter(c =>
    new Date(c.createdAt).toDateString() === (vue === 'semaine' ? jourSelectionne : aujourd)
  );

  const nouvelles = commandesDuJour
    .filter(c => c.statut === 'en attente')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const enPrep = commandesDuJour
    .filter(c => c.statut === 'en préparation' && parseInt(c.receveurId) === parseInt(user.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const pretes = commandesDuJour
    .filter(c => c.statut === 'prêt' && parseInt(c.receveurId) === parseInt(user.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const attentesPaiement = commandesDuJour
    .filter(c => c.statut === 'en attente paiement' && parseInt(c.receveurId) === parseInt(user.id))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const terminees = commandesDuJour
    .filter(c => ['en livraison', 'livré', 'payé', 'annulé'].includes(c.statut) && parseInt(c.receveurId) === parseInt(user.id))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const commandesRecherche = recherche.trim()
    ? commandes.filter(c => {
        const matchCode = c.codeCommande?.toLowerCase().includes(recherche.toLowerCase());
        const estSienne = parseInt(c.receveurId) === parseInt(user.id);
        const estEnAttente = c.statut === 'en attente';
        return matchCode && (estEnAttente || estSienne);
      })
    : [];

  const getDerniers7Jours = () => {
    const jours = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      jours.push(date);
    }
    return jours;
  };

  const getStatsJour = (date) => {
    const dateStr = date.toDateString();
    const cmds = commandes.filter(c =>
      new Date(c.createdAt).toDateString() === dateStr &&
      (parseInt(c.receveurId) === parseInt(user.id) || c.statut === 'en attente')
    );
    return { total: cmds.length, terminees: cmds.filter(c => ['livré', 'payé'].includes(c.statut)).length };
  };

  const derniers7Jours = getDerniers7Jours();
  const maxCommandes = Math.max(...derniers7Jours.map(j => getStatsJour(j).total), 1);

  // Action pour commande prête — retrait Airtel/Moov uniquement
  // Retrait espèces → automatiquement envoyé en caisse par le backend, pas de bouton
  const renderActionPrete = (c) => {
    if (c.modeReception === 'livraison') {
      return (
        <div style={styles.attenteLivreur}>
          🛵 En attente d'un livreur...
        </div>
      );
    }
    const mp = (c.modePaiement || '').toLowerCase();
    const estEspeces = mp.includes('espece');
    if (estEspeces) {
      // Ne devrait plus apparaître ici car le backend envoie direct en caisse
      // Mais au cas où, afficher un message informatif
      return (
        <div style={styles.attentePaiementBannerAction}>
          💵 Envoi automatique à la caisse en cours...
        </div>
      );
    }
    // Airtel ou Moov → payé directement
    return (
      <button style={styles.payerBtn} onClick={() => changerStatut(c.id, 'payé')}>
        ✅ Remis au client — Paye
      </button>
    );
  };

  const renderCommande = (cmd, actions) => (
    <div key={cmd.id} style={{ ...styles.card, borderLeft: '4px solid ' + (statutCouleur[cmd.statut] || '#888') }}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.code}>#{cmd.codeCommande}</h3>
          <p style={styles.date}>
            📅 {new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
          <span style={{ ...styles.badge, background: statutCouleur[cmd.statut] || '#888' }}>
            {cmd.statut}
          </span>
          <span style={{ ...styles.modeBadge, background: cmd.modeReception === 'livraison' ? '#0077B6' : '#FB8500' }}>
            {cmd.modeReception === 'livraison' ? '🛵 Livraison' : '🏪 Retrait'}
          </span>
        </div>
      </div>

      <div style={styles.infosGrid}>
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Client</p>
          <p style={styles.infoValue}>👤 {cmd.client?.nom || cmd.clientNom || 'Client'}</p>
        </div>
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Paiement</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            {(cmd.modePaiement || '').toLowerCase().includes('airtel') && (
              <img src="/images/airtel.png" alt="Airtel" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'contain', border: '1px solid #e8e8ed' }} />
            )}
            {(cmd.modePaiement || '').toLowerCase().includes('moov') && (
              <img src="/images/moov.png" alt="Moov" style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'contain', border: '1px solid #e8e8ed' }} />
            )}
            {(cmd.modePaiement || '').toLowerCase().includes('espece') && (
              <span style={{ fontSize: '1rem' }}>💵</span>
            )}
            <span style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>{cmd.modePaiement}</span>
          </div>
        </div>
        <div style={styles.infoItem}>
          <p style={styles.infoLabel}>Total</p>
          <p style={{ ...styles.infoValue, color: '#E63946', fontWeight: '700' }}>
            {parseFloat(cmd.total).toLocaleString()} FCFA
          </p>
        </div>
      </div>

      {/* BANNIERE EN ATTENTE PAIEMENT */}
      {cmd.statut === 'en attente paiement' && (
        <div style={styles.attentePaiementBanner}>
          <span style={{ fontSize: '1.2rem' }}>💵</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              Transmis a la caisse
            </p>
            <p style={{ fontSize: '0.78rem', opacity: 0.85 }}>
              Le client doit se presenter a la caisse pour payer. En attente de validation admin.
            </p>
          </div>
        </div>
      )}

      {cmd.items && cmd.items.length > 0 && (
        <div style={styles.itemsSection}>
          <p style={styles.itemsTitle}>Articles</p>
          {cmd.items.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <span style={styles.itemNom}>🍕 {item.nom}</span>
              <span style={styles.itemQty}>x{item.quantite}</span>
              <span style={styles.itemPrix}>{(item.prix * item.quantite).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>
      )}

      {actions && <div style={styles.actions}>{actions(cmd)}</div>}
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Commandes <span>Recues</span></h1>

      <div style={styles.searchBar}>
        <span>🔍</span>
        <input style={styles.searchInput} type="text" placeholder="Rechercher par code BZ..."
          value={recherche} onChange={e => setRecherche(e.target.value.toUpperCase())} />
        {recherche && <button style={styles.clearBtn} onClick={() => setRecherche('')}>✕</button>}
      </div>

      {recherche.trim() && (
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {commandesRecherche.length} commande(s) trouvee(s) pour "{recherche}"
          </p>
          {commandesRecherche.length === 0 ? (
            <div style={styles.empty}><p>Aucune commande trouvee</p></div>
          ) : (
            <div style={styles.list}>
              {commandesRecherche.map(cmd => renderCommande(cmd, (c) => {
                if (c.statut === 'en attente') return (
                  <button style={styles.prepBtn} onClick={() => changerStatut(c.id, 'en préparation')}>
                    👨‍🍳 Prendre en charge
                  </button>
                );
                if (c.statut === 'en préparation' && parseInt(c.receveurId) === parseInt(user.id)) return (
                  <button style={styles.pretBtn} onClick={() => changerStatut(c.id, 'prêt')}>
                    ✅ Marquer comme pret
                  </button>
                );
                if (c.statut === 'prêt' && parseInt(c.receveurId) === parseInt(user.id)) return renderActionPrete(c);
                return null;
              }))}
            </div>
          )}
        </div>
      )}

      {!recherche.trim() && (
        <>
          <div style={styles.vueSwitch}>
            <button style={{ ...styles.vueBtm, ...(vue === 'aujourd' ? styles.vueBtnActif : {}) }} onClick={() => setVue('aujourd')}>
              📅 Aujourd'hui
            </button>
            <button style={{ ...styles.vueBtm, ...(vue === 'semaine' ? styles.vueBtnActif : {}) }} onClick={() => setVue('semaine')}>
              📊 Cette semaine
            </button>
          </div>

          {vue === 'semaine' && (
            <div style={styles.graphCard}>
              <h3 style={styles.graphTitle}>Mon activite des 7 derniers jours</h3>
              <div style={styles.barChart}>
                {derniers7Jours.map((date, i) => {
                  const stats = getStatsJour(date);
                  const hauteur = (stats.total / maxCommandes) * 100;
                  const estSelectionne = date.toDateString() === jourSelectionne;
                  const estAujourdhui = date.toDateString() === aujourd;
                  return (
                    <div key={i} style={styles.barWrapper} onClick={() => setJourSelectionne(date.toDateString())}>
                      <p style={styles.barValue}>{stats.total}</p>
                      <div style={styles.barContainer}>
                        <div style={{ ...styles.bar, height: Math.max(hauteur, 5) + '%', background: estSelectionne ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E' }} />
                      </div>
                      <p style={{ ...styles.barLabel, color: estSelectionne ? '#E63946' : '#666' }}>{JOURS[date.getDay()].substring(0, 3)}</p>
                      <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
                    </div>
                  );
                })}
              </div>
              <p style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Cliquez sur un jour pour voir ses commandes
              </p>
            </div>
          )}

          <div style={styles.statsGrid}>
            <div style={{ ...styles.stat, borderLeft: '4px solid #FFB703' }}>
              <p style={styles.statNum}>{nouvelles.length}</p>
              <p style={styles.statLabel}>⏳ En attente</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #FB8500' }}>
              <p style={styles.statNum}>{enPrep.length}</p>
              <p style={styles.statLabel}>👨‍🍳 Ma prep</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #2D6A4F' }}>
              <p style={styles.statNum}>{pretes.length}</p>
              <p style={styles.statLabel}>✅ Mes pretes</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #9C27B0' }}>
              <p style={styles.statNum}>{attentesPaiement.length}</p>
              <p style={styles.statLabel}>💵 Att. caisse</p>
            </div>
            <div style={{ ...styles.stat, borderLeft: '4px solid #0077B6' }}>
              <p style={styles.statNum}>{terminees.length}</p>
              <p style={styles.statLabel}>📦 Terminees</p>
            </div>
          </div>

          <div style={styles.onglets}>
            {[
              { key: 'nouvelles', label: '⏳ En attente', count: nouvelles.length },
              { key: 'preparation', label: '👨‍🍳 Preparation', count: enPrep.length },
              { key: 'pretes', label: '✅ Pretes', count: pretes.length },
              { key: 'caisse', label: '💵 Caisse', count: attentesPaiement.length },
              { key: 'terminees', label: '📦 Terminees', count: terminees.length }
            ].map(o => (
              <button key={o.key}
                style={{ ...styles.onglet, ...(onglet === o.key ? styles.ongletActif : {}) }}
                onClick={() => setOnglet(o.key)}>
                {o.label} {o.count > 0 && <span style={styles.ongletCount}>{o.count}</span>}
              </button>
            ))}
          </div>

          {loading ? <p>Chargement...</p> : (
            <div style={styles.list}>
              {onglet === 'nouvelles' && (
                nouvelles.length === 0 ? (
                  <div style={styles.empty}><p style={{ fontSize: '3rem' }}>🎉</p><p>Aucune nouvelle commande</p></div>
                ) : nouvelles.map(cmd => renderCommande(cmd, (c) => (
                  <button style={styles.prepBtn} onClick={() => changerStatut(c.id, 'en préparation')}>
                    👨‍🍳 Prendre en charge
                  </button>
                )))
              )}

              {onglet === 'preparation' && (
                enPrep.length === 0 ? (
                  <div style={styles.empty}><p>Aucune commande en preparation</p></div>
                ) : enPrep.map(cmd => renderCommande(cmd, (c) => (
                  <button style={styles.pretBtn} onClick={() => changerStatut(c.id, 'prêt')}>
                    ✅ Marquer comme pret
                  </button>
                )))
              )}

              {/* PRETES — especes auto envoyees en caisse, Airtel/Moov bouton remise */}
              {onglet === 'pretes' && (
                pretes.length === 0 ? (
                  <div style={styles.empty}><p>Aucune commande prete</p></div>
                ) : pretes.map(cmd => renderCommande(cmd, (c) => renderActionPrete(c)))
              )}

              {/* CAISSE — commandes retrait especes en attente validation admin */}
              {onglet === 'caisse' && (
                attentesPaiement.length === 0 ? (
                  <div style={styles.empty}>
                    <p style={{ fontSize: '3rem' }}>💵</p>
                    <p>Aucune commande en attente de paiement</p>
                    <p style={{ fontSize: '0.82rem', color: '#bbb', marginTop: '0.3rem' }}>
                      Les commandes retrait especes apparaissent ici automatiquement
                    </p>
                  </div>
                ) : attentesPaiement.map(cmd => renderCommande(cmd, null))
              )}

              {onglet === 'terminees' && (
                terminees.length === 0 ? (
                  <div style={styles.empty}><p>Aucune commande terminee</p></div>
                ) : terminees.map(cmd => renderCommande(cmd, null))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  searchBar: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '0.7rem 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #e0e0e0', gap: '0.8rem', marginBottom: '1.5rem' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', fontWeight: '600' },
  clearBtn: { background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700' },
  vueSwitch: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  vueBtm: { background: '#f0f0f0', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  vueBtnActif: { background: '#1A1A2E', color: 'white' },
  graphCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
  graphTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1A2E', marginBottom: '1rem' },
  barChart: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', gap: '0.3rem' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 },
  barValue: { fontSize: '0.75rem', fontWeight: '700', color: '#1A1A2E', marginBottom: '0.2rem' },
  barContainer: { width: '100%', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '60%', borderRadius: '6px 6px 0 0', transition: 'all 0.3s', minHeight: '4px' },
  barLabel: { fontSize: '0.75rem', fontWeight: '600', marginTop: '0.3rem' },
  barDate: { fontSize: '0.65rem', color: '#aaa' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  stat: { background: 'white', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  statNum: { fontSize: '1.8rem', fontWeight: '900', color: '#1A1A2E' },
  statLabel: { color: '#666', fontSize: '0.8rem', marginTop: '0.2rem' },
  onglets: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  onglet: { background: '#f0f0f0', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  ongletActif: { background: '#1A1A2E', color: 'white' },
  ongletCount: { background: '#E63946', color: 'white', borderRadius: '50px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: { background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: '#666', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  card: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  code: { fontFamily: 'Georgia, serif', fontSize: '1.3rem', color: '#1A1A2E' },
  date: { color: '#888', fontSize: '0.8rem', marginTop: '0.3rem' },
  badge: { color: 'white', padding: '0.3rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' },
  modeBadge: { color: 'white', padding: '0.2rem 0.7rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap' },
  infosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.8rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  infoItem: {},
  infoLabel: { color: '#aaa', fontSize: '0.75rem', marginBottom: '0.2rem' },
  infoValue: { fontWeight: '600', color: '#333', fontSize: '0.9rem' },
  attentePaiementBanner: {
    background: 'linear-gradient(135deg, #f3e5f5, #ede7f6)',
    border: '1.5px solid #ce93d8', borderRadius: '12px',
    padding: '0.9rem 1rem', marginBottom: '1rem',
    display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#6a1b9a'
  },
  attentePaiementBannerAction: {
    background: '#f3e5f5', color: '#9C27B0', padding: '0.8rem 1.5rem',
    borderRadius: '50px', fontWeight: '600', fontSize: '0.9rem'
  },
  itemsSection: { background: '#fff8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', border: '2px solid #FFB703' },
  itemsTitle: { fontWeight: '700', color: '#1A1A2E', marginBottom: '0.8rem', fontSize: '0.95rem' },
  itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #ffe0a0' },
  itemNom: { fontWeight: '600', color: '#333', flex: 1 },
  itemQty: { background: '#FFB703', color: 'white', borderRadius: '50px', padding: '0.2rem 0.6rem', fontWeight: '700', fontSize: '0.8rem', margin: '0 0.5rem' },
  itemPrix: { color: '#E63946', fontWeight: '700', fontSize: '0.9rem' },
  actions: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap' },
  prepBtn: { background: '#FB8500', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
  pretBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
  payerBtn: { background: '#0077B6', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
  attenteLivreur: { background: '#e3f2fd', color: '#0077B6', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '600', fontSize: '0.9rem' }
};

export default ReceveurCommandes;