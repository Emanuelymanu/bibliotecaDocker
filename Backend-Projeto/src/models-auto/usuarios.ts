import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leituras, leiturasId } from './leituras';
import type { tags, tagsId } from './tags';
import bcrypt from 'bcrypt';

export interface usuariosAttributes {
  id_usuario: number;
  nome: string;
  email: string;
  cpf: string;
  senha: string;
}

export type usuariosPk = "id_usuario";
export type usuariosId = usuarios[usuariosPk];
export type usuariosOptionalAttributes = "nome" | "email" | "cpf" | "senha";
export type usuariosCreationAttributes = Optional<usuariosAttributes, usuariosOptionalAttributes>;

export class usuarios extends Model<usuariosAttributes, usuariosCreationAttributes> implements usuariosAttributes {
  id_usuario!: number;
  nome!: string;
  email!: string;
  cpf!: string;
  senha!: string;



 
  leituras!: leituras[];
  getLeituras!: Sequelize.HasManyGetAssociationsMixin<leituras>;
  setLeituras!: Sequelize.HasManySetAssociationsMixin<leituras, leiturasId>;
  addLeitura!: Sequelize.HasManyAddAssociationMixin<leituras, leiturasId>;
  addLeituras!: Sequelize.HasManyAddAssociationsMixin<leituras, leiturasId>;
  createLeitura!: Sequelize.HasManyCreateAssociationMixin<leituras>;
  removeLeitura!: Sequelize.HasManyRemoveAssociationMixin<leituras, leiturasId>;
  removeLeituras!: Sequelize.HasManyRemoveAssociationsMixin<leituras, leiturasId>;
  hasLeitura!: Sequelize.HasManyHasAssociationMixin<leituras, leiturasId>;
  hasLeituras!: Sequelize.HasManyHasAssociationsMixin<leituras, leiturasId>;
  countLeituras!: Sequelize.HasManyCountAssociationsMixin;

  tags!: tags[];
  getTags!: Sequelize.HasManyGetAssociationsMixin<tags>;
  setTags!: Sequelize.HasManySetAssociationsMixin<tags, tagsId>;
  addTag!: Sequelize.HasManyAddAssociationMixin<tags, tagsId>;
  addTags!: Sequelize.HasManyAddAssociationsMixin<tags, tagsId>;
  createTag!: Sequelize.HasManyCreateAssociationMixin<tags>;
  removeTag!: Sequelize.HasManyRemoveAssociationMixin<tags, tagsId>;
  removeTags!: Sequelize.HasManyRemoveAssociationsMixin<tags, tagsId>;
  hasTag!: Sequelize.HasManyHasAssociationMixin<tags, tagsId>;
  hasTags!: Sequelize.HasManyHasAssociationsMixin<tags, tagsId>;
  countTags!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof usuarios {
    return usuarios.init({
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      nome: {
        type: DataTypes.STRING(200),
        allowNull: false,
        
      },
      email: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
        
      },
      cpf: {
        type: DataTypes.STRING(11),
        allowNull: false,
        unique: true,
        validate: {

          len: { args: [11, 11], msg: 'O CPF é obrigatório' }
        }

      },
      senha: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: { args: [6, 100], msg: 'A senha deve conter no mínimo 6 caracteres' },
        }
      }
    }, {
      sequelize,
      tableName: 'usuarios',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "id_usuario" },
          ]
        },
      ]
    });
  }
}
