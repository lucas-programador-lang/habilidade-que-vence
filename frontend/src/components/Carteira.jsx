import React, { useState } from 'react';

export default function Carteira({ usuarioId, saldoAtual }) {
  const [valorDeposito, setValorDeposito] = useState(0.50); // Padrão R$ 0.50
  const [pixCopiaCola, setPixCopiaCola] = useState('');
  const [mensagem, setMensagem] = useState('');

  // FUNÇÃO: Gerar PIX de Depósito
  const gerarPix = async () => {
    setMensagem("Gerando PIX...");
    try {
      const res = await fetch('http://localhost:5000/api/pagamentos/depositar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, valor: valorDeposito })
      });
      const dados = await res.json();
      
      if (dados.sucesso) {
        setPixCopiaCola(dados.copiaECola);
        setMensagem("PIX gerado! O saldo entrará automaticamente após o pagamento.");
      } else {
        setMensagem(`❌ ${dados.erro}`);
      }
    } catch (error) {
      setMensagem("Erro ao conectar com o servidor.");
    }
  };

  // FUNÇÃO: Solicitar Saque
  const solicitarSaque = async () => {
    const valorSaque = prompt("Digite o valor que deseja sacar (Mínimo R$ 10,00):");
    if (!valorSaque) return;

    const chavePix = prompt("Digite sua Chave PIX:");
    if (!chavePix) return;

    setMensagem("Processando saque...");
    try {
      const res = await fetch('http://localhost:5000/api/pagamentos/sacar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chavePix, valorSolicitado: parseFloat(valorSaque) })
      });
      const dados = await res.json();
      
      setMensagem(dados.sucesso ? `✅ ${dados.mensagem}` : `❌ ${dados.erro}`);
    } catch (error) {
      setMensagem("Erro ao processar saque.");
    }
  };

  return (
    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', color: 'white' }}>
      <h2>💸 Sua Carteira</h2>
      <h1 style={{ color: '#25D366' }}>Saldo: R$ {saldoAtual.toFixed(2)}</h1>
      
      <p style={{ color: '#ffcc00' }}>{mensagem}</p>

      {/* ÁREA DE DEPÓSITO */}
      <div style={{ border: '1px solid #444', padding: '15px', borderRadius: '5px', marginTop: '15px' }}>
        <h3>Depositar</h3>
        <p style={{ fontSize: '12px', color: '#aaa' }}>O valor padrão para as partidas é R$ 0,50.</p>
        <input 
          type="number" 
          step="0.10"
          value={valorDeposito} 
          onChange={(e) => setValorDeposito(e.target.value)}
          style={{ padding: '10px', width: '100px', marginRight: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '5px' }}
        />
        <button onClick={gerarPix} style={{ background: '#4CAF50', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Gerar PIX
        </button>

        {pixCopiaCola && (
          <div style={{ marginTop: '15px', background: '#333', padding: '10px', borderRadius: '5px' }}>
            <p style={{ fontSize: '14px', marginBottom: '5px' }}>PIX Copia e Cola:</p>
            <input 
              type="text" 
              readOnly 
              value={pixCopiaCola} 
              style={{ width: '90%', padding: '5px', color: '#000' }} 
            />
            <button onClick={() => navigator.clipboard.writeText(pixCopiaCola)} style={{ marginTop: '5px', background: '#25D366', color: 'black', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
              Copiar
            </button>
          </div>
        )}
      </div>

      {/* ÁREA DE SAQUE */}
      <div style={{ border: '1px solid #444', padding: '15px', borderRadius: '5px', marginTop: '15px' }}>
        <h3>Sacar Dinheiro</h3>
        <ul style={{ fontSize: '12px', color: '#aaa', paddingLeft: '20px' }}>
          <li>Saques apenas aos **Domingos**.</li>
          <li>Mínimo de **R$ 10,00**.</li>
          <li>Taxa administrativa de **10%**.</li>
        </ul>
        <button onClick={solicitarSaque} style={{ background: '#f44336', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', marginTop: '10px', fontWeight: 'bold' }}>
          Solicitar Saque (PIX)
        </button>
      </div>

    </div>
  );
}
