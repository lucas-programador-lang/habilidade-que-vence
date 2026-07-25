const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Cria o servidor HTTP e acopla o Socket.io para comunicação em tempo real
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Memória da Sala de Jogo
const salaOficial = {
    jogadores: [], // Vai guardar { id, nome, pontos }
    valorAcumulado: 0.00,
    mensagens: [] // Histórico do chat
};

const VALOR_ENTRADA = 0.50;

// Quando um jogador conecta no túnel
io.on('connection', (socket) => {
    console.log(`Novo jogador conectado: ${socket.id}`);

    // 🟢 JOGADOR ENTRA NA SALA
    socket.on('entrar_jogo', (dadosUsuario) => {
        // Deduz R$ 0,50 do saldo do usuário no banco de dados aqui...
        salaOficial.valorAcumulado += VALOR_ENTRADA;

        const novoJogador = {
            id: socket.id,
            nome: dadosUsuario.nome,
            pontos: 0
        };
        salaOficial.jogadores.push(novoJogador);

        // Avisa TODOS os jogadores que alguém entrou e atualiza o pote de dinheiro
        io.emit('atualizar_sala', salaOficial);
    });

    // 🟡 CHAT DAS PROVOCAÇÕES
    socket.on('enviar_mensagem', (mensagem) => {
        const chatMsg = { nome: mensagem.nome, texto: mensagem.texto, hora: new Date().toLocaleTimeString() };
        salaOficial.mensagens.push(chatMsg);
        
        // Dispara a mensagem para a tela de todo mundo na hora
        io.emit('nova_mensagem', chatMsg);
    });

    // 🔵 PONTUAÇÃO DO JOGO
    socket.on('marcar_ponto', () => {
        const jogador = salaOficial.jogadores.find(j => j.id === socket.id);
        if (jogador) {
            jogador.pontos += 10; // Aumenta a pontuação
            
            // Ordena para o maior pontuador ficar no topo
            salaOficial.jogadores.sort((a, b) => b.pontos - a.pontos);
            
            // Atualiza o placar de todo mundo
            io.emit('atualizar_sala', salaOficial);
        }
    });

    // 🔴 DESCONEXÃO OU FIM DE JOGO
    socket.on('disconnect', () => {
        salaOficial.jogadores = salaOficial.jogadores.filter(j => j.id !== socket.id);
        io.emit('atualizar_sala', salaOficial);
    });
});

server.listen(5000, () => {
    console.log('Servidor Habilidade Que Vence rodando na porta 5000 🐼');
});
