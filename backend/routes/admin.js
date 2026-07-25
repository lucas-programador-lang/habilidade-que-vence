const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET_KEY = "chave_super_secreta_panda_2026"; // A mesma usada no auth.js

// Simulando o banco de dados (Em produção, você importará a conexão com o PostgreSQL)
// Importante: No seu banco real, sua conta deve ter 'is_admin: true'
let bancoDeDadosUsuarios = [
    { id: 1, nome: 'Admin Panda', email: 'admin@srapanda.com', saldo_real: 1000, is_admin: true },
    { id: 2, nome: 'Jogador 1', email: 'jogador1@teste.com', saldo_real: 15.50, is_admin: false }
];

// 🔒 MIDDLEWARE ANTI-HACKER: Verifica se quem faz a requisição é Admin
const verificarAdmin = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(403).json({ erro: "Nenhum token de segurança fornecido." });
    }

    try {
        // Remove a palavra "Bearer " e valida o token
        const tokenDecodificado = jwt.verify(token.split(" ")[1], SECRET_KEY);
        
        if (!tokenDecodificado.is_admin) {
            return res.status(403).json({ erro: "Acesso Negado! Apenas administradores." });
        }
        
        req.admin = tokenDecodificado; // Salva os dados do admin na requisição
        next(); // Autorizado! Passa para a rota solicitada.
    } catch (erro) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }
};

// 🟢 1. ROTA: Listar todos os usuários
router.get('/usuarios', verificarAdmin, (req, res) => {
    // Retorna os usuários sem a senha
    const usuariosSeguros = bancoDeDadosUsuarios.map(u => ({
        id: u.id, nome: u.nome, email: u.email, saldo_real: u.saldo_real, is_admin: u.is_admin
    }));
    res.json(usuariosSeguros);
});

// 🔵 2. ROTA: Alterar Saldo
router.put('/usuarios/:id/saldo', verificarAdmin, (req, res) => {
    const usuarioId = parseInt(req.params.id);
    const { novoSaldo } = req.body;

    const usuario = bancoDeDadosUsuarios.find(u => u.id === usuarioId);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

    usuario.saldo_real = parseFloat(novoSaldo);
    res.json({ sucesso: true, mensagem: `Saldo do usuário ${usuario.nome} atualizado para R$ ${usuario.saldo_real.toFixed(2)}.` });
});

// 🟡 3. ROTA: Alterar Senha (Redefinição manual pelo admin)
router.put('/usuarios/:id/senha', verificarAdmin, async (req, res) => {
    const usuarioId = parseInt(req.params.id);
    const { novaSenha } = req.body;

    const usuario = bancoDeDadosUsuarios.find(u => u.id === usuarioId);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

    // Criptografa a nova senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    usuario.senha = await bcrypt.hash(novaSenha, salt);

    res.json({ sucesso: true, mensagem: `Senha de ${usuario.nome} alterada com sucesso.` });
});

// 🔴 4. ROTA: Excluir Conta
router.delete('/usuarios/:id', verificarAdmin, (req, res) => {
    const usuarioId = parseInt(req.params.id);
    
    const index = bancoDeDadosUsuarios.findIndex(u => u.id === usuarioId);
    if (index === -1) return res.status(404).json({ erro: "Usuário não encontrado." });

    // Remove o usuário da Array (No PostgreSQL seria um DELETE FROM usuarios)
    bancoDeDadosUsuarios.splice(index, 1);
    res.json({ sucesso: true, mensagem: "Conta excluída permanentemente." });
});

module.exports = router;
