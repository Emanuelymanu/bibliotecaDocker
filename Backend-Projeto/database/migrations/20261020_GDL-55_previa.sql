SELECT
    t.id_conquista,
    t.nome,
    t.criterio,
    CASE
        -- "meta" como palavra inteira, sem número ou com número 1 ("1 meta", "Crie uma meta de leitura").
        -- Com outro número ("Bata sua meta de 12 livros") segue para as regras de baixo.
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
    (SELECT g.nome FROM generos g WHERE g.id_genero = t.genero_citado) AS genero_novo
FROM (
    SELECT
        c.id_conquista,
        c.nome,
        c.criterio,
        LOWER(COALESCE(NULLIF(TRIM(c.criterio), ''), c.descricao, '')) AS texto,
        (SELECT g.id_genero
           FROM generos g
          WHERE LOWER(COALESCE(NULLIF(TRIM(c.criterio), ''), c.descricao, '')) LIKE CONCAT('%', LOWER(g.nome), '%')
          ORDER BY CHAR_LENGTH(g.nome) DESC
          LIMIT 1) AS genero_citado
    FROM conquistas c
) t
ORDER BY t.id_conquista;