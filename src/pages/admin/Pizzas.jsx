import React, { useEffect, useState, useRef } from 'react';
import { getPizzas, createPizza, updatePizza, deletePizza } from '../../services/pizzaService';
import api from '../../services/api';

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith('/uploads/')) {
    return 'http://' + window.location.hostname + ':5000' + image;
  }
  return null;
};

const Pizzas = () => {
  const [pizzas, setPizzas] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState({ nom: '', description: '', prix: '', image: '' });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { chargerPizzas(); }, []);

  const chargerPizzas = () => {
    getPizzas().then(res => setPizzas(res.data)).catch(() => {});
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
    setUploadLoading(true);
    setErreur('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, image: res.data.url }));
      setSucces('Image uploadee avec succes !');
    } catch (err) {
      setErreur('Erreur lors de l\'upload');
    }
    setUploadLoading(false);
  };

  const handleSubmit = async () => {
    setErreur('');
    if (!form.nom || !form.prix) { setErreur('Nom et prix sont obligatoires'); return; }
    if (!form.image) { setErreur('Veuillez choisir une image'); return; }
    try {
      if (editId) {
        await updatePizza(editId, form);
        setSucces('Pizza modifiee !');
      } else {
        await createPizza(form);
        setSucces('Pizza ajoutee !');
      }
      setForm({ nom: '', description: '', prix: '', image: '' });
      setImagePreview(null);
      setEditId(null);
      setShowForm(false);
      chargerPizzas();
    } catch (err) {
      setErreur('Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (pizza) => {
    setForm({ nom: pizza.nom, description: pizza.description, prix: pizza.prix, image: pizza.image });
    setImagePreview(getImageUrl(pizza.image));
    setEditId(pizza.id);
    setShowForm(true);
    setErreur(''); setSucces('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette pizza ?')) {
      await deletePizza(id);
      chargerPizzas();
    }
  };

  const annuler = () => {
    setShowForm(false); setEditId(null);
    setForm({ nom: '', description: '', prix: '', image: '' });
    setImagePreview(null); setErreur(''); setSucces('');
  };

  // Filtrage
  const pizzasFiltrees = pizzas.filter(p =>
    p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="page">
      <div style={styles.pageHeader}>
        <h1 className="page-title">Gestion <span>Pizzas</span></h1>
        <button style={styles.addBtn} onClick={() => {
          setShowForm(!showForm); setEditId(null);
          setForm({ nom: '', description: '', prix: '', image: '' });
          setImagePreview(null); setErreur(''); setSucces('');
        }}>
          {showForm ? 'Annuler' : '+ Nouvelle pizza'}
        </button>
      </div>

      {succes && <div style={styles.succes}>{succes}</div>}
      {erreur && <div style={styles.erreur}>{erreur}</div>}

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {editId ? '✏️ Modifier la pizza' : '🍕 Ajouter une pizza'}
          </h2>
          <div style={styles.formLayout}>
            <div style={styles.imageSection}>
              <label style={styles.label}>Photo de la pizza</label>
              <div style={styles.imageUploadZone} onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" style={styles.imagePreview} />
                ) : (
                  <div style={styles.imagePlaceholder}>
                    <p style={{ fontSize: '3rem' }}>📷</p>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Cliquez pour choisir une image
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.75rem' }}>JPG, PNG, WEBP — max 5MB</p>
                  </div>
                )}
                {uploadLoading && (
                  <div style={styles.uploadOverlay}>
                    <p style={{ color: 'white', fontWeight: '700' }}>⏳ Upload en cours...</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {imagePreview && (
                <button style={styles.changeImageBtn} onClick={() => fileInputRef.current?.click()}>
                  📷 Changer l'image
                </button>
              )}
            </div>
            <div style={styles.formFields}>
              <div style={styles.field}>
                <label style={styles.label}>Nom de la pizza *</label>
                <input style={styles.input} type="text" placeholder="Ex: Margherita" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Prix (FCFA) *</label>
                <input style={styles.input} type="number" placeholder="Ex: 5000" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: '100px', resize: 'vertical' }} placeholder="Ex: Tomate, mozzarella, basilic..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={styles.formBtns}>
                <button style={styles.saveBtn} onClick={handleSubmit} disabled={uploadLoading}>
                  {uploadLoading ? 'Upload...' : editId ? '✅ Modifier' : '✅ Ajouter'}
                </button>
                <button style={styles.cancelBtn} onClick={annuler}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRE DE RECHERCHE */}
      <div style={styles.searchRow}>
        <div style={styles.searchBar}>
          <span>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Rechercher une pizza..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          {recherche && <button style={styles.clearBtn} onClick={() => setRecherche('')}>✕</button>}
        </div>
        <p style={styles.count}>{pizzasFiltrees.length} pizza(s) trouvee(s)</p>
      </div>

      {/* LISTE */}
      {pizzasFiltrees.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize: '3rem' }}>🍕</p>
          <p style={{ color: '#666' }}>{recherche ? 'Aucune pizza trouvee' : 'Aucune pizza pour le moment'}</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {pizzasFiltrees.map(pizza => {
            const imgUrl = getImageUrl(pizza.image);
            return (
              <div key={pizza.id} style={styles.card}>
                <div style={styles.cardImgWrapper}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={pizza.nom} style={styles.cardImg} />
                  ) : (
                    <div style={styles.cardImgPlaceholder}>🍕</div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardNom}>{pizza.nom}</h3>
                  <p style={styles.cardDesc}>{pizza.description}</p>
                  <p style={styles.cardPrix}>{parseFloat(pizza.prix).toLocaleString()} FCFA</p>
                  <div style={styles.cardBtns}>
                    <button style={styles.editBtn} onClick={() => handleEdit(pizza)}>✏️ Modifier</button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(pizza.id)}>🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  addBtn: { background: '#E63946', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' },
  succes: { background: '#d4edda', color: '#2D6A4F', padding: '1rem', borderRadius: '10px', marginBottom: '1rem', fontWeight: '600' },
  erreur: { background: '#ffe0e0', color: '#c00', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' },
  formCard: { background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', marginBottom: '2rem' },
  formLayout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'flex-start' },
  imageSection: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  imageUploadZone: { width: '100%', height: '220px', borderRadius: '16px', border: '3px dashed #e0e0e0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: '#f9f9f9' },
  imagePreview: { width: '100%', height: '100%', objectFit: 'cover' },
  imagePlaceholder: { textAlign: 'center', padding: '1rem' },
  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  changeImageBtn: { background: '#1A1A2E', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  formFields: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' },
  input: { padding: '0.8rem', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' },
  formBtns: { display: 'flex', gap: '1rem', marginTop: '0.5rem' },
  saveBtn: { background: '#2D6A4F', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' },
  cancelBtn: { background: '#f0f0f0', color: '#333', border: 'none', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: '700', cursor: 'pointer' },
  searchRow: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  searchBar: { flex: 1, display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '0.5rem 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '2px solid #e0e0e0', gap: '0.8rem', minWidth: '250px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', background: 'transparent' },
  clearBtn: { background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: '700' },
  count: { color: '#888', fontSize: '0.9rem', whiteSpace: 'nowrap' },
  empty: { background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' },
  card: { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  cardImgWrapper: { width: '100%', height: '180px', overflow: 'hidden', background: '#f9f9f9' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: '#fff5f5' },
  cardBody: { padding: '1.2rem' },
  cardNom: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', marginBottom: '0.4rem', color: '#1A1A2E' },
  cardDesc: { color: '#888', fontSize: '0.85rem', marginBottom: '0.8rem' },
  cardPrix: { color: '#E63946', fontWeight: '700', fontSize: '1.1rem', marginBottom: '1rem' },
  cardBtns: { display: 'flex', gap: '0.5rem' },
  editBtn: { flex: 1, background: '#f0f0f0', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  deleteBtn: { flex: 1, background: '#ffe0e0', color: '#c00', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }
};

export default Pizzas;