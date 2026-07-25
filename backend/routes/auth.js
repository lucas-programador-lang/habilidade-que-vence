const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// CHAVE SECRETA DO SISTEMA (Em produção, guarde isso em um arquivo .env)
const SECRET_KEY = "chave_super_secreta_panda_2026"; 

// Simulando um Banco de Dados (Substitua por comandos do PostgreSQL depois)
const bancoDeDadosUsuarios = []; 

// 🟢 1. ROTA DE CADASTRO
router.post('/cadastro', async (req, res) => {
    const { nome, email, senha, codigoIndicacaoUsado } = req.body;

    // Verifica se o usuário já existe
    const usuarioExiste = bancoDeDadosUsuarios.find(u => u.email === email);
    if (usuarioExiste) {
        return res.status(400).json({ erro: "Email já cadastrado." });
    }

    try {
        // Criptografia Anti-hacker: Gera um "salt" de 10 rounds e encripta a senha
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        // Gera o código de indicação único do usuário (ex: PANDA-Joao123)
        const meuCodigoIndicacao = `PANDA-${nome.substring(0,4)}${Math.floor(Math.random() * 1000)}`;

        const novoUsuario = {
            id: bancoDeDadosUsuarios.length + 1,
            nome,
            email,
            senha: senhaCriptografada,
            saldo_real: 0.00,
            meu_codigo: meuCodigoIndicacao,
            indicado_por: codigoIndicacaoUsado || null, // Salva quem indicou para os 8%
            is_admin: false
        };

        bancoDeDadosUsuarios.push(novoUsuario);
        res.status(201).json({ sucesso: true, mensagem: "Conta criada com sucesso!" });

    } catch (erro) {
        res.status(500).json({ erro: "Erro interno no servidor." });
    }
});

// 🔵 2. ROTA DE LOGIN
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    // Busca o usuário
    const usuario = bancoDeDadosUsuarios.find(u => u.email === email);
    if (!usuario) {
        return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    // Compara a senha digitada com a senha criptografada no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
        return res.status(401).json({ erro: "Email ou senha incorretos." });
    }

    // Gera o Token JWT de acesso (válido por 8 horas)
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, is_admin: usuario.is_admin }, 
        SECRET_KEY, 
        { expiresIn: '8h' }
    );

    res.json({ 
        sucesso: true, 
        token, 
        usuario: { nome: usuario.nome, saldo: usuario.saldo_real, codigo: usuario.meu_codigo } 
    });
});

// 🟡 3. ROTA DE ESQUECI A SENHA
router.post('/esqueci-senha', (req, res) => {
    const { email } = req.body;
    // Aqui você integraria um serviço de envio de email (como Nodemailer ou SendGrid)
    // para enviar um link com um token temporário de redefinição.
    res.json({ sucesso: true, mensagem: "Se o email existir, um link de recuperação foi enviado." });
});

module.exports = router;
