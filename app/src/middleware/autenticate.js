const jwt = require("jsonwebtoken");
const pool = require("../database/connection");
require('dotenv').config();

const verificarToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({
      mensagem:
        "Para acessar este recurso um token de autenticação válido deve ser enviado.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const { id } = jwt.verify(token, process.env.SECRET_KEYS);
    
    const { rows, rowCount } = await pool.query(
      "select * from usuarios where id = $1",
      [id]
    );

    if (rowCount < 1) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    req.usuario = rows[0];

    next();
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        mensagem: 'Token de autenticação inválido.',
      });
    }
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};
module.exports = verificarToken;
