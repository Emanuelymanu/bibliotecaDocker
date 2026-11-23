# Modelo de domínio — Gamificação (conquistas-service)

```mermaid
classDiagram
    direction TB

    namespace AgregadoConquista {
        class Conquista {
            <<Entity, Aggregate Root>>
            id_conquista
            nome
            descricao
            icone
            criterio: texto de exibição
        }
        class CriterioConquista {
            <<Value Object>>
            tipo: TipoConquista
            valor_alvo
            id_genero?
            nome_genero?
        }
        class TipoConquista {
            <<Enum>>
            MANUAL
            LIVROS_LIDOS
            LIVROS_CADASTRADOS
            PAGINAS_LIDAS
            SESSOES
            ANOTACOES
            AVALIACOES
            GENEROS_DISTINTOS
            LIVROS_GENERO
            POSSUI_META
        }
    }

    namespace AgregadoConquistaDoUsuario {
        class ConquistaDoUsuario {
            <<Entity, Aggregate Root>>
            PK id_usuario + id_conquista
            data_conquista
            visualizada
        }
    }

    namespace AgregadoEstatisticasLeitor {
        class EstatisticasLeitor {
            <<Entity, Aggregate Root>>
            PK id_usuario
            livros_lidos
            livros_cadastrados
            paginas_lidas
            total_sessoes
            total_anotacoes
            total_avaliacoes
            possui_meta
            livros_lidos_por_genero
            gerado_em
        }
    }

    class ConquistasRegras {
        <<Domain Service>>
        progresso(criterio, estatisticas)
        atingiu(criterio, estatisticas)
    }

    class EstatisticasAtualizadas {
        <<Domain Event>>
        usuarioId
        estatisticas: snapshot
        geradoEm
    }

    Conquista *-- CriterioConquista : compõe
    CriterioConquista --> TipoConquista
    ConquistaDoUsuario ..> Conquista : referencia por id_conquista
    EstatisticasAtualizadas --> EstatisticasLeitor : atualiza se geradoEm for mais novo
    ConquistasRegras ..> CriterioConquista
    ConquistasRegras ..> EstatisticasLeitor
    ConquistasRegras ..> ConquistaDoUsuario : concede uma única vez
```

- `id_usuario` pertence ao contexto Identidade e Acesso (sem FK entre schemas).
- Explicação de cada elemento em [arquitetura/modelo-dominio-gamificacao.md](../arquitetura/modelo-dominio-gamificacao.md).
