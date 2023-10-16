const { Pool } = require('pg');
require('dotenv').config()

const pool = new Pool({
    host: process.env.HOST,
    port: process.env.PORT,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

pool.connect()
    .then(client => {
        console.log('Conexão com o banco de dados bem-sucedida');
        client.release(); // Libere o cliente de volta para o pool
    })
    .catch(err => {
        console.error('Erro ao conectar ao banco de dados:', err);
    });

module.exports = pool;