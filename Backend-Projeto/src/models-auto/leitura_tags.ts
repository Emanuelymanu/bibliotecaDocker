import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leituras, leiturasId } from './leituras';
import type { tags, tagsId } from './tags';

export interface leitura_tagsAttributes {
  id_leitura: number;
  id_tag: number;
}

export type leitura_tagsPk = "id_leitura" | "id_tag";
export type leitura_tagsId = leitura_tags[leitura_tagsPk];
export type leitura_tagsCreationAttributes = leitura_tagsAttributes;

export class leitura_tags extends Model<leitura_tagsAttributes, leitura_tagsCreationAttributes> implements leitura_tagsAttributes {
  id_leitura!: number;
  id_tag!: number;


  id_leitura_leitura!: leituras;
  getId_leitura_leitura!: Sequelize.BelongsToGetAssociationMixin<leituras>;
  setId_leitura_leitura!: Sequelize.BelongsToSetAssociationMixin<leituras, leiturasId>;
  createId_leitura_leitura!: Sequelize.BelongsToCreateAssociationMixin<leituras>;
 
  id_tag_tag!: tags;
  getId_tag_tag!: Sequelize.BelongsToGetAssociationMixin<tags>;
  setId_tag_tag!: Sequelize.BelongsToSetAssociationMixin<tags, tagsId>;
  createId_tag_tag!: Sequelize.BelongsToCreateAssociationMixin<tags>;

  static initModel(sequelize: Sequelize.Sequelize): typeof leitura_tags {
    return leitura_tags.init({
    id_leitura: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'leituras',
        key: 'id_leitura'
      }
    },
    id_tag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'tags',
        key: 'id_tag'
      }
    }
  }, {
    sequelize,
    tableName: 'leitura_tags',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_leitura" },
          { name: "id_tag" },
        ]
      },
      {
        name: "id_tag",
        using: "BTREE",
        fields: [
          { name: "id_tag" },
        ]
      },
    ]
  });
  }
}
