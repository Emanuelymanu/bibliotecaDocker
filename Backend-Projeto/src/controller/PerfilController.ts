import { Request, Response } from 'express';
import { usuarios } from '../models-auto/usuarios';
import bcrypt from 'bcrypt';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

import { Op } from 'sequelize';

export class PerfilController {
    async perfil(req: Request, res: Response): Promise<Response> {
        try {

            const usuarioId = req.usuario.id;

            const usuario = await usuarios.findByPk(usuarioId, {
                attributes: { exclude: ['senha'] }
            });

            if (!usuario) {
                return res.status(404).json({
                    erro: 'Usuário não encontrado'
                });
            }
            return res.json(usuario);
        } catch (error) {
            return res.status(500).json({
                erro: 'Erro interno do servidor'
            })
        }
    }

    async editarPerfil(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    erro: 'Usuário não autenticado'
                })
            }

            const usuarioId = req.usuario.id;

            const usuario = await usuarios.findByPk(usuarioId);

            if (!usuario) {
                return res.status(404).json({
                    erro: 'Usuário não incontrado'
                })
            }

            const { nome, senha, cpf } = req.body;

            const dadosAtualizados: {
                nome?: string;
                senha?: string;
                cpf?: string;

            } = {}
            if (nome !== undefined) {
                if (!nome || nome.trim().length < 3) {
                    return res.status(400).json({
                        erro: 'Nome deve ter pelo menos 3 caracteres'
                    });
                }
                if (nome.trim().length > 100) {
                    return res.status(400).json({
                        erro: 'Nome deve ter no máximo 100 caracteres'
                    });
                }
                dadosAtualizados.nome = nome.trim();
            }


            if (cpf !== undefined) {

                const cpfLimpo = cpf.replace(/\D/g, '');


                if (!cpfLimpo || cpfLimpo.length !== 11) {
                    return res.status(400).json({
                        erro: 'CPF deve conter 11 dígitos'
                    });
                }
                if (!cpfValidator.isValid(cpfLimpo)) {
                    return res.status(400).json({
                        erro: 'CPF inválido'
                    })
                }

                const cpfExiste = await usuarios.findOne({
                    where: {
                        cpf: cpfLimpo,
                        id_usuario: { [Op.ne]: usuarioId }
                    }
                });

                if (cpfExiste) {
                    return res.status(400).json({
                        erro: 'Este CPF já está cadastrado'
                    })
                }

                dadosAtualizados.cpf = cpfLimpo;
            }

            if (senha !== undefined && senha !== "") {
                if (senha.length < 6) {
                    return res.status(400).json({
                        erro: 'A senha deve ter no mínimo 6 caracteres'
                    });
                }

                const senhaForte = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
                if (!senhaForte.test(senha)) {
                    return res.status(400).json({
                        erro: 'A senha deve conter letras e números'
                    });
                }

                const salt = await bcrypt.genSalt(10);
                dadosAtualizados.senha = await bcrypt.hash(senha, salt);
            }

            if (Object.keys(dadosAtualizados).length === 0) {
                return res.status(400).json({
                    erro: 'Nenhum campo válido para atualizar. Campos permitidos: nome, senha, cpf'
                });
            }


            await usuario.update(dadosAtualizados);


            const usuarioAtualizado = await usuarios.findByPk(usuarioId, {
                attributes: { exclude: ['senha'] }
            });

            return res.json({
                mensagem: 'Perfil atualizado com sucesso',
                usuario: usuarioAtualizado
            });

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return res.status(500).json({
                erro: 'Erro interno ao atualizar perfil'
            });
        }
    }
}