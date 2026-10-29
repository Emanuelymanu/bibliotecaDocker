import { montarCriterio } from './montar-criterio';

describe('montarCriterio', () => {
  describe('criação', () => {
    it('sem tipo (app atual): MANUAL com o texto enviado', () => {
      expect(montarCriterio({ criterio: 'Participou do clube de leitura' })).toEqual({
        tipo: 'MANUAL',
        valor_alvo: 1,
        id_genero: null,
        criterio: 'Participou do clube de leitura',
      });
    });

    it('MANUAL sem texto usa um texto padrão', () => {
      expect(montarCriterio({}).criterio).toBe('Concedida pela administração');
    });

    it('tipo automático gera o texto a partir da regra', () => {
      expect(montarCriterio({ tipo: 'LIVROS_LIDOS', valor_alvo: 10, criterio: 'ignorado' })).toEqual({
        tipo: 'LIVROS_LIDOS',
        valor_alvo: 10,
        id_genero: null,
        criterio: 'Conclua 10 livros',
      });
    });

    it('POSSUI_META sempre tem valor_alvo 1', () => {
      expect(montarCriterio({ tipo: 'POSSUI_META', valor_alvo: 50 })).toMatchObject({ valor_alvo: 1 });
    });

    it('LIVROS_GENERO exige o gênero', () => {
      expect(() => montarCriterio({ tipo: 'LIVROS_GENERO', valor_alvo: 5 })).toThrow(/Selecione o gênero/);
      expect(montarCriterio({ tipo: 'LIVROS_GENERO', valor_alvo: 5, id_genero: 3 })).toMatchObject({
        id_genero: 3,
        criterio: 'Conclua 5 livros de um gênero',
      });
    });

    it('tipo automático sem valor_alvo usa 1', () => {
      expect(montarCriterio({ tipo: 'SESSOES' })).toMatchObject({ valor_alvo: 1, criterio: 'Registre 1 sessão de leitura' });
    });
  });

  describe('edição (junta com o que a conquista já tem)', () => {
    const atual = { tipo: 'LIVROS_GENERO' as const, valor_alvo: 5, id_genero: 3, criterio: 'Conclua 5 livros de um gênero' };

    it('mudar só o valor_alvo mantém tipo e gênero', () => {
      expect(montarCriterio({ valor_alvo: 8 }, atual)).toMatchObject({
        tipo: 'LIVROS_GENERO',
        valor_alvo: 8,
        id_genero: 3,
        criterio: 'Conclua 8 livros de um gênero',
      });
    });

    it('trocar para um tipo sem gênero limpa o id_genero', () => {
      expect(montarCriterio({ tipo: 'LIVROS_LIDOS' }, atual)).toMatchObject({ tipo: 'LIVROS_LIDOS', id_genero: null });
    });

    it('trocar para MANUAL mantém o texto antigo se não vier um novo', () => {
      expect(montarCriterio({ tipo: 'MANUAL' }, atual)).toMatchObject({
        tipo: 'MANUAL',
        criterio: 'Conclua 5 livros de um gênero',
      });
    });

    it('id_genero null explícito numa conquista de gênero é recusado', () => {
      expect(() => montarCriterio({ id_genero: null }, atual)).toThrow(/Selecione o gênero/);
    });
  });
});