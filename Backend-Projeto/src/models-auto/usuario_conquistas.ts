import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';
import type { conquistas, conquistasId } from './conquistas';

export interface usuario_conquistasAttributes {
  id_usuario: number;
  id_conquista: number;
  data_conquista?: string;
}

export type usuario_conquistasPk = "id_usuario" | "id_conquista";
export type usuario_conquistasId = usuario_conquistas[usuario_conquistasPk];
export type usuario_conquistasOptionalAttributes = "data_conquista";
export type usuario_conquistasCreationAttributes = Optional<usuario_conquistasAttributes, usuario_conquistasOptionalAttributes>;

export class usuario_conquistas extends Model<usuario_conquistasAttributes, usuario_conquistasCreationAttributes> implements usuario_conquistasAttributes {
  id_usuario!: number;
  id_conquista!: number;
  data_conquista?: string;

  usuario!: usuarios;
  getUsuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setUsuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;

  conquista!: conquistas;
  getConquista!: Sequelize.BelongsToGetAssociationMixin<conquistas>;
  setConquista!: Sequelize.BelongsToSetAssociationMixin<conquistas, conquistasId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof usuario_conquistas {
    return usuario_conquistas.init({
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        }
      },
      id_conquista: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'conquistas',
          key: 'id_conquista'
        }
      },
      data_conquista: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'usuario_conquistas',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_usuario" }, { name: "id_conquista" }]
        },
      ]
    });
  }
}
