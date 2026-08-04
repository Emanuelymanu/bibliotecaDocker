import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { anotacoes } from '../models-auto/anotacoes';

import { editoras } from '../models-auto/editoras';
import { autores } from '../models-auto/autores';
import { generos } from '../models-auto/generos';
import { sequelize } from '../models-auto';
import fs from 'fs';
import path from 'path';
import { AtualizarLivroDTO, LivroResponse } from '../types/livroTypes';
import { normalizarTextoOpcional, normalizarInteiroOpcional, normalizarLista } from '../utils/normalizadores';

export class EditarLivrosController {

    async atualizarLivro(req: Request, res: Response): Promise<Response> {
        const file = req.file;
        try {
            const erroValidacao = await this.validarAtualizarLivro(req);
            if (erroValidacao) {
                if (file) fs.unlinkSync(file.path);
                return res.status(erroValidacao.status).json({ message: erroValidacao.message });
            }

            const livro = await this.atualizarLivroNoBanco(req);
            const resposta = await this.montarRespostaLivro(livro);

            return res.json({ mensagem: 'Livro atualizado com sucesso', livro: resposta });
        } catch (error) {
            if (file) {
                try { fs.unlinkSync(file.path); } catch (err) { console.error('Erro ao remover arquivo:', err); }
            }
            console.error('Erro ao atualizar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao atualizar livro' });
        }
    }

    private async validarAtualizarLivro(req: Request): Promise<{ status: number; message: string } | null> {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return { status: 400, message: 'ID inválido. O ID deve ser um número.' };
        }

        const livro = await livros.findByPk(id);
        if (!livro) {
            return { status: 404, message: 'Livro não encontrado' };
        }

        return null;
    }

    private async atualizarLivroNoBanco(req: Request) {
        const file = req.file;
        const id = Number(req.params.id);

        return sequelize.transaction(async (transaction) => {
            const livro = await livros.findByPk(id, { transaction });
            if (!livro) throw new Error('Livro não encontrado durante a transação');

            const { editora, autores: autoresBody, generos: generosBody, status, avaliacao } = req.body;

            const dadosAtualizados: AtualizarLivroDTO = {
                titulo: req.body.titulo,
                subtitulo: normalizarTextoOpcional(req.body.subtitulo),
                tipo_obra: req.body.tipo_obra,
                ano_publicacao: normalizarInteiroOpcional(req.body.ano_publicacao),
                num_paginas: normalizarInteiroOpcional(req.body.num_paginas) as number | undefined
            };

            // Editora: se o campo veio no body, resolve (ou limpa, se veio vazio)
            const nomeEditora = normalizarTextoOpcional(editora);
            if (nomeEditora !== undefined) {
                if (nomeEditora === null) {
                    (livro as any).id_editora = null;
                } else {
                    const [editoraLocal] = await editoras.findOrCreate({
                        where: { nome: nomeEditora },
                        defaults: { nome: nomeEditora },
                        transaction
                    });
                    (livro as any).id_editora = editoraLocal.id_editora;
                }
            }

            // Autores: se a lista veio no body, substitui o vínculo inteiro (set = remove os antigos e associa os novos)
            const nomesAutores = normalizarLista(autoresBody);
            if (autoresBody !== undefined) {
                const autoresLocais = await Promise.all(nomesAutores.map(async (nome) => {
                    const [autorLocal] = await autores.findOrCreate({ where: { nome }, defaults: { nome }, transaction });
                    return autorLocal;
                }));
                await (livro as any).setAutores(autoresLocais, { transaction });
            }

            // Gêneros: mesma lógica de substituição
            const nomesGeneros = normalizarLista(generosBody);
            if (generosBody !== undefined) {
                const generosLocais = await Promise.all(nomesGeneros.map(async (nome) => {
                    const [generoLocal] = await generos.findOrCreate({ where: { nome }, defaults: { nome }, transaction });
                    return generoLocal;
                }));
                await (livro as any).setGeneros(generosLocais, { transaction });
            }

            // Status/avaliação de leitura continuam vinculados a leituras, não a livros
            const usuario = req.usuario;
            if (usuario && (status !== undefined || avaliacao !== undefined)) {
                let leitura = await leituras.findOne({
                    where: { id_usuario: usuario.id, id_livro: id },
                    transaction
                });
                if (!leitura) {
                    await leituras.create({
                        id_usuario: usuario.id,
                        id_livro: id,
                        status: status || 'lendo',
                        avaliacao: avaliacao !== undefined ? avaliacao : null,
                        data_inicio: new Date().toISOString().split('T')[0]
                    }, { transaction });
                } else {
                    if (status !== undefined) leitura.status = status;
                    if (avaliacao !== undefined) leitura.avaliacao = avaliacao;
                    await leitura.save({ transaction });
                }
            }

            if (file) {
                if (livro.capa) {
                    try {
                        const nomeArquivoAntigo = livro.capa.split('/').pop();
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

            await livro.update(dadosAtualizados, { transaction });
            return livro;
        });
    }

    private async montarRespostaLivro(livro: any): Promise<LivroResponse> {
        const livroComRelacoes = await livros.findByPk(livro.id_livro, {
            include: [
                { association: 'editora' },
                { association: 'autores' },
                { association: 'generos' }
            ]
        });

        const dados = livroComRelacoes!.get({ plain: true }) as any;
        return {
            id_livro: dados.id_livro,
            id_google: dados.id_google,
            titulo: dados.titulo,
            subtitulo: dados.subtitulo,
            autores: (dados.autores || []).map((a: any) => a.nome),
            tipo_obra: dados.tipo_obra,
            ano_publicacao: dados.ano_publicacao,
            num_paginas: dados.num_paginas,
            editora: dados.editora?.nome ?? null,
            generos: (dados.generos || []).map((g: any) => g.nome),
            capa: dados.capa
        };
    }

    async deletarLivro(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ message: 'ID inválido. O ID deve ser um número.' });
            }

            const livro = await livros.findByPk(id);
            if (!livro) {
                return res.status(404).json({ message: 'Livro não encontrado' });
            }

            await sequelize.transaction(async (transaction) => {
                const leiturasDoLivro = await leituras.findAll({ where: { id_livro: id }, transaction });
                const idsLeituras = leiturasDoLivro.map((leitura) => leitura.id_leitura);

                if (idsLeituras.length > 0) {
                    await anotacoes.destroy({ where: { id_leitura: idsLeituras }, transaction });
                    
                    await leituras.destroy({ where: { id_livro: id }, transaction });
                }

                // As linhas de livros_autores e livro_generos somem sozinhas (ON DELETE CASCADE)

                if (livro.capa) {
                    try {
                        const nomeArquivo = livro.capa.split('/').pop();
                        if (nomeArquivo) {
                            const caminhoCompleto = path.join(__dirname, '..', '..', 'upload', 'capa', nomeArquivo);
                            if (fs.existsSync(caminhoCompleto)) fs.unlinkSync(caminhoCompleto);
                        }
                    } catch (err) {
                        console.error('Erro ao remover capa:', err);
                    }
                }

                await livro.destroy({ transaction });
            });

            return res.json({ message: 'Livro deletado com sucesso' });
        } catch (error) {
            console.error('Erro ao deletar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao deletar livro' });
        }
    }
}
