import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { autores } from '../models-auto/autores';
import { editoras } from '../models-auto/editoras';
import { generos } from '../models-auto/generos';
import { sequelize } from '../models-auto';
import { normalizarTexto, normalizarInteiro, normalizarLista } from '../utils/normalizadores';
import { traduzirGeneros } from '../utils/traducaoGeneros';

export class CadastrarLivrosController {


    private async resolverEditora(nomeEditora: string | null, transaction: any): Promise<number | null> {
        if (!nomeEditora) return null;
        const [editoraLocal] = await editoras.findOrCreate({
            where: { nome: nomeEditora },
            defaults: { nome: nomeEditora },
            transaction
        });
        return editoraLocal.id_editora;
    }

   
    private async vincularAutores(livroLocal: any, nomesAutores: string[], transaction: any) {
        for (const nome of nomesAutores) {
            const [autorLocal] = await autores.findOrCreate({
                where: { nome },
                defaults: { nome },
                transaction
            });
            await livroLocal.addAutores(autorLocal, { transaction });
        }
    }

   
    private async vincularGeneros(livroLocal: any, nomesGeneros: string[], transaction: any) {
        for (const nome of nomesGeneros) {
            const [generoLocal] = await generos.findOrCreate({
                where: { nome },
                defaults: { nome },
                transaction
            });
            await livroLocal.addGeneros(generoLocal, { transaction });
        }
    }

    async cadastrarLivro(req: Request, res: Response) {
        try {
            let { id_google, titulo, autor, autores: autoresBody, subtitulo, tipo_obra, ano_publicacao, num_paginas, editora, generos: generosBody, genero, capa, avaliacao_media, total_avaliacoes } = req.body;


            if (req.file) {
                capa = req.file.filename;
            }


            const nomesAutores = normalizarLista(autoresBody ?? autor);
            const nomesGeneros = normalizarLista(generosBody ?? traduzirGeneros(genero));
            const nomeEditora = normalizarTexto(editora);

            if (!titulo || nomesAutores.length === 0) {
                return res.status(400).json({ message: 'Campos obrigatórios ausentes: titulo e autor(es)' });
            }

            if (!id_google) {
                id_google = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            }

            const idUsuario = req.usuario?.id;
            if (!idUsuario) {
                return res.status(401).json({ message: 'Usuário não autenticado' });
            }

            const resultado = await sequelize.transaction(async (transaction) => {
                const idEditora = await this.resolverEditora(nomeEditora, transaction);

                const livroData = {
                    id_google: String(id_google),
                    titulo: String(titulo),
                    subtitulo: normalizarTexto(subtitulo) ?? undefined,
                    tipo_obra: (tipo_obra || 'unico') as 'unico' | 'trilogia' | 'serie' | 'colecao',
                    ano_publicacao: normalizarInteiro(ano_publicacao) ?? undefined,
                    num_paginas: normalizarInteiro(num_paginas) ?? 0,
                    id_editora: idEditora ?? undefined,
                    capa: normalizarTexto(capa) ?? undefined,
                    avaliacao_media: normalizarInteiro(avaliacao_media) ?? undefined,
                    total_avaliacoes: normalizarInteiro(total_avaliacoes) ?? undefined
                };

                const [livroLocal, livroCriado] = await livros.findOrCreate({
                    where: { id_google: livroData.id_google },
                    defaults: livroData,
                    transaction
                });

               
                if (livroCriado) {
                    await this.vincularAutores(livroLocal, nomesAutores, transaction);
                    await this.vincularGeneros(livroLocal, nomesGeneros, transaction);
                }

                const [, leituraCriada] = await leituras.findOrCreate({
                    where: {
                        id_usuario: idUsuario,
                        id_livro: livroLocal.id_livro
                    },
                    defaults: {
                        id_usuario: idUsuario,
                        id_livro: livroLocal.id_livro,
                        status: 'nao_lido',
                        data_inicio: new Date().toISOString().split('T')[0],
                        pagina_atual: 0,
                        vezes_lido: 0
                    },
                    transaction
                });

                return { livroLocal, leituraCriada };
            });

            if (!resultado.leituraCriada) {
                return res.status(409).json({ message: 'Este livro já está na sua estante!' });
            }

            console.log('Livro vinculado com sucesso. ID Local:', resultado.livroLocal.id_livro);

            return res.status(201).json({
                mensagem: 'Livro adicionado à sua estante com sucesso!',
                livro: resultado.livroLocal.get()
            });

        } catch (error: any) {
            console.error('Erro ao cadastrar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao cadastrar livro' });
        }
    }
}
