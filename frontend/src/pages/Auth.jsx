import React, { useState } from 'react';

export default function Auth({ onLoginSucesso }) {
  const [modo, setModo] = useState('login'); // 'login', 'cadastro', ou 'esqueci'
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '', indicacao: '' });
  const [mensagem, setMensagem] = useState('');

  const handleChange = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('Processando...');

    // Define qual rota do Backend será chamada
    let url = 'http://localhost:5000/api/auth/login'; // Substitua pelo domínio real depois
    if (modo === 'cadastro') url = 'http://localhost:5000/api/auth/cadastro';
    if (modo === 'esqueci') url = 'http://localhost:5000/api/auth/esqueci-senha';

    try {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      });
      const dados = await resposta.json();

      if (dados.erro) {
        setMensagem(`❌ ${dados.erro}`);
      } else {
        setMensagem(`✅ ${dados.mensagem || 'Sucesso!'}`);
        if (modo === 'login' && dados.token) {
          // Salva o token seguro no navegador
          localStorage.setItem('token_panda', dados.token);
          onLoginSucesso(dados.usuario);
        }
        if (modo === 'cadastro') setModo('login'); // Redireciona para login
      }
    } catch (error) {
      setMensagem('❌ Erro de conexão com o servidor.');
    }
  };

  const estilosInput = { width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #555', background: '#333', color: 'white' };
  const estilosBotao = { width: '100%', padding: '12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', background: '#1e1e1e', borderRadius: '10px', textAlign: 'center' }}>
      <h2>🐼 Habilidade que Vence</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <button onClick={() => setModo('login')} style={{ background: 'none', color: modo === 'login' ? '#25D366' : '#888', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Entrar</button>
        <button onClick={() => setModo('cadastro')} style={{ background: 'none', color: modo === 'cadastro' ? '#25D366' : '#888', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Cadastrar</button>
      </div>

      <form onSubmit={handleSubmit}>
        {modo === 'cadastro' && (
          <input type="text" name="nome" placeholder="Seu Nome ou Apelido" required onChange={handleChange} style={estilosInput} />
        )}
        
        <input type="email" name="email" placeholder="Seu E-mail" required onChange={handleChange} style={estilosInput} />
        
        {modo !== 'esqueci' && (
          <input type="password" name="senha" placeholder="Sua Senha Segura" required onChange={handleChange} style={estilosInput} />
        )}

        {modo === 'cadastro' && (
          <input type="text" name="indicacao" placeholder="Código de Indicação (Opcional)" onChange={handleChange} style={estilosInput} />
        )}

        <button type="submit" style={estilosBotao}>
          {modo === 'login' ? 'Entrar no Jogo' : modo === 'cadastro' ? 'Criar Conta' : 'Recuperar Senha'}
        </button>
      </form>

      {mensagem && <p style={{ marginTop: '15px', color: '#ffcc00' }}>{mensagem}</p>}

      {modo === 'login' && (
        <button onClick={() => setModo('esqueci')} style={{ background: 'none', color: '#aaa', border: 'none', marginTop: '15px', cursor: 'pointer', fontSize: '12px' }}>
          Esqueci minha senha
        </button>
      )}
    </div>
  );
}
