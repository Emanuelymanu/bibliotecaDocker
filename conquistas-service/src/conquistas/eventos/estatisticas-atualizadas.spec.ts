import { EventoInvalidoError, lerEventoEstatisticas, resumirEvento } from './estatisticas-atualizadas';


const doBackend = () => ({
  usuarioId: 7,
  geradoEm: '2026-11-04T14:00:00.123Z',
  estatisticas: {
    livrosLidos: 2,
    livrosCadastrados: 5,
    paginasLidas: 620,
    totalSessoes: 3,
    totalAnotacoes: 1,
    totalAvaliacoes: 2,
    possuiMeta: true,
    livrosLidosPorGenero: { '3': 2, '8': 1 },
  },
});

describe('lerEventoEstatisticas', () => {
  it('aceita o evento do backend e converte data e gêneros', () => {
    const evento = lerEventoEstatisticas(doBackend());

    expect(evento.usuarioId).toBe(7);
    expect(evento.geradoEm).toEqual(new Date('2026-11-04T14:00:00.123Z'));
    expect(evento.estatisticas).toEqual({
      livrosLidos: 2,
      livrosCadastrados: 5,
      paginasLidas: 620,
      totalSessoes: 3,
      totalAnotacoes: 1,
      totalAvaliacoes: 2,
      possuiMeta: true,
      livrosLidosPorGenero: { 3: 2, 8: 1 },
    });
  });

  it('aceita leitor sem nenhum livro lido', () => {
    const dados = doBackend();
    dados.estatisticas.livrosLidosPorGenero = {} as never;
    expect(lerEventoEstatisticas(dados).estatisticas.livrosLidosPorGenero).toEqual({});
  });

  it('ignora campos extras do evento', () => {
    const dados = { ...doBackend(), versao: 2 };
    expect(lerEventoEstatisticas(dados)).not.toHaveProperty('versao');
  });

  const invalidos: [string, (d: ReturnType<typeof doBackend>) => unknown, string][] = [
    ['corpo nulo', () => null, 'não é um objeto'],
    ['usuarioId em texto', (d) => ({ ...d, usuarioId: '7' }), 'usuarioId'],
    ['usuarioId zero', (d) => ({ ...d, usuarioId: 0 }), 'usuarioId'],
    ['sem geradoEm', (d) => ({ ...d, geradoEm: undefined }), 'geradoEm'],
    ['geradoEm inválido', (d) => ({ ...d, geradoEm: 'ontem' }), 'geradoEm'],
    ['sem estatisticas', (d) => ({ ...d, estatisticas: undefined }), 'estatisticas ausente'],
    ['contagem negativa', (d) => ({ ...d, estatisticas: { ...d.estatisticas, paginasLidas: -1 } }), 'paginasLidas'],
    ['contagem quebrada', (d) => ({ ...d, estatisticas: { ...d.estatisticas, totalSessoes: 1.5 } }), 'totalSessoes'],
    ['possuiMeta em texto', (d) => ({ ...d, estatisticas: { ...d.estatisticas, possuiMeta: 'sim' } }), 'possuiMeta'],
    [
      'gênero pelo nome em vez do id',
      (d) => ({ ...d, estatisticas: { ...d.estatisticas, livrosLidosPorGenero: { fantasia: 1 } } }),
      'livrosLidosPorGenero["fantasia"]',
    ],
    [
      'gêneros em lista',
      (d) => ({ ...d, estatisticas: { ...d.estatisticas, livrosLidosPorGenero: [1] } }),
      'livrosLidosPorGenero',
    ],
  ];

  it.each(invalidos)('recusa %s', (_, alterar, mensagem) => {
    const ler = () => lerEventoEstatisticas(alterar(doBackend()));
    expect(ler).toThrow(EventoInvalidoError);
    expect(ler).toThrow(mensagem);
  });
});

describe('resumirEvento', () => {
  it('resume a mensagem em uma linha para o log', () => {
    expect(resumirEvento(lerEventoEstatisticas(doBackend()))).toBe(
      'usuario=7 geradoEm=2026-11-04T14:00:00.123Z lidos=2 cadastrados=5 paginas=620 ' +
        'sessoes=3 anotacoes=1 avaliacoes=2 meta=sim generos={3:2,8:1}',
    );
  });
});