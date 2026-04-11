import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Accueil from './pages/Accueil';
import Menu from './pages/Menu';
import Panier from './pages/Panier';
import Login from './pages/Login';
import Inscription from './pages/Inscription';
import Suivi from './pages/Suivi';
import Dashboard from './pages/admin/Dashboard';
import Pizzas from './pages/admin/Pizzas';
import Commandes from './pages/admin/Commandes';
import Livreurs from './pages/admin/Livreurs';
import Horaires from './pages/admin/Horaires';
import MesCommandes from './pages/livreur/MesCommandes';
import Scanner from './pages/livreur/Scanner';
import ReceveurCommandes from './pages/receveur/Commandes';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatFlottant from './components/ChatFlottant';
import MotDePasseOublie from './pages/MotDePasseOublie';
import './index.css';

const RouteProtegee = ({ element, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'livreur') return <Navigate to="/livreur/commandes" replace />;
    if (user.role === 'receveur') return <Navigate to="/receveur/commandes" replace />;
    return <Navigate to="/" replace />;
  }
  return element;
};

const RouteClient = ({ element }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'livreur') return <Navigate to="/livreur/commandes" replace />;
  if (user.role === 'receveur') return <Navigate to="/receveur/commandes" replace />;
  return element;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/login" element={<Login />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/panier" element={<RouteClient element={<Panier />} />} />
        <Route path="/suivi" element={<RouteClient element={<Suivi />} />} />
        <Route path="/admin" element={<RouteProtegee element={<Dashboard />} role="admin" />} />
        <Route path="/admin/pizzas" element={<RouteProtegee element={<Pizzas />} role="admin" />} />
        <Route path="/admin/commandes" element={<RouteProtegee element={<Commandes />} role="admin" />} />
        <Route path="/admin/livreurs" element={<RouteProtegee element={<Livreurs />} role="admin" />} />
        <Route path="/admin/horaires" element={<RouteProtegee element={<Horaires />} role="admin" />} />
        <Route path="/livreur/commandes" element={<RouteProtegee element={<MesCommandes />} role="livreur" />} />
        <Route path="/livreur/scanner" element={<RouteProtegee element={<Scanner />} role="livreur" />} />
        <Route path="/receveur/commandes" element={<RouteProtegee element={<ReceveurCommandes />} role="receveur" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatFlottant />
      <Footer />
    </Router>
  );
}

export default App;