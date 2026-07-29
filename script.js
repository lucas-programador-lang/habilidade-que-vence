'use strict';

/* ================================================================
   HABILIDADE QUE VENCE — script.js
     1. Estado + persistência (localStorage)
     2. Toasts e confirmação customizada
     3. Modais
     4. Interface (saldo)
     5. Depósito (duas etapas)
     6. Saque
     7. Navegação em abas isoladas (páginas)
     8. Salas — fila real via Firebase Realtime Database
     9. Chat (XSS-safe)
     10. Indicação
     11. Conta (perfil, senha, sair)
     12. Admin
     13. Inicialização
   ================================================================ */

// ----------------------------------------------------------------
// 1. Estado + persistência
// ----------------------------------------------------------------

const CHAVE_SALDO = 'saldoAtual';

// 🧪 vagasNecessarias = 2 → modo de teste (abre com 2 jogadores reais).
//    Para produção, troque para 4 em cada sala.
const SALAS_CONFIG = {
  1: { nome: 'Uno Masters', valor: 0.50, premio: 2.00, vagasNecessarias: 2 },
  2: { nome: 'Truco de Baralho', valor: 1.00, premio: 4.00, vagasNecessarias: 2 },
  3: { nome: 'Arena da Escolha', valor: 2.00, premio: 8.00, vagasNecessarias: 2 },
};

const TEMPO_CONTAGEM_MS = 5000;
const TEMPO_TURNO_MS = 10000;

const carregarSaldoInicial = () => {
  const salvo = parseFloat(localStorage.getItem(CHAVE_SALDO));
  return Number.isNaN(salvo) ? 10.50 : salvo;
};

const estado = {
  saldoAtual: carregarSaldoInicial(),
  depositoPendente: null,
};

/** Salva o saldo no localStorage — chamado após qualquer mudança.
 *  A fila/turno das salas não é mais salva aqui: ela vive no
 *  Firebase Realtime Database, compartilhada entre navegadores. */
const persistirEstado = () => {
  localStorage.setItem(CHAVE_SALDO, estado.saldoAtual.toFixed(2));
};

const REGRAS = {
  DEPOSITO_MINIMO: 0.50,
  SAQUE_MINIMO: 10.00,
  TAXA_SAQUE: 0.10,
  DIA_LIBERADO_SAQUE: 0, // 0 = Domingo
  SENHA_MINIMA: 6,
};

// ----------------------------------------------------------------
// 2. Toasts e confirmação customizada
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
// 3. Modais
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
  persistirEstado();
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
  document.getElementById('deposito-valor-exibido').textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
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
// 6. Saque
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
// 7. Navegação em abas isoladas — cada aba é uma página cheia,
//    trocada via JS (sem scroll), com hash na URL para deep-link.
// ----------------------------------------------------------------

const PAGINA_PADRAO = 'salas';

const mostrarPagina = (nomePagina) => {
  const paginas = document.querySelectorAll('.pagina');
  const links = document.querySelectorAll('#nav-abas button');
  let existe = false;

  paginas.forEach((pagina) => {
    const ativa = pagina.dataset.pagina === nomePagina;
    pagina.classList.toggle('ativa', ativa);
    if (ativa) existe = true;
  });

  if (!existe) {
    mostrarPagina(PAGINA_PADRAO);
    return;
  }

  links.forEach((link) => {
    const ativo = link.dataset.pagina === nomePagina;
    link.classList.toggle('ativo', ativo);
    link.setAttribute('aria-current', ativo ? 'page' : 'false');
  });

  if (window.location.hash.slice(1) !== nomePagina) {
    history.replaceState(null, '', `#${nomePagina}`);
  }

  // Fecha o menu mobile ao trocar de página
  const navToggle = document.getElementById('nav-toggle');
  if (navToggle) navToggle.checked = false;
};

const configurarNavegacaoAbas = () => {
  document.querySelectorAll('#nav-abas button').forEach((botao) => {
    botao.addEventListener('click', () => mostrarPagina(botao.dataset.pagina));
  });

  window.addEventListener('hashchange', () => {
    mostrarPagina(window.location.hash.slice(1) || PAGINA_PADRAO);
  });

  mostrarPagina(window.location.hash.slice(1) || PAGINA_PADRAO);
};

// ----------------------------------------------------------------
// 8. Salas — fila real via Firebase Realtime Database.
//
//    Sem robôs, sem fila falsa: os "1/2" ou "2/2" jogadores que
//    aparecem na tela são navegadores reais escrevendo no mesmo
//    nó do Firebase. Ninguém é simulado localmente.
//
//    Estrutura no Realtime Database:
//      /salas/{id}/fila/{uid}      -> { nome, entrouEm }
//      /salas/{id}/status          -> 'aberta' | 'contagem' | 'em_andamento'
//      /salas/{id}/inicioEm        -> timestamp (fim da contagem de 5s)
//      /salas/{id}/turno/ordem     -> [uid, uid, ...]
//      /salas/{id}/turno/atual     -> uid
//      /salas/{id}/turno/prazoEm   -> timestamp (fim do turno de 10s)
//
//    Requer Firebase Auth Anônima habilitada e Realtime Database
//    criado no seu projeto (veja firebase-config.js).
// ----------------------------------------------------------------

let firebaseApp = null;
let firebaseDb = null;
let meuUid = null;
const listenersAtivos = {};   // salaId -> referência do listener no Firebase
const cronometrosAtivos = {}; // salaId -> setInterval do relógio local

const FIREBASE_DISPONIVEL = () =>
  typeof firebase !== 'undefined' &&
  typeof FIREBASE_CONFIG !== 'undefined' &&
  FIREBASE_CONFIG.apiKey !== 'COLE_AQUI_SUA_API_KEY';

const iniciarFirebase = () => {
  if (!FIREBASE_DISPONIVEL()) return false;
  if (!firebaseApp) {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firebaseDb = firebase.database();
  }
  return true;
};

const garantirLoginAnonimo = () =>
  new Promise((resolve, reject) => {
    if (!iniciarFirebase()) {
      reject(new Error('firebase-nao-configurado'));
      return;
    }
    firebase.auth().onAuthStateChanged((usuario) => {
      if (usuario) {
        meuUid = usuario.uid;
        resolve(meuUid);
      }
    });
    firebase.auth().signInAnonymously().catch(reject);
  });

const refSala = (salaId) => firebaseDb.ref(`salas/${salaId}`);

const atualizarInterfaceSala = (salaId, dadosSala = null) => {
  const config = SALAS_CONFIG[salaId];
  const botao = document.getElementById(`btn-entrar-${salaId}`);
  const badge = document.getElementById(`badge-sala-${salaId}`);
  const nota = document.getElementById(`nota-sala-${salaId}`);
  if (!config || !botao) return;

  const fila = dadosSala?.fila ? Object.keys(dadosSala.fila) : [];
  const jaEstouNaFila = meuUid ? fila.includes(meuUid) : false;
  const status = dadosSala?.status ?? 'aberta';

  const setBadge = (classeExtra, html) => {
    if (!badge) return;
    badge.classList.remove('badge-open', 'badge-wait');
    badge.classList.add(classeExtra);
    badge.innerHTML = html;
  };

  if (status === 'em_andamento') {
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-gamepad"></i> Partida em Andamento';
    setBadge('badge-wait', '<i class="fa-solid fa-circle-notch"></i> Jogando');
    if (nota) nota.textContent = 'Partida em andamento entre jogadores reais.';
  } else if (status === 'contagem') {
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Começando...';
    setBadge('badge-wait', `<i class="fa-solid fa-circle-notch"></i> ${fila.length}/${config.vagasNecessarias}`);
    if (nota) nota.textContent = 'Mesa completa. Iniciando contagem regressiva.';
  } else if (jaEstouNaFila) {
    botao.disabled = true;
    botao.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Aguardando Oponentes...';
    setBadge('badge-wait', `<i class="fa-solid fa-circle-notch"></i> ${fila.length}/${config.vagasNecessarias}`);
    if (nota) nota.textContent = `Você está confirmado. Aguardando jogadores reais (${fila.length}/${config.vagasNecessarias}).`;
  } else {
    botao.disabled = false;
    botao.innerHTML = `<i class="fa-solid fa-play"></i> Entrar na Partida (R$ ${config.valor.toFixed(2).replace('.', ',')})`;
    setBadge('badge-open', `<i class="fa-solid fa-circle"></i> Sala aberta (${fila.length}/${config.vagasNecessarias})`);
    if (nota) nota.textContent = 'Aguardando jogadores reais entrarem.';
  }
};

const pararCronometroSala = (salaId) => {
  if (cronometrosAtivos[salaId]) {
    clearInterval(cronometrosAtivos[salaId]);
    delete cronometrosAtivos[salaId];
  }
};

/** Painel central de contagem regressiva (5s) e de turno (10s) para uma sala. */
const atualizarPainelPartida = (salaId, dadosSala) => {
  const painel = document.getElementById(`partida-painel-${salaId}`);
  if (!painel) return;
  const config = SALAS_CONFIG[salaId];
  const status = dadosSala?.status ?? 'aberta';

  pararCronometroSala(salaId);

  if (status === 'contagem') {
    painel.hidden = false;
    const tick = () => {
      const restanteMs = (dadosSala.inicioEm ?? Date.now()) - Date.now();
      const restanteS = Math.max(0, Math.ceil(restanteMs / 1000));
      painel.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Começando o jogo em ${restanteS}s...`;
      if (restanteMs <= 0) {
        pararCronometroSala(salaId);
        tentarIniciarPartida(salaId, dadosSala);
      }
    };
    tick();
    cronometrosAtivos[salaId] = setInterval(tick, 250);
  } else if (status === 'em_andamento' && dadosSala.turno) {
    painel.hidden = false;
    const { atual, prazoEm, ordem } = dadosSala.turno;
    const souEu = atual === meuUid;
    const tick = () => {
      const restanteMs = (prazoEm ?? Date.now()) - Date.now();
      const restanteS = Math.max(0, Math.ceil(restanteMs / 1000));
      const quem = souEu ? 'Sua vez!' : 'Vez do oponente';
      painel.innerHTML = `
        <i class="fa-solid fa-clock"></i> ${quem} — ${restanteS}s
        ${souEu ? `<button class="btn-verde" style="margin-left:10px;" onclick="passarTurno('${salaId}')"><i class="fa-solid fa-play"></i> Fazer Jogada</button>` : ''}
      `;
      if (restanteMs <= 0) {
        pararCronometroSala(salaId);
        if (souEu) {
          mostrarToast('Tempo esgotado! Você perdeu a vez.', 'aviso');
        }
        tentarPassarTurnoPorTempo(salaId, dadosSala);
      }
    };
    tick();
    cronometrosAtivos[salaId] = setInterval(tick, 250);
  } else {
    painel.hidden = true;
  }
};

/** Só o cliente que detectar a mesa completa dispara a transação — evita corrida. */
const tentarIniciarContagem = (salaId, dadosSala) => {
  const config = SALAS_CONFIG[salaId];
  const fila = dadosSala?.fila ? Object.keys(dadosSala.fila) : [];
  if (dadosSala?.status !== 'aberta' || fila.length < config.vagasNecessarias) return;

  refSala(salaId).child('status').transaction((atual) => {
    if (atual === 'aberta' || atual === null) return 'contagem';
    return; // já mudou — aborta
  });
  refSala(salaId).child('inicioEm').transaction((atual) => atual ?? (Date.now() + TEMPO_CONTAGEM_MS));
};

const tentarIniciarPartida = (salaId, dadosSala) => {
  const fila = dadosSala?.fila ?? {};
  const ordem = Object.entries(fila)
    .sort((a, b) => (a[1].entrouEm ?? 0) - (b[1].entrouEm ?? 0))
    .map(([uid]) => uid);

  refSala(salaId).child('status').transaction((atual) => {
    if (atual === 'contagem') return 'em_andamento';
    return;
  });
  refSala(salaId).child('turno').transaction((atual) => {
    if (atual) return; // outro cliente já definiu
    return { ordem, atual: ordem[0], prazoEm: Date.now() + TEMPO_TURNO_MS };
  });
};

const passarTurno = (salaId) => {
  refSala(salaId).child('turno').transaction((turno) => {
    if (!turno || !Array.isArray(turno.ordem) || turno.atual !== meuUid) return;
    const indiceAtual = turno.ordem.indexOf(turno.atual);
    const proximo = turno.ordem[(indiceAtual + 1) % turno.ordem.length];
    return { ordem: turno.ordem, atual: proximo, prazoEm: Date.now() + TEMPO_TURNO_MS };
  });
};

/** Qualquer cliente conectado pode disparar o passe automático quando o prazo vence. */
const tentarPassarTurnoPorTempo = (salaId, dadosSala) => {
  const prazoConhecido = dadosSala?.turno?.prazoEm;
  refSala(salaId).child('turno').transaction((turno) => {
    if (!turno || !Array.isArray(turno.ordem)) return;
    if (turno.prazoEm !== prazoConhecido || Date.now() < turno.prazoEm) return; // já passou ou ainda não venceu
    const indiceAtual = turno.ordem.indexOf(turno.atual);
    const proximo = turno.ordem[(indiceAtual + 1) % turno.ordem.length];
    return { ordem: turno.ordem, atual: proximo, prazoEm: Date.now() + TEMPO_TURNO_MS };
  });
};

const escutarSala = (salaId) => {
  if (listenersAtivos[salaId]) return;
  const referencia = refSala(salaId);
  const callback = (snapshot) => {
    const dadosSala = snapshot.val();
    atualizarInterfaceSala(salaId, dadosSala);
    atualizarPainelPartida(salaId, dadosSala);
    tentarIniciarContagem(salaId, dadosSala);
  };
  referencia.on('value', callback);
  listenersAtivos[salaId] = { referencia, callback };
};

const entrarNaSala = async (salaId) => {
  const config = SALAS_CONFIG[salaId];
  if (!config) return;

  if (!FIREBASE_DISPONIVEL()) {
    mostrarToast('Fila real desativada: preencha firebase-config.js com as credenciais do seu projeto.', 'erro');
    return;
  }

  if (estado.saldoAtual < config.valor) {
    mostrarToast(`Saldo insuficiente para investir na ${config.nome}! Faça um depósito a partir de R$ ${REGRAS.DEPOSITO_MINIMO.toFixed(2)}.`, 'aviso');
    abrirModalDeposito();
    return;
  }

  try {
    await garantirLoginAnonimo();
  } catch {
    mostrarToast('Não foi possível conectar ao servidor de partidas. Verifique firebase-config.js.', 'erro');
    return;
  }

  const snapshotFila = await refSala(salaId).child('fila').get();
  if (snapshotFila.exists() && snapshotFila.hasChild(meuUid)) {
    mostrarToast('Você já está inscrito nessa sala.', 'aviso');
    return;
  }

  estado.saldoAtual -= config.valor;
  atualizarInterface();

  await refSala(salaId).child(`fila/${meuUid}`).set({
    nome: localStorage.getItem(CHAVE_NOME_EXIBICAO) || localStorage.getItem('usuarioLogado') || 'Jogador',
    entrouEm: firebase.database.ServerValue.TIMESTAMP,
  });

  mostrarToast(`Inscrição confirmada na ${config.nome}! R$ ${config.valor.toFixed(2)} descontado. Aguardando outros jogadores reais entrarem.`, 'sucesso');
};

/**
 * 🧪 FERRAMENTA DE TESTE — a decisão de quem venceu depende das
 * regras reais de cada jogo (Uno, Truco), que não estão implementadas
 * aqui. Este botão só existe para você testar o crédito/débito de
 * saldo; não é seguro deixar cada jogador se autodeclarar vencedor
 * em produção com dinheiro real.
 * @param {string} salaId
 * @param {boolean} venceu
 */
const processarResultadoPartida = async (salaId, venceu) => {
  const config = SALAS_CONFIG[salaId];
  if (!config) return;

  if (venceu) {
    estado.saldoAtual += config.premio;
    atualizarInterface();
    mostrarToast(`Vitória na ${config.nome}! Você levou o prêmio de R$ ${config.premio.toFixed(2)}.`, 'vitoria');
  } else {
    mostrarToast(`Não foi dessa vez na ${config.nome}. O valor investido não é devolvido.`, 'derrota');
  }

  if (meuUid) await refSala(salaId).child(`fila/${meuUid}`).remove();
  await refSala(salaId).update({ status: 'aberta', inicioEm: null, turno: null });
};

// ----------------------------------------------------------------
// 9. Chat — sempre via createElement + textContent, nunca innerHTML
//    com texto do usuário, pra impedir XSS.
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

const configurarEnvioChatComEnter = () => {
  const input = document.getElementById('input-chat');
  if (!input) return;
  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') enviarMensagem();
  });
};

const configurarSelecaoCanais = () => {
  document.querySelectorAll('.chat-canal').forEach((canal) => {
    canal.addEventListener('click', () => {
      document.querySelectorAll('.chat-canal').forEach((c) => c.classList.remove('ativo'));
      canal.classList.add('ativo');
      const nome = canal.textContent.trim();
      const titulo = document.querySelector('.chat-header h3');
      if (titulo) titulo.innerHTML = `<i class="fa-solid fa-hashtag"></i> ${nome.replace('#', '').trim()}`;
    });
  });
};

// ----------------------------------------------------------------
// 10. Indicação
// ----------------------------------------------------------------

const copiarLink = () => {
  const input = document.getElementById('link-afiliado');
  input.select();
  navigator.clipboard.writeText(input.value);
  mostrarToast('Link de indicação (8% de comissão) copiado com sucesso!', 'sucesso');
};

// ----------------------------------------------------------------
// 11. Conta — dropdown, perfil, alterar senha, sair
// ----------------------------------------------------------------

const CHAVE_NOME_EXIBICAO = 'nomeExibicao';

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
// 12. Admin
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
// 13. Inicialização
// ----------------------------------------------------------------

atualizarInterface();
atualizarNomeConta();
configurarValidacaoSenha();
configurarNavegacaoAbas();
configurarEnvioChatComEnter();
configurarSelecaoCanais();

Object.keys(SALAS_CONFIG).forEach((id) => atualizarInterfaceSala(id, null));

if (FIREBASE_DISPONIVEL()) {
  garantirLoginAnonimo()
    .then(() => Object.keys(SALAS_CONFIG).forEach((id) => escutarSala(id)))
    .catch(() => mostrarToast('Não foi possível conectar ao servidor de partidas.', 'erro'));
} else {
  mostrarToast('Fila real desativada: preencha firebase-config.js para ativar o matchmaking.', 'aviso');
}
