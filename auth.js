'use strict';

/* ================================================================
   HABILIDADE QUE VENCE — auth.js
   Depende de script.js já carregado antes deste arquivo, de onde
   vêm: mostrarToast(mensagem, tipo), abrirModal(id), fecharModal(id).

   Estrutura:
     1. Validação
     2. Login
     3. Cadastro
     4. Recuperação de senha (modal dedicado, sem prompt())
   ================================================================ */

// ----------------------------------------------------------------
// 1. Validação
// ----------------------------------------------------------------

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailValido = (email) => REGEX_EMAIL.test(email.trim());

// ----------------------------------------------------------------
// 2. Login
// ----------------------------------------------------------------

const fazerLogin = (event) => {
  event.preventDefault();

  const { value: email } = document.getElementById('login-email');
  const { value: senha } = document.getElementById('login-senha');

  if (!emailValido(email)) {
    mostrarToast('Digite um e-mail válido.', 'erro');
    return;
  }

  if (senha.trim().length === 0) {
    mostrarToast('Digite sua senha.', 'erro');
    return;
  }

  // Nota: isto só marca "logado" localmente no navegador — não é uma
  // sessão validada por servidor. Login de verdade precisa checar
  // e-mail/senha numa API antes de gravar qualquer coisa aqui.
  localStorage.setItem('usuarioLogado', email);

  mostrarToast('Login realizado com sucesso! Redirecionando...', 'sucesso');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1800);
};

// ----------------------------------------------------------------
// 3. Cadastro
// ----------------------------------------------------------------

const fazerCadastro = (event) => {
  event.preventDefault();

  const { value: nome } = document.getElementById('cad-nome');
  const { value: email } = document.getElementById('cad-email');
  const { value: senha } = document.getElementById('cad-senha');
  const { value: codigoIndicacao } = document.getElementById('cad-indicacao');

  if (nome.trim().length === 0) {
    mostrarToast('Digite seu nome completo.', 'erro');
    return;
  }

  if (!emailValido(email)) {
    mostrarToast('Digite um e-mail válido.', 'erro');
    return;
  }

  if (senha.trim().length < 6) {
    mostrarToast('A senha precisa ter pelo menos 6 caracteres.', 'erro');
    return;
  }

  const mensagemBonus = codigoIndicacao.trim()
    ? ' Bônus de indicação aplicado!'
    : '';

  mostrarToast(`Cadastro realizado com sucesso!${mensagemBonus} Redirecionando...`, 'sucesso');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1800);
};

// ----------------------------------------------------------------
// 4. Recuperação de senha (modal dedicado, sem prompt())
// ----------------------------------------------------------------

const ID_MODAL_RECUPERACAO = 'modal-recuperar-senha';

/** Cria (uma única vez) o modal de recuperação de senha e o insere no DOM. */
const garantirModalRecuperacao = () => {
  const existente = document.getElementById(ID_MODAL_RECUPERACAO);
  if (existente) return existente;

  const overlay = document.createElement('div');
  overlay.id = ID_MODAL_RECUPERACAO;
  overlay.className = 'modal';

  overlay.innerHTML = `
    <div class="modal-conteudo">
      <div class="modal-header">
        <i class="fa-solid fa-key modal-header-icon"></i>
        <h2>Recuperar senha</h2>
        <span class="fechar" role="button" tabindex="0" aria-label="Fechar">&times;</span>
      </div>
      <p class="confirm-mensagem">Digite o e-mail cadastrado para receber as instruções de recuperação.</p>
      <div class="input-icon-group">
        <input type="email" id="input-email-recuperacao" placeholder="E-mail cadastrado" autocomplete="email">
        <i class="fa-solid fa-envelope"></i>
      </div>
      <button type="button" class="btn-primario" id="btn-enviar-recuperacao">
        <i class="fa-solid fa-paper-plane"></i> Enviar instruções
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const fecharComTeclado = (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      fecharModal(ID_MODAL_RECUPERACAO);
    }
  };

  overlay.querySelector('.fechar').addEventListener('click', () => fecharModal(ID_MODAL_RECUPERACAO));
  overlay.querySelector('.fechar').addEventListener('keydown', fecharComTeclado);

  const enviarRecuperacao = () => {
    const campoEmail = overlay.querySelector('#input-email-recuperacao');
    const { value: email } = campoEmail;

    if (!emailValido(email)) {
      mostrarToast('Digite um e-mail válido para recuperar a senha.', 'erro');
      return;
    }

    // Simulação: aqui entraria a chamada real à API de recuperação de senha.
    mostrarToast('Instruções de recuperação enviadas para o seu e-mail!', 'sucesso');
    campoEmail.value = '';
    fecharModal(ID_MODAL_RECUPERACAO);
  };

  overlay.querySelector('#btn-enviar-recuperacao').addEventListener('click', enviarRecuperacao);
  overlay.querySelector('#input-email-recuperacao').addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') enviarRecuperacao();
  });

  return overlay;
};

const esqueciSenha = () => {
  garantirModalRecuperacao();
  abrirModal(ID_MODAL_RECUPERACAO);
};
