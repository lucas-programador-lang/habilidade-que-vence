import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensagem, setMensagem] = useState('');

  // Função para buscar dados com o Token de Segurança
  const fetchComToken = async (url, opções = {}) => {
    const token = localStorage.getItem('token_panda');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Envia o token do admin
    };
    const response = await fetch(url, { ...opções, headers });
    return response.json();
  };

  // Carrega os usuários assim que a página abre
  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    const dados = await fetchComToken('http://localhost:5000/api/admin/usuarios');
    if (dados.erro) {
      setMensagem(`❌ ${dados.erro}`);
    } else {
      setUsuarios(dados);
    }
  };

  // Ação: Alterar Saldo
  const alterarSaldo = async (id, nome) => {
    const novoSaldo = prompt(`Digite o novo saldo em REAIS para ${nome}:`);
    if (novoSaldo === null || isNaN(novoSaldo)) return;

    const res = await fetchComToken(`http://localhost:5000/api/admin/usuarios/${id}/saldo`, {
      method: 'PUT',
      body: JSON.stringify({ novoSaldo: parseFloat(novoSaldo) })
    });
    
    alert(res.mensagem || res.erro);
    carregarUsuarios(); // Atualiza a tabela
  };

  // Ação: Alterar Senha
  const alterarSenha = async (id, nome) => {
    const novaSenha = prompt(`Digite a NOVA SENHA para ${nome}:`);
    if (!novaSenha) return;

    const res = await fetchComToken(`http://localhost:5000/api/admin/usuarios/${id}/senha`, {
      method: 'PUT',
      body: JSON.stringify({ novaSenha })
    });
    
    alert(res.mensagem || res.erro);
  };

  // Ação: Excluir Conta
  const excluirConta = async (id, nome) => {
    const confirmar = window.confirm(`TEM CERTEZA que deseja excluir a conta de ${nome}? Isso apagará saldos e históricos.`);
    if (!confirmar) return;

    const res = await fetchComToken(`http://localhost:5000/api/admin/usuarios/${id}`, {
      method: 'DELETE'
    });
    
    alert(res.mensagem || res.erro);
    carregarUsuarios(); // Atualiza a tabela
  };

  return (
    <div style={{ padding: '20px', background: '#1e1e1e', borderRadius: '10px' }}>
      <h2>⚙️ Painel da Diretoria (Admin)</h2>
      {mensagem && <p style={{ color: '#ff4d4d' }}>{mensagem}</p>}
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#333', borderBottom: '2px solid #555' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Saldo (R$)</th>
            <th>Ações de Admin</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '10px' }}>{user.id}</td>
              <td>{user.nome} {user.is_admin && "👑"}</td>
              <td>{user.email}</td>
              <td style={{ color: '#25D366', fontWeight: 'bold' }}>R$ {user.saldo_real.toFixed(2)}</td>
              <td>
                {!user.is_admin && (
                  <>
                    <button onClick={() => alterarSaldo(user.id, user.nome)} style={{ background: '#4CAF50', color: 'white', padding: '5px 10px', marginRight: '5px', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>Editar Saldo</button>
                    <button onClick={() => alterarSenha(user.id, user.nome)} style={{ background: '#FF9800', color: 'white', padding: '5px 10px', marginRight: '5px', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>Nova Senha</button>
                    <button onClick={() => excluirConta(user.id, user.nome)} style={{ background: '#f44336', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
