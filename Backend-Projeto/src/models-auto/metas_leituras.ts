import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { usuarios, usuariosId } from './usuarios';

export interface metas_leiturasAttributes {
  id_meta: number;
  id_usuario: number;
  ano: number;
  qtd_livros_alvo?: number;
  qtd_paginas_alvo?: number;
}

export type metas_leiturasPk = "id_meta";
export type metas_leiturasId = metas_leituras[metas_leiturasPk];
export type metas_leiturasOptionalAttributes = "id_meta" | "qtd_livros_alvo" | "qtd_paginas_alvo";
export type metas_leiturasCreationAttributes = Optional<metas_leiturasAttributes, metas_leiturasOptionalAttributes>;

export class metas_leituras extends Model<metas_leiturasAttributes, metas_leiturasCreationAttributes> implements metas_leiturasAttributes {
  id_meta!: number;
  id_usuario!: number;
  ano!: number;
  qtd_livros_alvo?: number;
  qtd_paginas_alvo?: number;

  usuario!: usuarios;
  getUsuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setUsuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof metas_leituras {
    return metas_leituras.init({
      id_meta: {
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
      ano: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      qtd_livros_alvo: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      qtd_paginas_alvo: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'metas_leituras',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_meta" }]
        },
        {
          name: "unique_meta_usuario_ano",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_usuario" }, { name: "ano" }]
        },
      ]
    });
  }
}
