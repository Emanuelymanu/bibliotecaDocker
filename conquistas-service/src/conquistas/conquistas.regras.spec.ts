import {
  atingiuCriterio,
  calcularProgresso,
  gerarTextoCriterio,
  validarCriterio,
} from './conquistas.regras';
import { EstatisticasLeitor } from './conquistas.tipos';

const leitor: EstatisticasLeitor = {
  livrosLidos: 7,
  livrosCadastrados: 12,
  paginasLidas: 2150,
  totalSessoes: 3,
  totalAnotacoes: 0,
  totalAvaliacoes: 4,
  possuiMeta: true,
  livrosLidosPorGenero: { 2: 5, 9: 1, 4: 0 },
};

const leitorNovo: EstatisticasLeitor = {
  livrosLidos: 0,
  livrosCadastrados: 0,
  paginasLidas: 0,
  totalSessoes: 0,
  totalAnotacoes: 0,
  totalAvaliacoes: 0,
  possuiMeta: false,
  livrosLidosPorGenero: {},
};

describe('calcularProgresso', () => {
  it.each([
    ['LIVROS_LIDOS', 7],
    ['LIVROS_CADASTRADOS', 12],
    ['PAGINAS_LIDAS', 2150],
    ['SESSOES', 3],
    ['ANOTACOES', 0],
    ['AVALIACOES', 4],
    ['POSSUI_META', 1],
  ] as const)('%s retorna %i', (tipo, esperado) => {
    expect(calcularProgresso({ tipo, valor_alvo: 1 }, leitor)).toBe(esperado);
  });

  it('conta livros de um gênero pelo id', () => {
    expect(calcularProgresso({ tipo: 'LIVROS_GENERO', valor_alvo: 1, id_genero: 2 }, leitor)).toBe(5);
  });

  it('gênero sem leituras conta zero', () => {
    expect(calcularProgresso({ tipo: 'LIVROS_GENERO', valor_alvo: 1, id_genero: 99 }, leitor)).toBe(0);
  });

  it('LIVROS_GENERO sem gênero definido conta zero', () => {
    expect(calcularProgresso({ tipo: 'LIVROS_GENERO', valor_alvo: 1, id_genero: null }, leitor)).toBe(0);
  });

  it('gêneros distintos ignora gêneros com zero livros', () => {
    expect(calcularProgresso({ tipo: 'GENEROS_DISTINTOS', valor_alvo: 1 }, leitor)).toBe(2);
  });

  it('meta inexistente conta zero', () => {
    expect(calcularProgresso({ tipo: 'POSSUI_META', valor_alvo: 1 }, leitorNovo)).toBe(0);
  });

  it('conquista manual não tem progresso', () => {
    expect(calcularProgresso({ tipo: 'MANUAL', valor_alvo: 1 }, leitor)).toBeNull();
  });
});

describe('atingiuCriterio', () => {
  it('desbloqueia ao atingir exatamente o alvo', () => {
    expect(atingiuCriterio({ tipo: 'SESSOES', valor_alvo: 3 }, leitor)).toBe(true);
  });

  it('desbloqueia ao passar do alvo', () => {
    expect(atingiuCriterio({ tipo: 'PAGINAS_LIDAS', valor_alvo: 1000 }, leitor)).toBe(true);
  });

  it('não desbloqueia abaixo do alvo', () => {
    expect(atingiuCriterio({ tipo: 'LIVROS_LIDOS', valor_alvo: 10 }, leitor)).toBe(false);
  });

  it('leitor novo não desbloqueia nada', () => {
    expect(atingiuCriterio({ tipo: 'LIVROS_LIDOS', valor_alvo: 1 }, leitorNovo)).toBe(false);
    expect(atingiuCriterio({ tipo: 'POSSUI_META', valor_alvo: 1 }, leitorNovo)).toBe(false);
  });

  it('nunca desbloqueia conquista manual automaticamente', () => {
    expect(atingiuCriterio({ tipo: 'MANUAL', valor_alvo: 1 }, leitor)).toBe(false);
  });
});

describe('validarCriterio', () => {
  it('normaliza tipo em minúsculo e valor em texto', () => {
    expect(validarCriterio({ tipo: ' paginas_lidas ', valor_alvo: '1000' }))
      .toEqual({ tipo: 'PAGINAS_LIDAS', valor_alvo: 1000, id_genero: null });
  });

  it('aceita LIVROS_GENERO com gênero', () => {
    expect(validarCriterio({ tipo: 'LIVROS_GENERO', valor_alvo: 3, id_genero: '2' }))
      .toEqual({ tipo: 'LIVROS_GENERO', valor_alvo: 3, id_genero: 2 });
  });

  it('rejeita tipo desconhecido', () => {
    expect(() => validarCriterio({ tipo: 'LER_MUITO', valor_alvo: 1 })).toThrow('Tipo inválido');
  });

  it('rejeita tipo ausente', () => {
    expect(() => validarCriterio({ valor_alvo: 1 })).toThrow('Tipo inválido');
  });

  it.each([0, -5, 2.5, 'abc', undefined])('rejeita valor_alvo %p', (valor) => {
    expect(() => validarCriterio({ tipo: 'LIVROS_LIDOS', valor_alvo: valor })).toThrow('valor_alvo');
  });

  it('exige gênero para LIVROS_GENERO', () => {
    expect(() => validarCriterio({ tipo: 'LIVROS_GENERO', valor_alvo: 3 })).toThrow('gênero');
  });

  it('ignora valor_alvo em POSSUI_META e MANUAL', () => {
    expect(validarCriterio({ tipo: 'POSSUI_META', valor_alvo: 50 }).valor_alvo).toBe(1);
    expect(validarCriterio({ tipo: 'MANUAL' }).valor_alvo).toBe(1);
  });

  it('descarta gênero quando o tipo não usa', () => {
    expect(validarCriterio({ tipo: 'LIVROS_LIDOS', valor_alvo: 2, id_genero: 5 }).id_genero).toBeNull();
  });
});

describe('gerarTextoCriterio', () => {
  it('usa singular quando o alvo é 1', () => {
    expect(gerarTextoCriterio('LIVROS_LIDOS', 1)).toBe('Conclua 1 livro');
    expect(gerarTextoCriterio('SESSOES', 1)).toBe('Registre 1 sessão de leitura');
  });

  it('usa plural quando o alvo é maior que 1', () => {
    expect(gerarTextoCriterio('PAGINAS_LIDAS', 1000)).toBe('Leia 1000 páginas');
    expect(gerarTextoCriterio('ANOTACOES', 5)).toBe('Escreva 5 anotações');
  });

  it('inclui o nome do gênero', () => {
    expect(gerarTextoCriterio('LIVROS_GENERO', 5, 'Fantasia')).toBe('Conclua 5 livros de Fantasia');
  });

  it('tem texto para todos os tipos', () => {
    const tipos = ['MANUAL', 'LIVROS_LIDOS', 'LIVROS_CADASTRADOS', 'PAGINAS_LIDAS', 'SESSOES',
      'ANOTACOES', 'AVALIACOES', 'GENEROS_DISTINTOS', 'LIVROS_GENERO', 'POSSUI_META'] as const;
    for (const tipo of tipos) {
      expect(gerarTextoCriterio(tipo, 2).length).toBeGreaterThan(0);
    }
  });
});