import { Request, Response } from 'express'
import { autores } from '../models-auto/autores'
import { editoras } from '../models-auto/editoras'
import { generos } from '../models-auto/generos'
import { livros_autores } from '../models-auto/livros_autores'
import { livro_generos } from '../models-auto/livro_generos'
import { livros } from '../models-auto/livros'
import { sequelize } from '../models-auto'
import { Transaction } from 'sequelize'

export class AdmincatalogoController {
    async listarAutores(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await autores.findAll({
                include: [{ model: livros, as: 'livros', attributes: ['id_livro'] }],
                order: [['nome', 'ASC']]
            })

            const resposta = lista.map((a: any) => ({
                ...a.get({ plain: true }),
                total_livros: a.livros?.length || 0
            }));

            return res.json({ autores: resposta })
        } catch (error) {
            console.error('Erro ao listar autores', error)
            return res.status(500).json({ erro: 'Erro interno ao listar autores' })
        }
    }

    async editarAutor(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const autor = await autores.findByPk(id);
            if (!autor) {
                return res.status(404).json({
                    erro: 'Autor não encontrado'
                })
            }

            const { nome, bio, nacionalidade, data_nascimento } = req.body;
            if (nome !== undefined) autor.nome = nome;
            if (bio !== undefined) autor.bio = bio;
            if (nacionalidade !== undefined) autor.nacionalidade = nacionalidade;
            if (data_nascimento !== undefined) autor.data_nascimento = data_nascimento;
            await autor.save();

            return res.json({
                mensagem: 'Autor atualizado com sucesso', autor
            })
        } catch (error) {
            console.error('Erro ao editar autor', error)
            return res.status(500).json({
                erro: 'Erro interno ao editar autor'
            })
        }
    }

    async deletarAutor(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id)
            const autor = await autores.findByPk(id)
            if (!autor) {
                return res.status(404).json({
                    erro: 'Autor não encontrado'
                })
            }

            const totalLivros = await livros_autores.count({
                where: {
                    id_autor: id
                }
            })

            if (totalLivros > 0) {
                return res.status(409).json({
                    erro: `Este autor está vinculado a ${totalLivros} livro(s).`
                })
            }

            await autor.destroy()
            return res.json({
                mensagem: "Autor removido com sucesso"
            })
        } catch (error) {
            console.error('Erro ao deletar autor', error)
            return res.status(500).json({
                erro: 'Erro interno ao deletar autor'
            })
        }
    }


    async mesclarAutores(req: Request, res: Response): Promise<Response> {
        try {
            const { id_origem, id_destino } = req.body

            if (!id_origem || !id_destino) {
                return res.status(400).json({
                    erro: 'id_origem e id_destino são obrigatórios'
                })
            }

            if (id_origem === id_destino) {
                return res.status(400).json({
                    erro: 'id de origem e id de destino não podem ser o mesmo autor'
                })
            }

            const [autorOrigem, autorDestino] = await Promise.all([
                autores.findByPk(id_origem),
                autores.findByPk(id_destino)
            ])
            if (!autorOrigem || !autorDestino) {
                return res.status(404).json({
                    erro: 'Autor de origem ou destino não encontrado'
                })
            }

            await sequelize.transaction(async (transaction: Transaction) => {
                const vinculos = await livros_autores.findAll({
                    where: {
                        id_autor: id_origem
                    },
                    transaction
                })

                for (const vinculo of vinculos) {
                    const jaExiste = await livros_autores.findOne({
                        where: {
                            id_livro: vinculo.id_livro,
                            id_autor: id_destino
                        },
                        transaction
                    })

                    if (jaExiste) {
                        await vinculo.destroy({ transaction })
                    } else {
                        vinculo.id_autor = id_destino
                        await vinculo.save({ transaction })
                    }
                }

                await autorOrigem.destroy({ transaction })
            })

            return res.json({
                mensagem: 'Autores mesclados com sucesso'
            })
        } catch (error) {
            console.error('Erro ao mesclar autores', error)
            return res.status(500).json({
                erro: 'Erro interno ao mesclar autores'
            })
        }
    }

    async listarEditoras(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await editoras.findAll({
                include: [{ model: livros, as: 'livros', attributes: ['id_livro'] }],
                order: [['nome', 'ASC']]
            });
            const resposta = lista.map((e: any) => ({
                ...e.get({ plain: true }),
                total_livros: e.livros?.length || 0
            }));
            return res.json({ editoras: resposta });
        } catch (error) {
            console.error('Erro ao listar editoras:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar editoras' });
        }
    }
 
  
    async editarEditora(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const editora = await editoras.findByPk(id);
            if (!editora) {
                return res.status(404).json({ erro: 'Editora não encontrada' });
            }
            const { nome, pais } = req.body;
            if (nome !== undefined) editora.nome = nome;
            if (pais !== undefined) editora.pais = pais;
            await editora.save();
            return res.json({ mensagem: 'Editora atualizada com sucesso', editora });
        } catch (error) {
            console.error('Erro ao editar editora:', error);
            return res.status(500).json({ erro: 'Erro interno ao editar editora' });
        }
    }
 
   
    async deletarEditora(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const editora = await editoras.findByPk(id);
            if (!editora) {
                return res.status(404).json({ erro: 'Editora não encontrada' });
            }
 
            const totalLivros = await livros.count({ where: { id_editora: id } });
            if (totalLivros > 0) {
                return res.status(409).json({
                    erro: `Esta editora está vinculada a ${totalLivros} livro(s). Use a fusão em vez de apagar.`
                });
            }
 
            await editora.destroy();
            return res.json({ mensagem: 'Editora removida com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar editora:', error);
            return res.status(500).json({ erro: 'Erro interno ao deletar editora' });
        }
    }
 

    async mesclarEditoras(req: Request, res: Response): Promise<Response> {
        try {
            const { id_origem, id_destino } = req.body;
            if (!id_origem || !id_destino) {
                return res.status(400).json({ erro: 'id_origem e id_destino são obrigatórios' });
            }
            if (id_origem === id_destino) {
                return res.status(400).json({ erro: 'id_origem e id_destino não podem ser a mesma editora' });
            }
 
            const [origem, destino] = await Promise.all([
                editoras.findByPk(id_origem),
                editoras.findByPk(id_destino)
            ]);
            if (!origem || !destino) {
                return res.status(404).json({ erro: 'Editora de origem ou destino não encontrada' });
            }
 
            await sequelize.transaction(async (transaction) => {
                await livros.update({ id_editora: id_destino }, { where: { id_editora: id_origem }, transaction });
                await origem.destroy({ transaction });
            });
 
            return res.json({ mensagem: `Editora "${origem.nome}" mesclada em "${destino.nome}" com sucesso` });
        } catch (error) {
            console.error('Erro ao mesclar editoras:', error);
            return res.status(500).json({ erro: 'Erro interno ao mesclar editoras' });
        }
    }
 
   
    async listarGeneros(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await generos.findAll({
                include: [{ model: livros, as: 'livros', attributes: ['id_livro'] }],
                order: [['nome', 'ASC']]
            });
            const resposta = lista.map((g: any) => ({
                ...g.get({ plain: true }),
                total_livros: g.livros?.length || 0
            }));
            return res.json({ generos: resposta });
        } catch (error) {
            console.error('Erro ao listar gêneros:', error);
            return res.status(500).json({ erro: 'Erro interno ao listar gêneros' });
        }
    }
 
   
    async editarGenero(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const genero = await generos.findByPk(id);
            if (!genero) {
                return res.status(404).json({ erro: 'Gênero não encontrado' });
            }
            const { nome } = req.body;
            if (nome !== undefined) genero.nome = nome;
            await genero.save();
            return res.json({ mensagem: 'Gênero atualizado com sucesso', genero });
        } catch (error) {
            console.error('Erro ao editar gênero:', error);
            return res.status(500).json({ erro: 'Erro interno ao editar gênero' });
        }
    }
 
   
    async deletarGenero(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            const genero = await generos.findByPk(id);
            if (!genero) {
                return res.status(404).json({ erro: 'Gênero não encontrado' });
            }
 
            const totalLivros = await livro_generos.count({ where: { id_genero: id } });
            if (totalLivros > 0) {
                return res.status(409).json({
                    erro: `Este gênero está vinculado a ${totalLivros} livro(s). Use a fusão em vez de apagar.`
                });
            }
 
            await genero.destroy();
            return res.json({ mensagem: 'Gênero removido com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar gênero:', error);
            return res.status(500).json({ erro: 'Erro interno ao deletar gênero' });
        }
    }
 
    
    async mesclarGeneros(req: Request, res: Response): Promise<Response> {
        try {
            const { id_origem, id_destino } = req.body;
            if (!id_origem || !id_destino) {
                return res.status(400).json({ erro: 'id_origem e id_destino são obrigatórios' });
            }
            if (id_origem === id_destino) {
                return res.status(400).json({ erro: 'id_origem e id_destino não podem ser o mesmo gênero' });
            }
 
            const [origem, destino] = await Promise.all([
                generos.findByPk(id_origem),
                generos.findByPk(id_destino)
            ]);
            if (!origem || !destino) {
                return res.status(404).json({ erro: 'Gênero de origem ou destino não encontrado' });
            }
 
            await sequelize.transaction(async (transaction) => {
                const vinculos = await livro_generos.findAll({ where: { id_genero: id_origem }, transaction });
 
                for (const vinculo of vinculos) {
                    const jaExiste = await livro_generos.findOne({
                        where: { id_livro: vinculo.id_livro, id_genero: id_destino },
                        transaction
                    });
                    if (jaExiste) {
                        await vinculo.destroy({ transaction });
                    } else {
                        vinculo.id_genero = id_destino;
                        await vinculo.save({ transaction });
                    }
                }
 
                await origem.destroy({ transaction });
            });
 
            return res.json({ mensagem: `Gênero "${origem.nome}" mesclado em "${destino.nome}" com sucesso` });
        } catch (error) {
            console.error('Erro ao mesclar gêneros:', error);
            return res.status(500).json({ erro: 'Erro interno ao mesclar gêneros' });
        }
    }
}