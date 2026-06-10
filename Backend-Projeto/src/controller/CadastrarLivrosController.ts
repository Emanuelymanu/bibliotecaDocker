import { Request, Response } from 'express';
import { livros } from '../models-auto/livros';
import { leituras } from '../models-auto/leituras';
export class CadastrarLivrosController {
    private normalizarTexto(valor: unknown): string | null {
        if (typeof valor !== 'string') {
            return valor == null ? null : String(valor);
        }

        const texto = valor.trim();
        return texto.length > 0 ? texto : null;
    }

    private normalizarInteiro(valor: unknown): number | null {
        if (valor === null || valor === undefined || valor === '') {
            return null;
        }

        const numero = typeof valor === 'number' ? valor : Number(valor);
        return Number.isFinite(numero) ? numero : null;
    }

    async cadastrarLivro(req: Request, res: Response) {
        try {
            let { id_google, titulo, autor, subtitulo, tipo_obra, nome_serie, ano_publicacao, num_paginas, editora, genero, capa, avaliacao_media, total_avaliacoes } = req.body;

            // Arquivo enviado via multipart tem prioridade sobre o campo capa do body
            if (req.file) {
                capa = req.file.filename;
            }

            if (!titulo || !autor) {
                return res.status(400).json({ message: 'Campos obrigatórios ausentes: titulo e autor' });
            }

            if (!id_google) {
                id_google = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            }

            const livroData = {
                id_google: String(id_google),
                titulo: String(titulo),
                subtitulo: this.normalizarTexto(subtitulo),
                autor: String(autor),
                tipo_obra: (tipo_obra || 'unico') as 'unico' | 'trilogia' | 'serie' | 'colecao',
                nome_serie: this.normalizarTexto(nome_serie),
                ano_publicacao: this.normalizarInteiro(ano_publicacao),
                num_paginas: this.normalizarInteiro(num_paginas) ?? 0,
                editora: this.normalizarTexto(editora),
                genero: this.normalizarTexto(genero),
                capa: this.normalizarTexto(capa),
                avaliacao_media: this.normalizarInteiro(avaliacao_media),
                total_avaliacoes: this.normalizarInteiro(total_avaliacoes)
            };

            const idUsuario = req.usuario?.id_usuario || req.usuario?.id;
            if (!idUsuario) {
                return res.status(401).json({
                    message: 'Usuário não autenticado'
                })
            }

            const [livroLocal] = await livros.findOrCreate({
                where: { id_google: livroData.id_google },
                defaults: {
                    ...livroData
                }
            });

            const [leitura, criada] = await leituras.findOrCreate({
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
                }
            });

            if (!criada) {
                return res.status(409).json({ message: 'Este livro já está na sua estante!' });
            }

            console.log('Livro vinculado com sucesso. ID Local:', livroLocal.id_livro);

            return res.status(201).json({
                mensagem: 'Livro adicionado à sua estante com sucesso!',
                livro: livroLocal.get()
            });

        } catch (error: any) {
            console.error('Erro ao cadastrar livro:', error);
            return res.status(500).json({ message: 'Erro interno ao cadastrar livro' });
        }
    }
}
