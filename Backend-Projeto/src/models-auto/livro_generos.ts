import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import type { livros, livrosId } from './livros';
import type { generos, generosId } from './generos';

export interface livro_generosAttributes {
  id_livro: number;
  id_genero: number;
}

export type livro_generosPk = "id_livro" | "id_genero";
export type livro_generosId = livro_generos[livro_generosPk];
export type livro_generosCreationAttributes = livro_generosAttributes;

export class livro_generos extends Model<livro_generosAttributes, livro_generosCreationAttributes> implements livro_generosAttributes {
  id_livro!: number;
  id_genero!: number;

  livro!: livros;
  getLivro!: Sequelize.BelongsToGetAssociationMixin<livros>;
  setLivro!: Sequelize.BelongsToSetAssociationMixin<livros, livrosId>;

  genero!: generos;
  getGenero!: Sequelize.BelongsToGetAssociationMixin<generos>;
  setGenero!: Sequelize.BelongsToSetAssociationMixin<generos, generosId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof livro_generos {
    return livro_generos.init({
      id_livro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'livros',
          key: 'id_livro'
        }
      },
      id_genero: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'generos',
          key: 'id_genero'
        }
      }
    }, {
      sequelize,
      tableName: 'livro_generos',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_livro" }, { name: "id_genero" }]
        },
      ]
    });
  }
}
