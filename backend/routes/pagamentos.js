const express = require('express');
const axios = require('axios');
const router = express.Router();

// 🔑 TOKEN DO BANCO (Pegue isso no painel de desenvolvedor do Mercado Pago ou Asaas)
const TOKEN_API_BANCARIA = "TEST-seu-token-de-producao-aqui"; 

// 🟢 1. ROTA DE DEPÓSITO (Gera o PIX Copia e Cola)
router.post('/depositar', async (req, res) => {
    const { usuarioId, valor } = req.body; // valor será 0.50

    if (valor < 0.50) {
        return res.status(400).json({ erro: "O depósito mínimo é de R$ 0,50." });
    }

    try {
        // Chamada para a API do Banco (Exemplo padrão REST)
        const respostaBanco = await axios.post('https://api.mercadopago.com/v1/payments', {
            transaction_amount: valor,
            payment_method_id: 'pix',
            payer: { email: `usuario${usuarioId}@srapanda.com` } // Identificador
        }, {
            headers: { Authorization: `Bearer ${TOKEN_API_BANCARIA}` }
        });

        const qrcodeBase64 = respostaBanco.data.point_of_interaction.transaction_data.qr_code_base64;
        const copiaECola = respostaBanco.data.point_of_interaction.transaction_data.qr_code;
        const idTransacao = respostaBanco.data.id;

        res.json({
            sucesso: true,
            qrCode: qrcodeBase64,
            copiaECola: copiaECola,
            idTransacao: idTransacao,
            mensagem: "PIX gerado! O saldo entrará automaticamente após o pagamento."
        });
    } catch (erro) {
        res.status(500).json({ erro: "Falha ao comunicar com o banco." });
    }
});

// 🔔 2. WEBHOOK (O Banco chama essa rota para avisar que o usuário pagou)
router.post('/webhook-pix', async (req, res) => {
    const dados = req.body;

    // Se o pagamento foi aprovado
    if (dados.type === 'payment' && dados.action === 'payment.created') {
        const idPagamento = dados.data.id;

        // 1. Busca os detalhes do pagamento no banco para saber quem pagou
        // 2. Atualiza o `saldo_real` do usuário no seu banco de dados
        // 3. REGRA DE INDICAÇÃO: Verifica se o usuário tem um 'indicado_por'
        // 4. Se tiver, adiciona 8% do valor no saldo do Afiliado.
        
        console.log(`Pagamento ${idPagamento} recebido com sucesso! Saldo e bônus atualizados.`);
    }

    // Retorna 200 OK rápido para o banco não cancelar a notificação
    res.status(200).send("OK");
});

// 🔴 3. ROTA DE SAQUE (Transferência Automática PIX)
router.post('/sacar', async (req, res) => {
    const { chavePix, valorSolicitado } = req.body;
    // req.admin ou req.user vem do middleware de verificação de token

    const hoje = new Date();
    const DIA_DOMINGO = 0; 

    // 🛡️ REGRAS DE NEGÓCIO IMPLEMENTADAS AQUI:
    if (hoje.getDay() !== DIA_DOMINGO) {
        return res.status(403).json({ erro: "Saques só são permitidos aos domingos." });
    }
    if (valorSolicitado < 10.00) {
        return res.status(400).json({ erro: "O valor mínimo para saque é de R$ 10,00." });
    }
    
    // Simulação: verificar saldo no banco de dados
    const saldoUsuario = 50.00; // Substituir pela busca real no DB
    if (saldoUsuario < valorSolicitado) {
        return res.status(400).json({ erro: "Saldo insuficiente." });
    }

    const taxa = valorSolicitado * 0.10; // Taxa de 10%
    const valorLiquido = valorSolicitado - taxa;

    try {
        // Chamada de Transferência PIX para a API do Banco (Exemplo)
        /* 
        await axios.post('https://api.banco.com/v1/transferencias', {
            valor: valorLiquido,
            chave_destino: chavePix
        }, { headers: { Authorization: `Bearer ${TOKEN_API_BANCARIA}` } });
        */

        // Desconta o valor total do saldo do usuário no banco de dados...

        res.json({
            sucesso: true,
            mensagem: `Saque aprovado! R$ ${valorLiquido.toFixed(2)} enviados para a chave ${chavePix}. Taxa da casa: R$ ${taxa.toFixed(2)}.`
        });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao realizar a transferência no banco." });
    }
});

module.exports = router;
