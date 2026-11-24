import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarNomeGeneroConquistas1794225600000 implements MigrationInterface {
  name = 'AdicionarNomeGeneroConquistas1794225600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE conquistas ADD COLUMN nome_genero VARCHAR(100) NULL AFTER id_genero');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE conquistas DROP COLUMN nome_genero');
  }
}