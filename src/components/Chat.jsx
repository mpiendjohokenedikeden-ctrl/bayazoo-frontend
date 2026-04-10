import React, { useEffect, useState, useRef } from 'react';
import { getMessages, sendMessage } from '../services/chatService';

const Chat = ({ orderId, user }) => {
  const [messages, setMessages] = useState([]);
  const [nouveau, setNouveau] = useState('');
  const [loading, setLoading] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [premierChargement, setPremierChargement] = useState(true);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const prevNbMessages = useRef(0);

  useEffect(() => {
    chargerMessages();
    const interval = setInterval(chargerMessages, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    const nbActuel = messages.length;
    const nouveauMessage = nbActuel > prevNbMessages.current;
    const dernierEstMoi = messages[nbActuel - 1]?.expediteurId === user.id;

    // Scroll uniquement au premier chargement ou si nouveau message
    if (premierChargement && nbActuel > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setPremierChargement(false);
    } else if (nouveauMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevNbMessages.current = nbActuel;
  }, [messages]);

  const chargerMessages = async () => {
    try {
      const res = await getMessages(orderId);
      setMessages(res.data);
    } catch (err) {}
  };

  const envoyer = async () => {
    if (!nouveau.trim()) return;
    setLoading(true);
    try {
      await sendMessage({ contenu: nouveau, orderId });
      setNouveau('');
      chargerMessages();
    } catch (err) {}
    setLoading(false);
  };

  const demarrerEnregistrement = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setEnregistrement(true);
    } catch (err) {
      alert('Microphone non accessible');
    }
  };

  const arreterEnregistrement = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setEnregistrement(false);
    }
  };

  const envoyerAudio = async () => {
    if (!audioBlob) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        await sendMessage({ contenu: '[AUDIO]:' + base64, orderId });
        setAudioBlob(null);
        setAudioURL(null);
        chargerMessages();
        setLoading(false);
      };
      reader.readAsDataURL(audioBlob);
    } catch (err) {
      setLoading(false);
    }
  };

  const annulerAudio = () => {
    setAudioBlob(null);
    setAudioURL(null);
  };

  const estAudio = (contenu) => contenu?.startsWith('[AUDIO]:');
  const getAudioSrc = (contenu) => contenu?.replace('[AUDIO]:', '');
  const estMoi = (msg) => msg.expediteurId === user.id;

  return (
    <div style={styles.chat}>
      <div style={styles.chatHeader}>
        <div style={styles.headerAvatar}>
          {user.role === 'livreur' ? '👤' : '🛵'}
        </div>
        <div>
          <p style={styles.headerNom}>{user.role === 'livreur' ? 'Client' : 'Livreur'}</p>
          <p style={styles.headerStatut}>🟢 En ligne</p>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.noMessages}>
            <p style={{ fontSize: '2rem' }}>💬</p>
            <p>Demarrez la conversation !</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ ...styles.msgWrapper, justifyContent: estMoi(msg) ? 'flex-end' : 'flex-start' }}>
              {!estMoi(msg) && (
                <div style={styles.avatarSmall}>
                  {msg.expediteurRole === 'livreur' ? '🛵' : '👤'}
                </div>
              )}
              <div style={{ ...styles.bubble, ...(estMoi(msg) ? styles.bubbleMoi : styles.bubbleAutre) }}>
                {!estMoi(msg) && <p style={styles.bubbleNom}>{msg.expediteurNom}</p>}
                {estAudio(msg.contenu) ? (
                  <audio controls src={getAudioSrc(msg.contenu)} style={styles.audio} />
                ) : (
                  <p style={styles.bubbleTexte}>{msg.contenu}</p>
                )}
                <p style={{ ...styles.bubbleHeure, color: estMoi(msg) ? 'rgba(255,255,255,0.6)' : '#aaa' }}>
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {estMoi(msg) && ' ✓✓'}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {audioURL && (
        <div style={styles.audioPreview}>
          <audio controls src={audioURL} style={{ flex: 1, height: '36px' }} />
          <button style={styles.sendAudioBtn} onClick={envoyerAudio} disabled={loading}>{loading ? '...' : '📤'}</button>
          <button style={styles.cancelAudioBtn} onClick={annulerAudio}>✕</button>
        </div>
      )}

      <div style={styles.inputArea}>
        {enregistrement ? (
          <button style={styles.stopBtn} onClick={arreterEnregistrement}>⏹️ Arreter</button>
        ) : (
          <button style={styles.micBtn} onClick={demarrerEnregistrement}>🎙️</button>
        )}
        <input
          style={styles.input}
          type="text"
          placeholder={enregistrement ? 'Enregistrement...' : 'Ecrire un message...'}
          value={nouveau}
          onChange={e => setNouveau(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && envoyer()}
          disabled={enregistrement}
        />
        <button style={{ ...styles.sendBtn, opacity: nouveau.trim() ? 1 : 0.5 }} onClick={envoyer} disabled={loading || !nouveau.trim()}>➤</button>
      </div>
    </div>
  );
};

const styles = {
  chat: { background: '#f0f2f5', borderRadius: '16px', overflow: 'hidden', marginTop: '0', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  chatHeader: { background: '#1A1A2E', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  headerAvatar: { fontSize: '1.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerNom: { color: 'white', fontWeight: '700', fontSize: '1rem' },
  headerStatut: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' },
  messages: { height: '280px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f0f2f5' },
  noMessages: { textAlign: 'center', color: '#aaa', margin: 'auto', fontSize: '0.9rem' },
  msgWrapper: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem' },
  avatarSmall: { fontSize: '1.2rem', background: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  bubble: { maxWidth: '70%', padding: '0.7rem 1rem', borderRadius: '18px', wordBreak: 'break-word' },
  bubbleMoi: { background: '#E63946', color: 'white', borderBottomRightRadius: '4px' },
  bubbleAutre: { background: 'white', color: '#333', borderBottomLeftRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  bubbleNom: { fontSize: '0.7rem', fontWeight: '700', color: '#E63946', marginBottom: '0.3rem' },
  bubbleTexte: { fontSize: '0.95rem', lineHeight: '1.4' },
  bubbleHeure: { fontSize: '0.65rem', marginTop: '0.3rem', textAlign: 'right' },
  audio: { width: '100%', marginTop: '0.3rem' },
  audioPreview: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', background: '#fff3cd', borderTop: '1px solid #ffe0a0' },
  sendAudioBtn: { background: '#2D6A4F', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' },
  cancelAudioBtn: { background: '#ffe0e0', color: '#c00', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: '700' },
  inputArea: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1rem', background: 'white', borderTop: '1px solid #e0e0e0' },
  micBtn: { background: '#f0f0f0', border: 'none', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' },
  stopBtn: { background: '#ffe0e0', color: '#c00', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  input: { flex: 1, padding: '0.7rem 1.2rem', borderRadius: '50px', border: '2px solid #e0e0e0', fontSize: '0.95rem', outline: 'none', background: '#f9f9f9' },
  sendBtn: { background: '#E63946', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '50%', fontWeight: '700', cursor: 'pointer', fontSize: '1.1rem' }
};

export default Chat;