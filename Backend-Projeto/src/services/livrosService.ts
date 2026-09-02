import fs from 'fs';
import path from 'path';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
import { anotacoes } from '../models-auto/anotacoes';
import { autores } from '../models-auto/autores';
import { editoras } from '../models-auto/editoras';
import { generos } from '../models-auto/generos';
import { sequelize } from '../models-auto';
import { HttpError } from '../utils/HttpError';
import { AtualizarLivroDTO, LivroResponse } from '../types/livroTypes';
import { normalizarTexto, normalizarInteiro, normalizarLista, normalizarTextoOpcional, normalizarInteiroOpcional } from '../utils/normalizadores';
import { traduzirGeneros } from '../utils/traducaoGeneros';

interface CadastrarLivroInput {
    id_google?: string;
    titulo: string;
    autor?: string;
    autores?: string[] | string;
    subtitulo?: string;
    tipo_obra?: 'unico' | 'trilogia' | 'serie' | 'colecao';
    ano_publicacao?: number | string;
    num_paginas?: number | string;
    editora?: string;
    generos?: string[] | string;
    genero?: string;
    capa?: string;
    avaliacao_media?: number | string;
    total_avaliacoes?: number | string;
}

interface AtualizarLivroInput {
    titulo?: string;
    subtitulo?: string;
    tipo_obra?: 'unico' | 'trilogia' | 'serie' | 'colecao';
    ano_publicacao?: number | string;
    num_paginas?: number | string;
    editora?: string;
    autores?: string[] | string;
    generos?: string[] | string;
    status?: any;
    avaliacao?: number;
}

function caminhoCapa(nomeArquivo: string): string {
    return path.join(__dirname, '..', '..', 'upload', 'capa', nomeArquivo);
}

function removerArquivoCapaSeExistir(capa: string | null | undefined) {
    if (!capa) return;
    try {
        const nomeArquivo = capa.split('/').pop();
        if (nomeArquivo) {
            const caminho = caminhoCapa(nomeArquivo);
            if (fs.existsSync(caminho)) fs.unlinkSync(caminho);
        }
    } catch (err) {
        console.error('Erro ao remover arquivo de capa:', err);
    }
}

export class LivrosService {

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

    async cadastrarLivro(dados: CadastrarLivroInput, idUsuario: number | undefined, nomeArquivoCapa?: string) {
        let { id_google, titulo, autor, autores: autoresBody, subtitulo, tipo_obra, ano_publicacao, num_paginas, editora, generos: generosBody, genero, capa, avaliacao_media, total_avaliacoes } = dados;

        if (nomeArquivoCapa) {
            capa = nomeArquivoCapa;
        }

        const nomesAutores = normalizarLista(autoresBody ?? autor);
        const nomesGeneros = normalizarLista(generosBody ?? traduzirGeneros(genero));
        const nomeEditora = normalizarTexto(editora);

        if (!titulo || nomesAutores.length === 0) {
            throw new HttpError(400, 'Campos obrigatórios ausentes: titulo e autor(es)');
        }

        if (!idUsuario) {
            throw new HttpError(401, 'Usuário não autenticado');
        }

        if (!id_google) {
            id_google = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
            throw new HttpError(409, 'Este livro já está na sua estante!');
        }

        return resultado.livroLocal.get();
    }

    async atualizarLivro(id: number, dados: AtualizarLivroInput, usuario: { id: number } | undefined, arquivo?: { filename: string }, protocoloEHost?: string): Promise<LivroResponse> {
        if (isNaN(id)) {
            throw new HttpError(400, 'ID inválido. O ID deve ser um número.');
        }

        const livroExiste = await livros.findByPk(id);
        if (!livroExiste) {
            throw new HttpError(404, 'Livro não encontrado');
        }

        const livroAtualizado = await sequelize.transaction(async (transaction) => {
            const livro = await livros.findByPk(id, { transaction });
            if (!livro) throw new HttpError(404, 'Livro não encontrado durante a transação');

            const { editora, autores: autoresBody, generos: generosBody, status, avaliacao } = dados;

            const dadosAtualizados: AtualizarLivroDTO = {
                titulo: dados.titulo,
                subtitulo: normalizarTextoOpcional(dados.subtitulo),
                tipo_obra: dados.tipo_obra,
                ano_publicacao: normalizarInteiroOpcional(dados.ano_publicacao),
                num_paginas: normalizarInteiroOpcional(dados.num_paginas) as number | undefined
            };

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

            const nomesAutores = normalizarLista(autoresBody);
            if (autoresBody !== undefined) {
                const autoresLocais = await Promise.all(nomesAutores.map(async (nome) => {
                    const [autorLocal] = await autores.findOrCreate({ where: { nome }, defaults: { nome }, transaction });
                    return autorLocal;
                }));
                await (livro as any).setAutores(autoresLocais, { transaction });
            }

            const nomesGeneros = normalizarLista(generosBody);
            if (generosBody !== undefined) {
                const generosLocais = await Promise.all(nomesGeneros.map(async (nome) => {
                    const [generoLocal] = await generos.findOrCreate({ where: { nome }, defaults: { nome }, transaction });
                    return generoLocal;
                }));
                await (livro as any).setGeneros(generosLocais, { transaction });
            }

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

            if (arquivo) {
                removerArquivoCapaSeExistir(livro.capa);
                dadosAtualizados.capa = `${protocoloEHost}/upload/capa/${arquivo.filename}`;
            }

            await livro.update(dadosAtualizados, { transaction });
            return livro;
        });

        const livroComRelacoes = await livros.findByPk(livroAtualizado.id_livro, {
            include: [
                { association: 'editora' },
                { association: 'autores' },
                { association: 'generos' }
            ]
        });

        const dadosFormatados = livroComRelacoes!.get({ plain: true }) as any;
        return {
            id_livro: dadosFormatados.id_livro,
            id_google: dadosFormatados.id_google,
            titulo: dadosFormatados.titulo,
            subtitulo: dadosFormatados.subtitulo,
            autores: (dadosFormatados.autores || []).map((a: any) => a.nome),
            tipo_obra: dadosFormatados.tipo_obra,
            ano_publicacao: dadosFormatados.ano_publicacao,
            num_paginas: dadosFormatados.num_paginas,
            editora: dadosFormatados.editora?.nome ?? null,
            generos: (dadosFormatados.generos || []).map((g: any) => g.nome),
            capa: dadosFormatados.capa
        };
    }

    async deletarLivro(id: number): Promise<void> {
        if (isNaN(id)) {
            throw new HttpError(400, 'ID inválido. O ID deve ser um número.');
        }

        const livro = await livros.findByPk(id);
        if (!livro) {
            throw new HttpError(404, 'Livro não encontrado');
        }

        await sequelize.transaction(async (transaction) => {
            const leiturasDoLivro = await leituras.findAll({ where: { id_livro: id }, transaction });
            const idsLeituras = leiturasDoLivro.map((leitura) => leitura.id_leitura);

            if (idsLeituras.length > 0) {
                await anotacoes.destroy({ where: { id_leitura: idsLeituras }, transaction });
                await leituras.destroy({ where: { id_livro: id }, transaction });
            }

            // As linhas de livros_autores e livro_generos somem sozinhas (ON DELETE CASCADE)
            removerArquivoCapaSeExistir(livro.capa);

            await livro.destroy({ transaction });
        });
    }
}
