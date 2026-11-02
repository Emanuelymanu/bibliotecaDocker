# Diagrama C4 — Nível 1: Contexto

Visão geral do sistema: quem o utiliza e com quais sistemas externos ele se comunica.

```mermaid
flowchart TB
    leitor["<b>Leitor</b><br/>[Pessoa]<br/><br/>Busca livros, monta sua estante,<br/>registra leituras e acompanha conquistas"]
    admin["<b>Administrador</b><br/>[Pessoa]<br/><br/>Gerencia o catálogo de livros<br/>e de conquistas"]

    sistema["<b>Sistema Biblioteca</b><br/>(Estante Digital)<br/>[Sistema de Software]<br/><br/>Permite aos usuários organizar<br/>leituras pela web e pelo app mobile"]

    google["<b>Google Books API</b><br/>[Sistema Externo]<br/><br/>Fornece dados de livros:<br/>título, autor, capa e descrição"]

    leitor -- "Usa<br/>[HTTPS]" --> sistema
    admin -- "Administra<br/>[HTTPS]" --> sistema
    sistema -- "Busca livros<br/>[HTTPS/JSON]" --> google

    classDef pessoa fill:#08427b,stroke:#052e56,color:#fff
    classDef interno fill:#1168bd,stroke:#0b4884,color:#fff
    classDef externo fill:#999999,stroke:#6b6b6b,color:#fff

    class leitor,admin pessoa
    class sistema interno
    class google externo
```

## Elementos

| Elemento | Tipo | Descrição |
|---|---|---|
| Leitor | Pessoa | Usuário que busca livros, organiza sua estante e acompanha conquistas pela web ou pelo app mobile. |
| Administrador | Pessoa | Usuário com permissão de admin que gerencia o catálogo de livros e de conquistas. |
| Sistema Biblioteca | Sistema de software | O sistema documentado aqui (frontend web, app mobile, backend e conquistas-service). |
| Google Books API | Sistema externo | API pública do Google consultada pelo backend para buscar dados de livros. |
