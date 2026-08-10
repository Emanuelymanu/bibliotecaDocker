import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { anotacoes, anotacoesId } from './anotacoes';

import type { livros, livrosId } from './livros';

import type { usuarios, usuariosId } from './usuarios';

export interface leiturasAttributes {
  
  id_leitura: number;
  id_usuario: number;
  id_livro: number;
  status: 'nao_lido' | 'quero_ler' | 'lendo' | 'lido' | 'abandonado' | 'relendo';
  data_inicio?: string;
  data_conclusao?: string;
  avaliacao?: number;
  resenha?: string;
  pagina_atual?: number;
  vezes_lido?: number;

}

export type leiturasPk = "id_leitura";
export type leiturasId = leituras[leiturasPk];
export type leiturasOptionalAttributes = "id_leitura" | "status" | "data_inicio" | "data_conclusao" | "avaliacao" | "resenha" | "pagina_atual" | "vezes_lido";
export type leiturasCreationAttributes = Optional<leiturasAttributes, leiturasOptionalAttributes>;

export class leituras extends Model<leiturasAttributes, leiturasCreationAttributes> implements leiturasAttributes {
  media: any;
  id_leitura!: number;
  id_usuario!: number;
  id_livro!: number;
  status!: 'nao_lido' | 'quero_ler' | 'lendo' | 'lido' | 'abandonado' | 'relendo';
  data_inicio?: string;
  data_conclusao?: string;
  avaliacao?: number;
  resenha?: string;
  pagina_atual?: number;
  vezes_lido?: number;



  anotacos!: anotacoes[];
  getAnotacos!: Sequelize.HasManyGetAssociationsMixin<anotacoes>;
  setAnotacos!: Sequelize.HasManySetAssociationsMixin<anotacoes, anotacoesId>;
  addAnotaco!: Sequelize.HasManyAddAssociationMixin<anotacoes, anotacoesId>;
  addAnotacos!: Sequelize.HasManyAddAssociationsMixin<anotacoes, anotacoesId>;
  createAnotaco!: Sequelize.HasManyCreateAssociationMixin<anotacoes>;
  removeAnotaco!: Sequelize.HasManyRemoveAssociationMixin<anotacoes, anotacoesId>;
  removeAnotacos!: Sequelize.HasManyRemoveAssociationsMixin<anotacoes, anotacoesId>;
  hasAnotaco!: Sequelize.HasManyHasAssociationMixin<anotacoes, anotacoesId>;
  hasAnotacos!: Sequelize.HasManyHasAssociationsMixin<anotacoes, anotacoesId>;
  countAnotacos!: Sequelize.HasManyCountAssociationsMixin;
 
 

  id_livro_livro!: livros;
  getId_livro_livro!: Sequelize.BelongsToGetAssociationMixin<livros>;
  setId_livro_livro!: Sequelize.BelongsToSetAssociationMixin<livros, livrosId>;
  createId_livro_livro!: Sequelize.BelongsToCreateAssociationMixin<livros>;

  id_usuario_usuario!: usuarios;
  getId_usuario_usuario!: Sequelize.BelongsToGetAssociationMixin<usuarios>;
  setId_usuario_usuario!: Sequelize.BelongsToSetAssociationMixin<usuarios, usuariosId>;
  createId_usuario_usuario!: Sequelize.BelongsToCreateAssociationMixin<usuarios>;

  static initModel(sequelize: Sequelize.Sequelize): typeof leituras {
    return leituras.init({
      
      id_leitura: {
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
      id_livro: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'livros',
          key: 'id_livro'
        }
      },
      status: {
        type: DataTypes.ENUM('nao_lido', 'quero_ler', 'lendo', 'lido', 'abandonado', 'relendo'),
        allowNull: false,
        defaultValue: "quero_ler"
      },
      data_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      data_conclusao: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      avaliacao: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      resenha: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      pagina_atual: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      vezes_lido: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
      }
    }, {
      sequelize,
      tableName: 'leituras',
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "id_leitura" },
          ]
        },
        {
          name: "unique_leitura",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "id_usuario" },
            { name: "id_livro" },
          ]
        },
        {
          name: "id_livro",
          using: "BTREE",
          fields: [
            { name: "id_livro" },
          ]
        },
        {
          name: "idx_status",
          using: "BTREE",
          fields: [
            { name: "status" },
          ]
        },
        {
          name: "idx_usuario_status",
          using: "BTREE",
          fields: [
            { name: "id_usuario" },
            { name: "status" },
          ]
        },
        {
          name: "idx_datas",
          using: "BTREE",
          fields: [
            { name: "data_inicio" },
            { name: "data_conclusao" },
          ]
        },
      ]
    });
  }
}
