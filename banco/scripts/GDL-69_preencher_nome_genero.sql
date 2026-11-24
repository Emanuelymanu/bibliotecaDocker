START TRANSACTION;

UPDATE gamificacao.conquistas c
JOIN projeto5p.generos g ON g.id_genero = c.id_genero
SET
  c.nome_genero = g.nome,
  c.criterio = CONCAT('Conclua ', c.valor_alvo, IF(c.valor_alvo = 1, ' livro', ' livros'), ' de ', g.nome)
WHERE c.tipo = 'LIVROS_GENERO'
  AND (c.nome_genero IS NULL OR c.nome_genero = '');

COMMIT;


SELECT id_conquista, nome, id_genero, nome_genero, criterio
FROM gamificacao.conquistas
WHERE tipo = 'LIVROS_GENERO'
ORDER BY id_conquista;