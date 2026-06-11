import type { Sequelize } from "sequelize";
import { anotacoes as _anotacoes } from "./anotacoes";
import type { anotacoesAttributes, anotacoesCreationAttributes } from "./anotacoes";




import { leitura_tags as _leitura_tags } from "./leitura_tags";
import type { leitura_tagsAttributes, leitura_tagsCreationAttributes } from "./leitura_tags";
import { leituras as _leituras } from "./leituras";
import type { leiturasAttributes, leiturasCreationAttributes } from "./leituras";
import { livros as _livros } from "./livros";
import type { livrosAttributes, livrosCreationAttributes } from "./livros";
import { tags as _tags } from "./tags";
import type { tagsAttributes, tagsCreationAttributes } from "./tags";
import { usuarios as _usuarios } from "./usuarios";
import type { usuarios, usuariosAttributes, usuariosCreationAttributes } from "./usuarios";

export {
  _anotacoes as anotacoes,
  
  _leitura_tags as leitura_tags,
  _leituras as leituras,
  _livros as livros,
  _tags as tags,
  _usuarios as usuarios,
};

export type {
  anotacoesAttributes,
  anotacoesCreationAttributes,
  
  leitura_tagsAttributes,
  leitura_tagsCreationAttributes,
  leiturasAttributes,
  leiturasCreationAttributes,
  livrosAttributes,
  livrosCreationAttributes,
  tagsAttributes,
  tagsCreationAttributes,
  usuariosAttributes,
  usuariosCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const anotacoes = _anotacoes.initModel(sequelize);

  const leitura_tags = _leitura_tags.initModel(sequelize);
  const leituras = _leituras.initModel(sequelize);
  const livros = _livros.initModel(sequelize);
  const tags = _tags.initModel(sequelize);
  const usuarios = _usuarios.initModel(sequelize);

  leituras.belongsToMany(tags, { as: 'id_tag_tags', through: leitura_tags, foreignKey: "id_leitura", otherKey: "id_tag" });
  tags.belongsToMany(leituras, { as: 'id_leitura_leituras', through: leitura_tags, foreignKey: "id_tag", otherKey: "id_leitura" });
  anotacoes.belongsTo(leituras, { as: "id_leitura_leitura", foreignKey: "id_leitura"});
  leituras.hasMany(anotacoes, { as: "anotacos", foreignKey: "id_leitura"});
  leitura_tags.belongsTo(leituras, { as: "id_leitura_leitura", foreignKey: "id_leitura"});
  leituras.hasMany(leitura_tags, { as: "leitura_tags", foreignKey: "id_leitura"});
  leituras.belongsTo(livros, { as: "id_livro_livro", foreignKey: "id_livro"});
  livros.hasMany(leituras, { as: "leituras", foreignKey: "id_livro"});
  leitura_tags.belongsTo(tags, { as: "id_tag_tag", foreignKey: "id_tag"});
  tags.hasMany(leitura_tags, { as: "leitura_tags", foreignKey: "id_tag"});
  leituras.belongsTo(usuarios, { as: "id_usuario_usuario", foreignKey: "id_usuario"});
  usuarios.hasMany(leituras, { as: "leituras", foreignKey: "id_usuario"});
  tags.belongsTo(usuarios, { as: "id_usuario_usuario", foreignKey: "id_usuario"});
  usuarios.hasMany(tags, { as: "tags", foreignKey: "id_usuario"});

  return {
    anotacoes: anotacoes,
    
    leitura_tags: leitura_tags,
    leituras: leituras,
    livros: livros,
    tags: tags,
    usuarios: usuarios,
  };
}
