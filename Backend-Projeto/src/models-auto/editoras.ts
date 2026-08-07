import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { livros, livrosId } from './livros';

export interface editorasAttributes {
  id_editora: number;
  nome: string;
  pais?: string;
}

export type editorasPk = "id_editora";
export type editorasId = editoras[editorasPk];
export type editorasOptionalAttributes = "id_editora" | "pais";
export type editorasCreationAttributes = Optional<editorasAttributes, editorasOptionalAttributes>;

export class editoras extends Model<editorasAttributes, editorasCreationAttributes> implements editorasAttributes {
  id_editora!: number;
  nome!: string;
  pais?: string;

  livros!: livros[];
  getLivros!: Sequelize.HasManyGetAssociationsMixin<livros>;
  setLivros!: Sequelize.HasManySetAssociationsMixin<livros, livrosId>;
  addLivro!: Sequelize.HasManyAddAssociationMixin<livros, livrosId>;
  addLivros!: Sequelize.HasManyAddAssociationsMixin<livros, livrosId>;
  createLivro!: Sequelize.HasManyCreateAssociationMixin<livros>;
  removeLivro!: Sequelize.HasManyRemoveAssociationMixin<livros, livrosId>;
  removeLivros!: Sequelize.HasManyRemoveAssociationsMixin<livros, livrosId>;
  hasLivro!: Sequelize.HasManyHasAssociationMixin<livros, livrosId>;
  hasLivros!: Sequelize.HasManyHasAssociationsMixin<livros, livrosId>;
  countLivros!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof editoras {
    return editoras.init({
      id_editora: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      nome: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      pais: {
        type: DataTypes.STRING(100),
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'editoras',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_editora" }]
        },
      ]
    });
  }
}
