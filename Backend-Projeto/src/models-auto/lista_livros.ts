import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';
import type { livros, livrosId } from './livros';

/** Lista de desejos pessoal: "quero ler esse livro". Cada linha é um livro
 *  que um usuário marcou como desejado, com a data em que adicionou. */
export interface lista_livrosAttributes {
  id_usuario: number;
  id_livro: number;
  data_adicao?: string;
}

export type lista_livrosPk = "id_usuario" | "id_livro";
export type lista_livrosId = lista_livros[lista_livrosPk];
export type lista_livrosOptionalAttributes = "data_adicao";
export type lista_livrosCreationAttributes = Optional<lista_livrosAttributes, lista_livrosOptionalAttributes>;

export class lista_livros extends Model<lista_livrosAttributes, lista_livrosCreationAttributes> implements lista_livrosAttributes {
  id_usuario!: number;
  id_livro!: number;
  data_adicao?: string;

  usuario!: usuarios;
  getUsuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setUsuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;

  livro!: livros;
  getLivro!: Sequelize.BelongsToGetAssociationMixin<livros>;
  setLivro!: Sequelize.BelongsToSetAssociationMixin<livros, livrosId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof lista_livros {
    return lista_livros.init({
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
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
          fields: [{ name: "id_usuario" }, { name: "id_livro" }]
        },
      ]
    });
  }
}
