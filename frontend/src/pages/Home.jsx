import React from 'react';

export default function Home() {
  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Bem-vindo ao Habilidade que Vence (🐼)</h1>
      <p>O que tiver mais pontuação vence e leva o acumulado!</p>
      
      <div style={{ backgroundColor: '#2d2d2d', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h3>Meu Saldo: R$ 0,00</h3>
        <button style={{ background: '#4CAF50', color: 'white', padding: '10px', margin: '5px' }}>Depositar Automático (Mín. R$ 0,50)</button>
        <button style={{ background: '#f44336', color: 'white', padding: '10px', margin: '5px' }}>Sacar (Dom, Mín R$ 10,00)</button>
        <p style={{ fontSize: '12px', color: '#aaa' }}>Link de indicação: Ganhe 8% por depósito de amigos!</p>
      </div>

      {/* Bloco do WhatsApp - Copiado da sua solicitação */}
      <div style={{ backgroundColor: '#075e54', padding: '20px', borderRadius: '10px', marginTop: '30px' }}>
        <h2>🐼 Desafio da Diretoria Sra Panda! 🐼</h2>
        <p>A Diretoria da Sra Panda lança um desafio para você!</p>
        <p>🎯 Jogue contra seu aliado e tente conquistar o dinheiro dele!</p>
        <p style={{ fontSize: '14px' }}>Este é um jogo que une estratégia, raciocínio e emoção. Cada decisão pode fazer a diferença, tornando cada partida uma experiência única. Se você é habilidoso em jogos de estratégia, esta é a oportunidade perfeita para testar suas capacidades e, quem sabe, conquistar alguns trocados.</p>
        <p><strong>Aceite o desafio, monte sua estratégia e mostre que você é um verdadeiro campeão!</strong></p>
        
        <a 
          href="https://chat.whatsapp.com/IAJfImmgqqz2Ea41KOX0vD?s=cl&p=a&ilr=1" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '15px', background: '#25D366', color: 'white', padding: '12px 20px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}
        >
          Entrar no Grupo Oficial
        </a>
      </div>
    </div>
  );
}
