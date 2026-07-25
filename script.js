let saldoAtual = 10.50; 

function atualizarInterface() {
    let elem = document.getElementById('user-saldo');
    if(elem) {
        elem.innerText = `Saldo: R$ ${saldoAtual.toFixed(2).replace('.', ',')}`;
    }
}

function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}

function realizarDeposito() {
    let valor = parseFloat(document.getElementById('valor-deposito').value);
    if(isNaN(valor) || valor < 0.50) {
        alert('O valor mínimo de depósito automático via PIX é R$ 0,50');
        return;
    }
    saldoAtual += valor;
    atualizarInterface();
    fecharModal('modal-depositar');
    alert(`PIX gerado via API com sucesso! Depósito de R$ ${valor.toFixed(2)} creditado.`);
}

function realizarSaque() {
    let valor = parseFloat(document.getElementById('valor-saque').value);
    
    // Regra rígida: Saque somente aos domingos (0 = Domingo)
    let hoje = new Date().getDay();
    if (hoje !== 0) {
        alert('⚠️ ATENÇÃO: Os saques automáticos só são permitidos aos DOMINGOS!');
        return;
    }

    if(isNaN(valor) || valor < 10.00) {
        alert('O valor mínimo para saque é R$ 10,00');
        return;
    }

    if(valor > saldoAtual) {
        alert('Saldo insuficiente!');
        return;
    }

    let taxa = valor * 0.10; // Taxa de saque de 10%
    let valorLiquido = valor - taxa;

    saldoAtual -= valor;
    atualizarInterface();
    fecharModal('modal-sacar');
    alert(`Saque via API solicitado com sucesso! Taxa de 10% aplicada. Valor líquido a receber: R$ ${valorLiquido.toFixed(2)}`);
}

function entrarNaSala(valor) {
    if(saldoAtual < valor) {
        alert('Saldo insuficiente para investir nesta partida! Faça um depósito a partir de R$ 0,50.');
        abrirModal('modal-depositar');
        return;
    }
    saldoAtual -= valor;
    atualizarInterface();
    alert(`Investimento de R$ ${valor.toFixed(2)} confirmado! Aguardando completar 4 participantes na sala.`);
}

function enviarMensagem() {
    let input = document.getElementById('input-chat');
    let texto = input.value.trim();
    if(texto === '') return;

    let chat = document.getElementById('chat-mensagens');
    chat.innerHTML += `<div><strong>Você:</strong> ${texto}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;
}

function copiarLink() {
    let input = document.getElementById('link-afiliado');
    input.select();
    navigator.clipboard.writeText(input.value);
    alert('Link de indicação (8% de comissão) copiado com sucesso!');
}

// Funções do Painel Admin
function adminAlterarSaldo() {
    alert('Saldo do usuário alterado com sucesso pelo administrador!');
}

function adminAlterarSenha() {
    alert('Senha do usuário alterada com sucesso!');
}

function adminExcluirConta() {
    if(confirm('Tem certeza que deseja excluir esta conta permanentemente?')) {
        alert('Conta excluída com sucesso.');
    }
}

// Inicialização
atualizarInterface();
