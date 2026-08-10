import * as Sequelize from 'sequelize';
import { DataTypes, Model } from 'sequelize';
import type { livros, livrosId } from './livros';
import type { autores, autoresId } from './autores';

export interface livros_autoresAttributes {
  id_livro: number;
  id_autor: number;
}

export type livros_autoresPk = "id_livro" | "id_autor";
export type livros_autoresId = livros_autores[livros_autoresPk];
export type livros_autoresCreationAttributes = livros_autoresAttributes;

export class livros_autores extends Model<livros_autoresAttributes, livros_autoresCreationAttributes> implements livros_autoresAttributes {
  id_livro!: number;
  id_autor!: number;

  livro!: livros;
  getLivro!: Sequelize.BelongsToGetAssociationMixin<livros>;
  setLivro!: Sequelize.BelongsToSetAssociationMixin<livros, livrosId>;

  autor!: autores;
  getAutor!: Sequelize.BelongsToGetAssociationMixin<autores>;
  setAutor!: Sequelize.BelongsToSetAssociationMixin<autores, autoresId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof livros_autores {
    return livros_autores.init({
      id_livro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'livros',
          key: 'id_livro'
        }
      },
      id_autor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'autores',
          key: 'id_autor'
        }
      }
    }, {
      sequelize,
      tableName: 'livros_autores',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_livro" }, { name: "id_autor" }]
        },
      ]
    });
  }
}
