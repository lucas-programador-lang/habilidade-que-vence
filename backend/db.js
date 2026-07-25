const { Pool } = require('pg');

// A "connectionString" é a URL do seu banco de dados (você pegará isso no provedor de nuvem)
// Exemplo: postgres://usuario:senha@localhost:5432/habilidade_vence
const pool = new Pool({
  connectionString: "SUA_URL_DO_BANCO_DE_DADOS_AQUI", 
  ssl: {
    rejectUnauthorized: false // Necessário para a maioria dos bancos em nuvem
  }
});

pool.connect()
  .then(() => console.log('Conectado ao PostgreSQL com sucesso! 🐼'))
  .catch(err => console.error('Erro ao conectar no banco:', err.stack));

module.exports = pool;
