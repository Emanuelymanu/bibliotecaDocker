START TRANSACTION;


INSERT INTO gamificacao.conquistas
  (id_conquista, nome, descricao, icone, criterio, tipo, valor_alvo, id_genero)
SELECT
  o.id_conquista, o.nome, o.descricao, o.icone, o.criterio, o.tipo, o.valor_alvo, o.id_genero
FROM projeto5p.conquistas o
WHERE NOT EXISTS (
  SELECT 1 FROM gamificacao.conquistas d WHERE d.id_conquista = o.id_conquista
);


INSERT INTO gamificacao.usuario_conquistas
  (id_usuario, id_conquista, data_conquista)
SELECT
  o.id_usuario, o.id_conquista, o.data_conquista
FROM projeto5p.usuario_conquistas o
WHERE NOT EXISTS (
  SELECT 1 FROM gamificacao.usuario_conquistas d
  WHERE d.id_usuario = o.id_usuario AND d.id_conquista = o.id_conquista
);

COMMIT;


SELECT
  'conquistas' AS tabela,
  (SELECT COUNT(*) FROM projeto5p.conquistas)   AS origem,
  (SELECT COUNT(*) FROM gamificacao.conquistas) AS destino,
  (SELECT COUNT(*) FROM projeto5p.conquistas o
     WHERE NOT EXISTS (SELECT 1 FROM gamificacao.conquistas d
                       WHERE d.id_conquista = o.id_conquista)) AS faltando
UNION ALL
SELECT
  'usuario_conquistas',
  (SELECT COUNT(*) FROM projeto5p.usuario_conquistas),
  (SELECT COUNT(*) FROM gamificacao.usuario_conquistas),
  (SELECT COUNT(*) FROM projeto5p.usuario_conquistas o
     WHERE NOT EXISTS (SELECT 1 FROM gamificacao.usuario_conquistas d
                       WHERE d.id_usuario = o.id_usuario
                         AND d.id_conquista = o.id_conquista));