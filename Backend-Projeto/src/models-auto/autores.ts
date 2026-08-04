import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { livros, livrosId } from './livros';
import type { livros_autores } from './livros_autores';

export interface autoresAttributes {
  id_autor: number;
  nome: string;
  bio?: string;
  nacionalidade?: string;
  data_nascimento?: string;
}

export type autoresPk = "id_autor";
export type autoresId = autores[autoresPk];
export type autoresOptionalAttributes = "id_autor" | "bio" | "nacionalidade" | "data_nascimento";
export type autoresCreationAttributes = Optional<autoresAttributes, autoresOptionalAttributes>;

export class autores extends Model<autoresAttributes, autoresCreationAttributes> implements autoresAttributes {
  id_autor!: number;
  nome!: string;
  bio?: string;
  nacionalidade?: string;
  data_nascimento?: string;

  livros!: livros[];
  getLivros!: Sequelize.BelongsToManyGetAssociationsMixin<livros>;
  setLivros!: Sequelize.BelongsToManySetAssociationsMixin<livros, livrosId>;
  addLivro!: Sequelize.BelongsToManyAddAssociationMixin<livros, livrosId>;
  addLivros!: Sequelize.BelongsToManyAddAssociationsMixin<livros, livrosId>;
  createLivro!: Sequelize.BelongsToManyCreateAssociationMixin<livros>;
  removeLivro!: Sequelize.BelongsToManyRemoveAssociationMixin<livros, livrosId>;
  removeLivros!: Sequelize.BelongsToManyRemoveAssociationsMixin<livros, livrosId>;
  hasLivro!: Sequelize.BelongsToManyHasAssociationMixin<livros, livrosId>;
  hasLivros!: Sequelize.BelongsToManyHasAssociationsMixin<livros, livrosId>;
  countLivros!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof autores {
    return autores.init({
      id_autor: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      nome: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      nacionalidade: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      data_nascimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'autores',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_autor" }]
        },
      ]
    });
  }
}
