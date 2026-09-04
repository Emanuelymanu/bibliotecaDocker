import type { Sequelize } from "sequelize";

import { anotacoes as _anotacoes } from "./anotacoes";
import type { anotacoesAttributes, anotacoesCreationAttributes } from "./anotacoes";


import { leituras as _leituras } from "./leituras";
import type { leiturasAttributes, leiturasCreationAttributes } from "./leituras";
import { livros as _livros } from "./livros";
import type { livrosAttributes, livrosCreationAttributes } from "./livros";


import { usuarios as _usuarios } from "./usuarios";
import type { usuariosAttributes, usuariosCreationAttributes } from "./usuarios";

import { editoras as _editoras } from "./editoras";
import type { editorasAttributes, editorasCreationAttributes } from "./editoras";
import { autores as _autores } from "./autores";
import type { autoresAttributes, autoresCreationAttributes } from "./autores";
import { livros_autores as _livros_autores } from "./livros_autores";
import type { livros_autoresAttributes, livros_autoresCreationAttributes } from "./livros_autores";
import { generos as _generos } from "./generos";
import type { generosAttributes, generosCreationAttributes } from "./generos";
import { livro_generos as _livro_generos } from "./livro_generos";
import type { livro_generosAttributes, livro_generosCreationAttributes } from "./livro_generos";
import { lista_livros as _lista_livros } from "./lista_livros";
import type { lista_livrosAttributes, lista_livrosCreationAttributes } from "./lista_livros";
import { metas_leituras as _metas_leituras } from "./metas_leituras";
import type { metas_leiturasAttributes, metas_leiturasCreationAttributes } from "./metas_leituras";
import { conquistas as _conquistas } from "./conquistas";
import type { conquistasAttributes, conquistasCreationAttributes } from "./conquistas";
import { usuario_conquistas as _usuario_conquistas } from "./usuario_conquistas";
import type { usuario_conquistasAttributes, usuario_conquistasCreationAttributes } from "./usuario_conquistas";
import { sessoes_leitura as _sessoes_leitura } from "./sessoes_leitura";
import type { sessoes_leituraAttributes, sessoes_leituraCreationAttributes } from "./sessoes_leitura";

export {
  _anotacoes as anotacoes,
  
  _leituras as leituras,
  _livros as livros,
 
  _usuarios as usuarios,

  _editoras as editoras,
  _autores as autores,
  _livros_autores as livros_autores,
  _generos as generos,
  _livro_generos as livro_generos,
  _lista_livros as lista_livros,
  _metas_leituras as metas_leituras,
  _conquistas as conquistas,
  _usuario_conquistas as usuario_conquistas,
  _sessoes_leitura as sessoes_leitura,
};

export type {
  anotacoesAttributes,
  anotacoesCreationAttributes,
 
  leiturasAttributes,
  leiturasCreationAttributes,
  livrosAttributes,
  livrosCreationAttributes,
  
  usuariosAttributes,
  usuariosCreationAttributes,

  editorasAttributes,
  editorasCreationAttributes,
  autoresAttributes,
  autoresCreationAttributes,
  livros_autoresAttributes,
  livros_autoresCreationAttributes,
  generosAttributes,
  generosCreationAttributes,
  livro_generosAttributes,
  livro_generosCreationAttributes,
  lista_livrosAttributes,
  lista_livrosCreationAttributes,
  metas_leiturasAttributes,
  metas_leiturasCreationAttributes,
  conquistasAttributes,
  conquistasCreationAttributes,
  usuario_conquistasAttributes,
  usuario_conquistasCreationAttributes,
  sessoes_leituraAttributes,
  sessoes_leituraCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  // ---------- inicializa cada model ----------
  const anotacoes = _anotacoes.initModel(sequelize);
  
  const leituras = _leituras.initModel(sequelize);
  const livros = _livros.initModel(sequelize);
  
  const usuarios = _usuarios.initModel(sequelize);

  const editoras = _editoras.initModel(sequelize);
  const autores = _autores.initModel(sequelize);
  const livros_autores = _livros_autores.initModel(sequelize);
  const generos = _generos.initModel(sequelize);
  const livro_generos = _livro_generos.initModel(sequelize);
  const lista_livros = _lista_livros.initModel(sequelize);
  const metas_leituras = _metas_leituras.initModel(sequelize);
  const conquistas = _conquistas.initModel(sequelize);
  const usuario_conquistas = _usuario_conquistas.initModel(sequelize);
  const sessoes_leitura = _sessoes_leitura.initModel(sequelize);

  // ---------- associações já existentes ----------

  anotacoes.belongsTo(leituras, { as: "id_leitura_leitura", foreignKey: "id_leitura" });
  leituras.hasMany(anotacoes, { as: "anotacos", foreignKey: "id_leitura" });
 
  leituras.belongsTo(livros, { as: "id_livro_livro", foreignKey: "id_livro" });
  livros.hasMany(leituras, { as: "leituras", foreignKey: "id_livro" });

  leituras.belongsTo(usuarios, { as: "id_usuario_usuario", foreignKey: "id_usuario" });
  usuarios.hasMany(leituras, { as: "leituras", foreignKey: "id_usuario" });
 

  // ---------- normalização do catálogo ----------
  livros.belongsTo(editoras, { as: "editora", foreignKey: "id_editora" });
  editoras.hasMany(livros, { as: "livros", foreignKey: "id_editora" });

  livros.belongsTo(usuarios, { as: "cadastradoPor", foreignKey: "id_usuario_cadastro" });
  usuarios.hasMany(livros, { as: "livros_cadastrados", foreignKey: "id_usuario_cadastro" });

  livros.belongsToMany(autores, { as: "autores", through: livros_autores, foreignKey: "id_livro", otherKey: "id_autor" });
  autores.belongsToMany(livros, { as: "livros", through: livros_autores, foreignKey: "id_autor", otherKey: "id_livro" });
  livros_autores.belongsTo(livros, { as: "livro", foreignKey: "id_livro" });
  livros_autores.belongsTo(autores, { as: "autor", foreignKey: "id_autor" });

  livros.belongsToMany(generos, { as: "generos", through: livro_generos, foreignKey: "id_livro", otherKey: "id_genero" });
  generos.belongsToMany(livros, { as: "livros", through: livro_generos, foreignKey: "id_genero", otherKey: "id_livro" });
  livro_generos.belongsTo(livros, { as: "livro", foreignKey: "id_livro" });
  livro_generos.belongsTo(generos, { as: "genero", foreignKey: "id_genero" });

  // ---------- lista de desejos pessoal (usuário <-> livro) ----------
  usuarios.belongsToMany(livros, { as: "lista_desejos", through: lista_livros, foreignKey: "id_usuario", otherKey: "id_livro" });
  livros.belongsToMany(usuarios, { as: "usuarios_desejam", through: lista_livros, foreignKey: "id_livro", otherKey: "id_usuario" });
  lista_livros.belongsTo(usuarios, { as: "usuario", foreignKey: "id_usuario" });
  lista_livros.belongsTo(livros, { as: "livro", foreignKey: "id_livro" });

  // ---------- gamificação ----------
  usuarios.hasMany(metas_leituras, { as: "metas_leituras", foreignKey: "id_usuario" });
  metas_leituras.belongsTo(usuarios, { as: "usuario", foreignKey: "id_usuario" });

  usuarios.belongsToMany(conquistas, { as: "conquistas", through: usuario_conquistas, foreignKey: "id_usuario", otherKey: "id_conquista" });
  conquistas.belongsToMany(usuarios, { as: "usuarios", through: usuario_conquistas, foreignKey: "id_conquista", otherKey: "id_usuario" });
  usuario_conquistas.belongsTo(usuarios, { as: "usuario", foreignKey: "id_usuario" });
  usuario_conquistas.belongsTo(conquistas, { as: "conquista", foreignKey: "id_conquista" });

  // ---------- profundidade pessoal ----------
  leituras.hasMany(sessoes_leitura, { as: "sessoes_leitura", foreignKey: "id_leitura" });
  sessoes_leitura.belongsTo(leituras, { as: "leitura", foreignKey: "id_leitura" });

  return {
    anotacoes,
    
    leituras,
    livros,
    
    usuarios,

    editoras,
    autores,
    livros_autores,
    generos,
    livro_generos,
    lista_livros,
    metas_leituras,
    conquistas,
    usuario_conquistas,
    sessoes_leitura,
  };
}
