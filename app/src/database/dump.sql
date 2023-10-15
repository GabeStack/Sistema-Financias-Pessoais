create database dindin;

CREATE TABLE usuarios (
    id SERIAL PRIMARY key NOT NULL,
    nome VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    senha VARCHAR(255)
);

CREATE TABLE categorias (
    id SERIAL PRIMARY key NOT NULL,
    descricao VARCHAR(255)
);

CREATE TABLE transacoes (
    id SERIAL PRIMARY key NOT NULL,
    descricao VARCHAR(255),
    valor INT,
    data DATE,
    categoria_id INT,
    usuario_id INT,
    tipo VARCHAR(10),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT INTO categorias (descricao)
VALUES
    ('Alimentação'),
    ('Assinaturas e Serviços'),
    ('Casa'),
    ('Mercado'),
    ('Cuidados Pessoais'),
    ('Educação'),
    ('Família'),
    ('Lazer'),
    ('Pets'),
    ('Presentes'),
    ('Roupas'),
    ('Saúde'),
    ('Transporte'),
    ('Salário'),
    ('Vendas'),
    ('Outras receitas'),
    ('Outras despesas');