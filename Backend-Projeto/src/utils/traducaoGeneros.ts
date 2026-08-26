/** Categorias mais comuns devolvidas pela Google Books API (sempre em inglês) -> português. */
const TRADUCOES_GENERO: Record<string, string> = {
    'fiction': 'Ficção',
    'nonfiction': 'Não Ficção',
    'juvenile fiction': 'Ficção Juvenil',
    'juvenile nonfiction': 'Não Ficção Juvenil',
    'young adult fiction': 'Ficção Jovem Adulto',
    'young adult nonfiction': 'Não Ficção Jovem Adulto',
    'biography & autobiography': 'Biografia e Autobiografia',
    'history': 'História',
    'science': 'Ciência',
    'science fiction': 'Ficção Científica',
    'fantasy': 'Fantasia',
    'romance': 'Romance',
    'mystery': 'Mistério',
    'mystery & detective': 'Mistério e Detetive',
    'thriller': 'Suspense',
    'suspense': 'Suspense',
    'horror': 'Terror',
    'poetry': 'Poesia',
    'drama': 'Drama',
    'comics & graphic novels': 'Quadrinhos e Graphic Novels',
    'self-help': 'Autoajuda',
    'business & economics': 'Negócios e Economia',
    'philosophy': 'Filosofia',
    'religion': 'Religião',
    'psychology': 'Psicologia',
    'health & fitness': 'Saúde e Bem-Estar',
    'cooking': 'Culinária',
    'travel': 'Viagem',
    'art': 'Arte',
    'music': 'Música',
    'sports & recreation': 'Esportes e Lazer',
    'literary criticism': 'Crítica Literária',
    'literary collections': 'Coletâneas Literárias',
    'education': 'Educação',
    'computers': 'Computação',
    'technology & engineering': 'Tecnologia e Engenharia',
    'medical': 'Medicina',
    'law': 'Direito',
    'political science': 'Ciência Política',
    'social science': 'Ciências Sociais',
    'true crime': 'Crime Real',
    'adventure': 'Aventura',
    'crime': 'Crime',
    'classics': 'Clássicos',
    'western': 'Faroeste',
    'humor': 'Humor',
    'family & relationships': 'Família e Relacionamentos',
    'body, mind & spirit': 'Corpo, Mente e Espírito',
    'games & activities': 'Jogos e Atividades',
    'reference': 'Referência',
    'antiques & collectibles': 'Antiguidades e Colecionáveis',
    'architecture': 'Arquitetura',
    'nature': 'Natureza',
    'pets': 'Animais de Estimação',
};

/**
 * Google Books devolve categorias em inglês e às vezes compostas (ex: "Fiction / Fantasy").
 * Divide por vírgula/barra, traduz os termos conhecidos e devolve o resto sem alteração
 * (cobre também o caso de já vir em português, digitado manualmente: não tem match no
 * dicionário — que é só inglês — então passa direto sem alteração).
 */
export function traduzirGeneros(valor: unknown): string[] {
    if (typeof valor !== 'string' || !valor.trim()) {
        return [];
    }

    return valor
        .split(/[,/]/)
        .map((termo) => termo.trim())
        .filter((termo) => termo.length > 0)
        .map((termo) => TRADUCOES_GENERO[termo.toLowerCase()] ?? termo);
}
