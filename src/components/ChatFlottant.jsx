import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMesCommandes } from '../services/orderService';
import { getNonLus } from '../services/chatService';
import Chat from './Chat';
import api from '../services/api';

const ChatFlottant = () => {
  const { user } = useAuth();
  const [commandesEnLivraison, setCommandesEnLivraison] = useState([]);
  const [nonLus, setNonLus] = useState({});
  const [ouvert, setOuvert] = useState(false);
  const [cmdSelectionnee, setCmdSelectionnee] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'client') return;
    charger();
    const interval = setInterval(charger, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const charger = async () => {
    try {
      const [cmds, nl] = await Promise.all([
        getMesCommandes(),
        getNonLus()
      ]);
      const enLivraison = cmds.data.filter(c => c.statut === 'en livraison');
      setCommandesEnLivraison(enLivraison);
      setNonLus(nl.data);
      // Si une commande disparait de la liste fermer le chat
      if (cmdSelectionnee && !enLivraison.find(c => c.id === cmdSelectionnee.id)) {
        setCmdSelectionnee(null);
        setOuvert(false);
      }
    } catch (err) {}
  };

  const totalNonLus = commandesEnLivraison.reduce((sum, c) => sum + (nonLus[c.id] || 0), 0);

  const ouvrirChat = (cmd) => {
    setCmdSelectionnee(cmd);
    setOuvert(true);
    setNonLus(prev => ({ ...prev, [cmd.id]: 0 }));
  };

  // Ne pas afficher si pas client ou aucune livraison en cours
  if (!user || user.role !== 'client' || commandesEnLivraison.length === 0) return null;

  return (
    <div style={styles.wrap}>
      {/* FENETRE CHAT */}
      {ouvert && (
        <div style={styles.chatBox}>
          {/* LISTE DES LIVREURS si plusieurs commandes */}
          {!cmdSelectionnee || commandesEnLivraison.length > 1 ? (
            <div style={styles.livreursList}>
              <div style={styles.livreursHeader}>
                <p style={styles.livreursTitle}>🛵 Vos livreurs en route</p>
                <button style={styles.closeBtn} onClick={() => setOuvert(false)}>✕</button>
              </div>
              {commandesEnLivraison.map(cmd => {
                const nb = nonLus[cmd.id] || 0;
                return (
                  <div key={cmd.id} style={styles.livreurItem} onClick={() => ouvrirChat(cmd)}>
                    <div style={styles.livreurAvatar}>🛵</div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.livreurNom}>
                        {cmd.livreur?.nom || cmd.livreurNom || 'Livreur'}
                      </p>
                      <p style={styles.livreurCmd}>#{cmd.codeCommande}</p>
                    </div>
                    {nb > 0 && (
                      <span style={styles.livreurBadge}>{nb}</span>
                    )}
                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>›</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* CHAT D'UNE COMMANDE */}
          {cmdSelectionnee && (
            <div style={styles.chatContainer}>
              <div style={styles.chatBoxHeader}>
                {commandesEnLivraison.length > 1 && (
                  <button style={styles.backBtn} onClick={() => setCmdSelectionnee(null)}>‹</button>
                )}
                <div style={{ flex: 1 }}>
                  <p style={styles.chatBoxNom}>
                    🛵 {cmdSelectionnee.livreur?.nom || cmdSelectionnee.livreurNom || 'Votre livreur'}
                  </p>
                  <p style={styles.chatBoxCmd}>#{cmdSelectionnee.codeCommande} — En route vers vous</p>
                </div>
                <button style={styles.closeBtn} onClick={() => { setOuvert(false); setCmdSelectionnee(null); }}>✕</button>
              </div>
              <Chat orderId={cmdSelectionnee.id} user={user} />
            </div>
          )}
        </div>
      )}

      {/* BOUTON FLOTTANT */}
      <button style={styles.floatBtn} onClick={() => {
        if (ouvert) {
          setOuvert(false);
          setCmdSelectionnee(null);
        } else {
          setOuvert(true);
          // Si 1 seule commande ouvrir directement le chat
          if (commandesEnLivraison.length === 1) {
            ouvrirChat(commandesEnLivraison[0]);
          }
        }
      }}>
        {ouvert ? '✕' : '💬'}
        {!ouvert && totalNonLus > 0 && (
          <span style={styles.floatBadge}>{totalNonLus}</span>
        )}
      </button>
    </div>
  );
};

const styles = {
  wrap: {
    position: 'fixed', bottom: '5rem', right: '1.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    gap: '0.8rem', zIndex: 9999
  },
  floatBtn: {
    position: 'relative', width: '60px', height: '60px',
    borderRadius: '50%', background: 'linear-gradient(135deg, #0077B6, #023e8a)',
    color: 'white', border: 'none', fontSize: '1.6rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(0,119,182,0.45)', transition: 'all 0.25s ease'
  },
  floatBadge: {
    position: 'absolute', top: '-2px', right: '-2px',
    background: '#E63946', color: 'white', borderRadius: '50%',
    width: '22px', height: '22px', fontSize: '0.7rem', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid white', animation: 'pulse 1.5s infinite'
  },
  chatBox: {
    width: 'min(340px, calc(100vw - 3rem))',
    background: 'white', borderRadius: '20px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
    overflow: 'hidden', border: '1.5px solid #e8e8ed'
  },
  livreursList: { background: 'white' },
  livreursHeader: {
    background: 'linear-gradient(135deg, #0077B6, #023e8a)',
    padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  livreursTitle: { color: 'white', fontWeight: '700', fontSize: '0.92rem' },
  livreurItem: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    padding: '0.9rem 1.2rem', cursor: 'pointer',
    borderBottom: '1px solid #f5f5f7', transition: 'background 0.2s'
  },
  livreurAvatar: {
    width: '40px', height: '40px', borderRadius: '50%',
    background: '#e3f2fd', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
  },
  livreurNom: { fontWeight: '700', fontSize: '0.9rem', color: '#0d0d0d' },
  livreurCmd: { fontSize: '0.72rem', color: '#aaa', marginTop: '0.1rem' },
  livreurBadge: {
    background: '#E63946', color: 'white', borderRadius: '50%',
    width: '22px', height: '22px', fontSize: '0.7rem', fontWeight: '900',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  chatContainer: { background: 'white' },
  chatBoxHeader: {
    background: 'linear-gradient(135deg, #0077B6, #023e8a)',
    padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
    fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  },
  chatBoxNom: { color: 'white', fontWeight: '700', fontSize: '0.88rem' },
  chatBoxCmd: { color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', marginTop: '0.1rem' },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
    fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  }
};

export default ChatFlottant;