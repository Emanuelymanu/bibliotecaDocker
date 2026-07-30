import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';
import type { desafio_leitura, desafio_leituraId } from './desafio_leitura';

export interface usuario_desafioAttributes {
  id_usuario: number;
  id_desafio: number;
  progresso?: number;
  concluido?: boolean;
}

export type usuario_desafioPk = "id_usuario" | "id_desafio";
export type usuario_desafioId = usuario_desafio[usuario_desafioPk];
export type usuario_desafioOptionalAttributes = "progresso" | "concluido";
export type usuario_desafioCreationAttributes = Optional<usuario_desafioAttributes, usuario_desafioOptionalAttributes>;

export class usuario_desafio extends Model<usuario_desafioAttributes, usuario_desafioCreationAttributes> implements usuario_desafioAttributes {
  id_usuario!: number;
  id_desafio!: number;
  progresso?: number;
  concluido?: boolean;

  usuario!: usuarios;
  getUsuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setUsuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;

  desafio!: desafio_leitura;
  getDesafio!: Sequelize.BelongsToGetAssociationMixin<desafio_leitura>;
  setDesafio!: Sequelize.BelongsToSetAssociationMixin<desafio_leitura, desafio_leituraId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof usuario_desafio {
    return usuario_desafio.init({
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'usuarios',
          key: 'id_usuario'
        }
      },
      id_desafio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'desafio_leitura',
          key: 'id_desafio'
        }
      },
      progresso: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      concluido: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'usuario_desafio',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_usuario" }, { name: "id_desafio" }]
        },
      ]
    });
  }
}
