import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Conecta ao servidor (Substitua pelo link do seu backend quando publicar)
const socket = io('http://localhost:5000'); 

export default function GameRoom() {
  const [jogadores, setJogadores] = useState([]);
  const [valorAcumulado, setValorAcumulado] = useState(0);
  const [chat, setChat] = useState([]);
  const [mensagemInput, setMensagemInput] = useState('');
  const [meuNome, setMeuNome] = useState('Jogador' + Math.floor(Math.random() * 100)); // Nome provisório

  useEffect(() => {
    // 1. Entra na sala automaticamente ao abrir a página
    socket.emit('entrar_jogo', { nome: meuNome });

    // 2. Escuta as atualizações do placar e do pote em tempo real
    socket.on('atualizar_sala', (dadosSala) => {
      setJogadores(dadosSala.jogadores);
      setValorAcumulado(dadosSala.valorAcumulado);
    });

    // 3. Escuta novas mensagens no chat
    socket.on('nova_mensagem', (msg) => {
      setChat((chatAntigo) => [...chatAntigo, msg]);
    });

    return () => {
      socket.off('atualizar_sala');
      socket.off('nova_mensagem');
    };
  }, []);

  // Função do Chat
  const enviarMensagem = (e) => {
    e.preventDefault();
    if (mensagemInput.trim() !== '') {
      socket.emit('enviar_mensagem', { nome: meuNome, texto: mensagemInput });
      setMensagemInput(''); // Limpa o campo
    }
  };

  // Função do Jogo (Simulando o ganho de habilidade/pontos)
  const jogar = () => {
    socket.emit('marcar_ponto');
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px', color: 'white' }}>
      
      {/* 🟢 ÁREA DO JOGO E PLACAR */}
      <div style={{ flex: 2, background: '#1e1e1e', padding: '20px', borderRadius: '10px' }}>
        <h2>🎮 Arena: Habilidade que Vence</h2>
        <div style={{ background: '#FFD700', color: 'black', padding: '10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '20px', textAlign: 'center', marginBottom: '20px' }}>
          💰 Pote Acumulado: R$ {valorAcumulado.toFixed(2)}
        </div>

        {/* O JOGO EM SI (Botão provisório para testar a pontuação) */}
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <button onClick={jogar} style={{ background: '#25D366', color: 'white', padding: '20px 40px', fontSize: '24px', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0px 5px 15px rgba(37, 211, 102, 0.4)' }}>
            🎯 MOSTRAR HABILIDADE (Pontuar)
          </button>
        </div>

        <h3>🏆 Ranking em Tempo Real</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #555' }}>
              <th>Posição</th>
              <th>Jogador</th>
              <th>Pontuação</th>
            </tr>
          </thead>
          <tbody>
            {jogadores.map((jog, index) => (
              <tr key={jog.id} style={{ borderBottom: '1px solid #333', background: index === 0 ? '#3a3a00' : 'transparent' }}>
                <td style={{ padding: '10px' }}>{index + 1}º {index === 0 && '👑'}</td>
                <td>{jog.nome} {jog.nome === meuNome && '(Você)'}</td>
                <td style={{ color: '#25D366', fontWeight: 'bold' }}>{jog.pontos} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔴 ÁREA DO CHAT (Para provocar o inimigo) */}
      <div style={{ flex: 1, background: '#1e1e1e', padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', maxHeight: '500px' }}>
        <h3>💬 Chat Provocação</h3>
        
        {/* Lista de Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#2a2a2a', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
          {chat.map((msg, index) => (
            <div key={index} style={{ marginBottom: '10px', fontSize: '14px' }}>
              <span style={{ color: '#888', fontSize: '10px' }}>{msg.hora}</span><br/>
              <strong style={{ color: msg.nome === meuNome ? '#25D366' : '#FF9800' }}>{msg.nome}:</strong> {msg.texto}
            </div>
          ))}
        </div>

        {/* Input de Mensagem */}
        <form onSubmit={enviarMensagem} style={{ display: 'flex', gap: '5px' }}>
          <input 
            type="text" 
            value={mensagemInput} 
            onChange={(e) => setMensagemInput(e.target.value)} 
            placeholder="Provoque seu oponente..." 
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: 'none', background: '#333', color: 'white' }}
          />
          <button type="submit" style={{ background: '#f44336', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Enviar
          </button>
        </form>
      </div>

    </div>
  );
}
