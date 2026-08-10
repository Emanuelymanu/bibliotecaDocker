import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leituras, leiturasId } from './leituras';

export interface sessoes_leituraAttributes {
  id_sessao: number;
  id_leitura: number;
  data: string;
  pagina_inicial?: number;
  pagina_final?: number;
  duracao_minutos?: number;
}

export type sessoes_leituraPk = "id_sessao";
export type sessoes_leituraId = sessoes_leitura[sessoes_leituraPk];
export type sessoes_leituraOptionalAttributes = "id_sessao" | "pagina_inicial" | "pagina_final" | "duracao_minutos";
export type sessoes_leituraCreationAttributes = Optional<sessoes_leituraAttributes, sessoes_leituraOptionalAttributes>;

export class sessoes_leitura extends Model<sessoes_leituraAttributes, sessoes_leituraCreationAttributes> implements sessoes_leituraAttributes {
  id_sessao!: number;
  id_leitura!: number;
  data!: string;
  pagina_inicial?: number;
  pagina_final?: number;
  duracao_minutos?: number;

  leitura!: leituras;
  getLeitura!: Sequelize.BelongsToGetAssociationMixin<leituras>;
  setLeitura!: Sequelize.BelongsToSetAssociationMixin<leituras, leiturasId>;

  static initModel(sequelize: Sequelize.Sequelize): typeof sessoes_leitura {
    return sessoes_leitura.init({
      id_sessao: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      id_leitura: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'leituras',
          key: 'id_leitura'
        }
      },
      data: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      pagina_inicial: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      pagina_final: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      duracao_minutos: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    }, {
      sequelize,
      tableName: 'sessoes_leitura',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_sessao" }]
        },
      ]
    });
  }
}
