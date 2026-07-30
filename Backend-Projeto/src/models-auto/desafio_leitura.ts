import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';

export interface desafio_leituraAttributes {
  id_desafio: number;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  meta_livros?: number;
}

export type desafio_leituraPk = "id_desafio";
export type desafio_leituraId = desafio_leitura[desafio_leituraPk];
export type desafio_leituraOptionalAttributes = "id_desafio" | "descricao" | "data_inicio" | "data_fim" | "meta_livros";
export type desafio_leituraCreationAttributes = Optional<desafio_leituraAttributes, desafio_leituraOptionalAttributes>;

export class desafio_leitura extends Model<desafio_leituraAttributes, desafio_leituraCreationAttributes> implements desafio_leituraAttributes {
  id_desafio!: number;
  nome!: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  meta_livros?: number;

  usuarios!: usuarios[];
  getUsuarios!: Sequelize.BelongsToManyGetAssociationsMixin<usuarios>;
  setUsuarios!: Sequelize.BelongsToManySetAssociationsMixin<usuarios, usuariosId>;
  addUsuario!: Sequelize.BelongsToManyAddAssociationMixin<usuarios, usuariosId>;
  addUsuarios!: Sequelize.BelongsToManyAddAssociationsMixin<usuarios, usuariosId>;
  removeUsuario!: Sequelize.BelongsToManyRemoveAssociationMixin<usuarios, usuariosId>;
  hasUsuario!: Sequelize.BelongsToManyHasAssociationMixin<usuarios, usuariosId>;
  countUsuarios!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof desafio_leitura {
    return desafio_leitura.init({
      id_desafio: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      nome: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      descricao: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      data_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      data_fim: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      meta_livros: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'desafio_leitura',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_desafio" }]
        },
      ]
    });
  }
}
