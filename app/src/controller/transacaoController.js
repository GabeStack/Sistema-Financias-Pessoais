const pool = require('../database/connection');

const listarCategorias = async (req, res) => {
  try {

    const categorias = await pool.query('SELECT * FROM categorias');

    res.status(200).json(categorias.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
};

const cadastrarTransacao = async (req, res) => {
  const { descricao, valor, data, categoria_id, tipo } = req.body
  try {
    const dadosDoUsuario = req.usuario;
    if (!descricao || !valor || !data || !categoria_id || !tipo) {
      return res.status(400).json({ mensagem: 'Preencha todos os campos obrigatórios' });
    }
    const validacaoDaCategoriaId = await pool.query('select descricao from categorias where id = $1', [categoria_id]);
    if (validacaoDaCategoriaId.rowCount < 1) {
      return res.status(404).json({ mensagem: 'A categoria ID informada não existe.' });
    }
    if (tipo === "entrada" || tipo === "saida") {
      const transacaoFeita = await pool.query('insert into transacoes (descricao, valor, data, categoria_id, usuario_id, tipo) values ($1, $2, $3, $4, $5, $6) RETURNING id, descricao, valor, data, categoria_id, usuario_id, tipo ',
        [descricao, valor, data, categoria_id, dadosDoUsuario.id, tipo]);
      const dadosDaTransacaoRealizada = {
        id: transacaoFeita.rows[0].id,
        tipo: transacaoFeita.rows[0].tipo,
        descricao: transacaoFeita.rows[0].descricao,
        valor: transacaoFeita.rows[0].valor,
        data: transacaoFeita.rows[0].data,
        usuario_id: transacaoFeita.rows[0].usuario_id,
        categoria_id: transacaoFeita.rows[0].categoria_id,
        categoria_nome: validacaoDaCategoriaId.rows[0].descricao
      };
      res.status(200).json(dadosDaTransacaoRealizada);
    } else {
      return res.status(400).json({ mensagem: "O tipo de transação não é valido." });
    }
  } catch (error) {
    console.error('Erro ao cadastrar Transação:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

const excluirTransacao = async (req, res) => {
  const { id } = req.params;
  try {
    const dadosDoUsuario = req.usuario;
    const validacaoDoIdDaRota = await pool.query('select id, usuario_id from transacoes where id = $1', [id]);
    if (validacaoDoIdDaRota.rowCount < 1) {
      return res.status(404).json({ mensagem: 'Transação não encontrada.' });
    }
    if (validacaoDoIdDaRota.rows[0].usuario_id !== dadosDoUsuario.id) {
      return res.status(403).json({ mensagem: "Esta transação não pertence ao usuário logado." });
    }
    await pool.query('delete from transacoes where id = $1', [id])
    return res.status(204).json()
  } catch (error) {
    console.error('Erro ao Excluir Transação:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

const obterExtrato = async (req, res) => {
  try {
    const dadosDoUsuario = req.usuario;
    const somaEntrada = await pool.query('select sum(valor) from transacoes where tipo = $1 and usuario_id = $2', ["entrada", dadosDoUsuario.id])
    const somaSaida = await pool.query('select sum(valor) from transacoes where tipo = $1 and usuario_id = $2', ["saida", dadosDoUsuario.id])
    let entrada = somaEntrada.rows[0].sum;
    let saida = somaSaida.rows[0].sum;
    const nulo = null;
    if (entrada === nulo) {
      entrada = 0
    }
    if (saida === nulo) {
      saida = 0
    }
    const resultadoDaSoma = {
      entrada: Number(entrada),
      saida: Number(saida)
    };
    res.status(200).json(resultadoDaSoma);
  } catch (error) {
    console.error('Erro ao obter o extrato da transação:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

const detalharTransacao = async (req, res) => {
  const { id } = req.params;
  try {
    const dadosDoUsuario = req.usuario;
    const validacaoDoIdDaRota = await pool.query('select * from transacoes where id = $1', [id]);
    if (validacaoDoIdDaRota.rowCount < 1) {
      return res.status(404).json({ mensagem: 'Transação não encontrada.' });
    }
    if (validacaoDoIdDaRota.rows[0].usuario_id !== dadosDoUsuario.id) {
      return res.status(403).json({ mensagem: "Esta transação não pertence ao usuário logado." });
    }
    const categoriaNome = await pool.query('select descricao from categorias where id = $1', [validacaoDoIdDaRota.rows[0].categoria_id])
    const dadosDaTransacaoRealizada = {
      id: validacaoDoIdDaRota.rows[0].id,
      tipo: validacaoDoIdDaRota.rows[0].tipo,
      descricao: validacaoDoIdDaRota.rows[0].descricao,
      valor: validacaoDoIdDaRota.rows[0].valor,
      data: validacaoDoIdDaRota.rows[0].data,
      usuario_id: validacaoDoIdDaRota.rows[0].usuario_id,
      categoria_id: validacaoDoIdDaRota.rows[0].categoria_id,
      categoria_nome: categoriaNome.rows[0].descricao
    }
    res.status(200).json(dadosDaTransacaoRealizada);
  } catch (error) {
    console.error('Erro ao Detalhar Transação:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

const listarTransacao = async (req, res) => {
  try {
    const { id } = req.usuario;
    const { filtro } = req.query;

    
    const { rows } = await pool.query(
      'SELECT t.*, c.descricao AS categoria_nome FROM transacoes t ' +
      'INNER JOIN categorias c ON t.categoria_id = c.id ' +
      'WHERE t.usuario_id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(204).json([]);
    }
    if(filtro){

      const { rows } = await pool.query(
        'SELECT t.*, c.descricao AS categoria_nome FROM transacoes t ' +
        'INNER JOIN categorias c ON t.categoria_id = c.id ' +
        'WHERE t.usuario_id = $1 AND c.descricao = ANY($2)',
        [id, filtro]
      );
      if(rows.length < 1){
        return res.status(400).json({ mensagem: 'O parâmetro inválido.' });
      }

console.log(filtro)
      res.status(200).json(rows);
    }else{
      res.status(200).json(rows);
    }

    
  } catch (error) {
    console.error('Erro ao listar transações do usuário:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

const atualizarTransacao = async (req, res) => {
  try {
    const { id } = req.usuario;
    const transacaoId = req.params.id;
    const { descricao, valor, data, categoria_id, tipo } = req.body;

    if (!descricao || !valor || !data || !categoria_id || !tipo) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios faltando' });
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
      return res.status(400).json({ mensagem: 'O tipo deve ser "entrada" ou "saida"' });
    }

    const { rows, rowCount } = await pool.query(
      'SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2',
      [transacaoId, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ mensagem: 'Transação não encontrada ou não pertence ao usuário logado' });
    }
    await pool.query(
      'UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6',
      [descricao, valor, data, categoria_id, tipo, transacaoId]
    );

    res.status(204).json({});
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({ mensagem: 'Erro interno do servidor' });
  }
}

module.exports = { listarCategorias, cadastrarTransacao, excluirTransacao, obterExtrato, detalharTransacao, listarTransacao, atualizarTransacao };