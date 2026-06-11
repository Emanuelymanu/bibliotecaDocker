import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leituras, leiturasId } from './leituras';


export interface livrosAttributes {
  id_livro: number;
  id_google: string;
  titulo: string;
  subtitulo?: string;
  autor: string;
  tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
  nome_serie?: string;
  ano_publicacao?: number;
  num_paginas: number;
  editora?: string;
  genero?: string;
  capa?: string;
  avaliacao_media?: number; // averageRating do Google Books
  total_avaliacoes?: number; // ratingsCount do Google Books
}

export type livrosPk = "id_livro";
export type livrosId = livros[livrosPk];
export type livrosOptionalAttributes = "id_livro" | "id_google" | "subtitulo" | "tipo_obra" | "nome_serie" | "ano_publicacao" | "num_paginas" | "editora" | "genero" | "capa" | "avaliacao_media" | "total_avaliacoes";
export type livrosCreationAttributes = Optional<livrosAttributes, livrosOptionalAttributes>;

export class livros extends Model<livrosAttributes, livrosCreationAttributes> implements livrosAttributes {
  id_livro!: number;
  id_google!: string;
  titulo!: string;
  subtitulo?: string;
  autor!: string;
  tipo_obra!: 'unico' | 'trilogia' | 'serie' | 'colecao';
  nome_serie?: string;
  ano_publicacao?: number;
  num_paginas!: number;
  editora?: string;
  genero?: string;
  capa?: string;
  avaliacao_media?: number;
  total_avaliacoes?: number;



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

  static initModel(sequelize: Sequelize.Sequelize): typeof livros {
    return livros.init({
      id_livro: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      id_google: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      titulo: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      subtitulo: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      autor: {
        type: DataTypes.STRING(300),
        allowNull: false
      },
      tipo_obra: {
        type: DataTypes.ENUM('unico', 'trilogia', 'serie', 'colecao'),
        allowNull: false,
        defaultValue: 'unico',
        validate: {
          isIn: [['unico', 'trilogia', 'serie', 'colecao']]
        }
      },
      nome_serie: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      ano_publicacao: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      num_paginas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      editora: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      genero: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      capa: {
        type: DataTypes.STRING(500),
        allowNull: true
      }
    },


      {
        sequelize,
        tableName: 'livros',
        timestamps: false,

        indexes: [
          {
            name: "PRIMARY",
            unique: true,
            using: "BTREE",
            fields: [
              { name: "id_livro" },
            ]
          },
          {
            name: "unique_livro",
            unique: true,
            using: "BTREE",
            fields: [
              { name: "titulo", length: 200 },
              { name: "autor", length: 100 },
            ]
          },
          {
            name: "idx_titulo",
            using: "BTREE",
            fields: [
              { name: "titulo", length: 255 },
            ]
          },
          {
            name: "idx_autor",
            using: "BTREE",
            fields: [
              { name: "autor", length: 100 },
            ]
          },
          {
            name: "idx_genero",
            using: "BTREE",
            fields: [
              { name: "genero" },
            ]
          },
        ]
      });
  }
}
