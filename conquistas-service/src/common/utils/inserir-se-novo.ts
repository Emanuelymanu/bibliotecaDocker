import { ObjectLiteral, Repository } from 'typeorm';


export async function inserirSeNovo<T extends ObjectLiteral>(
  repositorio: Repository<T>,
  valores: Partial<T>,
): Promise<boolean> {
  const resultado = await repositorio
    .createQueryBuilder()
    .insert()
    .values(valores as T)
    .orIgnore()
    .execute();
  const linhasAfetadas = (resultado.raw as { affectedRows?: number } | undefined)?.affectedRows ?? 0;
  return linhasAfetadas > 0;
}