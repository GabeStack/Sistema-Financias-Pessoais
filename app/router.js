const express = require('express');
const router = express.Router();
const { cadastroUsuario, loginUsuario, obterDetalhesDoUsuario, atualizarUsuario } = require('./src/controller/usuarioController');
const verificarToken = require('./src/middleware/autenticate');
const { listarCategorias, cadastrarTransacao, excluirTransacao, obterExtrato, detalharTransacao, listarTransacao, atualizarTransacao } = require('./src/controller/transacaoController');


router.post('/usuario', cadastroUsuario);
router.post('/login', loginUsuario);

router.use(verificarToken);

router.get('/usuario', obterDetalhesDoUsuario);

router.get('/categoria', listarCategorias);
router.get('/transacao/extrato', obterExtrato);
router.get('/transacao/:id', detalharTransacao);
router.get('/transacao', listarTransacao);

router.post('/transacao', cadastrarTransacao);

router.put('/usuario', atualizarUsuario);

router.put('/transacao/:id', atualizarTransacao);

router.delete('/transacao/:id', excluirTransacao);

module.exports = router;