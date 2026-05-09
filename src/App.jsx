/**
 * KAJUN CHICKEN & SEAFOOD — App
 * Designed & Built by ZAI (Zawwar Sami)
 * github.com/zawwarsami16
 * All Rights Reserved © 2025 Zawwar Sami
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import CartSidebar from './components/CartSidebar';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';
import KAI from './components/KAI';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Locations from './pages/Locations';
import Receipt from './pages/Receipt';
import Admin from './pages/Admin';
import Arcade from './pages/games/Arcade';
import Chess from './pages/games/Chess';
import Ludo from './pages/games/Ludo';
import TicTacToe from './pages/games/TicTacToe';



function Layout() {
  const [cartOpen, setCartOpen] = useState(false);
  const loc = useLocation();
  const isReceipt = loc.pathname === '/receipt';
  const isAdmin   = loc.pathname === '/admin';

  useEffect(() => { window.scrollTo({ top:0, behavior:'instant' }); }, [loc.pathname]);

  return (
    <>
      <div className="grain-overlay" aria-hidden="true"/>

      {!isAdmin && <AnnouncementBar/>}
      {!isAdmin && <Navbar onCart={() => setCartOpen(true)}/>}
      {!isAdmin && <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)}/>}

      <main>
        <Routes>
          <Route path="/"                element={<Home/>}/>
          <Route path="/menu"            element={<Menu/>}/>
          <Route path="/about"           element={<About/>}/>
          <Route path="/locations"       element={<Locations/>}/>
          <Route path="/receipt"         element={<Receipt/>}/>
          <Route path="/admin"           element={<Admin/>}/>
          <Route path="/games"           element={<Arcade/>}/>
          <Route path="/games/chess"     element={<Chess/>}/>
          <Route path="/games/ludo"      element={<Ludo/>}/>
          <Route path="/games/tictactoe" element={<TicTacToe/>}/>
          <Route path="*"                element={<Home/>}/>
        </Routes>
      </main>

      {!isReceipt && !isAdmin && <KAI/>}
      {!isReceipt && !isAdmin && <Footer/>}
    </>
  );
}

// Vite injects import.meta.env.BASE_URL from vite.config.js base.
//   GitHub Pages build (BASE_PATH=/Kajun-chicken-and-seafood/) -> '/Kajun-chicken-and-seafood/'
//   Vercel / custom domain (no BASE_PATH)                       -> '/'
const ROUTER_BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

export default function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AdminProvider>
        <CartProvider>
          <ToastProvider>
            <Layout/>
          </ToastProvider>
        </CartProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}
