import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { livros, livrosId } from './livros';

export interface lista_livrosAttributes {
  id_lista: number;
  id_livro: number;
  data_adicao?: string;
}

export type lista_livrosPk = "id_lista" | "id_livro";
export type lista_livrosId = lista_livros[lista_livrosPk];
export type lista_livrosOptionalAttributes = "data_adicao";
export type lista_livrosCreationAttributes = Optional<lista_livrosAttributes, lista_livrosOptionalAttributes>;

export class lista_livros extends Model<lista_livrosAttributes, lista_livrosCreationAttributes> implements lista_livrosAttributes {
  id_lista!: number;
  id_livro!: number;
  data_adicao?: string;

  lista!: any;
  getLista!: Sequelize.BelongsToGetAssociationMixin<any>;
  setLista!: Sequelize.BelongsToSetAssociationMixin<any, number>;

  livro!: livros;
  getLivro!: Sequelize.BelongsToGetAssociationMixin<livros>;
  setLivro!: Sequelize.BelongsToSetAssociationMixin<livros, livrosId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof lista_livros {
    return lista_livros.init({
      id_lista: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'listas_leituras',
          key: 'id_lista'
        }
      },
      id_livro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'livros',
          key: 'id_livro'
        }
      },
      data_adicao: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'lista_livros',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_lista" }, { name: "id_livro" }]
        },
      ]
    });
  }
}
