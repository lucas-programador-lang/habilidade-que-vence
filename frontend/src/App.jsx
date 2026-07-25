import React, { useState } from 'react';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import GameRoom from './pages/GameRoom';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null); // Guardará os dados de login

  return (
    <div className="app-container" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      {/* Navegação Simples */}
      <nav style={{ padding: '10px', backgroundColor: '#333', display: 'flex', gap: '10px' }}>
        <button onClick={() => setCurrentPage('home')}>Início 🐼</button>
        <button onClick={() => setCurrentPage('game')}>Sala de Jogo 🎮</button>
        <button onClick={() => setCurrentPage('admin')}>Painel Admin ⚙️</button>
      </nav>

      {/* Renderização das Telas */}
      <main style={{ padding: '20px' }}>
        {currentPage === 'home' && <Home />}
        {currentPage === 'game' && <GameRoom />}
        {currentPage === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
