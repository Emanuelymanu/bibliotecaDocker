import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { anotacoes } from '../models-auto/anotacoes';
import { leitura_tags } from '../models-auto/leitura_tags';
import { sequelize } from '../models-auto';
import fs from 'fs';
import path from 'path';
import { AtualizarLivroDTO, LivroResponse } from '../types/livroTypes';

export class EditarLivrosController {

    private normalizarTextoOpcional(valor: unknown): string | null | undefined {
        if (valor === undefined) {
            return undefined;
        }

        if (valor === null) {
            return null;
        }

        const texto = String(valor).trim();
        return texto.length > 0 ? texto : null;
    }

    private normalizarInteiroOpcional(valor: unknown): number | null | undefined {
        if (valor === undefined) {
            return undefined;
        }

        if (valor === null || valor === '') {
            return null;
        }

        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : null;
    }


    async atualizarLivro(req: Request, res: Response): Promise<Response> {
        const file = req.file;
        try {
            const valid = await this.validarAtualizarLivro(req, res);

            if (valid) return valid;

            const livro = await this.atualizarLivroNoBanco(req);

            const resposta = this.montarRespostaLivro(livro);

            return res.json({
                mensagem: 'Livro atualizado com sucesso', livro: resposta
            });
        } catch (error) {
            if (file) {
                try { fs.unlinkSync(file.path); } catch (err) { console.error('Erro ao remover arquivo:', err); }
            }
            console.error(' Erro ao atualizar livro:', error);
            return res.status(500).json({
                message: 'Erro interno ao atualizar livro'
            });
        }
    }

    private async validarAtualizarLivro(req: Request, res: Response) {
        const file = req.file;
        const idParam = req.params.id;

        const id = Number(idParam);

        if (isNaN(id)) {
            if (file) fs.unlinkSync(file.path);
            return res.status(400).json({
                message: 'ID inválido. O ID deve ser um número.'
            });
        }
        const livro = await livros.findByPk(id);

        if (!livro) {
            if (file) fs.unlinkSync(file.path);
            return res.status(404).json({
                message: 'Livro não encontrado'
            });
        }
        return null;
    }

    private async atualizarLivroNoBanco(req: Request) {
        const file = req.file;
        const id = Number(req.params.id);

        const livro = await livros.findByPk(id);

        const dadosAtualizados: AtualizarLivroDTO = { ...req.body };

        dadosAtualizados.subtitulo = this.normalizarTextoOpcional(dadosAtualizados.subtitulo) as AtualizarLivroDTO['subtitulo'];
        dadosAtualizados.nome_serie = this.normalizarTextoOpcional(dadosAtualizados.nome_serie) as AtualizarLivroDTO['nome_serie'];
        dadosAtualizados.editora = this.normalizarTextoOpcional(dadosAtualizados.editora) as AtualizarLivroDTO['editora'];
        dadosAtualizados.genero = this.normalizarTextoOpcional(dadosAtualizados.genero) as AtualizarLivroDTO['genero'];
        dadosAtualizados.ano_publicacao = this.normalizarInteiroOpcional(dadosAtualizados.ano_publicacao) as AtualizarLivroDTO['ano_publicacao'];
        dadosAtualizados.num_paginas = this.normalizarInteiroOpcional(dadosAtualizados.num_paginas) as AtualizarLivroDTO['num_paginas'];

        const { status, avaliacao } = req.body;

        const usuario = req.usuario;

        if (usuario && (status !== undefined || avaliacao !== undefined)) {
            let leitura = await leituras.findOne({
                where: {
                    id_usuario: usuario.id, id_livro: id
                }
            });
            if (!leitura) {
                await leituras.create({
                    id_usuario: usuario.id, id_livro: id, status: status || 'lendo', avaliacao: avaliacao !== undefined ? avaliacao : null, data_inicio: new Date().toISOString().split('T')[0]
                });
            } else {
                if (status !== undefined) leitura.status = status;
                if (avaliacao !== undefined) leitura.avaliacao = avaliacao;
                await leitura.save();
            }
        }
        if (file) {
            if (livro!.capa) {
                try {
                    const nomeArquivoAntigo = livro!.capa.split('/').pop();

                    if (nomeArquivoAntigo) {
                        const caminhoAntigo = path.join(__dirname, '..', '..', 'upload', 'capa', nomeArquivoAntigo);
                        if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
                    }

                } catch (err) {
                    console.error('Erro ao remover capa antiga:', err);
                }
            }
            dadosAtualizados.capa = `${req.protocol}://${req.get('host')}/upload/capa/${file.filename}`;
        }
        await livro!.update(dadosAtualizados);
        return livro!;
    }

    private montarRespostaLivro(livro: any): LivroResponse {
        return {
            id_livro: livro.id_livro,
            id_google: livro.id_google,
            titulo: livro.titulo,
            subtitulo: livro.subtitulo,
            autor: livro.autor,
            tipo_obra: livro.tipo_obra,
            nome_serie: livro.nome_serie,
            ano_publicacao: livro.ano_publicacao,
            num_paginas: livro.num_paginas,
            editora: livro.editora,
            genero: livro.genero,
            capa: livro.capa
        };
    }


    async deletarLivro(req: Request, res: Response): Promise<Response> {
        try {

            const idParam = req.params.id;


            const id = Number(idParam);


            if (isNaN(id)) {
                return res.status(400).json({
                    message: 'ID inválido. O ID deve ser um número.'
                });
            }




            const livro = await livros.findByPk(id);

            if (!livro) {
                return res.status(404).json({
                    message: 'Livro não encontrado'
                });
            }

            await sequelize.transaction(async (transaction) => {
                const leiturasDoLivro = await leituras.findAll({
                    where: { id_livro: id },
                    transaction
                });

                const idsLeituras = leiturasDoLivro.map((leitura) => leitura.id_leitura);

                if (idsLeituras.length > 0) {
                    await anotacoes.destroy({
                        where: { id_leitura: idsLeituras },
                        transaction
                    });

                    await leitura_tags.destroy({
                        where: { id_leitura: idsLeituras },
                        transaction
                    });

                    await leituras.destroy({
                        where: { id_livro: id },
                        transaction
                    });
                }

                if (livro.capa) {
                    try {
                        const nomeArquivo = livro.capa.split('/').pop();
                        if (nomeArquivo) {
                            const caminhoCompleto = path.join(
                                __dirname,
                                '..',
                                '..',
                                'upload',
                                'capa',
                                nomeArquivo
                            );

                            if (fs.existsSync(caminhoCompleto)) {
                                fs.unlinkSync(caminhoCompleto);
                            }
                        }
                    } catch (err) {
                        console.error('Erro ao remover capa:', err);
                    }
                }

                await livro.destroy({ transaction });
            });

            return res.json({
                message: 'Livro deletado com sucesso'
            });

        } catch (error) {
            console.error('Erro ao deletar livro:', error);
            return res.status(500).json({
                message: 'Erro interno ao deletar livro'
            });
        }
    }
}