// Lógica blindada contra hackers no servidor
const TAXA_SAQUE = 0.10; // 10%
const MINIMO_SAQUE = 10.00;
const MINIMO_DEPOSITO = 0.50;
const COMISSAO_INDICACAO = 0.08; // 8%

function solicitarSaque(usuarioId, saldoAtual, valorSolicitado) {
    const dataAtual = new Date();
    const DIA_DOMINGO = 0; // 0 = Domingo no JavaScript

    // Regra 1: Saque somente aos domingos
    if (dataAtual.getDay() !== DIA_DOMINGO) {
        return { erro: "Saques só são permitidos aos domingos.", sucesso: false };
    }

    // Regra 2: Mínimo de R$ 10,00
    if (valorSolicitado < MINIMO_SAQUE) {
        return { erro: `O valor mínimo para saque é de R$ ${MINIMO_SAQUE.toFixed(2)}.`, sucesso: false };
    }

    // Regra 3: Antifraude de Saldo
    if (valorSolicitado > saldoAtual) {
        return { erro: "Saldo insuficiente ou tentativa de fraude detectada.", sucesso: false };
    }

    // Regra 4: Aplicação da Taxa
    const valorTaxa = valorSolicitado * TAXA_SAQUE;
    const valorLiquido = valorSolicitado - valorTaxa;

    // Retorna para a API de Pagamento (PIX) executar
    return {
        sucesso: true,
        novoSaldo: saldoAtual - valorSolicitado,
        valorParaTransferirPix: valorLiquido,
        mensagem: `Saque de R$ ${valorLiquido.toFixed(2)} processado com sucesso. Taxa retida: R$ ${valorTaxa.toFixed(2)}.`
    };
}

function processarDepositoComIndicação(valorDepositado, indicadorId) {
    if (valorDepositado < MINIMO_DEPOSITO) return { erro: "Depósito mínimo de R$ 0,50." };

    let bonusIndicador = 0;
    if (indicadorId) {
        bonusIndicador = valorDepositado * COMISSAO_INDICACAO; // Paga 8% para o afiliado
    }

    return { sucesso: true, bonusAfiliado: bonusIndicador };
}

module.exports = { solicitarSaque, processarDepositoComIndicação };
