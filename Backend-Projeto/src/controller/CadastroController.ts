import { Request, Response } from 'express';
import { usuarios } from '../models-auto/usuarios';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado');
}

export class CadastroController {

    async cadastro(req: Request, res: Response) {
        try {

            const { nome, email, senha, cpf } = req.body;

            if (!nome || !email || !senha || !cpf) {
                return res.status(400).json({
                    erro: 'Todos os campos são obrigatórios'
                })
            }

            const cpfLimpo = cpf.replace(/\D/g, '');
            const cpfValido = cpfValidator.isValid(cpfLimpo);
            if (!cpfValido) {
                return res.status(400).json({
                    erro: "CPF inválido"
                })
            }

            const senhaForte = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
            if (!senhaForte.test(senha)) {
                return res.status(400).json({
                    erro: 'A senha deve conter no mínimo 6 caracteres, incluindo letras e números'
                });
            }

            const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
            if (!emailRegex.test(email)) {
                console.log('Email inválido');
                return res.status(400).json({ erro: 'Formato de email inválido' });
            }
            const emailExiste = await usuarios.findOne({ where: { email } });
            if (emailExiste) {
                return res.status(400).json({
                    erro: 'Este email já está cadastrado'
                });
            }

            const cpfExiste = await usuarios.findOne({ where: { cpf } });
            if (cpfExiste) {
                return res.status(400).json({
                    erro: 'Este CPF já está cadastrado'
                })
            }

            const salt = await bcrypt.genSalt(10);
            const senhaCriptografada = await bcrypt.hash(senha, salt)

            const usuario = await usuarios.create({
                nome,
                email,
                senha: senhaCriptografada,
                cpf: cpf.replace(/\D/g, '')
            });

            const UsuarioemSenha = usuario.toJSON();
            delete UsuarioemSenha.senha;

            res.status(201).json({
                message: 'Usuário cadastrado com sucesso',
                usuario: UsuarioemSenha
            });

        } catch (error: any) {
            if (error.name === 'SequelizeValidationError') {

                return res.status(400).json({ erro: error.errors.map((e: any) => e.message) });
            }
            console.error('Erro no cadastro:', error);
            return res.status(500).json({
                erro: error.message
            });
        }


    }
}


