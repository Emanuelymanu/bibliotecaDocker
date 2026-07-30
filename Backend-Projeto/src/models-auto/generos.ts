import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { livros, livrosId } from './livros';

export interface generosAttributes {
  id_genero: number;
  nome: string;
}

export type generosPk = "id_genero";
export type generosId = generos[generosPk];
export type generosOptionalAttributes = "id_genero";
export type generosCreationAttributes = Optional<generosAttributes, generosOptionalAttributes>;

export class generos extends Model<generosAttributes, generosCreationAttributes> implements generosAttributes {
  id_genero!: number;
  nome!: string;

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

  static initModel(sequelize: Sequelize.Sequelize): typeof generos {
    return generos.init({
      id_genero: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      }
    }, {
      sequelize,
      tableName: 'generos',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_genero" }]
        },
      ]
    });
  }
}
