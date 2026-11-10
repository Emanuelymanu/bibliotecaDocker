import { MigrationInterface, QueryRunner } from 'typeorm';


export class AdicionarVisualizadaUsuarioConquistas1794251400000 implements MigrationInterface {
  name = 'AdicionarVisualizadaUsuarioConquistas1794251400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE usuario_conquistas ADD COLUMN visualizada TINYINT(1) NOT NULL DEFAULT 1 AFTER data_conquista',
    );
    await queryRunner.query('ALTER TABLE usuario_conquistas ALTER COLUMN visualizada SET DEFAULT 0');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE usuario_conquistas DROP COLUMN visualizada');
  }
}