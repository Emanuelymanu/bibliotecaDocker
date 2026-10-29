import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarEstatisticasLeitor1793227891240 implements MigrationInterface {
  name = 'CriarEstatisticasLeitor1793227891240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE estatisticas_leitor (
        id_usuario              INT NOT NULL,
        livros_lidos            INT NOT NULL DEFAULT 0,
        livros_cadastrados      INT NOT NULL DEFAULT 0,
        paginas_lidas           INT NOT NULL DEFAULT 0,
        total_sessoes           INT NOT NULL DEFAULT 0,
        total_anotacoes         INT NOT NULL DEFAULT 0,
        total_avaliacoes        INT NOT NULL DEFAULT 0,
        possui_meta             TINYINT NOT NULL DEFAULT 0,
        livros_lidos_por_genero JSON NOT NULL,
        atualizado_em           DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id_usuario)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE estatisticas_leitor');
  }
}