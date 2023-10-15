const pool = require("../database/connection");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()


const cadastroUsuario = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: "Campos obrigatórios faltando" });
    }
    const usuarioExistente = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    if (usuarioExistente.rows.length > 0) {
      return res
        .status(400)
        .json({
          mensagem: "Já existe usuário cadastrado com o e-mail informado.",
        });
    }
    const cryptoSenha = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
      [nome, email, cryptoSenha]
    );
    const usuarioCadastrado = {
      id: result.rows[0].id,
      nome: result.rows[0].nome,
      email: result.rows[0].email,
    };
    res.status(201).json(usuarioCadastrado);
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const loginUsuario = async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res
        .status(400)
        .json({ mensagem: "Preencha todos os campos obrigatórios" });
    }
    const usuario = await pool.query(
      "select * from usuarios where email = $1",
      [email]
    );
    if (usuario.rowCount < 1) {
      return res
        .status(404)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }
    const senhaCorreta = await bcrypt.compare(senha, usuario.rows[0].senha);
    if (!senhaCorreta) {
      return res
        .status(400)
        .json({ mensagem: "Usuário e/ou senha inválido(s)." });
    }
    const token = jwt.sign({ id: usuario.rows[0].id }, process.env.SECRET_KEYS, {
      expiresIn: "8h",
    });
    const { senha: _, ...usuarioLogado } = usuario.rows[0];
    return res.status(200).json({ usuario: usuarioLogado, token });
  } catch (error) {
    console.log("Erro ao realizar o login do usuário:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};

const obterDetalhesDoUsuario = async (req, res) => {
  try {
    const id = req.usuario;
    const info = {
      id: id.id,
      nome: id.nome,
      email: id.email
    }
    res.status(200).json(info);
  } catch (error) {
    console.error("Erro ao obter detalhes do usuário:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
}

const atualizarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    const dadosDoUsuario = req.usuario
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios' });
    }
    const verificacaoDeEmailExistente = await pool.query('select * from usuarios where email = $1', [email]);
    if (verificacaoDeEmailExistente.rowCount > 0) {
      res.status(400).json({ mensagem: "O e-mail informado já está sendo utilizado por outro usuário." })
    }
    const cryptoSenha = await bcrypt.hash(senha, 10);
    await pool.query('update usuarios set nome = $1, email = $2, senha = $3 where id = $4',
      [nome, email, cryptoSenha, dadosDoUsuario.id]);
    return res.status(200).json();
  } catch (error) {
    console.error("Erro ao tentar atualizar o usuário:", error);
    return res.status(500).json('Erro interno do Servidor')
  }
}

module.exports = { cadastroUsuario, loginUsuario, obterDetalhesDoUsuario, atualizarUsuario };
