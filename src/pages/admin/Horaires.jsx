const styles = {
  page: { maxWidth: '900px', margin: '0 auto', padding: 'clamp(4.5rem, 10vw, 6rem) 1rem 6rem', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
  titre: { fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: '900', color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: '0.4rem' },
  sousTitre: { color: '#aaa', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", marginBottom: '1.5rem' },
  succes: { background: '#f0faf5', color: '#2D6A4F', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', fontWeight: '600', fontFamily: "'Inter', sans-serif", border: '1.5px solid #b7e4c7' },
  apercuGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' },
  apercuCard: { borderRadius: '12px', padding: '0.7rem', textAlign: 'center' },
  liste: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  // ✅ Card en colonne sur mobile
  card: { background: 'white', borderRadius: '16px', padding: '1.2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardLeft: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  jour: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: '700', color: '#0d0d0d' },
  toggle: { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' },
  toggleTrack: { width: '46px', height: '26px', borderRadius: '100px', position: 'relative', transition: 'background 0.3s ease', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: '3px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'transform 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  toggleLabel: { fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', fontWeight: '600', color: '#555' },
  // ✅ Heures en colonne sur mobile — plus de coupure
  heures: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' },
  heureGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  heureLabel: { fontFamily: "'Inter', sans-serif", fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  // ✅ Input time prend toute la largeur
  timeInput: { padding: '0.7rem 0.8rem', borderRadius: '10px', border: '1.5px solid #e8e8ed', fontSize: '1rem', fontFamily: "'Inter', sans-serif", fontWeight: '700', color: '#0d0d0d', outline: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' },
  separateurHeure: { color: '#aaa', fontWeight: '700', textAlign: 'center' },
  saveBtn: { background: '#E63946', color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '100px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(230,57,70,0.22)', width: '100%' }
};