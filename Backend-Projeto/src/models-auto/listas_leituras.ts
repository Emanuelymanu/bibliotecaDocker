import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';
import type { livros, livrosId } from './livros';
import type { lista_livros } from './lista_livros';

export interface listas_leiturasAttributes {
  id_lista: number;
  id_usuario: number;
  nome: string;
  descricao?: string;
  data_criacao?: string;
}

export type listas_leiturasPk = "id_lista";
export type listas_leiturasId = listas_leituras[listas_leiturasPk];
export type listas_leiturasOptionalAttributes = "id_lista" | "descricao" | "data_criacao";
export type listas_leiturasCreationAttributes = Optional<listas_leiturasAttributes, listas_leiturasOptionalAttributes>;

export class listas_leituras extends Model<listas_leiturasAttributes, listas_leiturasCreationAttributes> implements listas_leiturasAttributes {
  id_lista!: number;
  id_usuario!: number;
  nome!: string;
  descricao?: string;
  data_criacao?: string;

  usuario!: usuarios;
  getUsuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setUsuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;

  livros!: livros[];
  getLivros!: Sequelize.BelongsToManyGetAssociationsMixin<livros>;
  setLivros!: Sequelize.BelongsToManySetAssociationsMixin<livros, livrosId>;
  addLivro!: Sequelize.BelongsToManyAddAssociationMixin<livros, livrosId>;
  addLivros!: Sequelize.BelongsToManyAddAssociationsMixin<livros, livrosId>;
  removeLivro!: Sequelize.BelongsToManyRemoveAssociationMixin<livros, livrosId>;
  hasLivro!: Sequelize.BelongsToManyHasAssociationMixin<livros, livrosId>;
  countLivros!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof listas_leituras {
    return listas_leituras.init({
      id_lista: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        }
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      descricao: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      data_criacao: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'listas_leituras',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_lista" }]
        },
      ]
    });
  }
}
