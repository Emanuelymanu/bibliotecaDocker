import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';

export interface conquistasAttributes {
  id_conquista: number;
  nome: string;
  descricao?: string;
  icone?: string;
  criterio?: string;
}

export type conquistasPk = "id_conquista";
export type conquistasId = conquistas[conquistasPk];
export type conquistasOptionalAttributes = "id_conquista" | "descricao" | "icone" | "criterio";
export type conquistasCreationAttributes = Optional<conquistasAttributes, conquistasOptionalAttributes>;

export class conquistas extends Model<conquistasAttributes, conquistasCreationAttributes> implements conquistasAttributes {
  id_conquista!: number;
  nome!: string;
  descricao?: string;
  icone?: string;
  criterio?: string;

  usuarios!: usuarios[];
  getUsuarios!: Sequelize.BelongsToManyGetAssociationsMixin<usuarios>;
  setUsuarios!: Sequelize.BelongsToManySetAssociationsMixin<usuarios, usuariosId>;
  addUsuario!: Sequelize.BelongsToManyAddAssociationMixin<usuarios, usuariosId>;
  addUsuarios!: Sequelize.BelongsToManyAddAssociationsMixin<usuarios, usuariosId>;
  removeUsuario!: Sequelize.BelongsToManyRemoveAssociationMixin<usuarios, usuariosId>;
  hasUsuario!: Sequelize.BelongsToManyHasAssociationMixin<usuarios, usuariosId>;
  countUsuarios!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof conquistas {
    return conquistas.init({
      id_conquista: {
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
      icone: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      criterio: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'conquistas',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_conquista" }]
        },
      ]
    });
  }
}
