ALTER TABLE conquistas
    ADD COLUMN tipo ENUM(
        'MANUAL', 'LIVROS_LIDOS', 'LIVROS_CADASTRADOS', 'PAGINAS_LIDAS', 'SESSOES',
        'ANOTACOES', 'AVALIACOES', 'GENEROS_DISTINTOS', 'LIVROS_GENERO', 'POSSUI_META'
    ) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN valor_alvo INT NOT NULL DEFAULT 1,
    ADD COLUMN id_genero INT NULL;
 
ALTER TABLE conquistas
    ADD CONSTRAINT fk_conquistas_genero
        FOREIGN KEY (id_genero) REFERENCES generos (id_genero) ON DELETE SET NULL;
 

CREATE TEMPORARY TABLE conversao_conquistas AS
SELECT
    t.id_conquista,
    CASE

        WHEN t.texto REGEXP '(^|[^a-z])meta([^a-z]|$)'
         AND COALESCE(CAST(REGEXP_SUBSTR(t.texto, '[0-9]+') AS UNSIGNED), 1) = 1 THEN 'POSSUI_META'
        WHEN (t.texto LIKE '%genero%' OR t.texto LIKE '%gênero%')
         AND (t.texto LIKE '%diferente%' OR t.texto LIKE '%distint%')       THEN 'GENEROS_DISTINTOS'
        WHEN t.texto LIKE '%sess%'                                          THEN 'SESSOES'
        WHEN t.texto LIKE '%pagina%' OR t.texto LIKE '%página%'             THEN 'PAGINAS_LIDAS'
        WHEN t.texto LIKE '%anota%'                                         THEN 'ANOTACOES'
        WHEN t.texto LIKE '%avali%'                                         THEN 'AVALIACOES'
        WHEN t.texto LIKE '%cadastr%' OR t.texto LIKE '%adicion%'           THEN 'LIVROS_CADASTRADOS'
        WHEN (t.texto LIKE '%livro%' OR t.texto LIKE '%leitura%')
         AND t.genero_citado IS NOT NULL                                    THEN 'LIVROS_GENERO'
        WHEN t.texto LIKE '%livro%' OR t.texto LIKE '%leitura%'             THEN 'LIVROS_LIDOS'
        ELSE 'MANUAL'
    END AS tipo_novo,
    COALESCE(CAST(REGEXP_SUBSTR(t.texto, '[0-9]+') AS UNSIGNED), 1) AS valor_alvo_novo,
    t.genero_citado
FROM (
    SELECT
        c.id_conquista,
        LOWER(COALESCE(NULLIF(TRIM(c.criterio), ''), c.descricao, '')) AS texto,
        (SELECT g.id_genero
           FROM generos g
          WHERE LOWER(COALESCE(NULLIF(TRIM(c.criterio), ''), c.descricao, '')) LIKE CONCAT('%', LOWER(g.nome), '%')
          ORDER BY CHAR_LENGTH(g.nome) DESC
          LIMIT 1) AS genero_citado
    FROM conquistas c
) t;
 
UPDATE conquistas c
JOIN conversao_conquistas v ON v.id_conquista = c.id_conquista
SET c.tipo       = v.tipo_novo,
    c.valor_alvo = CASE WHEN v.tipo_novo IN ('MANUAL', 'POSSUI_META') THEN 1 ELSE v.valor_alvo_novo END,
    c.id_genero  = CASE WHEN v.tipo_novo = 'LIVROS_GENERO' THEN v.genero_citado ELSE NULL END;
 
DROP TEMPORARY TABLE conversao_conquistas;
 

SELECT c.id_conquista, c.nome, c.criterio, c.tipo, c.valor_alvo, g.nome AS genero
FROM conquistas c
LEFT JOIN generos g ON g.id_genero = c.id_genero
ORDER BY c.id_conquista;
 
-- Rollback :
-- ALTER TABLE conquistas DROP FOREIGN KEY fk_conquistas_genero;
-- ALTER TABLE conquistas DROP COLUMN id_genero, DROP COLUMN valor_alvo, DROP COLUMN tipo;