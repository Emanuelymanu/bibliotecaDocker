import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { leituras, leiturasId } from './leituras';
import type { editoras, editorasId } from './editoras';
import type { autores, autoresId } from './autores';
import type { generos, generosId } from './generos';


export interface livrosAttributes {
  id_livro: number;
  id_google: string;
  titulo: string;
  subtitulo?: string;
  tipo_obra: 'unico' | 'trilogia' | 'serie' | 'colecao';
  ano_publicacao?: number;
  num_paginas: number;
  id_editora?: number;
  capa?: string;
  avaliacao_media?: number; // averageRating do Google Books
  total_avaliacoes?: number; // ratingsCount do Google Books
}

export type livrosPk = "id_livro";
export type livrosId = livros[livrosPk];
export type livrosOptionalAttributes = "id_livro" | "id_google" | "subtitulo" | "tipo_obra" | "ano_publicacao" | "num_paginas" | "id_editora" | "capa" | "avaliacao_media" | "total_avaliacoes";
export type livrosCreationAttributes = Optional<livrosAttributes, livrosOptionalAttributes>;

export class livros extends Model<livrosAttributes, livrosCreationAttributes> implements livrosAttributes {
  id_livro!: number;
  id_google!: string;
  titulo!: string;
  subtitulo?: string;
  tipo_obra!: 'unico' | 'trilogia' | 'serie' | 'colecao';
  ano_publicacao?: number;
  num_paginas!: number;
  id_editora?: number;
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

  editora!: editoras;
  getEditora!: Sequelize.BelongsToGetAssociationMixin<editoras>;
  setEditora!: Sequelize.BelongsToSetAssociationMixin<editoras, editorasId>;

  autores!: autores[];
  getAutores!: Sequelize.BelongsToManyGetAssociationsMixin<autores>;
  setAutores!: Sequelize.BelongsToManySetAssociationsMixin<autores, autoresId>;
  addAutor!: Sequelize.BelongsToManyAddAssociationMixin<autores, autoresId>;
  addAutores!: Sequelize.BelongsToManyAddAssociationsMixin<autores, autoresId>;
  removeAutor!: Sequelize.BelongsToManyRemoveAssociationMixin<autores, autoresId>;
  hasAutor!: Sequelize.BelongsToManyHasAssociationMixin<autores, autoresId>;
  countAutores!: Sequelize.BelongsToManyCountAssociationsMixin;

  generos!: generos[];
  getGeneros!: Sequelize.BelongsToManyGetAssociationsMixin<generos>;
  setGeneros!: Sequelize.BelongsToManySetAssociationsMixin<generos, generosId>;
  addGenero!: Sequelize.BelongsToManyAddAssociationMixin<generos, generosId>;
  addGeneros!: Sequelize.BelongsToManyAddAssociationsMixin<generos, generosId>;
  removeGenero!: Sequelize.BelongsToManyRemoveAssociationMixin<generos, generosId>;
  hasGenero!: Sequelize.BelongsToManyHasAssociationMixin<generos, generosId>;
  countGeneros!: Sequelize.BelongsToManyCountAssociationsMixin;

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
      tipo_obra: {
        type: DataTypes.ENUM('unico', 'trilogia', 'serie', 'colecao'),
        allowNull: false,
        defaultValue: 'unico',
        validate: {
          isIn: [['unico', 'trilogia', 'serie', 'colecao']]
        }
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
      id_editora: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'editoras',
          key: 'id_editora'
        }
      },
      capa: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      avaliacao_media: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true
      },
      total_avaliacoes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
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
            name: "idx_titulo",
            using: "BTREE",
            fields: [
              { name: "titulo", length: 255 },
            ]
          },
        ]
      });
  }
}
