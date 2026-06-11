import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leitura_tags, leitura_tagsId } from './leitura_tags';
import type { leituras, leiturasId } from './leituras';
import type { usuarios, usuariosId } from './usuarios';

export interface tagsAttributes {
  id_tag: number;
  id_usuario: number;
  nome: string;
  cor?: string;
}

export type tagsPk = "id_tag";
export type tagsId = tags[tagsPk];
export type tagsOptionalAttributes = "id_tag" | "cor";
export type tagsCreationAttributes = Optional<tagsAttributes, tagsOptionalAttributes>;

export class tags extends Model<tagsAttributes, tagsCreationAttributes> implements tagsAttributes {
  id_tag!: number;
  id_usuario!: number;
  nome!: string;
  cor?: string;

 
  leitura_tags!: leitura_tags[];
  getLeitura_tags!: Sequelize.HasManyGetAssociationsMixin<leitura_tags>;
  setLeitura_tags!: Sequelize.HasManySetAssociationsMixin<leitura_tags, leitura_tagsId>;
  addLeitura_tag!: Sequelize.HasManyAddAssociationMixin<leitura_tags, leitura_tagsId>;
  addLeitura_tags!: Sequelize.HasManyAddAssociationsMixin<leitura_tags, leitura_tagsId>;
  createLeitura_tag!: Sequelize.HasManyCreateAssociationMixin<leitura_tags>;
  removeLeitura_tag!: Sequelize.HasManyRemoveAssociationMixin<leitura_tags, leitura_tagsId>;
  removeLeitura_tags!: Sequelize.HasManyRemoveAssociationsMixin<leitura_tags, leitura_tagsId>;
  hasLeitura_tag!: Sequelize.HasManyHasAssociationMixin<leitura_tags, leitura_tagsId>;
  hasLeitura_tags!: Sequelize.HasManyHasAssociationsMixin<leitura_tags, leitura_tagsId>;
  countLeitura_tags!: Sequelize.HasManyCountAssociationsMixin;
 
  id_leitura_leituras!: leituras[];
  getId_leitura_leituras!: Sequelize.BelongsToManyGetAssociationsMixin<leituras>;
  setId_leitura_leituras!: Sequelize.BelongsToManySetAssociationsMixin<leituras, leiturasId>;
  addId_leitura_leitura!: Sequelize.BelongsToManyAddAssociationMixin<leituras, leiturasId>;
  addId_leitura_leituras!: Sequelize.BelongsToManyAddAssociationsMixin<leituras, leiturasId>;
  createId_leitura_leitura!: Sequelize.BelongsToManyCreateAssociationMixin<leituras>;
  removeId_leitura_leitura!: Sequelize.BelongsToManyRemoveAssociationMixin<leituras, leiturasId>;
  removeId_leitura_leituras!: Sequelize.BelongsToManyRemoveAssociationsMixin<leituras, leiturasId>;
  hasId_leitura_leitura!: Sequelize.BelongsToManyHasAssociationMixin<leituras, leiturasId>;
  hasId_leitura_leituras!: Sequelize.BelongsToManyHasAssociationsMixin<leituras, leiturasId>;
  countId_leitura_leituras!: Sequelize.BelongsToManyCountAssociationsMixin;
  
  id_usuario_usuario!: usuarios;
  getId_usuario_usuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setId_usuario_usuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;
  createId_usuario_usuario!: Sequelize.BelongsToCreateAssociationMixin<usuarios>;

  static initModel(sequelize: Sequelize.Sequelize): typeof tags {
    return tags.init({
    id_tag: {
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
      type: DataTypes.STRING(50),
      allowNull: false
    },
    cor: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: "#808080"
    }
  }, {
    sequelize,
    tableName: 'tags',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_tag" },
        ]
      },
      {
        name: "unique_tag_usuario",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id_usuario" },
          { name: "nome" },
        ]
      },
    ]
  });
  }
}
