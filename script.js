'use strict';

/* ================================================================
   HABILIDADE QUE VENCE — script.js
   Estrutura do arquivo:
     1. Estado
     2. Sistema de notificações (toast) e confirmação customizada
     3. Modais (abrir/fechar com animação sincronizada ao CSS)
     4. Interface (saldo)
     5. Depósito (fluxo em duas etapas: gerar PIX -> confirmar pagamento)
     6. Saque (nome, chave PIX, valor)
     7. Sala de jogo
     8. Chat
     9. Indicação
     10. Painel Admin
     11. Inicialização
   ================================================================ */

// ----------------------------------------------------------------
// 1. Estado
// ----------------------------------------------------------------

const estado = {
  saldoAtual: 10.50,
  depositoPendente: null, // valor aguardando confirmação de pagamento
};

const REGRAS = {
  DEPOSITO_MINIMO: 0.50,
  SAQUE_MINIMO: 10.00,
  TAXA_SAQUE: 0.10,
  DIA_LIBERADO_SAQUE: 0, // 0 = Domingo
};

// ----------------------------------------------------------------
// 2. Sistema de notificações (toast) e confirmação customizada
// ----------------------------------------------------------------

const TOAST_DURACAO_MS = 4500;

const ICONES_TOAST = {
  sucesso: 'fa-solid fa-circle-check',
  erro: 'fa-solid fa-circle-xmark',
  aviso: 'fa-solid fa-triangle-exclamation',
  info: 'fa-solid fa-circle-info',
};

/** Garante que existe um container de toasts no DOM e o retorna. */
const obterToastContainer = () => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
};

/**
 * Mostra uma notificação toast no canto da tela, substituindo o alert() nativo.
 * @param {string} mensagem - Texto a exibir (sempre inserido via textContent).
 * @param {'sucesso'|'erro'|'aviso'|'info'} tipo
 */
const mostrarToast = (mensagem, tipo = 'info') => {
  const container = obterToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', 'status');

  const icone = document.createElement('i');
  icone.className = `toast-icon ${ICONES_TOAST[tipo] ?? ICONES_TOAST.info}`;

  const texto = document.createElement('span');
  texto.textContent = mensagem; // textContent: nunca interpreta HTML/JS

  const btnFechar = document.createElement('button');
  btnFechar.className = 'toast-fechar';
  btnFechar.setAttribute('aria-label', 'Fechar notificação');
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  toast.append(icone, texto, btnFechar);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visivel'));

  const remover = () => {
    toast.classList.remove('toast-visivel');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  btnFechar.addEventListener('click', remover);
  setTimeout(remover, TOAST_DURACAO_MS);
};

/**
 * Substitui o confirm() nativo por um modal customizado.
 * @param {string} mensagem
 * @param {string} [titulo='Confirmar ação']
 * @returns {Promise<boolean>} true se o usuário confirmar, false se cancelar.
 */
const confirmarAcao = (mensagem, titulo = 'Confirmar ação') => {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal';
    overlay.style.display = 'flex';

    const caixa = document.createElement('div');
    caixa.className = 'modal-conteudo';

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <i class="fa-solid fa-triangle-exclamation modal-header-icon"></i>
      <h2></h2>
    `;
    header.querySelector('h2').textContent = titulo;

    const textoMensagem = document.createElement('p');
    textoMensagem.className = 'confirm-mensagem';
    textoMensagem.textContent = mensagem;

    const acoes = document.createElement('div');
    acoes.className = 'confirm-actions';

    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn-primario';
    btnCancelar.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.className = 'btn-perigo';
    btnConfirmar.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar';

    acoes.append(btnCancelar, btnConfirmar);
    caixa.append(header, textoMensagem, acoes);
    overlay.appendChild(caixa);
    document.body.appendChild(overlay);

    const finalizar = (resultado) => {
      overlay.classList.add('fechando');
      overlay.addEventListener(
        'animationend',
        () => {
          overlay.remove();
          resolve(resultado);
        },
        { once: true }
      );
    };

    btnCancelar.addEventListener('click', () => finalizar(false));
    btnConfirmar.addEventListener('click', () => finalizar(true));
  });
};

// ----------------------------------------------------------------
// 3. Modais (abrir/fechar com animação sincronizada ao CSS)
// ----------------------------------------------------------------

const abrirModal = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove('fechando');
  modal.style.display = 'flex';
};

const fecharModal = (id) => {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add('fechando');

  const finalizarFechamento = () => {
    modal.style.display = 'none';
    modal.classList.remove('fechando');
  };

  modal.addEventListener('animationend', finalizarFechamento, { once: true });
  setTimeout(finalizarFechamento, 250); // rede de segurança
};

// ----------------------------------------------------------------
// 4. Interface (saldo)
// ----------------------------------------------------------------

const atualizarInterface = () => {
  const elementoSaldo = document.getElementById('user-saldo');
  if (!elementoSaldo) return;

  const saldoFormatado = estado.saldoAtual.toFixed(2).replace('.', ',');
  elementoSaldo.innerHTML = `<i class="fa-solid fa-sack-dollar"></i> Saldo: R$ ${saldoFormatado}`;
};

// ----------------------------------------------------------------
// 5. Depósito — fluxo em duas etapas
//    Etapa "valor": usuário digita o valor e pede o PIX.
//    Etapa "qr": mostra QR fictício + chave copia-e-cola; o saldo só
//    é creditado quando o usuário clica em "Confirmar Pagamento".
//    Antes, o saldo subia direto ao gerar o PIX — isso estava errado
//    e foi corrigido aqui.
// ----------------------------------------------------------------

/** Alterna qual etapa do modal de depósito fica visível. */
const mostrarEtapaDeposito = (nomeEtapa) => {
  document.querySelectorAll('#modal-depositar .deposito-etapa').forEach((etapa) => {
    etapa.hidden = etapa.dataset.etapa !== nomeEtapa;
  });
};

/** Abre o modal de depósito sempre resetado na etapa inicial. */
const abrirModalDeposito = () => {
  mostrarEtapaDeposito('valor');
  estado.depositoPendente = null;
  abrirModal('modal-depositar');
};

/** Gera um payload PIX copia-e-cola fictício só pra preencher a tela. */
const gerarChavePixFicticia = (valor) => {
  const valorFormatado = valor.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136habilidadequevence-${Date.now()}5204000053039865406${valorFormatado}5802BR5920HABILIDADE QUE VENCE6009SAO PAULO62070503***6304`;
};

const gerarPixDeposito = () => {
  const { value } = document.getElementById('valor-deposito');
  const valor = parseFloat(value);

  if (Number.isNaN(valor) || valor < REGRAS.DEPOSITO_MINIMO) {
    mostrarToast(`O valor mínimo de depósito automático via PIX é R$ ${REGRAS.DEPOSITO_MINIMO.toFixed(2)}`, 'erro');
    return;
  }

  estado.depositoPendente = valor;

  document.getElementById('deposito-valor-exibido').textContent =
    `R$ ${valor.toFixed(2).replace('.', ',')}`;
  document.getElementById('pix-copia-cola').value = gerarChavePixFicticia(valor);

  mostrarEtapaDeposito('qr');
};

const copiarChavePix = () => {
  const input = document.getElementById('pix-copia-cola');
  input.select();
  navigator.clipboard.writeText(input.value);
  mostrarToast('Chave PIX copiada! Cole no seu banco para pagar.', 'sucesso');
};

/** Só aqui, na confirmação explícita, o saldo é de fato creditado. */
const confirmarPagamentoPix = () => {
  if (estado.depositoPendente === null) {
    mostrarToast('Nenhum depósito pendente para confirmar.', 'erro');
    return;
  }

  estado.saldoAtual += estado.depositoPendente;
  atualizarInterface();

  const valorCreditado = estado.depositoPendente;
  estado.depositoPendente = null;

  fecharModal('modal-depositar');
  mostrarToast(`Pagamento confirmado! R$ ${valorCreditado.toFixed(2)} creditado na sua conta.`, 'sucesso');
};

// ----------------------------------------------------------------
// 6. Saque — nome completo, chave PIX e valor
// ----------------------------------------------------------------

const realizarSaque = () => {
  const { value: nome } = document.getElementById('saque-nome');
  const { value: chavePix } = document.getElementById('saque-chave-pix');
  const { value: valorTexto } = document.getElementById('valor-saque');
  const valor = parseFloat(valorTexto);

  if (nome.trim().length === 0 || chavePix.trim().length === 0 || valorTexto.trim().length === 0) {
    mostrarToast('Preencha nome completo, chave PIX e valor para solicitar o saque.', 'erro');
    return;
  }

  const hoje = new Date().getDay();
  if (hoje !== REGRAS.DIA_LIBERADO_SAQUE) {
    mostrarToast('Os saques automáticos só são permitidos aos DOMINGOS!', 'aviso');
    return;
  }

  if (Number.isNaN(valor) || valor < REGRAS.SAQUE_MINIMO) {
    mostrarToast(`O valor mínimo para saque é R$ ${REGRAS.SAQUE_MINIMO.toFixed(2)}`, 'erro');
    return;
  }

  if (valor > estado.saldoAtual) {
    mostrarToast('Saldo insuficiente!', 'erro');
    return;
  }

  const taxa = valor * REGRAS.TAXA_SAQUE;
  const valorLiquido = valor - taxa;

  estado.saldoAtual -= valor;
  atualizarInterface();
  fecharModal('modal-sacar');
  mostrarToast(
    `Saque solicitado para a chave ${chavePix}! Taxa de ${REGRAS.TAXA_SAQUE * 100}% aplicada. Valor líquido: R$ ${valorLiquido.toFixed(2)}`,
    'sucesso'
  );
};

// ----------------------------------------------------------------
// 7. Sala de jogo
// ----------------------------------------------------------------

const entrarNaSala = (valor) => {
  if (estado.saldoAtual < valor) {
    mostrarToast(`Saldo insuficiente para investir nesta partida! Faça um depósito a partir de R$ ${REGRAS.DEPOSITO_MINIMO.toFixed(2)}.`, 'aviso');
    abrirModalDeposito();
    return;
  }

  estado.saldoAtual -= valor;
  atualizarInterface();
  mostrarToast(`Investimento de R$ ${valor.toFixed(2)} confirmado! Aguardando completar 4 participantes na sala.`, 'sucesso');
};

// ----------------------------------------------------------------
// 8. Chat
// ----------------------------------------------------------------

/**
 * Insere a mensagem do próprio usuário no chat.
 * Usa createElement + textContent (nunca innerHTML com a string digitada)
 * pra impedir que HTML/script inserido pelo usuário seja executado (XSS).
 */
const enviarMensagem = () => {
  const input = document.getElementById('input-chat');
  const texto = input.value.trim();
  if (texto === '') return;

  const chat = document.getElementById('chat-mensagens');

  const linha = document.createElement('div');
  linha.className = 'msg msg-proprio';

  const autor = document.createElement('strong');
  autor.textContent = 'Você: ';

  const corpo = document.createElement('span');
  corpo.textContent = texto;

  const hora = document.createElement('span');
  hora.className = 'msg-hora';
  hora.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  linha.append(autor, corpo, hora);
  chat.appendChild(linha);

  input.value = '';
  chat.scrollTop = chat.scrollHeight;
};

// ----------------------------------------------------------------
// 9. Indicação
// ----------------------------------------------------------------

const copiarLink = () => {
  const input = document.getElementById('link-afiliado');
  input.select();
  navigator.clipboard.writeText(input.value);
  mostrarToast('Link de indicação (8% de comissão) copiado com sucesso!', 'sucesso');
};

// ----------------------------------------------------------------
// 10. Painel Admin
// ----------------------------------------------------------------

const adminAlterarSaldo = () => {
  mostrarToast('Saldo do usuário alterado com sucesso pelo administrador!', 'sucesso');
};

const adminAlterarSenha = () => {
  mostrarToast('Senha do usuário alterada com sucesso!', 'sucesso');
};

const adminExcluirConta = async () => {
  const confirmado = await confirmarAcao(
    'Tem certeza que deseja excluir esta conta permanentemente? Essa ação não pode ser desfeita.',
    'Excluir conta'
  );

  if (confirmado) {
    mostrarToast('Conta excluída com sucesso.', 'sucesso');
  }
};

// ----------------------------------------------------------------
// 11. Inicialização
// ----------------------------------------------------------------

atualizarInterface();
