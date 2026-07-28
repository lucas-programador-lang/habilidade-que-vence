'use strict';

/* ================================================================
   HABILIDADE QUE VENCE — script.js
   Estrutura do arquivo:
     1. Estado
     2. Sistema de notificações (toast) e confirmação customizada
     3. Modais (abrir/fechar com animação sincronizada ao CSS)
     4. Interface (saldo)
     5. Depósito (fluxo em duas etapas)
     6. Saque (nome, chave PIX, valor)
     7. Sala de jogo (contador e barra de progresso reais)
     8. Chat
     9. Indicação
     10. Conta (menu dropdown, perfil, alterar senha, sair)
     11. Painel Admin
     12. Inicialização
   ================================================================ */

// ----------------------------------------------------------------
// 1. Estado
// ----------------------------------------------------------------

const estado = {
  saldoAtual: 10.50,
  depositoPendente: null,
  sala: {
    participantesAtuais: 1,
    capacidadeMaxima: 4,
    cheia: false,
    jogadorInscrito: false,
  },
};

const REGRAS = {
  DEPOSITO_MINIMO: 0.50,
  SAQUE_MINIMO: 10.00,
  TAXA_SAQUE: 0.10,
  DIA_LIBERADO_SAQUE: 0, // 0 = Domingo
  SENHA_MINIMA: 6,
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
  vitoria: 'fa-solid fa-trophy',
  derrota: 'fa-solid fa-face-frown',
};

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

const mostrarToast = (mensagem, tipo = 'info') => {
  const container = obterToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', 'status');

  const icone = document.createElement('i');
  icone.className = `toast-icon ${ICONES_TOAST[tipo] ?? ICONES_TOAST.info}`;

  const texto = document.createElement('span');
  texto.textContent = mensagem;

  const btnFechar = document.createElement('button');
  btnFechar.className = 'toast-fechar';
  btnFechar.setAttribute('aria-label', 'Fechar notificação');
  btnFechar.innerHTML = '<i class="fa-solid fa-xmark"></i>';

  const trilhaProgresso = document.createElement('div');
  trilhaProgresso.className = 'toast-progresso-trilha';
  const barraProgresso = document.createElement('div');
  barraProgresso.className = 'toast-progresso-barra';
  barraProgresso.style.animationDuration = `${TOAST_DURACAO_MS}ms`;
  trilhaProgresso.appendChild(barraProgresso);

  toast.append(icone, texto, btnFechar, trilhaProgresso);
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast-visivel'));

  const remover = () => {
    toast.classList.remove('toast-visivel');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  btnFechar.addEventListener('click', remover);
  setTimeout(remover, TOAST_DURACAO_MS);
};

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
  setTimeout(finalizarFechamento, 250);
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
// ----------------------------------------------------------------

const mostrarEtapaDeposito = (nomeEtapa) => {
  document.querySelectorAll('#modal-depositar .deposito-etapa').forEach((etapa) => {
    etapa.hidden = etapa.dataset.etapa !== nomeEtapa;
  });
};

const abrirModalDeposito = () => {
  mostrarEtapaDeposito('valor');
  estado.depositoPendente = null;
  abrirModal('modal-depositar');
};

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
//    - Clique duplo bloqueado: uma vez inscrito, o botão desabilita
//      e mostra "Aguardando Oponentes...".
//    - Oponentes fictícios entram sozinhos em intervalos aleatórios
//      até 4/4, cada entrada atualiza contador + barra.
//    - Ao completar, a sala vira "Partida em Andamento": chat recebe
//      mensagens automáticas e, após 12s, um resultado aleatório
//      (vitória credita R$ 2,00, derrota não credita nada).
// ----------------------------------------------------------------

const OPONENTES_FICTICIOS = ['Jogador_2', 'Jogador_3', 'Jogador_4'];
const PREMIO_SALA = 2.00;

const atualizarInterfaceSala = () => {
  const contador = document.getElementById('contador-players');
  const barra = document.querySelector('.progresso-sala-preenchido');
  const botao = document.querySelector('.btn-entrar-sala');
  const badgeVagas = document.querySelector('.progresso-sala .badge-open');
  const card = document.querySelector('.card-sala');

  if (contador) contador.textContent = estado.sala.participantesAtuais;

  if (barra) {
    const percentual = (estado.sala.participantesAtuais / estado.sala.capacidadeMaxima) * 100;
    barra.style.width = `${percentual}%`;
  }

  if (estado.sala.cheia) {
    card?.classList.add('partida-andamento');
    if (botao) {
      botao.disabled = true;
      botao.innerHTML = '<i class="fa-solid fa-bolt"></i> Partida em andamento...';
    }
    badgeVagas?.classList.add('badge-completa');
  } else if (estado.sala.jogadorInscrito) {
    if (botao) {
      botao.disabled = true;
      botao.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Aguardando oponentes...';
    }
  }
};

/** Zera a sala de volta ao estado inicial, pronta para uma nova rodada. */
const resetarSala = () => {
  estado.sala = {
    participantesAtuais: 1,
    capacidadeMaxima: 4,
    cheia: false,
    jogadorInscrito: false,
  };

  const botao = document.querySelector('.btn-entrar-sala');
  const card = document.querySelector('.card-sala');
  const badgeVagas = document.querySelector('.progresso-sala .badge-open');

  card?.classList.remove('partida-andamento');
  badgeVagas?.classList.remove('badge-completa');
  if (botao) {
    botao.disabled = false;
    botao.innerHTML = '<i class="fa-solid fa-play"></i> Entrar na Partida (R$ 0,50)';
  }

  atualizarInterfaceSala();
};

/** Faz os oponentes fictícios entrarem um a um, em intervalos aleatórios. */
const iniciarSimulacaoOponentes = () => {
  const entrarProximoOponente = () => {
    if (estado.sala.participantesAtuais >= estado.sala.capacidadeMaxima) return;

    estado.sala.participantesAtuais += 1;

    if (estado.sala.participantesAtuais >= estado.sala.capacidadeMaxima) {
      estado.sala.cheia = true;
      atualizarInterfaceSala();
      iniciarPartida();
      return;
    }

    atualizarInterfaceSala();
    const atraso = 1500 + Math.random() * 2500;
    setTimeout(entrarProximoOponente, atraso);
  };

  const atrasoInicial = 1200 + Math.random() * 2000;
  setTimeout(entrarProximoOponente, atrasoInicial);
};

/** Dispara as mensagens automáticas dos oponentes e agenda o fim da partida. */
const iniciarPartida = () => {
  mostrarToast('Sala completa! A partida está começando.', 'sucesso');

  const mensagensAutomaticas = [
    { autor: OPONENTES_FICTICIOS[0], texto: 'Boa sorte a todos! 🍀' },
    { autor: 'Sistema', texto: 'Analisando jogadas...' },
    { autor: OPONENTES_FICTICIOS[1], texto: 'Vamos que vamos!' },
    { autor: OPONENTES_FICTICIOS[2], texto: 'Essa eu levo 😄' },
  ];

  mensagensAutomaticas.forEach((msg, indice) => {
    setTimeout(() => adicionarMensagemChat(msg.autor, msg.texto, 'msg-outro'), 900 + indice * 1600);
  });

  setTimeout(finalizarPartida, 12000);
};

/** Sorteia vitória ou derrota, credita o prêmio se for o caso, e reseta a sala. */
const finalizarPartida = () => {
  const venceu = Math.random() < 0.5;

  if (venceu) {
    estado.saldoAtual += PREMIO_SALA;
    atualizarInterface();
    mostrarToast(`Vitória! Você levou o prêmio de R$ ${PREMIO_SALA.toFixed(2)}.`, 'vitoria');
    adicionarMensagemChat('Sistema', 'Partida encerrada — parabéns ao vencedor!', 'msg-outro');
  } else {
    mostrarToast('Não foi dessa vez. A partida terminou.', 'derrota');
    adicionarMensagemChat('Sistema', 'Partida encerrada.', 'msg-outro');
  }

  resetarSala();
};

const entrarNaSala = (valor) => {
  if (estado.sala.jogadorInscrito) {
    mostrarToast('Você já está inscrito nessa sala. Aguarde os outros participantes.', 'aviso');
    return;
  }

  if (estado.sala.cheia) {
    mostrarToast('Essa sala já está completa. Aguarde a próxima.', 'aviso');
    return;
  }

  if (estado.saldoAtual < valor) {
    mostrarToast(`Saldo insuficiente para investir nesta partida! Faça um depósito a partir de R$ ${REGRAS.DEPOSITO_MINIMO.toFixed(2)}.`, 'aviso');
    abrirModalDeposito();
    return;
  }

  estado.saldoAtual -= valor;
  estado.sala.jogadorInscrito = true;
  estado.sala.participantesAtuais += 1;

  if (estado.sala.participantesAtuais >= estado.sala.capacidadeMaxima) {
    estado.sala.cheia = true;
    atualizarInterface();
    atualizarInterfaceSala();
    iniciarPartida();
    return;
  }

  atualizarInterface();
  atualizarInterfaceSala();
  mostrarToast(`Investimento de R$ ${valor.toFixed(2)} confirmado! Aguardando os outros participantes.`, 'sucesso');
  iniciarSimulacaoOponentes();
};

// ----------------------------------------------------------------
// 8. Chat
//    Função única compartilhada por mensagens do usuário e dos
//    oponentes fictícios — sempre via createElement + textContent,
//    nunca innerHTML com texto vindo de fora, o que impede XSS.
// ----------------------------------------------------------------

const adicionarMensagemChat = (autor, texto, classeExtra) => {
  const chat = document.getElementById('chat-mensagens');
  if (!chat) return;

  const linha = document.createElement('div');
  linha.className = `msg ${classeExtra}`;

  const autorEl = document.createElement('strong');
  autorEl.textContent = `${autor}: `;

  const corpo = document.createElement('span');
  corpo.textContent = texto;

  const hora = document.createElement('span');
  hora.className = 'msg-hora';
  hora.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  linha.append(autorEl, corpo, hora);
  chat.appendChild(linha);
  chat.scrollTop = chat.scrollHeight;
};

const enviarMensagem = () => {
  const input = document.getElementById('input-chat');
  const texto = input.value.trim();
  if (texto === '') return;

  adicionarMensagemChat('Você', texto, 'msg-proprio');
  input.value = '';
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
// 10. Conta — dropdown, perfil, alterar senha, sair
// ----------------------------------------------------------------

const CHAVE_NOME_EXIBICAO = 'nomeExibicao';

/** Mostra o nome de exibição salvo, ou o e-mail como alternativa. */
const atualizarNomeConta = () => {
  const elemento = document.getElementById('account-nome');
  if (!elemento) return;

  const nomeExibicao = localStorage.getItem(CHAVE_NOME_EXIBICAO);
  const email = localStorage.getItem('usuarioLogado');
  elemento.textContent = nomeExibicao || email || 'Minha conta';
};

const alternarMenuConta = (evento) => {
  evento.stopPropagation();
  const dropdown = document.getElementById('account-dropdown');
  const toggle = document.querySelector('.account-menu-toggle');
  if (!dropdown || !toggle) return;

  const abrindo = dropdown.hidden;
  dropdown.hidden = !abrindo;
  toggle.setAttribute('aria-expanded', String(abrindo));
};

// Fecha o dropdown ao clicar fora dele
document.addEventListener('click', (evento) => {
  const dropdown = document.getElementById('account-dropdown');
  const menu = document.querySelector('.account-menu');
  if (!dropdown || dropdown.hidden || !menu) return;

  if (!menu.contains(evento.target)) {
    dropdown.hidden = true;
    document.querySelector('.account-menu-toggle')?.setAttribute('aria-expanded', 'false');
  }
});

const abrirModalPerfil = () => {
  document.getElementById('account-dropdown').hidden = true;

  const email = localStorage.getItem('usuarioLogado') || '';
  const nomeExibicao = localStorage.getItem(CHAVE_NOME_EXIBICAO) || '';

  document.getElementById('perfil-email').value = email;
  document.getElementById('perfil-nome').value = nomeExibicao;

  abrirModal('modal-perfil');
};

const salvarPerfil = () => {
  const { value: nome } = document.getElementById('perfil-nome');

  if (nome.trim().length === 0) {
    localStorage.removeItem(CHAVE_NOME_EXIBICAO);
  } else {
    localStorage.setItem(CHAVE_NOME_EXIBICAO, nome.trim());
  }

  atualizarNomeConta();
  fecharModal('modal-perfil');
  mostrarToast('Perfil atualizado com sucesso!', 'sucesso');
};

/**
 * Sem backend real, não existe uma "senha atual" armazenada em lugar
 * nenhum pra conferir contra o que a pessoa digitar aqui — por isso
 * este fluxo só valida tamanho mínimo e confirmação, e simula o
 * sucesso. Trocar por uma chamada de API é obrigatório antes de ir
 * pra produção de verdade.
 */
const alterarSenha = () => {
  const { value: senhaAtual } = document.getElementById('senha-atual');
  const { value: senhaNova } = document.getElementById('senha-nova');
  const { value: senhaConfirmar } = document.getElementById('senha-confirmar');

  if (senhaAtual.trim().length === 0) {
    mostrarToast('Digite sua senha atual.', 'erro');
    return;
  }

  if (senhaNova.length < REGRAS.SENHA_MINIMA) {
    mostrarToast(`A nova senha precisa ter pelo menos ${REGRAS.SENHA_MINIMA} caracteres.`, 'erro');
    return;
  }

  if (senhaNova !== senhaConfirmar) {
    mostrarToast('A confirmação não bate com a nova senha.', 'erro');
    return;
  }

  document.getElementById('senha-atual').value = '';
  document.getElementById('senha-nova').value = '';
  document.getElementById('senha-confirmar').value = '';

  fecharModal('modal-senha');
  mostrarToast('Senha alterada com sucesso!', 'sucesso');
};

/** Valida em tempo real se "confirmar nova senha" bate com "nova senha". */
const configurarValidacaoSenha = () => {
  const nova = document.getElementById('senha-nova');
  const confirmar = document.getElementById('senha-confirmar');
  if (!nova || !confirmar) return;

  const validar = () => {
    const grupoConfirmar = confirmar.closest('.input-icon-group');
    if (!grupoConfirmar || confirmar.value.length === 0) {
      grupoConfirmar?.classList.remove('senha-confere', 'senha-nao-confere');
      return;
    }
    const confere = confirmar.value === nova.value;
    grupoConfirmar.classList.toggle('senha-confere', confere);
    grupoConfirmar.classList.toggle('senha-nao-confere', !confere);
  };

  nova.addEventListener('input', validar);
  confirmar.addEventListener('input', validar);
};

const sairDaConta = () => {
  localStorage.removeItem('usuarioLogado');
  localStorage.removeItem(CHAVE_NOME_EXIBICAO);
  mostrarToast('Sessão encerrada. Até logo!', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 900);
};

// ----------------------------------------------------------------
// 11. Painel Admin
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
// 11.5 Navmenu — indicador de item ativo conforme a rolagem
// ----------------------------------------------------------------

const configurarScrollSpyNavmenu = () => {
  const links = document.querySelectorAll('.nav-links a[href^="#"]');
  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const mapaLinks = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const secao = document.getElementById(id);
    if (secao) mapaLinks.set(secao, link);
  });

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        const link = mapaLinks.get(entrada.target);
        if (!link) return;
        link.classList.toggle('ativo', entrada.isIntersecting);
      });
    },
    { rootMargin: '-40% 0px -50% 0px' }
  );

  mapaLinks.forEach((_, secao) => observer.observe(secao));
};

// ----------------------------------------------------------------
// 12. Inicialização
// ----------------------------------------------------------------

atualizarInterface();
atualizarInterfaceSala();
atualizarNomeConta();
configurarValidacaoSenha();
configurarScrollSpyNavmenu();
