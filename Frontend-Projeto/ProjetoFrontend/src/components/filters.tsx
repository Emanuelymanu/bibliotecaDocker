import "../css/filters.css";

export function Filters(props: any) {

  function aplicarFiltro() {
    let filtrados = props.livros;

    if (props.statusFilter !== "todos") {
      filtrados = filtrados.filter(
        (l: any) => l.status_leitura === props.statusFilter
      );
    }

    if (props.generoFilter !== "todos") {
      filtrados = filtrados.filter(
        (l: any) => l.genero === props.generoFilter
      );
    }

    if (props.editoraFilter !== "todos") {
      filtrados = filtrados.filter(
        (l: any) => l.editora === props.editoraFilter
      );
    }

    if (props.avaliacaoFilter !== "todos") {
      filtrados = filtrados.filter(
        (l: any) => l.avaliacao === Number(props.avaliacaoFilter)
      );
    }

    if (props.sortBy === "titulo") {
      filtrados = [...filtrados].sort((a: any, b: any) =>
        a.titulo.localeCompare(b.titulo)
      );
    } else {
      filtrados = [...filtrados].sort((a: any, b: any) =>
        b.id - a.id
      );
    }

    props.setLivrosFiltrados(filtrados);
  }

  return (
    <section className="filters-container">
      <div className="filters-card">
        <div className="filters-grid-custom">

          <div className="filters-group">
            <label>Status</label>
            <select
              value={props.statusFilter}
              onChange={(e) => props.setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="Lido">Lido</option>
              <option value="Lendo">Lendo</option>
              <option value="Quero Ler">Quero Ler</option>
              <option value="Não lido">Não lido</option>
              <option value="Abandonado">Abandonado</option>
              <option value="Relendo">Relendo</option>
            </select>
          </div>

          <div className="filters-group">
            <label>Gênero</label>
            <select
              value={props.generoFilter}
              onChange={(e) => props.setGeneroFilter(e.target.value)}
            >
              <option value="todos">Todos</option>
              {props.generos.map((g: any) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="filters-group">
            <label>Editora</label>
            <select
              value={props.editoraFilter}
              onChange={(e) => props.setEditoraFilter(e.target.value)}
            >
              <option value="todos">Todas</option>
              {props.editoras.map((e: any) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div className="filters-group">
            <label>Avaliação</label>
            <select
              value={props.avaliacaoFilter}
              onChange={(e) => props.setAvaliacaoFilter(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>

          <div className="filters-group">
            <button
              className="btn-filter-primary"
              onClick={aplicarFiltro}
            >
              Filtrar
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}