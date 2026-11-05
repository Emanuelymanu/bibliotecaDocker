import { MigrationInterface, QueryRunner } from 'typeorm';


export class AdicionarGeradoEmEstatisticas1793803508998 implements MigrationInterface {
  name = 'AdicionarGeradoEmEstatisticas1793803508998';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE estatisticas_leitor ADD COLUMN gerado_em DATETIME(3) NULL AFTER livros_lidos_por_genero',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE estatisticas_leitor DROP COLUMN gerado_em');
  }
}