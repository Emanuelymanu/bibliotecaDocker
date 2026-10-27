import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriarTabelasGamificacao1793062185895 implements MigrationInterface {
  name = 'CriarTabelasGamificacao1793062185895';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE conquistas (
        id_conquista INT NOT NULL AUTO_INCREMENT,
        nome         VARCHAR(150) NOT NULL,
        descricao    TEXT NULL,
        icone        VARCHAR(255) NULL,
        criterio     VARCHAR(255) NULL,
        tipo         ENUM('MANUAL','LIVROS_LIDOS','LIVROS_CADASTRADOS','PAGINAS_LIDAS','SESSOES',
                          'ANOTACOES','AVALIACOES','GENEROS_DISTINTOS','LIVROS_GENERO','POSSUI_META')
                     NOT NULL DEFAULT 'MANUAL',
        valor_alvo   INT NOT NULL DEFAULT 1,
        id_genero    INT NULL,
        PRIMARY KEY (id_conquista)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE usuario_conquistas (
        id_usuario     INT NOT NULL,
        id_conquista   INT NOT NULL,
        data_conquista DATE NULL,
        PRIMARY KEY (id_usuario, id_conquista),
        CONSTRAINT fk_usuario_conquistas_conquista
          FOREIGN KEY (id_conquista) REFERENCES conquistas (id_conquista) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE usuario_conquistas');
    await queryRunner.query('DROP TABLE conquistas');
  }
}