import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getNonLus } from '../services/chatService';

const F = {
  titre: 'Georgia, serif',
  corps: "'Inter', -apple-system, sans-serif"
};

const IconHome = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IconMenu = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

const IconCart = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconOrders = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const IconLogin = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const IconDashboard = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconPizza = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M12 2 L2 12 L12 22"/>
    <circle cx="9" cy="9" r="1.5" fill={active ? '#E63946' : '#999'}/>
    <circle cx="15" cy="14" r="1.5" fill={active ? '#E63946' : '#999'}/>
  </svg>
);

const IconTeam = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconClock = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconScanner = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
);

const IconLogout = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconDelivery = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#E63946' : '#999'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [totalNonLus, setTotalNonLus] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { user, logout } = useAuth();
  const { nombreArticles } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user) return;
    chargerNonLus();
    const interval = setInterval(chargerNonLus, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const chargerNonLus = async () => {
    try {
      const res = await getNonLus();
      const total = Object.values(res.data).reduce((sum, v) => sum + v, 0);
      setTotalNonLus(total);
    } catch (err) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const Badge = ({ count }) => count > 0 ? (
    <span style={styles.badge}>{count}</span>
  ) : null;

  const BottomNavItem = ({ to, icon, label, badge }) => {
    const active = isActive(to);
    return (
      <Link to={to} style={{ ...styles.bottomItem, ...(active ? styles.bottomItemActive : {}) }}>
        <div style={styles.bottomIconWrap}>
          {icon}
          {badge > 0 && <span style={styles.bottomBadge}>{badge}</span>}
        </div>
        <span style={{ ...styles.bottomLabel, color: active ? '#E63946' : '#999' }}>{label}</span>
        {active && <div style={styles.bottomDot} />}
      </Link>
    );
  };

  const BottomNavBtn = ({ icon, label, onClick }) => (
    <button style={styles.bottomItemBtn} onClick={onClick}>
      <div style={styles.bottomIconWrap}>{icon}</div>
      <span style={styles.bottomLabel}>{label}</span>
    </button>
  );

  // ===== NAVBAR RECEVEUR =====
  if (user?.role === 'receveur') {
    return (
      <>
        <nav style={styles.navbar}>
          <div style={styles.logo}>
  <img src="/logo.png" alt="BAYAZOO" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
  BAY<span style={{ color: '#E63946' }}>A</span>ZOO
  <span style={{ ...styles.roleBadgeBase, background: '...' }}>...</span>
</div>
          <ul style={{ ...styles.navLinks, display: isMobile ? 'none' : 'flex' }}>
            <li>
              <Link to="/receveur/commandes" style={{ ...styles.link, ...(isActive('/receveur/commandes') ? styles.linkActif : {}) }}>
                Commandes
              </Link>
            </li>
            <li style={styles.userBox}>
              <div style={{ ...styles.userAvatar, background: '#FB8500' }}>{user.nom.charAt(0).toUpperCase()}</div>
              <span style={styles.userName}>{user.nom}</span>
              <button style={styles.logoutBtn} onClick={handleLogout}>Deconnexion</button>
            </li>
          </ul>
          <button style={{ ...styles.burgerBtn, display: isMobile ? 'flex' : 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
            <span style={styles.burgerIco}>{menuOpen ? '✕' : '☰'}</span>
          </button>
          {menuOpen && (
            <div style={styles.mobileMenu}>
              <div style={styles.mobileHeader}>
                <div style={{ ...styles.mobileAvatar, background: '#FB8500' }}>{user.nom.charAt(0).toUpperCase()}</div>
                <div>
                  <p style={styles.mobileNom}>{user.nom}</p>
                  <p style={styles.mobileRole}>Receveur</p>
                </div>
              </div>
              <div style={styles.mobileDivider} />
              <Link to="/receveur/commandes" style={{ ...styles.mobileLink, ...(isActive('/receveur/commandes') ? styles.mobileLinkActive : {}) }} onClick={() => setMenuOpen(false)}>
                <div style={styles.mobileLinkIcon}><IconOrders active={isActive('/receveur/commandes')} /></div>
                Commandes
              </Link>
              <div style={styles.mobileDivider} />
              <button style={styles.mobileLogoutBtn} onClick={handleLogout}>Se deconnecter</button>
            </div>
          )}
        </nav>
        <div style={{ ...styles.bottomNav, display: isMobile ? 'flex' : 'none' }}>
          <BottomNavItem to="/receveur/commandes" icon={<IconOrders active={isActive('/receveur/commandes')} />} label="Commandes" />
          <BottomNavBtn icon={<IconLogout />} label="Quitter" onClick={handleLogout} />
        </div>
      </>
    );
  }

  // ===== NAVBAR LIVREUR =====
  if (user?.role === 'livreur') {
    return (
      <>
        <nav style={styles.navbar}>
         <div style={styles.logo}>
  <img src="/logo.png" alt="BAYAZOO" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
  BAY<span style={{ color: '#E63946' }}>A</span>ZOO
  <span style={{ ...styles.roleBadgeBase, background: '...' }}>...</span>
</div>
          <ul style={{ ...styles.navLinks, display: isMobile ? 'none' : 'flex' }}>
            <li>
              <Link to="/livreur/commandes" style={{ ...styles.link, ...(isActive('/livreur/commandes') ? styles.linkActif : {}) }}>
                <span style={styles.linkInner}>Livraisons <Badge count={totalNonLus} /></span>
              </Link>
            </li>
            <li>
              <Link to="/livreur/scanner" style={{ ...styles.link, ...(isActive('/livreur/scanner') ? styles.linkActif : {}) }}>
                Scanner
              </Link>
            </li>
            <li style={styles.userBox}>
              <div style={{ ...styles.userAvatar, background: '#0077B6' }}>{user.nom.charAt(0).toUpperCase()}</div>
              <span style={styles.userName}>{user.nom}</span>
              <button style={styles.logoutBtn} onClick={handleLogout}>Deconnexion</button>
            </li>
          </ul>
          <button style={{ ...styles.burgerBtn, display: isMobile ? 'flex' : 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
            <span style={styles.burgerIco}>{menuOpen ? '✕' : '☰'}</span>
          </button>
          {menuOpen && (
            <div style={styles.mobileMenu}>
              <div style={styles.mobileHeader}>
                <div style={{ ...styles.mobileAvatar, background: '#0077B6' }}>{user.nom.charAt(0).toUpperCase()}</div>
                <div>
                  <p style={styles.mobileNom}>{user.nom}</p>
                  <p style={styles.mobileRole}>Livreur</p>
                </div>
              </div>
              <div style={styles.mobileDivider} />
              <Link to="/livreur/commandes" style={{ ...styles.mobileLink, ...(isActive('/livreur/commandes') ? styles.mobileLinkActive : {}) }} onClick={() => setMenuOpen(false)}>
                <div style={styles.mobileLinkIcon}><IconDelivery active={isActive('/livreur/commandes')} /></div>
                Livraisons
                {totalNonLus > 0 && <span style={styles.mobileBadge}>{totalNonLus}</span>}
              </Link>
              <Link to="/livreur/scanner" style={{ ...styles.mobileLink, ...(isActive('/livreur/scanner') ? styles.mobileLinkActive : {}) }} onClick={() => setMenuOpen(false)}>
                <div style={styles.mobileLinkIcon}><IconScanner active={isActive('/livreur/scanner')} /></div>
                Scanner
              </Link>
              <div style={styles.mobileDivider} />
              <button style={styles.mobileLogoutBtn} onClick={handleLogout}>Se deconnecter</button>
            </div>
          )}
        </nav>
        <div style={{ ...styles.bottomNav, display: isMobile ? 'flex' : 'none' }}>
          <BottomNavItem to="/livreur/commandes" icon={<IconDelivery active={isActive('/livreur/commandes')} />} label="Livraisons" badge={totalNonLus} />
          <BottomNavItem to="/livreur/scanner" icon={<IconScanner active={isActive('/livreur/scanner')} />} label="Scanner" />
          <BottomNavBtn icon={<IconLogout />} label="Quitter" onClick={handleLogout} />
        </div>
      </>
    );
  }

  // ===== NAVBAR ADMIN =====
  if (user?.role === 'admin') {
    return (
      <>
        <nav style={styles.navbar}>
         <div style={styles.logo}>
  <img src="/logo.png"  style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
  BAY<span style={{ color: '#E63946' }}>A</span>ZOO
  <span style={{ ...styles.roleBadgeBase, background: '...' }}>...</span>
</div>
          <ul style={{ ...styles.navLinks, display: isMobile ? 'none' : 'flex' }}>
            {[
              { to: '/admin', label: 'Dashboard' },
              { to: '/admin/commandes', label: 'Commandes' },
              { to: '/admin/pizzas', label: 'Pizzas' },
              { to: '/admin/livreurs', label: 'Equipe' },
              { to: '/admin/horaires', label: 'Horaires' }
            ].map(item => (
              <li key={item.to}>
                <Link to={item.to} style={{ ...styles.link, ...(isActive(item.to) ? styles.linkActif : {}) }}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={styles.userBox}>
              <div style={{ ...styles.userAvatar, background: '#E63946' }}>{user.nom.charAt(0).toUpperCase()}</div>
              <span style={styles.userName}>{user.nom}</span>
              <button style={styles.logoutBtn} onClick={handleLogout}>Deconnexion</button>
            </li>
          </ul>
          <button style={{ ...styles.burgerBtn, display: isMobile ? 'flex' : 'none' }} onClick={() => setMenuOpen(!menuOpen)}>
            <span style={styles.burgerIco}>{menuOpen ? '✕' : '☰'}</span>
          </button>
          {menuOpen && (
            <div style={styles.mobileMenu}>
              <div style={styles.mobileHeader}>
                <div style={{ ...styles.mobileAvatar, background: '#E63946' }}>{user.nom.charAt(0).toUpperCase()}</div>
                <div>
                  <p style={styles.mobileNom}>{user.nom}</p>
                  <p style={styles.mobileRole}>Administrateur</p>
                </div>
              </div>
              <div style={styles.mobileDivider} />
              {[
                { to: '/admin', icon: <IconDashboard active={isActive('/admin')} />, label: 'Dashboard' },
                { to: '/admin/commandes', icon: <IconOrders active={isActive('/admin/commandes')} />, label: 'Commandes' },
                { to: '/admin/pizzas', icon: <IconPizza active={isActive('/admin/pizzas')} />, label: 'Pizzas' },
                { to: '/admin/livreurs', icon: <IconTeam active={isActive('/admin/livreurs')} />, label: 'Equipe' },
                { to: '/admin/horaires', icon: <IconClock active={isActive('/admin/horaires')} />, label: 'Horaires' }
              ].map(item => (
                <Link key={item.to} to={item.to}
                  style={{ ...styles.mobileLink, ...(isActive(item.to) ? styles.mobileLinkActive : {}) }}
                  onClick={() => setMenuOpen(false)}>
                  <div style={styles.mobileLinkIcon}>{item.icon}</div>
                  {item.label}
                </Link>
              ))}
              <div style={styles.mobileDivider} />
              <button style={styles.mobileLogoutBtn} onClick={handleLogout}>Se deconnecter</button>
            </div>
          )}
        </nav>
        <div style={{ ...styles.bottomNav, display: isMobile ? 'flex' : 'none' }}>
          <BottomNavItem to="/admin" icon={<IconDashboard active={isActive('/admin')} />} label="Dashboard" />
          <BottomNavItem to="/admin/commandes" icon={<IconOrders active={isActive('/admin/commandes')} />} label="Commandes" />
          <BottomNavItem to="/admin/pizzas" icon={<IconPizza active={isActive('/admin/pizzas')} />} label="Pizzas" />
          <BottomNavItem to="/admin/livreurs" icon={<IconTeam active={isActive('/admin/livreurs')} />} label="Equipe" />
          <BottomNavItem to="/admin/horaires" icon={<IconClock active={isActive('/admin/horaires')} />} label="Horaires" />
        </div>
      </>
    );
  }

  // ===== NAVBAR CLIENT =====
  return (
    <>
      <nav style={styles.navbar}>
       <Link to="/" style={styles.logo} onClick={() => setMenuOpen(false)}>
  <img src="/logo.png"  style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
  BAYAZOO
</Link>
        <ul style={{ ...styles.navLinks, display: isMobile ? 'none' : 'flex' }}>
          <li><Link to="/" style={{ ...styles.link, ...(isActive('/') ? styles.linkActif : {}) }}>Accueil</Link></li>
          <li><Link to="/menu" style={{ ...styles.link, ...(isActive('/menu') ? styles.linkActif : {}) }}>Menu</Link></li>
          <li>
            <Link to="/panier" style={{ ...styles.link, ...(isActive('/panier') ? styles.linkActif : {}) }}>
              <span style={styles.linkInner}>Panier <Badge count={nombreArticles} /></span>
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/suivi" style={{ ...styles.link, ...(isActive('/suivi') ? styles.linkActif : {}) }}>
                  <span style={styles.linkInner}>Commandes <Badge count={totalNonLus} /></span>
                </Link>
              </li>
              <li style={styles.userBox}>
                <div style={styles.userAvatar}>{user.nom.charAt(0).toUpperCase()}</div>
                <span style={styles.userName}>{user.nom}</span>
                <button style={styles.logoutBtn} onClick={handleLogout}>Deconnexion</button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" style={styles.btnLogin}>Connexion</Link></li>
              <li><Link to="/inscription" style={styles.btnInscription}>S'inscrire</Link></li>
            </>
          )}
        </ul>

        <div style={{ ...styles.mobileRight, display: isMobile ? 'flex' : 'none' }}>
          <Link to="/panier" style={{ position: 'relative', textDecoration: 'none' }}>
            <IconCart active={isActive('/panier')} />
            {nombreArticles > 0 && (
              <span style={{ ...styles.badge, position: 'absolute', top: '-6px', right: '-8px', fontSize: '0.55rem' }}>
                {nombreArticles}
              </span>
            )}
          </Link>
          <button style={{ ...styles.burgerBtn, display: 'flex' }} onClick={() => setMenuOpen(!menuOpen)}>
            <span style={styles.burgerIco}>{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {menuOpen && (
          <div style={styles.mobileMenu}>
            {user && (
              <>
                <div style={styles.mobileHeader}>
                  <div style={styles.mobileAvatar}>{user.nom.charAt(0).toUpperCase()}</div>
                  <div>
                    <p style={styles.mobileNom}>{user.nom}</p>
                    <p style={styles.mobileRole}>Client</p>
                  </div>
                </div>
                <div style={styles.mobileDivider} />
              </>
            )}
            {[
              { to: '/', icon: <IconHome active={isActive('/')} />, label: 'Accueil' },
              { to: '/menu', icon: <IconMenu active={isActive('/menu')} />, label: 'Menu' },
              { to: '/panier', icon: <IconCart active={isActive('/panier')} />, label: 'Panier' + (nombreArticles > 0 ? ' (' + nombreArticles + ')' : '') }
            ].map(item => (
              <Link key={item.to} to={item.to}
                style={{ ...styles.mobileLink, ...(isActive(item.to) ? styles.mobileLinkActive : {}) }}
                onClick={() => setMenuOpen(false)}>
                <div style={styles.mobileLinkIcon}>{item.icon}</div>
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/suivi"
                  style={{ ...styles.mobileLink, ...(isActive('/suivi') ? styles.mobileLinkActive : {}) }}
                  onClick={() => setMenuOpen(false)}>
                  <div style={styles.mobileLinkIcon}><IconOrders active={isActive('/suivi')} /></div>
                  Mes commandes
                  {totalNonLus > 0 && <span style={styles.mobileBadge}>{totalNonLus}</span>}
                </Link>
                <div style={styles.mobileDivider} />
                <button style={styles.mobileLogoutBtn} onClick={handleLogout}>Se deconnecter</button>
              </>
            ) : (
              <>
                <div style={styles.mobileDivider} />
                <Link to="/login" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                  <div style={styles.mobileLinkIcon}><IconLogin active={false} /></div>
                  Connexion
                </Link>
                <Link to="/inscription" style={styles.mobileLinkPrimary} onClick={() => setMenuOpen(false)}>
                  S'inscrire gratuitement
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div style={{ ...styles.bottomNav, display: isMobile ? 'flex' : 'none' }}>
        <BottomNavItem to="/" icon={<IconHome active={isActive('/')} />} label="Accueil" />
        <BottomNavItem to="/menu" icon={<IconMenu active={isActive('/menu')} />} label="Menu" />
        <BottomNavItem to="/panier" icon={<IconCart active={isActive('/panier')} />} label="Panier" badge={nombreArticles} />
        {user ? (
          <BottomNavItem to="/suivi" icon={<IconOrders active={isActive('/suivi')} />} label="Commandes" badge={totalNonLus} />
        ) : (
          <BottomNavItem to="/login" icon={<IconLogin active={isActive('/login')} />} label="Connexion" />
        )}
      </div>
    </>
  );
};

const roleBadgeBase = {
  fontSize: '0.68rem', padding: '0.25rem 0.8rem',
  borderRadius: '100px', fontWeight: '700',
  color: 'white', fontFamily: "'Inter', sans-serif", letterSpacing: '0.03em'
};

const styles = {
  navbar: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.85rem 5%',
    background: 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 1px 0 rgba(0,0,0,0.04)'
  },
  logo: {
    fontFamily: 'Georgia, serif', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
    fontWeight: '900', color: '#0d0d0d', textDecoration: 'none',
    display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em'
  },
  roleBadgeBase,
  navLinks: { listStyle: 'none', display: 'flex', alignItems: 'center', gap: '2rem', margin: 0, padding: 0 },
  link: {
    textDecoration: 'none', color: '#555', fontWeight: '500',
    fontSize: '0.9rem', fontFamily: "'Inter', sans-serif", transition: 'color 0.2s ease'
  },
  linkActif: { color: '#E63946', fontWeight: '700' },
  linkInner: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', position: 'relative' },
  badge: {
    background: '#E63946', color: 'white', fontSize: '0.6rem',
    fontWeight: '900', padding: '2px 6px', borderRadius: '100px',
    minWidth: '16px', textAlign: 'center', fontFamily: "'Inter', sans-serif"
  },
  btnLogin: {
    background: '#E63946', color: 'white', padding: '0.5rem 1.3rem',
    borderRadius: '100px', textDecoration: 'none', fontWeight: '700',
    fontSize: '0.88rem', fontFamily: "'Inter', sans-serif",
    boxShadow: '0 4px 12px rgba(230,57,70,0.22)'
  },
  btnInscription: {
    border: '1.5px solid #E63946', color: '#E63946', padding: '0.5rem 1.3rem',
    borderRadius: '100px', textDecoration: 'none', fontWeight: '700',
    fontSize: '0.88rem', fontFamily: "'Inter', sans-serif"
  },
  userBox: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  userAvatar: {
    width: '32px', height: '32px', background: '#E63946', color: 'white',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", flexShrink: 0
  },
  userName: {
    fontWeight: '600', color: '#0d0d0d', fontSize: '0.88rem',
    whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif"
  },
  logoutBtn: {
    background: '#f5f5f7', color: '#555', border: 'none',
    padding: '0.4rem 1rem', borderRadius: '100px', fontWeight: '600',
    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem',
    fontFamily: "'Inter', sans-serif"
  },
  burgerBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem',
    alignItems: 'center', justifyContent: 'center', borderRadius: '8px',
    width: '36px', height: '36px'
  },
  burgerIco: { fontSize: '1.4rem', color: '#0d0d0d', lineHeight: 1 },
  mobileRight: { alignItems: 'center', gap: '1rem', position: 'relative' },
  mobileMenu: {
    position: 'fixed', top: '60px', left: 0, right: 0,
    background: 'white', padding: '1rem 1.5rem 1.5rem',
    boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    zIndex: 999, borderTop: '1px solid #f0f0f0', borderRadius: '0 0 20px 20px'
  },
  mobileHeader: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0 0.8rem' },
  mobileAvatar: {
    width: '44px', height: '44px', background: '#E63946', color: 'white',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '900', fontSize: '1.1rem', fontFamily: "'Inter', sans-serif", flexShrink: 0
  },
  mobileNom: { fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '1rem', color: '#0d0d0d' },
  mobileRole: { fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', color: '#aaa', marginTop: '0.1rem' },
  mobileDivider: { height: '1px', background: '#f5f5f7', margin: '0.5rem 0' },
  mobileLink: {
    textDecoration: 'none', color: '#333', fontWeight: '600',
    padding: '0.9rem 1rem', borderRadius: '12px',
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    fontSize: '0.95rem', fontFamily: "'Inter', sans-serif"
  },
  mobileLinkActive: { background: '#fff0f0', color: '#E63946' },
  mobileLinkIcon: { width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mobileBadge: {
    background: '#E63946', color: 'white', fontSize: '0.65rem',
    fontWeight: '700', padding: '2px 8px', borderRadius: '100px',
    marginLeft: 'auto', fontFamily: "'Inter', sans-serif"
  },
  mobileLinkPrimary: {
    textDecoration: 'none', background: '#E63946', color: 'white',
    fontWeight: '700', padding: '0.9rem 1rem', borderRadius: '12px',
    display: 'block', textAlign: 'center', fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif", boxShadow: '0 4px 12px rgba(230,57,70,0.25)'
  },
  mobileLogoutBtn: {
    background: '#f5f5f7', color: '#666', border: 'none',
    padding: '0.9rem 1rem', borderRadius: '12px', fontWeight: '600',
    cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem',
    fontFamily: "'Inter', sans-serif", width: '100%'
  },
  bottomNav: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(255,255,255,0.98)',
    backdropFilter: 'blur(24px) saturate(200%)',
    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
    borderTop: '1px solid rgba(0,0,0,0.06)',
    zIndex: 1000, padding: '0.5rem 0 0.9rem',
    justifyContent: 'space-around', alignItems: 'center',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
  },
  bottomItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.25rem', padding: '0.3rem 0.8rem', textDecoration: 'none',
    color: '#999', fontFamily: "'Inter', sans-serif",
    position: 'relative', minWidth: '60px', transition: 'all 0.2s ease'
  },
  bottomItemActive: { color: '#E63946' },
  bottomItemBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.25rem', padding: '0.3rem 0.8rem', background: 'none',
    border: 'none', cursor: 'pointer', color: '#999',
    fontFamily: "'Inter', sans-serif", minWidth: '60px'
  },
  bottomIconWrap: {
    position: 'relative', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    width: '24px', height: '24px'
  },
  bottomLabel: {
    fontSize: '0.6rem', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    fontFamily: "'Inter', sans-serif"
  },
  bottomDot: {
    position: 'absolute', bottom: '-4px', left: '50%',
    transform: 'translateX(-50%)', width: '4px', height: '4px',
    background: '#E63946', borderRadius: '50%'
  },
  bottomBadge: {
    position: 'absolute', top: '-6px', right: '-8px',
    background: '#E63946', color: 'white', fontSize: '0.5rem',
    fontWeight: '900', padding: '2px 5px', borderRadius: '100px',
    fontFamily: "'Inter', sans-serif", minWidth: '14px', textAlign: 'center'
  }
};

export default Navbar;