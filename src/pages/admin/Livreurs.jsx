import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// MODAL ADMIN
const Modal = ({ visible, titre, message, montant, onConfirm, onCancel, loading, type }) => {
  if (!visible) return null;
  return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.box}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : '💸'}
        </div>
        <h3 style={stylesModal.titre}>{titre}</h3>
        {montant && <p style={stylesModal.montant}>{parseFloat(montant).toLocaleString()} FCFA</p>}
        <p style={stylesModal.message}>{message}</p>
        <div style={stylesModal.actions}>
          {onCancel && <button style={stylesModal.annulerBtn} onClick={onCancel} disabled={loading}>Annuler</button>}
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
  confirmerBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(45,106,79,0.35)' }
};

const Livreurs = () => {
  const [livreurs, setLivreurs] = useState([]);
  const [receveurs, setReceveurs] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [soldesLivreurs, setSoldesLivreurs] = useState({});
  const [recherche, setRecherche] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [onglet, setOnglet] = useState('livreurs');
  const [selectionne, setSelectionne] = useState(null);
  const [vueSelectionne, setVueSelectionne] = useState('aujourd');
  const [jourSelectionne, setJourSelectionne] = useState(new Date().toDateString());
  const [form, setForm] = useState({ nom: '', email: '', motDePasse: '', telephone: '', role: 'livreur' });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [modal, setModal] = useState({ visible: false, type: '', titre: '', message: '', montant: null, remiseId: null });
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  useEffect(() => { chargerDonnees(); }, []);

const chargerDonnees = async () => {
  try {
    const [liv, rec, cmd] = await Promise.all([
      api.get('/auth/livreurs'),
      api.get('/auth/receveurs'),
      api.get('/orders')
    ]);
    setLivreurs(liv.data);
    setReceveurs(rec.data);
    setCommandes(cmd.data);

    const soldes = {};
    for (const l of liv.data) {
      try {
        const res = await api.get('/remises/solde-livreur/' + l.id);
        console.log('✅ Solde', l.nom, l.id, '→', res.data);
        soldes[l.id] = res.data;
      } catch (e) {
        console.error('❌ Erreur solde', l.nom, l.id, e.response?.status, e.response?.data);
        soldes[l.id] = { solde: 0, totalEspeces: 0, totalRemis: 0, remiseEnAttente: null };
      }
    }
    console.log('Tous les soldes:', soldes);
    setSoldesLivreurs(soldes);
  } catch (err) {
    console.error('Erreur générale:', err);
  }
};
  const creerUtilisateur = async () => {
    setErreur(''); setSucces('');
    if (!form.nom || !form.email || !form.motDePasse) { setErreur('Tous les champs sont obligatoires'); return; }
    try {
      const endpoint = form.role === 'livreur' ? '/auth/creer-livreur' : '/auth/creer-receveur';
      await api.post(endpoint, form);
      setSucces((form.role === 'livreur' ? 'Livreur ' : 'Receveur ') + form.nom + ' cree !');
      setForm({ nom: '', email: '', motDePasse: '', telephone: '', role: onglet === 'livreurs' ? 'livreur' : 'receveur' });
      setShowForm(false);
      chargerDonnees();
    } catch (err) { setErreur(err.response?.data?.message || 'Erreur'); }
  };

  const supprimerUtilisateur = async (u) => {
    setModal({
      visible: true, type: 'confirm', titre: 'Supprimer ' + u.nom + ' ?',
      message: 'Cette action est irreversible. Toutes les donnees de ce compte seront perdues.',
      montant: null, userId: u.id
    });
  };

  const confirmerSuppression = async () => {
    setLoadingConfirm(true);
    try {
      await api.delete('/auth/utilisateurs/' + modal.userId);
      setSucces('Utilisateur supprime');
      if (selectionne?.id === modal.userId) setSelectionne(null);
      chargerDonnees();
      setModal({ ...modal, visible: false });
    } catch (err) { setErreur('Erreur lors de la suppression'); setModal({ ...modal, visible: false }); }
    setLoadingConfirm(false);
  };

  const getCommandesLivreur = (id) => commandes.filter(c => parseInt(c.livreurId) === parseInt(id));
  const getCommandesReceveur = (id) => commandes.filter(c => parseInt(c.receveurId) === parseInt(id));

  const getDerniers7Jours = () => {
    const jours = [];
    for (let i = 6; i >= 0; i--) { const date = new Date(); date.setDate(date.getDate() - i); jours.push(date); }
    return jours;
  };

  const getStatsJourLivreur = (sesCommandes, date) => {
    const dateStr = date.toDateString();
    const cmds = sesCommandes.filter(c => new Date(c.createdAt).toDateString() === dateStr);
    const especes = cmds.filter(c =>
      ['livré', 'payé'].includes(c.statut) &&
      c.modePaiement?.toLowerCase().includes('espece') &&
      c.modeReception === 'livraison'
    );
    const revenuEspeces = especes.reduce((sum, c) => sum + parseFloat(c.total), 0);
    return { total: cmds.length, terminees: cmds.filter(c => ['livré', 'payé'].includes(c.statut)).length, revenuEspeces, commandes: cmds };
  };

  const getStatsJourReceveur = (sesCommandes, date) => {
    const dateStr = date.toDateString();
    const cmds = sesCommandes.filter(c => new Date(c.createdAt).toDateString() === dateStr);
    return { total: cmds.length, terminees: cmds.filter(c => ['livré', 'payé'].includes(c.statut)).length, commandes: cmds };
  };

  const derniers7Jours = getDerniers7Jours();
  const aujourd = new Date().toDateString();
  const liste = onglet === 'livreurs' ? livreurs : receveurs;
  const listeFiltree = liste.filter(u =>
    u.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    u.email.toLowerCase().includes(recherche.toLowerCase()) ||
    (u.telephone && u.telephone.includes(recherche))
  );

  const renderHistorique = (u) => {
    const estLivreur = onglet === 'livreurs';
    const sesCommandes = estLivreur ? getCommandesLivreur(u.id) : getCommandesReceveur(u.id);
    const soldeLivreur = estLivreur ? (soldesLivreurs[u.id] || { solde: 0, totalEspeces: 0, totalRemis: 0, remiseEnAttente: null }) : null;
    const maxCmds = Math.max(...derniers7Jours.map(j =>
      estLivreur ? getStatsJourLivreur(sesCommandes, j).total : getStatsJourReceveur(sesCommandes, j).total
    ), 1);
    const statsJour = estLivreur
      ? getStatsJourLivreur(sesCommandes, new Date(jourSelectionne))
      : getStatsJourReceveur(sesCommandes, new Date(jourSelectionne));
    const aujourdStats = estLivreur
      ? getStatsJourLivreur(sesCommandes, new Date())
      : getStatsJourReceveur(sesCommandes, new Date());

    return (
      <div style={styles.historique}>
        {/* SOLDE EN POSSESSION — LIVREUR SEULEMENT */}
        {estLivreur && soldeLivreur && (
          <div style={styles.soldeHistorique}>
            <div style={{ flex: 1 }}>
              <p style={styles.soldeHistLabel}>💼 Especes en possession</p>
              <p style={styles.soldeHistMontant}>{soldeLivreur.solde.toLocaleString()} FCFA</p>
              <p style={styles.soldeHistSub}>
                Total : {soldeLivreur.totalEspeces.toLocaleString()} FCFA
                {soldeLivreur.totalRemis > 0 && ` — Remis : ${soldeLivreur.totalRemis.toLocaleString()} FCFA`}
              </p>
            </div>
            {soldeLivreur.remiseEnAttente && (
              <div style={styles.remiseAttenteAdmin}>
                <p style={{ fontWeight: '700', fontSize: '0.78rem', marginBottom: '0.2rem' }}>⏳ En attente</p>
                <p style={{ fontSize: '0.72rem' }}>{parseFloat(soldeLivreur.remiseEnAttente.montant).toLocaleString()} FCFA</p>
              </div>
            )}
            {soldeLivreur.solde === 0 && !soldeLivreur.remiseEnAttente && (
              <div style={styles.soldeLivreurZero}>✅ Solde a zero</div>
            )}
          </div>
        )}

        <div style={styles.vueSwitch}>
          <button style={{ ...styles.vueBtn, ...(vueSelectionne === 'aujourd' ? styles.vueBtnActif : {}) }} onClick={() => setVueSelectionne('aujourd')}>📅 Aujourd'hui</button>
          <button style={{ ...styles.vueBtn, ...(vueSelectionne === 'semaine' ? styles.vueBtnActif : {}) }} onClick={() => setVueSelectionne('semaine')}>📊 Semaine</button>
        </div>

        {vueSelectionne === 'aujourd' && (
          <>
            <div style={styles.miniStats}>
              <div style={styles.miniStat}><p style={styles.miniStatNum}>{aujourdStats.total}</p><p style={styles.miniStatLabel}>Total</p></div>
              <div style={styles.miniStat}><p style={styles.miniStatNum}>{aujourdStats.terminees}</p><p style={styles.miniStatLabel}>Terminees</p></div>
              {estLivreur && (
                <div style={styles.miniStat}>
                  <p style={{ ...styles.miniStatNum, color: '#FFB703', fontSize: '0.9rem' }}>{aujourdStats.revenuEspeces?.toLocaleString()} FCFA</p>
                  <p style={styles.miniStatLabel}>Especes recus</p>
                </div>
              )}
            </div>
            {aujourdStats.commandes.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '1rem' }}>Aucune activite aujourd'hui</p>
            ) : (
              aujourdStats.commandes.map(cmd => (
                <div key={cmd.id} style={styles.histItem}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700' }}>#{cmd.codeCommande}</p>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>👤 {cmd.client?.nom || cmd.clientNom || 'Client'}</p>
                    {estLivreur && <p style={{ color: '#666', fontSize: '0.8rem' }}>📍 {cmd.adresseLivraison || 'Retrait'}</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p>
                    <span style={{ ...styles.statutBadge, background: ['livré', 'payé'].includes(cmd.statut) ? '#2D6A4F' : '#FFB703' }}>{cmd.statut}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {vueSelectionne === 'semaine' && (
          <>
            <div style={styles.barChart}>
              {derniers7Jours.map((date, i) => {
                const s = estLivreur ? getStatsJourLivreur(sesCommandes, date) : getStatsJourReceveur(sesCommandes, date);
                const hauteur = (s.total / maxCmds) * 100;
                const estSelectionneJour = date.toDateString() === jourSelectionne;
                const estAujourdhui = date.toDateString() === aujourd;
                return (
                  <div key={i} style={styles.barWrapper} onClick={() => setJourSelectionne(date.toDateString())}>
                    <p style={styles.barValue}>{s.total}</p>
                    <div style={styles.barContainer}>
                      <div style={{ ...styles.bar, height: Math.max(hauteur, 5) + '%', background: estSelectionneJour ? '#E63946' : estAujourdhui ? '#FFB703' : '#1A1A2E' }} />
                    </div>
                    <p style={{ ...styles.barLabel, color: estSelectionneJour ? '#E63946' : '#666' }}>{JOURS[date.getDay()].substring(0, 3)}</p>
                    <p style={styles.barDate}>{date.getDate()}/{date.getMonth() + 1}</p>
                  </div>
                );
              })}
            </div>
            <div style={styles.miniStats}>
              <div style={styles.miniStat}><p style={styles.miniStatNum}>{statsJour.total}</p><p style={styles.miniStatLabel}>Total</p></div>
              <div style={styles.miniStat}><p style={styles.miniStatNum}>{statsJour.terminees}</p><p style={styles.miniStatLabel}>Terminees</p></div>
              {estLivreur && (
                <div style={styles.miniStat}>
                  <p style={{ ...styles.miniStatNum, color: '#FFB703', fontSize: '0.9rem' }}>{statsJour.revenuEspeces?.toLocaleString()} FCFA</p>
                  <p style={styles.miniStatLabel}>Especes recus</p>
                </div>
              )}
            </div>
            {statsJour.commandes.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center', padding: '1rem' }}>Aucune activite ce jour</p>
            ) : (
              statsJour.commandes.map(cmd => (
                <div key={cmd.id} style={styles.histItem}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '700' }}>#{cmd.codeCommande}</p>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>{new Date(cmd.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p style={{ color: '#666', fontSize: '0.8rem' }}>👤 {cmd.client?.nom || cmd.clientNom || 'Client'}</p>
                    {estLivreur && <p style={{ color: '#666', fontSize: '0.8rem' }}>📍 {cmd.adresseLivraison || 'Retrait'}</p>}
                    {estLivreur && <p style={{ color: '#888', fontSize: '0.75rem' }}>💳 {cmd.modePaiement}</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#E63946', fontWeight: '700' }}>{parseFloat(cmd.total).toLocaleString()} FCFA</p>
                    <span style={{ ...styles.statutBadge, background: ['livré', 'payé'].includes(cmd.statut) ? '#2D6A4F' : '#FFB703' }}>{cmd.statut}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <Modal
        visible={modal.visible}
        type={modal.type}
        titre={modal.titre}
        message={modal.message}
        montant={modal.montant}
        loading={loadingConfirm}
        onConfirm={modal.type === 'confirm' ? confirmerSuppression : () => setModal({ ...modal, visible: false })}
        onCancel={modal.type === 'confirm' ? () => setModal({ ...modal, visible: false }) : null}
      />

      <div style={styles.pageHeader}>
        <h1 className="page-title">Gestion <span>{onglet === 'livreurs' ? 'Livreurs' : 'Serveurs'}</span></h1>
        <button style={styles.addBtn} onClick={() => {
          setShowForm(!showForm);
          setForm({ ...form, role: onglet === 'livreurs' ? 'livreur' : 'receveur' });
          setErreur(''); setSucces('');
        }}>
          {showForm ? 'Annuler' : '+ Nouveau'}
        </button>
      </div>

      <div style={styles.onglets}>
        <button style={{ ...styles.onglet, ...(onglet === 'livreurs' ? styles.ongletActif : {}) }} onClick={() => { setOnglet('livreurs'); setSelectionne(null); }}>
          🛵 Livreurs ({livreurs.length})
        </button>
        <button style={{ ...styles.onglet, ...(onglet === 'receveurs' ? styles.ongletActif : {}) }} onClick={() => { setOnglet('receveurs'); setSelectionne(null); }}>
          📋 Serveurs ({receveurs.length})
        </button>
      </div>

      {succes && <div style={styles.succes}>{succes}</div>}
      {erreur && <div style={styles.erreur}>{erreur}</div>}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={{ marginBottom: '1.5rem' }}>{onglet === 'livreurs' ? '🛵 Creer un livreur' : '📋 Creer un serveur'}</h2>
          <div style={styles.formGrid}>
            <div style={styles.field}><label style={styles.label}>Nom complet</label><input style={styles.input} type="text" placeholder="Nom complet" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></div>
            <div style={styles.field}><label style={styles.label}>Email</label><input style={styles.input} type="email" placeholder="email@bayazoo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={styles.field}><label style={styles.label}>Telephone</label><input style={styles.input} type="text" placeholder="+241 XX XX XX XX" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></div>
            <div style={styles.field}><label style={styles.label}>Mot de passe</label><input style={styles.input} type="password" placeholder="••••••••" value={form.motDePasse} onChange={e => setForm({ ...form, motDePasse: e.target.value })} /></div>
          </div>
          <button style={styles.saveBtn} onClick={creerUtilisateur}>{onglet === 'livreurs' ? '🛵 Creer le livreur' : '📋 Creer le serveur'}</button>
        </div>
      )}

      <div style={styles.searchBar}>
        <span>🔍</span>
        <input style={styles.searchInput} type="text" placeholder={'Rechercher un ' + (onglet === 'livreurs' ? 'livreur' : 'receveur') + '...'} value={recherche} onChange={e => setRecherche(e.target.value)} />
        {recherche && <button style={styles.clearSearch} onClick={() => setRecherche('')}>✕</button>}
      </div>

      <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        {listeFiltree.length} {onglet === 'livreurs' ? 'livreur(s)' : 'receveur(s)'} trouve(s)
      </p>

      <div style={styles.grid}>
        {listeFiltree.length === 0 ? (
          <div style={styles.empty}><p style={{ fontSize: '3rem' }}>🔍</p><p style={{ color: '#666' }}>Aucun resultat</p></div>
        ) : (
          listeFiltree.map(u => {
            const estLivreur = onglet === 'livreurs';
            const sesCommandes = estLivreur ? getCommandesLivreur(u.id) : getCommandesReceveur(u.id);
            const aujourdCmds = sesCommandes.filter(c => new Date(c.createdAt).toDateString() === aujourd);
            const terminees = sesCommandes.filter(c => ['livré', 'payé'].includes(c.statut) && new Date(c.createdAt).toDateString() === aujourd);
            const enCours = estLivreur
              ? sesCommandes.filter(c => c.statut === 'en livraison').length
              : sesCommandes.filter(c => ['en préparation', 'prêt'].includes(c.statut)).length;
            const soldeLivreur = estLivreur ? (soldesLivreurs[u.id] || { solde: 0 }) : null;
            const estSelectionne = selectionne?.id === u.id;

            return (
              <div key={u.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.avatar, background: estLivreur ? '#e3f2fd' : '#fff3e0' }}>
                    {estLivreur ? '🛵' : '📋'}
                  </div>
                  <div style={styles.userInfo}>
                    <h3 style={styles.nom}>{u.nom}</h3>
                    <p style={styles.email}>📧 {u.email}</p>
                    <p style={styles.tel}>📞 {u.telephone || 'Non renseigne'}</p>
                  </div>
                </div>

                <div style={styles.statsRow}>
                  <div style={styles.statItem}>
                    <p style={{ fontWeight: '700', color: '#FFB703', fontSize: '1.2rem' }}>{aujourdCmds.length}</p>
                    <p style={{ fontSize: '0.7rem', color: '#666' }}>Aujourd'hui</p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={{ fontWeight: '700', color: '#0077B6', fontSize: '1.2rem' }}>{enCours}</p>
                    <p style={{ fontSize: '0.7rem', color: '#666' }}>En cours</p>
                  </div>
                  <div style={styles.statItem}>
                    <p style={{ fontWeight: '700', color: '#2D6A4F', fontSize: '1.2rem' }}>{terminees.length}</p>
                    <p style={{ fontSize: '0.7rem', color: '#666' }}>Terminees</p>
                  </div>
                </div>

                {/* SOLDE EN POSSESSION SUR LA CARTE */}
                {estLivreur && soldeLivreur && (
                  <div style={{ ...styles.especesBadge, borderColor: soldeLivreur.solde > 0 ? '#FFB703' : '#2D6A4F' }}>
                    <span>💼 Especes en possession</span>
                    <span style={{ fontWeight: '900', color: soldeLivreur.solde > 0 ? '#FFB703' : '#40916c' }}>
                      {soldeLivreur.solde.toLocaleString()} FCFA
                      {soldeLivreur.remiseEnAttente && ' ⏳'}
                    </span>
                  </div>
                )}

                <div style={styles.actions}>
                  <button style={styles.histBtn} onClick={() => {
                    setSelectionne(estSelectionne ? null : u);
                    setVueSelectionne('aujourd');
                    setJourSelectionne(new Date().toDateString());
                  }}>
                    {estSelectionne ? 'Masquer' : '📋 Historique'}
                  </button>
                  <button style={styles.deleteBtn} onClick={() => supprimerUtilisateur(u)}>🗑️ Supprimer</button>
                </div>

                {estSelectionne && renderHistorique(u)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  addBtn: { background: '#E63946', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' },
  onglets: { display: 'flex', gap: '0.5rem', marginBottom: '2rem' },
  onglet: { background: '#f0f0f0', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' },
  ongletActif: { background: '#1A1A2E', color: 'white' },
  succes: { background: '#d4edda', color: '#2D6A4F', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', fontWeight: '600' },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' },
  formCard: { background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginBottom: '2rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' },
  input: { padding: '0.8rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '0.95rem' },
  saveBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' },
  searchBar: { display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '0.5rem 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '1rem', border: '2px solid #e0e0e0', gap: '0.8rem' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' },
  clearSearch: { background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' },
  empty: { background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', gridColumn: '1/-1' },
  card: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' },
  avatar: { fontSize: '2rem', borderRadius: '50%', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  userInfo: { flex: 1 },
  nom: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', marginBottom: '0.3rem' },
  email: { color: '#666', fontSize: '0.85rem', marginBottom: '0.2rem' },
  tel: { color: '#666', fontSize: '0.85rem' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem', marginBottom: '0.8rem', textAlign: 'center' },
  statItem: {},
  especesBadge: { background: '#1A1A2E', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', border: '1.5px solid #FFB703' },
  actions: { display: 'flex', gap: '0.8rem' },
  histBtn: { flex: 1, background: '#0077B6', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  deleteBtn: { background: '#ffe0e0', color: '#c00', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  historique: { marginTop: '1rem', background: '#f9f9f9', borderRadius: '12px', padding: '1rem' },
  // SOLDE DANS HISTORIQUE
  soldeHistorique: { background: 'linear-gradient(135deg, #1a2744, #1A1A2E)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', border: '1.5px solid #FFB703' },
  soldeHistLabel: { color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '0.2rem' },
  soldeHistMontant: { color: '#FFB703', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.02em', marginBottom: '0.2rem' },
  soldeHistSub: { color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' },
  remiseAttenteAdmin: { background: 'rgba(255,183,3,0.15)', border: '1px solid #FFB703', borderRadius: '10px', padding: '0.6rem 0.8rem', color: '#FFB703', fontSize: '0.75rem', textAlign: 'center', flexShrink: 0 },
  soldeLivreurZero: { background: 'rgba(45,106,79,0.2)', border: '1px solid #2D6A4F', borderRadius: '10px', padding: '0.6rem 0.8rem', color: '#40916c', fontSize: '0.78rem', fontWeight: '700', flexShrink: 0 },
  vueSwitch: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  vueBtn: { background: '#e0e0e0', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' },
  vueBtnActif: { background: '#1A1A2E', color: 'white' },
  miniStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1rem' },
  miniStat: { background: 'white', borderRadius: '10px', padding: '0.8rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  miniStatNum: { fontWeight: '900', fontSize: '1.3rem', color: '#1A1A2E' },
  miniStatLabel: { color: '#888', fontSize: '0.7rem', marginTop: '0.2rem' },
  barChart: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '80px', gap: '0.2rem', marginBottom: '1rem' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flex: 1 },
  barValue: { fontSize: '0.65rem', fontWeight: '700', color: '#1A1A2E', marginBottom: '0.2rem' },
  barContainer: { width: '100%', height: '50px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: { width: '60%', borderRadius: '4px 4px 0 0', transition: 'all 0.3s', minHeight: '3px' },
  barLabel: { fontSize: '0.65rem', fontWeight: '600', marginTop: '0.2rem' },
  barDate: { fontSize: '0.6rem', color: '#aaa' },
  histItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.7rem 0', borderBottom: '1px solid #e0e0e0', gap: '1rem' },
  statutBadge: { color: 'white', padding: '0.2rem 0.6rem', borderRadius: '50px', fontSize: '0.7rem', fontWeight: '600', display: 'inline-block', marginTop: '0.3rem' }
};

export default Livreurs;